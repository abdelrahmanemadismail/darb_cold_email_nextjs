/**
 * Structured Logging Utility for Apollo Operations
 * 
 * Provides consistent logging with context for debugging and monitoring
 */

export interface LogContext {
  userId?: string | number;
  operation?: string;
  pageNumber?: number;
  batchNumber?: number;
  resultId?: string;
  personId?: string;
  [key: string]: unknown;
}

export class ApolloLogger {
  /**
   * Log an info message with context
   */
  static info(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    console.log(`[${timestamp}] [INFO] ${message}${contextStr}`);
  }

  /**
   * Log a warning message with context
   */
  static warn(message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    console.warn(`[${timestamp}] [WARN] ${message}${contextStr}`);
  }

  /**
   * Log an error message with context
   */
  static error(message: string, error?: Error | unknown, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    const errorStr = error instanceof Error 
      ? ` Error: ${error.message}${error.stack ? `\n${error.stack}` : ''}`
      : error ? ` Error: ${JSON.stringify(error)}` : '';
    console.error(`[${timestamp}] [ERROR] ${message}${contextStr}${errorStr}`);
  }

  /**
   * Log progress for long-running operations
   */
  static progress(
    current: number,
    total: number,
    operation: string,
    context?: LogContext
  ): void {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    const message = `${operation}: ${current}/${total} (${percentage}%)`;
    this.info(message, context);
  }
}
