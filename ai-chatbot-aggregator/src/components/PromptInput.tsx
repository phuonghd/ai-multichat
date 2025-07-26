import React, { useState } from 'react';
import { ChatBotConfig } from '../types';

interface PromptInputProps {
  chatbots: ChatBotConfig[];
  onSendPrompt: (prompt: string, selectedChatbots: string[]) => void;
  isLoading: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ chatbots, onSendPrompt, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedChatbots, setSelectedChatbots] = useState<string[]>(
    chatbots.filter(bot => bot.isEnabled).map(bot => bot.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && selectedChatbots.length > 0 && !isLoading) {
      onSendPrompt(prompt.trim(), selectedChatbots);
    }
  };

  const toggleChatbot = (chatbotId: string) => {
    setSelectedChatbots(prev => 
      prev.includes(chatbotId) 
        ? prev.filter(id => id !== chatbotId)
        : [...prev, chatbotId]
    );
  };

  const selectAll = () => {
    setSelectedChatbots(chatbots.map(bot => bot.id));
  };

  const selectNone = () => {
    setSelectedChatbots([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Chatbot Aggregator</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Enter your prompt:
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask anything..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={4}
            disabled={isLoading}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Chatbots:
            </label>
            <div className="space-x-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-blue-600 hover:text-blue-800"
                disabled={isLoading}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={selectNone}
                className="text-xs text-red-600 hover:text-red-800"
                disabled={isLoading}
              >
                Select None
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {chatbots.map(chatbot => (
              <label
                key={chatbot.id}
                className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedChatbots.includes(chatbot.id)
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedChatbots.includes(chatbot.id)}
                  onChange={() => toggleChatbot(chatbot.id)}
                  disabled={isLoading}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="text-sm font-medium">{chatbot.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!prompt.trim() || selectedChatbots.length === 0 || isLoading}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            !prompt.trim() || selectedChatbots.length === 0 || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Sending to {selectedChatbots.length} chatbots...
            </div>
          ) : (
            `Send to ${selectedChatbots.length} chatbot${selectedChatbots.length !== 1 ? 's' : ''}`
          )}
        </button>
      </form>
    </div>
  );
};

export default PromptInput;