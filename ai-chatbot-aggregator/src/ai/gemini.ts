import { BaseChatBot } from './base.js';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class GeminiBot extends BaseChatBot {
  constructor() {
    super('gemini');
  }

  async waitForResponse(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    logger.debug('Waiting for Gemini response', this.id);

    // Wait for response container to appear
    const responseSelector = await this.findElement(this.selectors.responseContainer, CONFIG.BROWSER.TIMEOUT.RESPONSE_WAIT);
    await this.page.waitForSelector(responseSelector);
    
    // Wait for streaming to complete
    let isGenerating = true;
    let attempts = 0;
    const maxAttempts = CONFIG.BROWSER.TIMEOUT.RESPONSE_WAIT / 1000;

    while (isGenerating && attempts < maxAttempts) {
      await this.page.waitForTimeout(1000);
      
      // Check if there's a stop button or loading indicator
      try {
        const stopSelector = await this.findElement(this.selectors.stopButton, 1000);
        const stopButton = await this.page.$(stopSelector);
        const loadingIndicator = await this.page.$('.loading, .generating');
        
        isGenerating = !!(stopButton || loadingIndicator);
      } catch {
        isGenerating = false;
      }
      
      attempts++;
    }

    logger.debug(`Streaming completed after ${attempts} seconds`, this.id);

    // Extract the response text using multiple strategies
    const responseElements = await this.page.$$(this.selectors.responseText.join(', '));
    
    if (responseElements.length > 0) {
      const responses = await Promise.all(
        responseElements.map(el => el.textContent())
      );
      const filteredResponses = responses.filter(text => text?.trim());
      
      if (filteredResponses.length > 0) {
        return filteredResponses.join('\n').trim();
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