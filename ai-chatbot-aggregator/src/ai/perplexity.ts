import { BaseChatBot } from './base';

export class PerplexityBot extends BaseChatBot {
  constructor() {
    super('perplexity', 'Perplexity', 'https://www.perplexity.ai');
  }

  getLoginSelectors() {
    return {
      chatInputSelector: 'textarea[placeholder*="Ask anything"], textarea[placeholder*="Follow up"]',
      submitButtonSelector: 'button[aria-label="Submit"], button:has(svg[data-icon="arrow-right"])',
      responseSelector: '.prose, [data-testid="answer"] .markdown'
    };
  }

  async waitForResponse(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    // Wait for response to start appearing
    await this.page.waitForSelector('.prose, [data-testid="answer"]', { timeout: 30000 });
    
    // Wait for streaming to complete
    await this.page.waitForTimeout(2000);
    
    // Check if still generating
    let isGenerating = true;
    let attempts = 0;
    while (isGenerating && attempts < 30) {
      await this.page.waitForTimeout(1000);
      
      // Look for stop button or generating indicators
      const stopButton = await this.page.$('button[aria-label="Stop"]');
      const loadingDots = await this.page.$('.loading-dots, .generating');
      
      isGenerating = !!(stopButton || loadingDots);
      attempts++;
    }

    // Extract the latest response
    const responseElement = await this.page.$('.prose:last-child, [data-testid="answer"]:last-child');
    
    if (!responseElement) {
      return 'No response received';
    }

    const responseText = await responseElement.textContent();
    return responseText?.trim() || 'No response received';
  }
}