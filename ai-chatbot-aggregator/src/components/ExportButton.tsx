import React, { useState } from 'react';
import { exportResponses, ExportData, ExportOptions } from '../utils/exportUtils';
import ExportSettings from './ExportSettings';

interface ExportButtonProps {
  data: ExportData;
  disabled?: boolean;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  data, 
  disabled = false, 
  className = '' 
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv' | 'markdown' | 'pdf', options: ExportOptions) => {
    setIsExporting(true);
    
    try {
      exportResponses(format, data, options);
      
      // Small delay to show loading state
      setTimeout(() => setIsExporting(false), 500);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const hasResponses = data.responses && data.responses.length > 0;

  return (
    <>
      <button
        onClick={() => setIsSettingsOpen(true)}
        disabled={disabled || !hasResponses || isExporting}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${className}
          ${disabled || !hasResponses || isExporting
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
          }
        `}
        title={!hasResponses ? 'No responses to export' : 'Export responses'}
      >
        {isExporting ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <span>📥</span>
            <span>Export</span>
          </>
        )}
      </button>

      <ExportSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onExport={handleExport}
        responseCount={data.responses.length}
      />
    </>
  );
};

export default ExportButton;