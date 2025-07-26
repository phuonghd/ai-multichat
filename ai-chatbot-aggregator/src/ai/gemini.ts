import { BaseChatBot } from './base';

export class GeminiBot extends BaseChatBot {
  constructor() {
    super('gemini', 'Gemini', 'https://gemini.google.com');
  }

  getLoginSelectors() {
    return {
      chatInputSelector: 'rich-textarea[placeholder*="Enter a prompt"], textarea[placeholder*="Enter a prompt"]',
      submitButtonSelector: 'button[aria-label="Send message"], button[data-testid="send-button"]',
      responseSelector: '.model-response-text, [data-response-container] .markdown'
    };
  }

  async waitForResponse(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    // Wait for response container to appear
    await this.page.waitForSelector('[data-response-container], .model-response-text', { timeout: 30000 });
    
    // Wait for streaming to complete
    let isGenerating = true;
    let attempts = 0;
    while (isGenerating && attempts < 30) {
      await this.page.waitForTimeout(1000);
      
      // Check if there's a stop button or loading indicator
      const stopButton = await this.page.$('button[aria-label="Stop generating"]');
      const loadingIndicator = await this.page.$('.loading, .generating');
      
      isGenerating = !!(stopButton || loadingIndicator);
      attempts++;
    }

    // Extract the response text
    const responseElements = await this.page.$$('.model-response-text:last-child, [data-response-container]:last-child .markdown p');
    
    if (responseElements.length === 0) {
      // Fallback to get any response text
      const fallbackResponse = await this.page.textContent('[data-response-container]:last-child, .model-response-text:last-child');
      return fallbackResponse?.trim() || 'No response received';
    }

    const responses = await Promise.all(
      responseElements.map(el => el.textContent())
    );

    return responses.filter(text => text?.trim()).join('\n').trim() || 'No response received';
  }
}