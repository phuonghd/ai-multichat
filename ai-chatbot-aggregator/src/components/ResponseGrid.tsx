import React from 'react';
import { ChatBotResponse } from '../types';
import ChatBotCard from './ChatBotCard';
import ExportButton from './ExportButton';

interface ResponseGridProps {
  responses: ChatBotResponse[];
  metadata?: {
    totalDuration?: number;
    successCount?: number;
    errorCount?: number;
  };
  prompt?: string;
}

const ResponseGrid: React.FC<ResponseGridProps> = ({ responses, metadata, prompt }) => {
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

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getAverageResponseTime = () => {
    const responsesWithTime = responses.filter(r => r.metadata?.responseTime);
    if (responsesWithTime.length === 0) return null;
    
    const total = responsesWithTime.reduce((sum, r) => sum + (r.metadata?.responseTime || 0), 0);
    return total / responsesWithTime.length;
  };

  const averageTime = getAverageResponseTime();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Results ({responses.length})
          </h3>
          
          <div className="flex items-center space-x-4">
            {metadata && (
              <div className="text-sm text-gray-600">
                Total time: {formatDuration(metadata.totalDuration)}
                {averageTime && (
                  <span className="ml-4">
                    Avg: {formatDuration(averageTime)}
                  </span>
                )}
              </div>
            )}
            
            <ExportButton
              data={{
                responses,
                metadata,
                prompt,
                timestamp: Date.now()
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Success ({metadata?.successCount || responses.filter(r => r.status === 'success').length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Error ({metadata?.errorCount || responses.filter(r => r.status === 'error').length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Pending ({responses.filter(r => r.status === 'pending').length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Retries ({responses.reduce((sum, r) => sum + (r.metadata?.retryCount || 0), 0)})</span>
          </div>
        </div>

        {/* Error breakdown */}
        {responses.some(r => r.status === 'error') && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Error Types:</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {['NETWORK_ERROR', 'SELECTOR_NOT_FOUND', 'TIMEOUT_ERROR', 'SESSION_INVALID', 'UNKNOWN_ERROR'].map(errorType => {
                const count = responses.filter(r => r.error?.type === errorType).length;
                if (count === 0) return null;
                
                const icons = {
                  'NETWORK_ERROR': '🌐',
                  'SELECTOR_NOT_FOUND': '🔍',
                  'TIMEOUT_ERROR': '⏱️',
                  'SESSION_INVALID': '🔑',
                  'UNKNOWN_ERROR': '⚠️'
                };
                
                return (
                  <span key={errorType} className="bg-red-100 text-red-700 px-2 py-1 rounded">
                    {icons[errorType as keyof typeof icons]} {errorType.replace('_', ' ')}: {count}
                  </span>
                );
              })}
            </div>
          </div>
        )}
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