import React, { useState, useEffect } from 'react';
import './App.css';
import PromptInput from './components/PromptInput';
import ResponseGrid from './components/ResponseGrid';
import { TauriService } from './services/tauri';
import { ChatBotConfig, ChatBotResponse } from './types';

function App() {
  const [chatbots, setChatbots] = useState<ChatBotConfig[]>([]);
  const [responses, setResponses] = useState<ChatBotResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const chatbotsList = await TauriService.getChatbotsList();
      setChatbots(chatbotsList);
      setIsInitialized(true);
    } catch (error) {
      setError('Failed to initialize application');
      console.error('Initialization error:', error);
    }
  };

  const handleSendPrompt = async (prompt: string, selectedChatbots: string[]) => {
    setIsLoading(true);
    setError(null);
    
    // Create pending responses
    const pendingResponses: ChatBotResponse[] = selectedChatbots.map(chatbotId => {
      const chatbot = chatbots.find(bot => bot.id === chatbotId);
      return {
        id: chatbotId,
        name: chatbot?.name || chatbotId,
        response: '',
        status: 'pending' as const,
        timestamp: Date.now()
      };
    });
    
    setResponses(pendingResponses);

    try {
      const response = await TauriService.sendPromptToChatbots({
        prompt,
        chatbots: selectedChatbots
      });
      
      setResponses(response.results);
    } catch (error) {
      setError('Failed to send prompt to chatbots');
      console.error('Send prompt error:', error);
      
      // Update responses to show error state
      const errorResponses: ChatBotResponse[] = pendingResponses.map(response => ({
        ...response,
        status: 'error' as const,
        error: 'Failed to communicate with backend'
      }));
      setResponses(errorResponses);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSessions = async () => {
    try {
      setIsLoading(true);
      await TauriService.setupChatbotSessions();
      alert('Session setup completed! You can now use the chatbots.');
    } catch (error) {
      alert('Failed to setup sessions. Please try again.');
      console.error('Session setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing AI Chatbot Aggregator...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={initializeApp}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🤖 AI Chatbot Aggregator
            </h1>
            <p className="text-gray-600">
              Send prompts to multiple AI chatbots simultaneously and compare responses
            </p>
          </div>
          <button
            onClick={handleSetupSessions}
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            Setup Sessions
          </button>
        </div>

        <PromptInput
          chatbots={chatbots}
          onSendPrompt={handleSendPrompt}
          isLoading={isLoading}
        />

        <ResponseGrid responses={responses} />
      </div>
    </div>
  );
}

export default App;
