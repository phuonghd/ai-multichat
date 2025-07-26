import { chromium, Browser } from 'playwright';
import { ChatGPTBot } from './chatgpt.js';
import { ClaudeBot } from './claude.js';
import { GeminiBot } from './gemini.js';
import { PerplexityBot } from './perplexity.js';
import { BaseChatBot } from './base.js';
import { ChatBotResponse, PromptRequest, PromptResponse } from '../types/index.js';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { withRetry, isRetryableError } from '../utils/retry.js';
import * as fs from 'fs';
import * as path from 'path';

export class AIManager {
  private browser?: Browser;
  private chatbots: Map<string, BaseChatBot>;
  private isInitialized = false;

  constructor() {
    this.chatbots = new Map([
      ['chatgpt', new ChatGPTBot()],
      ['claude', new ClaudeBot()],
      ['gemini', new GeminiBot()],
      ['perplexity', new PerplexityBot()]
    ]);
    
    logger.info(`AI Manager created with ${this.chatbots.size} chatbots`);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('AI Manager already initialized');
      return;
    }

    try {
      logger.info('Initializing AI Manager');
      
      // Ensure sessions directory exists
      const sessionsDir = path.join(process.cwd(), CONFIG.APP.SESSIONS_DIR);
      if (!fs.existsSync(sessionsDir)) {
        fs.mkdirSync(sessionsDir, { recursive: true });
        logger.info(`Created sessions directory: ${sessionsDir}`);
      }

      // Launch browser with enhanced configuration
      this.browser = await chromium.launch({
        headless: CONFIG.BROWSER.HEADLESS,
        args: [...CONFIG.BROWSER.ARGS]
      });

      this.isInitialized = true;
      logger.info('AI Manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Manager', undefined, error as Error);
      throw error;
    }
  }

  async setupSessions(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    logger.info('Starting session setup for all chatbots');

    const setupPromises = Array.from(this.chatbots.entries()).map(async ([id, chatbot]) => {
      const sessionPath = path.join(process.cwd(), CONFIG.APP.SESSIONS_DIR, `${id}-session.json`);
      
      if (!fs.existsSync(sessionPath)) {
        logger.info(`Setting up session for ${chatbot.name}`, id);
        
        try {
          // Create a temporary context for login
          const context = await this.browser!.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          });
          const page = await context.newPage();
          
          await page.goto(chatbot.url, { 
            waitUntil: 'networkidle',
            timeout: CONFIG.BROWSER.TIMEOUT.PAGE_LOAD 
          });
          
          logger.info(`Please login to ${chatbot.name} manually in the opened browser`, id);
          
          // Wait for user to complete login (in a real scenario, this would be interactive)
          await page.waitForTimeout(5000);
          
          // Save the session
          await context.storageState({ path: sessionPath });
          await context.close();
          
          logger.info(`Session saved for ${chatbot.name}`, id);
        } catch (error) {
          logger.error(`Failed to setup session for ${chatbot.name}`, id, error as Error);
          throw error;
        }
      } else {
        logger.info(`Session already exists for ${chatbot.name}`, id);
      }
    });

    await Promise.allSettled(setupPromises);
    logger.info('Session setup completed for all chatbots');
  }

  async sendPromptToAll(request: PromptRequest): Promise<PromptResponse> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const startTime = Date.now();
    const { prompt, chatbots: enabledChatbots, options = {} } = request;
    // Options for future extensibility
    const { timeout: _timeout, retries: _retries } = { 
      timeout: CONFIG.BROWSER.TIMEOUT.RESPONSE_WAIT, 
      retries: CONFIG.APP.MAX_RETRIES,
      ...options 
    };
    
    logger.info(`Sending prompt to ${enabledChatbots.length} chatbots: "${prompt.substring(0, 50)}..."`);

    // Filter and get selected chatbots
    const selectedChatbots = Array.from(this.chatbots.entries())
      .filter(([id]) => enabledChatbots.includes(id))
      .map(([, chatbot]) => chatbot);

    if (selectedChatbots.length === 0) {
      throw new Error('No valid chatbots selected');
    }

    let results: ChatBotResponse[] = [];

    try {
      // Initialize all chatbots in parallel with error handling
      const initPromises = selectedChatbots.map(async (chatbot) => {
        try {
          await withRetry(
            () => chatbot.initialize(this.browser!),
            {
              maxRetries: 2,
              retryCondition: isRetryableError
            },
            chatbot.id
          );
          logger.debug('Chatbot initialized successfully', chatbot.id);
        } catch (error) {
          logger.error('Failed to initialize chatbot', chatbot.id, error as Error);
          throw error;
        }
      });

      const initResults = await Promise.allSettled(initPromises);
      
      // Check which chatbots failed to initialize
      const failedInits = initResults
        .map((result, index) => ({ result, chatbot: selectedChatbots[index] }))
        .filter(({ result }) => result.status === 'rejected');

      if (failedInits.length > 0) {
        logger.warn(`${failedInits.length} chatbots failed to initialize`);
      }

      // Send prompts to successfully initialized chatbots
      const successfulChatbots = selectedChatbots.filter((_, index) => 
        initResults[index].status === 'fulfilled'
      );

      if (successfulChatbots.length === 0) {
        throw new Error('All chatbots failed to initialize');
      }

      logger.info(`Sending prompts to ${successfulChatbots.length} initialized chatbots`);

      const promptPromises = successfulChatbots.map(chatbot => chatbot.sendPrompt(prompt));
      const promptResults = await Promise.allSettled(promptPromises);

      // Process results
      results = promptResults.map((result, index) => {
        const chatbot = successfulChatbots[index];
        
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          logger.error('Prompt failed for chatbot', chatbot.id, result.reason);
          return {
            id: chatbot.id,
            name: chatbot.name,
            response: '',
            status: 'error' as const,
            error: {
              type: 'UNKNOWN_ERROR' as const,
              message: result.reason?.message || 'Unknown error',
              details: result.reason?.stack,
              recoverable: true
            },
            timestamp: Date.now(),
            metadata: {
              responseTime: 0,
              retryCount: 0,
              sessionValid: false
            }
          };
        }
      });

      // Add failed initialization results
      failedInits.forEach(({ chatbot, result }) => {
        results.push({
          id: chatbot.id,
          name: chatbot.name,
          response: '',
          status: 'error',
          error: {
            type: 'NETWORK_ERROR',
            message: 'Failed to initialize',
            details: (result as PromiseRejectedResult).reason?.message,
            recoverable: true
          },
          timestamp: Date.now(),
          metadata: {
            responseTime: 0,
            retryCount: 0,
            sessionValid: false
          }
        });
      });

    } finally {
      // Close all chatbot contexts
      const closePromises = selectedChatbots.map(chatbot => 
        chatbot.close().catch(error => 
          logger.warn('Error closing chatbot', chatbot.id, error)
        )
      );
      await Promise.allSettled(closePromises);
    }

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    logger.info(`Prompt processing completed - Success: ${successCount}, Errors: ${errorCount}, Duration: ${totalDuration}ms`);

    return {
      results,
      timestamp: Date.now(),
      metadata: {
        totalDuration,
        successCount,
        errorCount
      }
    };
  }

  async close(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = undefined;
      }
      this.isInitialized = false;
      logger.info('AI Manager closed successfully');
    } catch (error) {
      logger.error('Error closing AI Manager', undefined, error as Error);
      throw error;
    }
  }

  getChatbotsList() {
    return Array.from(this.chatbots.values()).map(bot => ({
      id: bot.id,
      name: bot.name,
      url: bot.url,
      isEnabled: true,
      priority: 1,
      tags: []
    }));
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    return this.isInitialized && !!this.browser;
  }

  // Get logs for debugging
  getLogs() {
    return logger.getLogs();
  }
}