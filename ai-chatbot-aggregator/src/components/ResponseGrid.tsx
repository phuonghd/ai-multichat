import React from 'react';
import { ChatBotResponse } from '../types';
import ChatBotCard from './ChatBotCard';

interface ResponseGridProps {
  responses: ChatBotResponse[];
}

const ResponseGrid: React.FC<ResponseGridProps> = ({ responses }) => {
  if (responses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🤖</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No responses yet
        </h3>
        <p className="text-gray-500">
          Enter a prompt above and select chatbots to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Responses ({responses.length})
        </h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Success</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Error</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {responses.map((response) => (
          <div key={response.id} className="min-h-[400px]">
            <ChatBotCard response={response} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponseGrid;