import React, { useState, useCallback } from 'react';
import { ExportManager, ExportData, ExportOptions, ExportResult, ExportFormat } from '../utils/exportUtils';
import ExportSettings from './ExportSettings';

interface ExportButtonProps {
  data: ExportData;
  disabled?: boolean;
  className?: string;
  onExportStart?: () => void;
  onExportComplete?: (result: ExportResult) => void;
  onExportError?: (error: string) => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  data, 
  disabled = false, 
  className = '',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [lastError, setLastError] = useState<string | undefined>();

  const exportManager = new ExportManager();

  const handleExport = useCallback(async (format: ExportFormat, options: ExportOptions) => {
    setIsExporting(true);
    setLastError(undefined);
    onExportStart?.();

    try {
      // Estimate file size and warn if large
      const estimatedSize = exportManager.estimateExportSize(format, data);
      if (estimatedSize > 10 * 1024 * 1024) { // 10MB
        const confirmLarge = window.confirm(
          `This export may create a large file (~${Math.round(estimatedSize / 1024 / 1024)}MB). Continue?`
        );
        if (!confirmLarge) {
          setIsExporting(false);
          return;
        }
      }

      const result = await exportManager.export(format, data, options);
      
      if (result.success) {
        onExportComplete?.(result);
        // Simple success notification
        console.log(`Successfully exported to ${result.filename}`);
      } else {
        const errorMsg = result.error || 'Export failed';
        setLastError(errorMsg);
        onExportError?.(errorMsg);
        console.error(`Export failed: ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown export error';
      setLastError(errorMsg);
      onExportError?.(errorMsg);
      console.error(`Export failed: ${errorMsg}`);
    } finally {
      setIsExporting(false);
    }
  }, [data, exportManager, onExportStart, onExportComplete, onExportError]);

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
        isExporting={isExporting}
        lastError={lastError}
      />
    </>
  );
};

export default ExportButton;