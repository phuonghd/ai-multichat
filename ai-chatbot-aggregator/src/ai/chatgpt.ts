import { BaseChatBot } from './base.js';
import { CONFIG } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class ChatGPTBot extends BaseChatBot {
  constructor() {
    super('chatgpt');
  }

  async waitForResponse(): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');

    logger.debug('Waiting for ChatGPT response', this.id);

    // Wait for the response to appear
    const responseSelector = await this.findElement(this.selectors.responseContainer, CONFIG.BROWSER.TIMEOUT.RESPONSE_WAIT);
    await this.page.waitForSelector(responseSelector);
    
    // Wait for streaming to complete (look for the stop button to disappear)
    try {
      const stopSelector = await this.findElement(this.selectors.stopButton, CONFIG.BROWSER.TIMEOUT.STREAMING_CHECK);
      await this.page.waitForSelector(stopSelector, { timeout: CONFIG.BROWSER.TIMEOUT.STREAMING_CHECK });
      await this.page.waitForSelector(stopSelector, { 
        state: 'hidden', 
        timeout: CONFIG.BROWSER.TIMEOUT.RESPONSE_WAIT 
      });
      logger.debug('Streaming completed (stop button disappeared)', this.id);
    } catch {
      // Button might not be present, continue
      logger.debug('Stop button not found, assuming response is complete', this.id);
    }

    // Give a small delay to ensure content is fully loaded
    await this.page.waitForTimeout(1000);

    // Extract the response text using multiple fallback strategies
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