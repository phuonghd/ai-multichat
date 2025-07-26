export interface ChatBotResponse {
  id: string;
  name: string;
  response: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  timestamp: number;
}

export interface ChatBotConfig {
  id: string;
  name: string;
  url: string;
  isEnabled: boolean;
}

export interface PromptRequest {
  prompt: string;
  chatbots: string[];
}

export interface PromptResponse {
  results: ChatBotResponse[];
  timestamp: number;
}

export type ChatBotStatus = 'idle' | 'initializing' | 'running' | 'completed' | 'error';