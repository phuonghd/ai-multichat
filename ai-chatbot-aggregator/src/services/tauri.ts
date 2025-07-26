import { invoke } from '@tauri-apps/api/core';
import { ChatBotConfig, PromptRequest, PromptResponse } from '../types';

export class TauriService {
  static async getChatbotsList(): Promise<ChatBotConfig[]> {
    try {
      return await invoke<ChatBotConfig[]>('get_chatbots_list');
    } catch (error) {
      console.error('Failed to get chatbots list:', error);
      throw error;
    }
  }

  static async sendPromptToChatbots(request: PromptRequest): Promise<PromptResponse> {
    try {
      return await invoke<PromptResponse>('send_prompt_to_chatbots', { request });
    } catch (error) {
      console.error('Failed to send prompt to chatbots:', error);
      throw error;
    }
  }

  static async setupChatbotSessions(): Promise<string> {
    try {
      return await invoke<string>('setup_chatbot_sessions');
    } catch (error) {
      console.error('Failed to setup chatbot sessions:', error);
      throw error;
    }
  }
}