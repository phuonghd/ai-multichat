import React, { useState } from 'react';
import { ExportOptions, ExportFormat } from '../utils/exportUtils';

interface ExportSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, options: ExportOptions) => void;
  responseCount: number;
  isExporting?: boolean;
  lastError?: string;
}

const ExportSettings: React.FC<ExportSettingsProps> = ({
  isOpen,
  onClose,
  onExport,
  responseCount,
  isExporting = false,
  lastError
}) => {
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeErrors, setIncludeErrors] = useState(true);
  const [customFilename, setCustomFilename] = useState('');

  const exportFormats = [
    { 
      key: 'json' as const, 
      label: 'JSON', 
      icon: '📄', 
      description: 'Structured data format for technical analysis',
      fileSize: 'Small',
      useCase: 'API integration, data analysis',
      maxRecommended: 10000
    },
    { 
      key: 'csv' as const, 
      label: 'CSV', 
      icon: '📊', 
      description: 'Spreadsheet format for Excel/Google Sheets',
      fileSize: 'Small',
      useCase: 'Statistical analysis, charts',
      maxRecommended: 5000
    },
    { 
      key: 'markdown' as const, 
      label: 'Markdown', 
      icon: '📝', 
      description: 'Documentation format for reports',
      fileSize: 'Medium',
      useCase: 'Documentation, GitHub README',
      maxRecommended: 1000
    },
    { 
      key: 'pdf' as const, 
      label: 'PDF', 
      icon: '📋', 
      description: 'Printable document for presentations',
      fileSize: 'Large',
      useCase: 'Reports, presentations, printing',
      maxRecommended: 100
    }
  ];

  const handleExport = (format: ExportFormat) => {
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
              {lastError && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  <strong>Previous export failed:</strong> {lastError}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="text-gray-400 hover:text-gray-600 text-2xl disabled:opacity-50"
              aria-label="Close dialog"
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
                  disabled={isExporting}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
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
                  disabled={isExporting}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
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
              id="custom-filename"
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              disabled={isExporting}
              placeholder="Leave empty for auto-generated filename"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100"
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
                    disabled={isExporting}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={isExporting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        {isExporting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Preparing export...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportSettings;