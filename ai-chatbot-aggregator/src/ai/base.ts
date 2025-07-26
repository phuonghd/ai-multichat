import { Browser, BrowserContext, Page } from 'playwright';
import { ChatBotResponse, ChatBotError, SelectorConfig } from '../types/index.js';
import { CONFIG, ChatBotConfigType } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { withRetry, isRetryableError } from '../utils/retry.js';
import * as path from 'path';
import * as fs from 'fs';

export abstract class BaseChatBot {
  protected browser?: Browser;
  protected context?: BrowserContext;
  protected page?: Page;
  protected config: ChatBotConfigType;
  private startTime?: number;
  private retryCount = 0;

  constructor(chatbotId: keyof typeof CONFIG.CHATBOTS) {
    this.config = CONFIG.CHATBOTS[chatbotId];
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get url(): string {
    return this.config.url;
  }

  protected get selectors(): SelectorConfig {
    return this.config.selectors;
  }

  abstract waitForResponse(): Promise<string>;

  protected async findElement(selectors: readonly string[], timeout: number = CONFIG.BROWSER.TIMEOUT.SELECTOR_WAIT): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    for (const selector of selectors) {
      try {
        await this.page.waitForSelector(selector, { timeout: timeout / selectors.length });
        logger.debug(`Found element with selector: ${selector}`, this.id);
        return selector;
      } catch (error) {
        logger.debug(`Selector not found: ${selector}`, this.id);
      }
    }

    throw new Error(`None of the selectors found: ${selectors.join(', ')}`);
  }

  protected createError(type: ChatBotError['type'], message: string, details?: string): ChatBotError {
    return {
      type,
      message,
      details,
      recoverable: type !== 'SESSION_INVALID'
    };
  }

  async initialize(browser: Browser): Promise<void> {
    try {
      logger.info('Initializing chatbot', this.id);
      this.browser = browser;
      
      const sessionPath = path.join(process.cwd(), CONFIG.APP.SESSIONS_DIR, `${this.id}-session.json`);
      const hasSession = fs.existsSync(sessionPath);
      
      this.context = await browser.newContext({
        ...(hasSession ? { storageState: sessionPath } : {}),
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      this.page = await this.context.newPage();
      
      // Navigate to the chatbot URL
      await this.page.goto(this.url, { 
        waitUntil: 'networkidle',
        timeout: CONFIG.BROWSER.TIMEOUT.PAGE_LOAD 
      });
      
      logger.info('Chatbot initialized successfully', this.id);
    } catch (error) {
      logger.error('Failed to initialize chatbot', this.id, error as Error);
      throw error;
    }
  }

  async sendPrompt(prompt: string): Promise<ChatBotResponse> {
    this.startTime = Date.now();
    this.retryCount = 0;

    try {
      const response = await withRetry(
        () => this._sendPromptInternal(prompt),
        {
          maxRetries: CONFIG.APP.MAX_RETRIES,
          retryCondition: isRetryableError
        },
        this.id
      );

      const responseTime = Date.now() - this.startTime;
      logger.info(`Prompt completed successfully in ${responseTime}ms`, this.id);

      return {
        id: this.id,
        name: this.name,
        response,
        status: 'success',
        timestamp: Date.now(),
        metadata: {
          responseTime,
          retryCount: this.retryCount,
          sessionValid: true
        }
      };
    } catch (error) {
      const responseTime = this.startTime ? Date.now() - this.startTime : 0;
      const chatbotError = this._mapErrorToChatBotError(error as Error);
      
      logger.error('Prompt failed', this.id, error as Error);

      return {
        id: this.id,
        name: this.name,
        response: '',
        status: 'error',
        error: chatbotError,
        timestamp: Date.now(),
        metadata: {
          responseTime,
          retryCount: this.retryCount,
          sessionValid: chatbotError.type !== 'SESSION_INVALID'
        }
      };
    }
  }

  private async _sendPromptInternal(prompt: string): Promise<string> {
    if (!this.page) {
      throw new Error('Chatbot not initialized');
    }

    this.retryCount++;
    logger.debug(`Sending prompt (attempt ${this.retryCount})`, this.id);

    // Wait for and find the chat input
    const inputSelector = await this.findElement(this.selectors.chatInput);
    await this.page.waitForSelector(inputSelector, { state: 'visible' });

    // Clear and type the prompt
    await this.page.click(inputSelector);
    await this.page.fill(inputSelector, '');
    await this.page.type(inputSelector, prompt, { delay: 50 });

    // Find and click submit button
    const submitSelector = await this.findElement(this.selectors.submitButton);
    await this.page.click(submitSelector);

    // Wait for response
    const response = await this.waitForResponse();
    
    if (!response || response.trim() === '') {
      throw new Error('Empty response received');
    }

    return response;
  }

  private _mapErrorToChatBotError(error: Error): ChatBotError {
    if (error.message.includes('timeout')) {
      return this.createError('TIMEOUT_ERROR', 'Request timed out', error.message);
    } else if (error.message.includes('selector') || error.message.includes('not found')) {
      return this.createError('SELECTOR_NOT_FOUND', 'UI element not found', error.message);
    } else if (error.message.includes('network') || error.message.includes('connection')) {
      return this.createError('NETWORK_ERROR', 'Network connectivity issue', error.message);
    } else if (error.message.includes('session') || error.message.includes('login')) {
      return this.createError('SESSION_INVALID', 'Session expired or invalid', error.message);
    } else {
      return this.createError('UNKNOWN_ERROR', error.message, error.stack);
    }
  }

  async saveSession(): Promise<void> {
    if (!this.context) {
      throw new Error('Context not available');
    }
    
    const sessionPath = path.join(process.cwd(), CONFIG.APP.SESSIONS_DIR, `${this.id}-session.json`);
    await this.context.storageState({ path: sessionPath });
    logger.info('Session saved successfully', this.id);
  }

  async close(): Promise<void> {
    try {
      await this.page?.close();
      await this.context?.close();
      logger.debug('Chatbot closed successfully', this.id);
    } catch (error) {
      logger.warn('Error closing chatbot', this.id, error as Error);
    }
  }
}