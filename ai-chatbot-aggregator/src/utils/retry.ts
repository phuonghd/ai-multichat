import { logger } from './logger.js';
import { CONFIG } from '../config/index.js';

export interface RetryOptions {
  maxRetries?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  retryCondition?: (error: Error) => boolean;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
  context?: string
): Promise<T> {
  const {
    maxRetries = CONFIG.APP.MAX_RETRIES,
    delay = CONFIG.APP.RETRY_DELAY,
    backoffMultiplier = 1.5,
    maxDelay = 10000,
    retryCondition = () => true
  } = options;

  let lastError: Error;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        logger.debug(`Retry attempt ${attempt}/${maxRetries}`, context);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
      }

      const result = await operation();
      
      if (attempt > 0) {
        logger.info(`Operation succeeded after ${attempt} retries`, context);
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries || !retryCondition(lastError)) {
        logger.error(`Operation failed after ${attempt + 1} attempts`, context, lastError);
        break;
      }
      
      logger.warn(`Attempt ${attempt + 1} failed, retrying...`, context, lastError);
    }
  }

  throw lastError!;
}

export function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    /timeout/i,
    /network/i,
    /connection/i,
    /ECONNRESET/,
    /ENOTFOUND/,
    /ETIMEDOUT/,
    /502/,
    /503/,
    /504/
  ];

  return retryablePatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.name)
  );
}