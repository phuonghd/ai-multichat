// Demo file showing how to use the export functionality
// This file can be used for testing the export functions

import { exportResponses, ExportData } from './exportUtils';
import { ChatBotResponse } from '../types';

// Sample chatbot responses for demonstration
const sampleResponses: ChatBotResponse[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    response: 'Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think and learn like humans. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving.',
    status: 'success',
    timestamp: Date.now() - 5000,
    metadata: {
      responseTime: 2340,
      retryCount: 0,
      sessionValid: true
    }
  },
  {
    id: 'claude',
    name: 'Claude',
    response: 'Artificial Intelligence is a field of computer science focused on creating systems that can perform tasks that typically require human intelligence. This includes things like understanding natural language, recognizing patterns, making decisions, and solving problems.',
    status: 'success',
    timestamp: Date.now() - 4000,
    metadata: {
      responseTime: 1850,
      retryCount: 0,
      sessionValid: true
    }
  },
  {
    id: 'gemini',
    name: 'Gemini',
    response: '',
    status: 'error',
    timestamp: Date.now() - 3000,
    error: {
      type: 'TIMEOUT_ERROR',
      message: 'Request timed out after 30 seconds',
      details: 'The chatbot did not respond within the specified timeout period',
      recoverable: true
    },
    metadata: {
      responseTime: undefined,
      retryCount: 2,
      sessionValid: false
    }
  },
  {
    id: 'bard',
    name: 'Bard',
    response: 'AI, or Artificial Intelligence, encompasses computer systems designed to perform tasks that traditionally require human cognitive abilities. This includes machine learning, natural language processing, computer vision, and reasoning capabilities.',
    status: 'success',
    timestamp: Date.now() - 2000,
    metadata: {
      responseTime: 3100,
      retryCount: 1,
      sessionValid: true
    }
  }
];

// Sample export data
const sampleExportData: ExportData = {
  responses: sampleResponses,
  metadata: {
    totalDuration: 8500,
    successCount: 3,
    errorCount: 1
  },
  prompt: 'What is artificial intelligence?',
  timestamp: Date.now()
};

// Demo functions for each export format

export const demoJSONExport = () => {
  console.log('Exporting to JSON...');
  exportResponses('json', sampleExportData, {
    includeMetadata: true,
    includeErrors: true,
    filename: 'ai_responses_demo.json'
  });
};

export const demoCSVExport = () => {
  console.log('Exporting to CSV...');
  exportResponses('csv', sampleExportData, {
    includeMetadata: true,
    includeErrors: true,
    filename: 'ai_responses_demo.csv'
  });
};

export const demoMarkdownExport = () => {
  console.log('Exporting to Markdown...');
  exportResponses('markdown', sampleExportData, {
    includeMetadata: true,
    includeErrors: true,
    filename: 'ai_responses_demo.md'
  });
};

export const demoPDFExport = () => {
  console.log('Exporting to PDF...');
  exportResponses('pdf', sampleExportData, {
    includeMetadata: true,
    includeErrors: true,
    filename: 'ai_responses_demo.pdf'
  });
};

// Demo function to export all formats
export const demoAllFormats = () => {
  console.log('Exporting to all formats...');
  
  const formats: Array<'json' | 'csv' | 'markdown' | 'pdf'> = ['json', 'csv', 'markdown', 'pdf'];
  
  formats.forEach((format, index) => {
    setTimeout(() => {
      exportResponses(format, sampleExportData, {
        includeMetadata: true,
        includeErrors: true,
        filename: `ai_responses_demo_${format}.${format === 'markdown' ? 'md' : format}`
      });
    }, index * 1000); // Stagger exports by 1 second
  });
};

// Helper function to create export data from current responses
export const createExportDataFromResponses = (
  responses: ChatBotResponse[],
  prompt?: string,
  metadata?: {
    totalDuration?: number;
    successCount?: number;
    errorCount?: number;
  }
): ExportData => {
  return {
    responses,
    metadata: metadata || {
      totalDuration: responses.reduce((sum, r) => sum + (r.metadata?.responseTime || 0), 0),
      successCount: responses.filter(r => r.status === 'success').length,
      errorCount: responses.filter(r => r.status === 'error').length
    },
    prompt,
    timestamp: Date.now()
  };
};

// Usage example:
// To test the export functionality, you can call these functions from the browser console:
// 
// import { demoJSONExport, demoCSVExport, demoMarkdownExport, demoPDFExport, demoAllFormats } from './utils/exportDemo';
// 
// demoJSONExport();      // Export sample data as JSON
// demoCSVExport();       // Export sample data as CSV  
// demoMarkdownExport();  // Export sample data as Markdown
// demoPDFExport();       // Export sample data as PDF
// demoAllFormats();      // Export sample data in all formats