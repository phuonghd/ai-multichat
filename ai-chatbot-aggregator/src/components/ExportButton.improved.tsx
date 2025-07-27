import React, { useState, useCallback } from 'react';
import { ExportManager, ExportData, ExportOptions, ExportResult, ExportFormat } from '../utils/exportUtils.refactored';
import ExportSettings from './ExportSettings';

interface ExportButtonProps {
  data: ExportData;
  disabled?: boolean;
  className?: string;
  onExportStart?: () => void;
  onExportComplete?: (result: ExportResult) => void;
  onExportError?: (error: string) => void;
}

interface ExportState {
  isSettingsOpen: boolean;
  isExporting: boolean;
  currentExport?: {
    format: ExportFormat;
    startTime: number;
  };
  lastError?: string;
  lastSuccess?: ExportResult;
}

const ExportButton: React.FC<ExportButtonProps> = ({ 
  data, 
  disabled = false, 
  className = '',
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [state, setState] = useState<ExportState>({
    isSettingsOpen: false,
    isExporting: false
  });

  const exportManager = new ExportManager();

  const handleExport = useCallback(async (format: ExportFormat, options: ExportOptions) => {
    setState(prev => ({
      ...prev,
      isExporting: true,
      currentExport: { format, startTime: Date.now() },
      lastError: undefined
    }));

    onExportStart?.();

    try {
      // Estimate file size and warn if large
      const estimatedSize = exportManager.estimateExportSize(format, data);
      if (estimatedSize > 10 * 1024 * 1024) { // 10MB
        const confirmLarge = window.confirm(
          `This export may create a large file (~${Math.round(estimatedSize / 1024 / 1024)}MB). Continue?`
        );
        if (!confirmLarge) {
          setState(prev => ({ ...prev, isExporting: false, currentExport: undefined }));
          return;
        }
      }

      const result = await exportManager.export(format, data, options);
      
      setState(prev => ({
        ...prev,
        isExporting: false,
        currentExport: undefined,
        lastSuccess: result.success ? result : undefined,
        lastError: result.success ? undefined : result.error
      }));

      if (result.success) {
        onExportComplete?.(result);
        // Show success notification
        showNotification(`Successfully exported to ${result.filename}`, 'success');
      } else {
        const errorMsg = result.error || 'Export failed';
        onExportError?.(errorMsg);
        showNotification(`Export failed: ${errorMsg}`, 'error');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown export error';
      setState(prev => ({
        ...prev,
        isExporting: false,
        currentExport: undefined,
        lastError: errorMsg
      }));
      onExportError?.(errorMsg);
      showNotification(`Export failed: ${errorMsg}`, 'error');
    }
  }, [data, exportManager, onExportStart, onExportComplete, onExportError]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Simple notification system - could be replaced with a proper toast library
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  };

  const hasResponses = data.responses && data.responses.length > 0;
  const isDisabled = disabled || !hasResponses || state.isExporting;

  const getButtonContent = () => {
    if (state.isExporting && state.currentExport) {
      const elapsed = Math.round((Date.now() - state.currentExport.startTime) / 1000);
      return (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Exporting {state.currentExport.format.toUpperCase()}...</span>
          <span className="text-xs opacity-75">({elapsed}s)</span>
        </>
      );
    }
    
    return (
      <>
        <span>📥</span>
        <span>Export</span>
        {state.lastSuccess && (
          <span className="text-xs opacity-75">(✓)</span>
        )}
      </>
    );
  };

  const getTooltipText = () => {
    if (!hasResponses) return 'No responses to export';
    if (state.isExporting) return 'Export in progress...';
    if (state.lastError) return `Last export failed: ${state.lastError}`;
    if (state.lastSuccess) return `Last exported: ${state.lastSuccess.filename}`;
    return 'Export responses';
  };

  return (
    <>
      <button
        onClick={() => setState(prev => ({ ...prev, isSettingsOpen: true }))}
        disabled={isDisabled}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${className}
          ${isDisabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
          }
          ${state.lastError ? 'ring-2 ring-red-300' : ''}
          ${state.lastSuccess ? 'ring-2 ring-green-300' : ''}
        `}
        title={getTooltipText()}
        aria-label="Export chatbot responses"
        aria-describedby="export-button-description"
      >
        {getButtonContent()}
      </button>

      {/* Hidden description for screen readers */}
      <div id="export-button-description" className="sr-only">
        Export {data.responses.length} chatbot response{data.responses.length !== 1 ? 's' : ''} 
        to PDF, CSV, JSON, or Markdown format
      </div>

      <ExportSettings
        isOpen={state.isSettingsOpen}
        onClose={() => setState(prev => ({ ...prev, isSettingsOpen: false }))}
        onExport={handleExport}
        responseCount={data.responses.length}
        isExporting={state.isExporting}
        lastError={state.lastError}
      />
    </>
  );
};

export default ExportButton;