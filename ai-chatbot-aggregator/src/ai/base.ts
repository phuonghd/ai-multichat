import { Browser, BrowserContext, Page } from 'playwright';
import { ChatBotResponse } from '../types';

export abstract class BaseChatBot {
  protected browser?: Browser;
  protected context?: BrowserContext;
  protected page?: Page;
  
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly url: string
  ) {}

  abstract getLoginSelectors(): {
    usernameSelector?: string;
    passwordSelector?: string;
    loginButtonSelector?: string;
    chatInputSelector: string;
    submitButtonSelector: string;
    responseSelector: string;
  };

  abstract waitForResponse(): Promise<string>;

  async initialize(browser: Browser): Promise<void> {
    this.browser = browser;
    this.context = await browser.newContext({
      storageState: `sessions/${this.id}-session.json`
    });
    this.page = await this.context.newPage();
    
    // Navigate to the chatbot URL
    await this.page.goto(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  async sendPrompt(prompt: string): Promise<ChatBotResponse> {
    if (!this.page) {
      throw new Error('Chatbot not initialized');
    }

    try {
      const selectors = this.getLoginSelectors();
      
      // Wait for the chat input to be available
      await this.page.waitForSelector(selectors.chatInputSelector, { timeout: 10000 });
      
      // Clear and type the prompt
      await this.page.click(selectors.chatInputSelector);
      await this.page.fill(selectors.chatInputSelector, prompt);
      
      // Submit the prompt
      await this.page.click(selectors.submitButtonSelector);
      
      // Wait for response
      const response = await this.waitForResponse();
      
      return {
        id: this.id,
        name: this.name,
        response,
        status: 'success',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        id: this.id,
        name: this.name,
        response: '',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
    }
  }

  async saveSession(): Promise<void> {
    if (!this.context) {
      throw new Error('Context not available');
    }
    
    await this.context.storageState({ path: `sessions/${this.id}-session.json` });
  }

  async close(): Promise<void> {
    await this.page?.close();
    await this.context?.close();
  }
}