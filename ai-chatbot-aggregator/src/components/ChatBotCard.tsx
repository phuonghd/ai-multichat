import React from 'react';
import { ChatBotResponse } from '../types';

interface ChatBotCardProps {
  response: ChatBotResponse;
}

const ChatBotCard: React.FC<ChatBotCardProps> = ({ response }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 border-green-300 text-green-800';
      case 'error': return 'bg-red-100 border-red-300 text-red-800';
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <div className={`border-2 rounded-lg p-4 h-full flex flex-col ${getStatusColor(response.status)}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {getStatusIcon(response.status)}
          {response.name}
        </h3>
        <span className="text-sm opacity-75">
          {new Date(response.timestamp).toLocaleTimeString()}
        </span>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        {response.status === 'error' ? (
          <div className="text-red-600">
            <p className="font-medium">Error:</p>
            <p className="text-sm">{response.error || 'Unknown error occurred'}</p>
          </div>
        ) : response.status === 'pending' ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Generating response...</span>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              {response.response || 'No response received'}
            </pre>
          </div>
        )}
      </div>
      
      {response.status === 'success' && response.response && (
        <div className="mt-3 pt-3 border-t border-current opacity-50">
          <p className="text-xs">
            Response length: {response.response.length} characters
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatBotCard;