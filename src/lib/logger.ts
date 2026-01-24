/**
 * Production-safe logging utility
 * In production, logs are sent to console (visible via adb logcat)
 * Can be extended to send to remote logging services (Sentry, etc.)
 */

const isDev = __DEV__;

interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
}

export const LogLevel: LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

class Logger {
  private prefix: string;

  constructor(prefix: string = 'BreakFree') {
    this.prefix = prefix;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (isDev) {
      console.log(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('INFO', message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    const errorMessage = error instanceof Error 
      ? `${message}: ${error.message}\n${error.stack}`
      : message;
    
    console.error(this.formatMessage('ERROR', errorMessage), ...args);
    
    // In production, you could send to remote logging service here
    // Example: Sentry.captureException(error);
  }

  // Log app lifecycle events
  appStart(): void {
    this.info('App started', { 
      platform: require('react-native').Platform.OS,
      version: require('expo-constants').default.expoConfig?.version 
    });
  }

  appError(error: Error, context?: Record<string, any>): void {
    this.error('App error', error, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for creating custom loggers
export { Logger };
