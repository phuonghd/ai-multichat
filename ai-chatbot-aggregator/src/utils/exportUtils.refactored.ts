import jsPDF from 'jspdf';
import { unparse } from 'papaparse';
import { ChatBotResponse } from '../types';

// Constants
const MAX_RESPONSES_FOR_PDF = 100;
const MAX_PROMPT_LENGTH_IN_FILENAME = 30;
const EXPORT_TIMEOUT_MS = 30000;

// Types
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

export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  fileSize?: number;
}

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'pdf';

// Validation
class ExportValidator {
  static validateData(data: ExportData): void {
    if (!data.responses || !Array.isArray(data.responses)) {
      throw new Error('Invalid data: responses must be an array');
    }
    
    if (data.responses.length === 0) {
      throw new Error('No responses to export');
    }
    
    if (data.responses.length > 1000) {
      console.warn(`Large dataset detected (${data.responses.length} responses). Export may take longer.`);
    }
  }

  static validateFormat(format: string): asserts format is ExportFormat {
    const validFormats: ExportFormat[] = ['json', 'csv', 'markdown', 'pdf'];
    if (!validFormats.includes(format as ExportFormat)) {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  static validatePdfExport(responseCount: number): void {
    if (responseCount > MAX_RESPONSES_FOR_PDF) {
      throw new Error(`PDF export is limited to ${MAX_RESPONSES_FOR_PDF} responses for performance reasons. Current: ${responseCount}`);
    }
  }
}

// Utility functions
class ExportUtils {
  static formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toISOString().replace(/[:.]/g, '-').slice(0, -5);
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9\s-_]/gi, '')
      .trim()
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  static generateDefaultFilename(format: ExportFormat, prompt?: string): string {
    const timestamp = this.formatTimestamp(Date.now());
    const promptPrefix = prompt 
      ? this.sanitizeFilename(prompt.substring(0, MAX_PROMPT_LENGTH_IN_FILENAME))
      : 'chatbot_responses';
    return `${promptPrefix}_${timestamp}.${format === 'markdown' ? 'md' : format}`;
  }

  static createDownloadLink(blob: Blob, filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          resolve();
        }, 100);
      } catch (error) {
        reject(new Error(`Failed to create download: ${error}`));
      }
    });
  }

  static estimateFileSize(content: string, format: ExportFormat): number {
    const baseSize = new Blob([content]).size;
    // PDF compression factor estimation
    return format === 'pdf' ? baseSize * 0.7 : baseSize;
  }
}

// Export strategies
abstract class ExportStrategy {
  abstract export(data: ExportData, options: ExportOptions): Promise<ExportResult>;
  
  protected generateFilename(format: ExportFormat, data: ExportData, customFilename?: string): string {
    return customFilename || ExportUtils.generateDefaultFilename(format, data.prompt);
  }
}

class JSONExportStrategy extends ExportStrategy {
  async export(data: ExportData, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const { includeMetadata = true, includeErrors = true, filename } = options;

      const exportObject: Record<string, unknown> = {
        timestamp: data.timestamp || Date.now(),
        prompt: data.prompt,
        responses: data.responses.map(response => {
          const baseResponse = {
            id: response.id,
            name: response.name,
            response: response.response,
            status: response.status,
            timestamp: response.timestamp,
          };

          if (includeMetadata && response.metadata) {
            Object.assign(baseResponse, { metadata: response.metadata });
          }

          if (includeErrors && response.error) {
            Object.assign(baseResponse, { error: response.error });
          }

          return baseResponse;
        })
      };

      if (includeMetadata && data.metadata) {
        exportObject.metadata = data.metadata;
      }

      const jsonString = JSON.stringify(exportObject, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const finalFilename = this.generateFilename('json', data, filename);
      
      await ExportUtils.createDownloadLink(blob, finalFilename);
      
      return {
        success: true,
        filename: finalFilename,
        fileSize: blob.size
      };
    } catch (error) {
      return {
        success: false,
        error: `JSON export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

class CSVExportStrategy extends ExportStrategy {
  async export(data: ExportData, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const { includeMetadata = true, includeErrors = true, filename } = options;

      const csvData = data.responses.map(response => {
        const baseData = {
          id: response.id,
          name: response.name,
          status: response.status,
          response: this.sanitizeCSVContent(response.response),
          timestamp: new Date(response.timestamp).toISOString(),
        };

        if (includeMetadata && response.metadata) {
          Object.assign(baseData, {
            responseTime: response.metadata.responseTime ?? '',
            retryCount: response.metadata.retryCount ?? 0,
            sessionValid: response.metadata.sessionValid ?? ''
          });
        }

        if (includeErrors && response.error) {
          Object.assign(baseData, {
            errorType: response.error.type ?? '',
            errorMessage: this.sanitizeCSVContent(response.error.message ?? ''),
            errorRecoverable: response.error.recoverable ?? ''
          });
        }

        return baseData;
      });

      const csv = unparse(csvData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const finalFilename = this.generateFilename('csv', data, filename);
      
      await ExportUtils.createDownloadLink(blob, finalFilename);
      
      return {
        success: true,
        filename: finalFilename,
        fileSize: blob.size
      };
    } catch (error) {
      return {
        success: false,
        error: `CSV export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private sanitizeCSVContent(content: string): string {
    return content
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/"/g, '""')
      .trim();
  }
}

class MarkdownExportStrategy extends ExportStrategy {
  async export(data: ExportData, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const { includeMetadata = true, includeErrors = true, filename } = options;

      const sections: string[] = [];
      
      // Header
      sections.push('# Chatbot Responses Export\n');
      
      if (data.prompt) {
        sections.push(`**Prompt:** ${this.escapeMarkdown(data.prompt)}\n`);
      }
      
      sections.push(`**Export Date:** ${new Date().toISOString()}\n`);
      
      // Summary
      if (includeMetadata && data.metadata) {
        sections.push('## Summary\n');
        sections.push(`- **Total Duration:** ${data.metadata.totalDuration}ms`);
        sections.push(`- **Success Count:** ${data.metadata.successCount}`);
        sections.push(`- **Error Count:** ${data.metadata.errorCount}`);
        sections.push(`- **Total Responses:** ${data.responses.length}\n`);
      }
      
      // Individual responses
      sections.push('## Responses\n');
      
      data.responses.forEach((response, index) => {
        sections.push(`### ${index + 1}. ${this.escapeMarkdown(response.name)}\n`);
        sections.push(`**Status:** ${response.status}\n`);
        sections.push(`**Timestamp:** ${new Date(response.timestamp).toISOString()}\n`);
        
        if (includeMetadata && response.metadata) {
          sections.push('**Metadata:**');
          if (response.metadata.responseTime) {
            sections.push(`- Response Time: ${response.metadata.responseTime}ms`);
          }
          if (response.metadata.retryCount !== undefined) {
            sections.push(`- Retry Count: ${response.metadata.retryCount}`);
          }
          if (response.metadata.sessionValid !== undefined) {
            sections.push(`- Session Valid: ${response.metadata.sessionValid}`);
          }
          sections.push('');
        }
        
        if (response.status === 'success' && response.response) {
          sections.push('**Response:**\n```');
          sections.push(response.response);
          sections.push('```\n');
        }
        
        if (includeErrors && response.error) {
          sections.push('**Error Details:**');
          sections.push(`- Type: ${response.error.type}`);
          sections.push(`- Message: ${this.escapeMarkdown(response.error.message)}`);
          if (response.error.details) {
            sections.push(`- Details: ${this.escapeMarkdown(response.error.details)}`);
          }
          sections.push(`- Recoverable: ${response.error.recoverable}\n`);
        }
        
        sections.push('---\n');
      });

      const markdown = sections.join('\n');
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
      const finalFilename = this.generateFilename('markdown', data, filename);
      
      await ExportUtils.createDownloadLink(blob, finalFilename);
      
      return {
        success: true,
        filename: finalFilename,
        fileSize: blob.size
      };
    } catch (error) {
      return {
        success: false,
        error: `Markdown export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private escapeMarkdown(text: string): string {
    return text
      .replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&')
      .replace(/\n/g, '\\n');
  }
}

class PDFExportStrategy extends ExportStrategy {
  async export(data: ExportData, options: ExportOptions = {}): Promise<ExportResult> {
    try {
      ExportValidator.validatePdfExport(data.responses.length);
      
      const { includeMetadata = true, includeErrors = true, filename } = options;

      const pdf = new jsPDF();
      const pdfGenerator = new PDFGenerator(pdf);
      
      // Header
      pdfGenerator.addTitle('Chatbot Responses Export');
      
      if (data.prompt) {
        pdfGenerator.addSubtitle(`Prompt: ${data.prompt}`);
      }
      
      pdfGenerator.addText(`Export Date: ${new Date().toISOString()}`);
      pdfGenerator.addSpacing(10);
      
      // Summary
      if (includeMetadata && data.metadata) {
        pdfGenerator.addHeading('Summary');
        pdfGenerator.addText(`Total Duration: ${data.metadata.totalDuration}ms`);
        pdfGenerator.addText(`Success Count: ${data.metadata.successCount}`);
        pdfGenerator.addText(`Error Count: ${data.metadata.errorCount}`);
        pdfGenerator.addText(`Total Responses: ${data.responses.length}`);
        pdfGenerator.addSpacing(10);
      }
      
      // Individual responses
      pdfGenerator.addHeading('Responses');
      pdfGenerator.addSpacing(5);
      
      data.responses.forEach((response, index) => {
        pdfGenerator.checkPageSpace(60);
        
        pdfGenerator.addSubheading(`${index + 1}. ${response.name}`);
        pdfGenerator.addText(`Status: ${response.status}`, 25);
        pdfGenerator.addText(`Timestamp: ${new Date(response.timestamp).toISOString()}`, 25);
        
        if (includeMetadata && response.metadata) {
          if (response.metadata.responseTime) {
            pdfGenerator.addText(`Response Time: ${response.metadata.responseTime}ms`, 25);
          }
          if (response.metadata.retryCount !== undefined) {
            pdfGenerator.addText(`Retry Count: ${response.metadata.retryCount}`, 25);
          }
          if (response.metadata.sessionValid !== undefined) {
            pdfGenerator.addText(`Session Valid: ${response.metadata.sessionValid}`, 25);
          }
        }
        
        if (response.status === 'success' && response.response) {
          pdfGenerator.addText('Response:', 25, 10, true);
          pdfGenerator.addText(response.response, 30, 9);
        }
        
        if (includeErrors && response.error) {
          pdfGenerator.addText('Error Details:', 25, 10, true);
          pdfGenerator.addText(`Type: ${response.error.type}`, 30);
          pdfGenerator.addText(`Message: ${response.error.message}`, 30);
          if (response.error.details) {
            pdfGenerator.addText(`Details: ${response.error.details}`, 30);
          }
          pdfGenerator.addText(`Recoverable: ${response.error.recoverable}`, 30);
        }
        
        pdfGenerator.addSpacing(10);
      });

      const finalFilename = this.generateFilename('pdf', data, filename);
      pdf.save(finalFilename);
      
      return {
        success: true,
        filename: finalFilename,
        fileSize: undefined // PDF size not easily calculable
      };
    } catch (error) {
      return {
        success: false,
        error: `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

class PDFGenerator {
  private pdf: jsPDF;
  private yPosition: number = 20;
  private readonly pageHeight: number;
  private readonly lineHeight: number = 6;
  private readonly maxLineWidth: number = 180;

  constructor(pdf: jsPDF) {
    this.pdf = pdf;
    this.pageHeight = pdf.internal.pageSize.height;
  }

  addTitle(text: string): void {
    this.addText(text, 20, 16, true);
    this.addSpacing(5);
  }

  addSubtitle(text: string): void {
    this.addText(text, 20, 12, true);
    this.addSpacing(3);
  }

  addHeading(text: string): void {
    this.addText(text, 20, 14, true);
  }

  addSubheading(text: string): void {
    this.addText(text, 20, 12, true);
  }

  addText(text: string, x: number = 20, fontSize: number = 10, isBold: boolean = false): void {
    this.pdf.setFontSize(fontSize);
    this.pdf.setFont(undefined, isBold ? 'bold' : 'normal');
    
    const lines = this.pdf.splitTextToSize(text, this.maxLineWidth);
    lines.forEach((line: string) => {
      this.checkPageSpace();
      this.pdf.text(line, x, this.yPosition);
      this.yPosition += this.lineHeight;
    });
  }

  addSpacing(space: number): void {
    this.yPosition += space;
  }

  checkPageSpace(requiredSpace: number = 20): void {
    if (this.yPosition > this.pageHeight - requiredSpace) {
      this.pdf.addPage();
      this.yPosition = 20;
    }
  }
}

// Export Manager
export class ExportManager {
  private strategies: Map<ExportFormat, ExportStrategy> = new Map([
    ['json', new JSONExportStrategy()],
    ['csv', new CSVExportStrategy()],
    ['markdown', new MarkdownExportStrategy()],
    ['pdf', new PDFExportStrategy()]
  ]);

  async export(
    format: ExportFormat,
    data: ExportData,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      // Validation
      ExportValidator.validateFormat(format);
      ExportValidator.validateData(data);

      const strategy = this.strategies.get(format);
      if (!strategy) {
        throw new Error(`No export strategy found for format: ${format}`);
      }

      // Execute export with timeout
      const exportPromise = strategy.export(data, options);
      const timeoutPromise = new Promise<ExportResult>((_, reject) => {
        setTimeout(() => reject(new Error('Export timeout')), EXPORT_TIMEOUT_MS);
      });

      return await Promise.race([exportPromise, timeoutPromise]);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  estimateExportSize(format: ExportFormat, data: ExportData): number {
    const sampleContent = JSON.stringify(data);
    return ExportUtils.estimateFileSize(sampleContent, format);
  }
}

// Convenience function for backward compatibility
export const exportResponses = async (
  format: ExportFormat,
  data: ExportData,
  options: ExportOptions = {}
): Promise<ExportResult> => {
  const manager = new ExportManager();
  return manager.export(format, data, options);
};