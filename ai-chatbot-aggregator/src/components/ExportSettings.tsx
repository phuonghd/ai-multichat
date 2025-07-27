import React, { useState } from 'react';
import { ExportOptions } from '../utils/exportUtils';

interface ExportSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'json' | 'csv' | 'markdown' | 'pdf', options: ExportOptions) => void;
  responseCount: number;
}

const ExportSettings: React.FC<ExportSettingsProps> = ({
  isOpen,
  onClose,
  onExport,
  responseCount
}) => {
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeErrors, setIncludeErrors] = useState(true);
  const [customFilename, setCustomFilename] = useState('');

  const exportFormats = [
    { 
      key: 'json', 
      label: 'JSON', 
      icon: '📄', 
      description: 'Structured data format for technical analysis',
      fileSize: 'Small',
      useCase: 'API integration, data analysis'
    },
    { 
      key: 'csv', 
      label: 'CSV', 
      icon: '📊', 
      description: 'Spreadsheet format for Excel/Google Sheets',
      fileSize: 'Small',
      useCase: 'Statistical analysis, charts'
    },
    { 
      key: 'markdown', 
      label: 'Markdown', 
      icon: '📝', 
      description: 'Documentation format for reports',
      fileSize: 'Medium',
      useCase: 'Documentation, GitHub README'
    },
    { 
      key: 'pdf', 
      label: 'PDF', 
      icon: '📋', 
      description: 'Printable document for presentations',
      fileSize: 'Large',
      useCase: 'Reports, presentations, printing'
    }
  ] as const;

  const handleExport = (format: 'json' | 'csv' | 'markdown' | 'pdf') => {
    const options: ExportOptions = {
      includeMetadata,
      includeErrors,
      ...(customFilename ? { filename: customFilename } : {})
    };
    
    onExport(format, options);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Export Responses</h2>
              <p className="text-gray-600 mt-1">
                Export {responseCount} response{responseCount !== 1 ? 's' : ''} in your preferred format
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Export Options */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Options</h3>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-700">Include Metadata</span>
                  <p className="text-sm text-gray-500">Response times, retry counts, session info</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={includeErrors}
                  onChange={(e) => setIncludeErrors(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-700">Include Error Details</span>
                  <p className="text-sm text-gray-500">Error types, messages, and recovery information</p>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Filename */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Filename (optional)
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="Leave empty for auto-generated filename"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              File extension will be added automatically based on format
            </p>
          </div>

          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Choose Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exportFormats.map((format) => (
                <button
                  key={format.key}
                  onClick={() => handleExport(format.key)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 text-left group"
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{format.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-800 group-hover:text-blue-700">
                          {format.label}
                        </h4>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {format.fileSize}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                      <p className="text-xs text-gray-500">
                        <strong>Best for:</strong> {format.useCase}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💡 All formats include timestamp and prompt information
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSettings;