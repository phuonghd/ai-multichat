import { chromium, Browser } from 'playwright';
import { ChatGPTBot } from './chatgpt';
import { ClaudeBot } from './claude';
import { GeminiBot } from './gemini';
import { PerplexityBot } from './perplexity';
import { BaseChatBot } from './base';
import { ChatBotResponse, PromptRequest, PromptResponse } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class AIManager {
  private browser?: Browser;
  private chatbots: Map<string, BaseChatBot>;

  constructor() {
    this.chatbots = new Map([
      ['chatgpt', new ChatGPTBot()],
      ['claude', new ClaudeBot()],
      ['gemini', new GeminiBot()],
      ['perplexity', new PerplexityBot()]
    ]);
  }

  async initialize(): Promise<void> {
    // Ensure sessions directory exists
    const sessionsDir = path.join(process.cwd(), 'sessions');
    if (!fs.existsSync(sessionsDir)) {
      fs.mkdirSync(sessionsDir, { recursive: true });
    }

    // Launch browser
    this.browser = await chromium.launch({
      headless: false, // Set to true in production
      args: ['--disable-blink-features=AutomationControlled']
    });

    console.log('Browser initialized successfully');
  }

  async setupSessions(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    for (const [id, chatbot] of this.chatbots) {
      const sessionPath = path.join(process.cwd(), 'sessions', `${id}-session.json`);
      
      if (!fs.existsSync(sessionPath)) {
        console.log(`Setting up session for ${chatbot.name}...`);
        
        // Create a temporary context for login
        const context = await this.browser.newContext();
        const page = await context.newPage();
        
        await page.goto(chatbot.url);
        console.log(`Please login to ${chatbot.name} manually. Press Enter when done...`);
        
        // In a real scenario, you'd wait for user interaction or implement automatic login
        // For now, we'll create an empty session file
        await context.storageState({ path: sessionPath });
        await context.close();
      }
    }
  }

  async sendPromptToAll(request: PromptRequest): Promise<PromptResponse> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const { prompt, chatbots: enabledChatbots } = request;
    const selectedChatbots = Array.from(this.chatbots.entries())
      .filter(([id]) => enabledChatbots.includes(id))
      .map(([, chatbot]) => chatbot);

    // Initialize all chatbots in parallel
    await Promise.all(
      selectedChatbots.map(chatbot => chatbot.initialize(this.browser!))
    );

    // Send prompts to all chatbots in parallel
    const responses = await Promise.allSettled(
      selectedChatbots.map(chatbot => chatbot.sendPrompt(prompt))
    );

    // Process results
    const results: ChatBotResponse[] = responses.map((result, index) => {
      const chatbot = selectedChatbots[index];
      
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          id: chatbot.id,
          name: chatbot.name,
          response: '',
          status: 'error',
          error: result.reason?.message || 'Unknown error',
          timestamp: Date.now()
        };
      }
    });

    // Close all chatbot contexts
    await Promise.all(selectedChatbots.map(chatbot => chatbot.close()));

    return {
      results,
      timestamp: Date.now()
    };
  }

  async close(): Promise<void> {
    await this.browser?.close();
  }

  getChatbotsList() {
    return Array.from(this.chatbots.values()).map(bot => ({
      id: bot.id,
      name: bot.name,
      url: bot.url,
      isEnabled: true
    }));
  }
}