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

  const getErrorTypeIcon = (errorType?: string) => {
    switch (errorType) {
      case 'NETWORK_ERROR': return '🌐';
      case 'SELECTOR_NOT_FOUND': return '🔍';
      case 'TIMEOUT_ERROR': return '⏱️';
      case 'SESSION_INVALID': return '🔑';
      default: return '⚠️';
    }
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className={`border-2 rounded-lg p-4 h-full flex flex-col ${getStatusColor(response.status)}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {getStatusIcon(response.status)}
          {response.name}
          {response.error && (
            <span className="text-sm opacity-75">
              {getErrorTypeIcon(response.error.type)}
            </span>
          )}
        </h3>
        <div className="text-sm opacity-75 text-right">
          <div>{new Date(response.timestamp).toLocaleTimeString()}</div>
          {response.metadata?.responseTime && (
            <div className="text-xs">
              {formatResponseTime(response.metadata.responseTime)}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
        {response.status === 'error' ? (
          <div className="text-red-600 space-y-2">
            <div className="flex items-center gap-2">
              {response.error && getErrorTypeIcon(response.error.type)}
              <p className="font-medium">
                {response.error?.type?.replace('_', ' ') || 'Error'}:
              </p>
              {response.error?.recoverable && (
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                  Recoverable
                </span>
              )}
            </div>
            <p className="text-sm">{response.error?.message || 'Unknown error occurred'}</p>
            {response.error?.details && (
              <details className="text-xs">
                <summary className="cursor-pointer hover:underline">Technical Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-gray-600 overflow-auto">
                  {response.error.details}
                </pre>
              </details>
            )}
            {response.metadata?.retryCount && response.metadata.retryCount > 0 && (
              <p className="text-xs opacity-75">
                Retried {response.metadata.retryCount} time{response.metadata.retryCount !== 1 ? 's' : ''}
              </p>
            )}
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
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Length: {response.response.length} chars</div>
            <div>
              {response.metadata?.sessionValid !== undefined && (
                <span className={response.metadata.sessionValid ? 'text-green-600' : 'text-red-600'}>
                  Session: {response.metadata.sessionValid ? 'Valid' : 'Invalid'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBotCard;