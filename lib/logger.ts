/**
 * Simple logger module for the application
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Set the minimum log level
const MIN_LOG_LEVEL = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;

/**
 * Logger class with methods for different log levels
 */
class Logger {
  debug(message: string, ...args: any[]) {
    if (MIN_LOG_LEVEL <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (MIN_LOG_LEVEL <= LogLevel.INFO) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (MIN_LOG_LEVEL <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (MIN_LOG_LEVEL <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  // Specialized methods for document processing
  logDocumentUpload(documentId: string, filename: string, metadata: any) {
    this.info(`Document Upload: ${documentId} - ${filename}`, metadata);
    return { success: true, documentId, timestamp: new Date().toISOString() };
  }

  logTextractProcessing(documentId: string, status: string, details: any = {}) {
    this.info(`Textract Processing: ${documentId} - ${status}`, details);
    return { success: true, documentId, status, timestamp: new Date().toISOString() };
  }
}

// Export a singleton instance
export const logger = new Logger();

// Default export for convenience
export default logger; 