import { LogLevel, LogEntry } from '../types/index.js';

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private log(level: LogLevel, message: string, chatbotId?: string, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      chatbotId,
      error
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs);
    }

    // Console output with formatting
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = chatbotId ? `[${chatbotId}]` : '';
    const formattedMessage = `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        if (error) console.warn(error);
        break;
      case 'error':
        console.error(formattedMessage);
        if (error) console.error(error);
        break;
    }
  }

  debug(message: string, chatbotId?: string): void {
    this.log('debug', message, chatbotId);
  }

  info(message: string, chatbotId?: string): void {
    this.log('info', message, chatbotId);
  }

  warn(message: string, chatbotId?: string, error?: Error): void {
    this.log('warn', message, chatbotId, error);
  }

  error(message: string, chatbotId?: string, error?: Error): void {
    this.log('error', message, chatbotId, error);
  }

  getLogs(level?: LogLevel, chatbotId?: string): LogEntry[] {
    return this.logs.filter(log => {
      if (level && log.level !== level) return false;
      if (chatbotId && log.chatbotId !== chatbotId) return false;
      return true;
    });
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();