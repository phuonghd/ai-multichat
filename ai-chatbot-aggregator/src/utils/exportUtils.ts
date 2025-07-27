import jsPDF from 'jspdf';
import { unparse } from 'papaparse';
import { ChatBotResponse } from '../types';

export interface ExportData {
  responses: ChatBotResponse[];
  metadata?: {
    totalDuration?: number;
    successCount?: number;
    errorCount?: number;
  };
  prompt?: string;
  timestamp?: number;
}

export interface ExportOptions {
  includeMetadata?: boolean;
  includeErrors?: boolean;
  filename?: string;
}

// Helper function to format timestamp
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toISOString().replace(/[:.]/g, '-').slice(0, -5);
};

// Helper function to sanitize filename
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

// Helper function to get default filename
const getDefaultFilename = (format: string, prompt?: string): string => {
  const timestamp = formatTimestamp(Date.now());
  const promptPrefix = prompt ? sanitizeFilename(prompt.substring(0, 30)) : 'chatbot_responses';
  return `${promptPrefix}_${timestamp}.${format}`;
};

// Export to JSON
export const exportToJSON = (data: ExportData, options: ExportOptions = {}): void => {
  const {
    includeMetadata = true,
    includeErrors = true,
    filename
  } = options;

  const exportObject: any = {
    timestamp: data.timestamp || Date.now(),
    prompt: data.prompt,
    responses: data.responses.map(response => ({
      id: response.id,
      name: response.name,
      response: response.response,
      status: response.status,
      timestamp: response.timestamp,
      ...(includeMetadata && response.metadata ? { metadata: response.metadata } : {}),
      ...(includeErrors && response.error ? { error: response.error } : {})
    }))
  };

  if (includeMetadata && data.metadata) {
    exportObject.metadata = data.metadata;
  }

  const jsonString = JSON.stringify(exportObject, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || getDefaultFilename('json', data.prompt);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export to CSV
export const exportToCSV = (data: ExportData, options: ExportOptions = {}): void => {
  const {
    includeMetadata = true,
    includeErrors = true,
    filename
  } = options;

  const csvData = data.responses.map(response => ({
    id: response.id,
    name: response.name,
    status: response.status,
    response: response.response.replace(/\n/g, ' ').replace(/,/g, ';'), // Clean for CSV
    timestamp: new Date(response.timestamp).toISOString(),
    ...(includeMetadata && response.metadata ? {
      responseTime: response.metadata.responseTime || '',
      retryCount: response.metadata.retryCount || 0,
      sessionValid: response.metadata.sessionValid || ''
    } : {}),
    ...(includeErrors && response.error ? {
      errorType: response.error.type || '',
      errorMessage: response.error.message?.replace(/\n/g, ' ').replace(/,/g, ';') || '',
      errorRecoverable: response.error.recoverable || ''
    } : {})
  }));

  const csv = unparse(csvData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || getDefaultFilename('csv', data.prompt);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export to Markdown
export const exportToMarkdown = (data: ExportData, options: ExportOptions = {}): void => {
  const {
    includeMetadata = true,
    includeErrors = true,
    filename
  } = options;

  let markdown = '';
  
  // Header
  markdown += '# Chatbot Responses Export\n\n';
  
  if (data.prompt) {
    markdown += `**Prompt:** ${data.prompt}\n\n`;
  }
  
  markdown += `**Export Date:** ${new Date().toISOString()}\n\n`;
  
  // Summary
  if (includeMetadata && data.metadata) {
    markdown += '## Summary\n\n';
    markdown += `- **Total Duration:** ${data.metadata.totalDuration}ms\n`;
    markdown += `- **Success Count:** ${data.metadata.successCount}\n`;
    markdown += `- **Error Count:** ${data.metadata.errorCount}\n`;
    markdown += `- **Total Responses:** ${data.responses.length}\n\n`;
  }
  
  // Individual responses
  markdown += '## Responses\n\n';
  
  data.responses.forEach((response, index) => {
    markdown += `### ${index + 1}. ${response.name}\n\n`;
    markdown += `**Status:** ${response.status}\n\n`;
    markdown += `**Timestamp:** ${new Date(response.timestamp).toISOString()}\n\n`;
    
    if (includeMetadata && response.metadata) {
      markdown += '**Metadata:**\n';
      if (response.metadata.responseTime) {
        markdown += `- Response Time: ${response.metadata.responseTime}ms\n`;
      }
      if (response.metadata.retryCount !== undefined) {
        markdown += `- Retry Count: ${response.metadata.retryCount}\n`;
      }
      if (response.metadata.sessionValid !== undefined) {
        markdown += `- Session Valid: ${response.metadata.sessionValid}\n`;
      }
      markdown += '\n';
    }
    
    if (response.status === 'success' && response.response) {
      markdown += '**Response:**\n```\n';
      markdown += response.response;
      markdown += '\n```\n\n';
    }
    
    if (includeErrors && response.error) {
      markdown += '**Error Details:**\n';
      markdown += `- Type: ${response.error.type}\n`;
      markdown += `- Message: ${response.error.message}\n`;
      if (response.error.details) {
        markdown += `- Details: ${response.error.details}\n`;
      }
      markdown += `- Recoverable: ${response.error.recoverable}\n\n`;
    }
    
    markdown += '---\n\n';
  });

  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || getDefaultFilename('md', data.prompt);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export to PDF
export const exportToPDF = (data: ExportData, options: ExportOptions = {}): void => {
  const {
    includeMetadata = true,
    includeErrors = true,
    filename
  } = options;

  const pdf = new jsPDF();
  let yPosition = 20;
  const pageHeight = pdf.internal.pageSize.height;
  const lineHeight = 6;
  const maxLineWidth = 180;

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, fontSize: number = 10, isBold: boolean = false): void => {
    pdf.setFontSize(fontSize);
    if (isBold) {
      pdf.setFont(undefined, 'bold');
    } else {
      pdf.setFont(undefined, 'normal');
    }
    
    const lines = pdf.splitTextToSize(text, maxLineWidth);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, x, yPosition);
      yPosition += lineHeight;
    });
  };

  // Header
  addText('Chatbot Responses Export', 20, 16, true);
  yPosition += 5;
  
  if (data.prompt) {
    addText(`Prompt: ${data.prompt}`, 20, 12, true);
    yPosition += 3;
  }
  
  addText(`Export Date: ${new Date().toISOString()}`, 20, 10);
  yPosition += 10;
  
  // Summary
  if (includeMetadata && data.metadata) {
    addText('Summary', 20, 14, true);
    addText(`Total Duration: ${data.metadata.totalDuration}ms`, 20);
    addText(`Success Count: ${data.metadata.successCount}`, 20);
    addText(`Error Count: ${data.metadata.errorCount}`, 20);
    addText(`Total Responses: ${data.responses.length}`, 20);
    yPosition += 10;
  }
  
  // Individual responses
  addText('Responses', 20, 14, true);
  yPosition += 5;
  
  data.responses.forEach((response, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }
    
    addText(`${index + 1}. ${response.name}`, 20, 12, true);
    addText(`Status: ${response.status}`, 25);
    addText(`Timestamp: ${new Date(response.timestamp).toISOString()}`, 25);
    
    if (includeMetadata && response.metadata) {
      if (response.metadata.responseTime) {
        addText(`Response Time: ${response.metadata.responseTime}ms`, 25);
      }
      if (response.metadata.retryCount !== undefined) {
        addText(`Retry Count: ${response.metadata.retryCount}`, 25);
      }
      if (response.metadata.sessionValid !== undefined) {
        addText(`Session Valid: ${response.metadata.sessionValid}`, 25);
      }
    }
    
    if (response.status === 'success' && response.response) {
      addText('Response:', 25, 10, true);
      addText(response.response, 30, 9);
    }
    
    if (includeErrors && response.error) {
      addText('Error Details:', 25, 10, true);
      addText(`Type: ${response.error.type}`, 30);
      addText(`Message: ${response.error.message}`, 30);
      if (response.error.details) {
        addText(`Details: ${response.error.details}`, 30);
      }
      addText(`Recoverable: ${response.error.recoverable}`, 30);
    }
    
    yPosition += 10;
  });

  pdf.save(filename || getDefaultFilename('pdf', data.prompt));
};

// Main export function that handles all formats
export const exportResponses = (
  format: 'json' | 'csv' | 'markdown' | 'pdf',
  data: ExportData,
  options: ExportOptions = {}
): void => {
  switch (format) {
    case 'json':
      exportToJSON(data, options);
      break;
    case 'csv':
      exportToCSV(data, options);
      break;
    case 'markdown':
      exportToMarkdown(data, options);
      break;
    case 'pdf':
      exportToPDF(data, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};