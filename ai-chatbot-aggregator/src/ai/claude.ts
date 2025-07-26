import { BaseChatBot } from './base.js';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class ClaudeBot extends BaseChatBot {
  constructor() {
    super('claude');
  }

  async waitForResponse(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    logger.debug('Waiting for Claude response', this.id);

    // Wait for response to start appearing
    const responseSelector = await this.findElement(this.selectors.responseContainer, CONFIG.BROWSER.TIMEOUT.RESPONSE_WAIT);
    await this.page.waitForSelector(responseSelector);

    // Wait for streaming to complete
    await this.page.waitForTimeout(2000);
    
    // Check if still generating
    let isGenerating = true;
    let attempts = 0;
    const maxAttempts = CONFIG.BROWSER.TIMEOUT.RESPONSE_WAIT / 1000;

    while (isGenerating && attempts < maxAttempts) {
      await this.page.waitForTimeout(1000);
      
      try {
        const stopSelector = await this.findElement(this.selectors.stopButton, 1000);
        const stopButton = await this.page.$(stopSelector);
        isGenerating = !!stopButton;
      } catch {
        isGenerating = false;
      }
      
      attempts++;
    }

    logger.debug(`Streaming completed after ${attempts} seconds`, this.id);

    // Extract the latest response using multiple strategies
    const responseElements = await this.page.$$(this.selectors.responseText.join(', '));
    
    if (responseElements.length > 0) {
      // Get the last response element
      const lastElement = responseElements[responseElements.length - 1];
      const responseText = await lastElement.textContent();
      
      if (responseText?.trim()) {
        return responseText.trim();
      }
    }

    // Fallback: try to get any text from the response container
    const fallbackResponse = await this.page.textContent(`${responseSelector}:last-child`);
    if (fallbackResponse?.trim()) {
      logger.debug('Used fallback response extraction', this.id);
      return fallbackResponse.trim();
    }

    throw new Error('No response text found');
  }
}