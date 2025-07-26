export interface ChatBotResponse {
  id: string;
  name: string;
  response: string;
  status: 'pending' | 'success' | 'error';
  error?: ChatBotError;
  timestamp: number;
  metadata?: {
    responseTime?: number;
    retryCount?: number;
    sessionValid?: boolean;
  };
}

export interface ChatBotError {
  type: 'NETWORK_ERROR' | 'SELECTOR_NOT_FOUND' | 'TIMEOUT_ERROR' | 'SESSION_INVALID' | 'UNKNOWN_ERROR';
  message: string;
  details?: string;
  recoverable: boolean;
}

export interface ChatBotConfig {
  id: string;
  name: string;
  url: string;
  isEnabled: boolean;
  priority?: number;
  tags?: string[];
}

export interface PromptRequest {
  prompt: string;
  chatbots: string[];
  options?: {
    timeout?: number;
    retries?: number;
    saveResults?: boolean;
  };
}

export interface PromptResponse {
  results: ChatBotResponse[];
  timestamp: number;
  metadata: {
    totalDuration: number;
    successCount: number;
    errorCount: number;
  };
}

export interface SelectorConfig {
  chatInput: readonly string[];
  submitButton: readonly string[];
  responseContainer: readonly string[];
  responseText: readonly string[];
  stopButton: readonly string[];
}

export interface BrowserConfig {
  headless: boolean;
  timeout: {
    pageLoad: number;
    selectorWait: number;
    responseWait: number;
    streamingCheck: number;
  };
  args: readonly string[];
}

export type ChatBotStatus = 'idle' | 'initializing' | 'running' | 'completed' | 'error';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  chatbotId?: string;
  error?: Error;
}