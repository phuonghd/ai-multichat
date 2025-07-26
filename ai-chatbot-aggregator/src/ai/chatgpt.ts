import { BaseChatBot } from './base';

export class ChatGPTBot extends BaseChatBot {
  constructor() {
    super('chatgpt', 'ChatGPT', 'https://chat.openai.com');
  }

  getLoginSelectors() {
    return {
      chatInputSelector: '#prompt-textarea, [data-id="root"] textarea, textarea[placeholder*="Message"]',
      submitButtonSelector: '[data-testid="send-button"], button[aria-label="Send prompt"]',
      responseSelector: '[data-message-author-role="assistant"] .markdown, [data-message-author-role="assistant"] p'
    };
  }

  async waitForResponse(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    // Wait for the response to appear
    await this.page.waitForSelector('[data-message-author-role="assistant"]', { timeout: 30000 });
    
    // Wait for streaming to complete (look for the stop button to disappear)
    try {
      await this.page.waitForSelector('button[aria-label="Stop generating"]', { timeout: 2000 });
      await this.page.waitForSelector('button[aria-label="Stop generating"]', { state: 'hidden', timeout: 60000 });
    } catch {
      // Button might not be present, continue
    }

    // Extract the response text
    const responseElements = await this.page.$$('[data-message-author-role="assistant"]:last-child .markdown p, [data-message-author-role="assistant"]:last-child p');
    
    if (responseElements.length === 0) {
      // Fallback selector
      const fallbackResponse = await this.page.textContent('[data-message-author-role="assistant"]:last-child');
      return fallbackResponse?.trim() || 'No response received';
    }

    const responses = await Promise.all(
      responseElements.map(el => el.textContent())
    );

    return responses.filter(text => text?.trim()).join('\n').trim() || 'No response received';
  }
}