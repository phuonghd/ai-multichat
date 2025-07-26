import { BaseChatBot } from './base';

export class ClaudeBot extends BaseChatBot {
  constructor() {
    super('claude', 'Claude', 'https://claude.ai');
  }

  getLoginSelectors() {
    return {
      chatInputSelector: 'div[contenteditable="true"], textarea[placeholder*="Talk to Claude"]',
      submitButtonSelector: 'button[aria-label="Send Message"], button:has(svg[data-icon="send"])',
      responseSelector: '.font-claude-message, [data-testid="user-input"] ~ div .prose'
    };
  }

  async waitForResponse(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    // Wait for response to start appearing
    await this.page.waitForFunction(() => {
      const messages = document.querySelectorAll('.font-claude-message, .prose');
      return messages.length > 0;
    }, { timeout: 30000 });

    // Wait for streaming to complete
    await this.page.waitForTimeout(2000);
    
    // Check if still generating
    let isGenerating = true;
    let attempts = 0;
    while (isGenerating && attempts < 30) {
      await this.page.waitForTimeout(1000);
      
      const stopButton = await this.page.$('button[aria-label="Stop"]');
      isGenerating = !!stopButton;
      attempts++;
    }

    // Extract the latest response
    const responseElement = await this.page.$('.font-claude-message:last-child, .prose:last-child');
    
    if (!responseElement) {
      return 'No response received';
    }

    const responseText = await responseElement.textContent();
    return responseText?.trim() || 'No response received';
  }
}