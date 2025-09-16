// Enhanced logging utility for the music application
const isDevelopment = process.env.NODE_ENV === 'development'

// Log levels for different types of messages
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// Current log level (can be configured via environment)
const currentLogLevel = isDevelopment ? LogLevel.DEBUG : LogLevel.INFO

// Enhanced logger with proper typing and conditional logging
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.INFO) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] [INFO] ${message}`, ...args)
    }
  },
  
  error: (message: string, error?: Error | unknown, ...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.ERROR) {
      const timestamp = new Date().toISOString()
      if (error instanceof Error) {
        console.error(`[${timestamp}] [ERROR] ${message}`, error.message, error.stack, ...args)
      } else {
        console.error(`[${timestamp}] [ERROR] ${message}`, error, ...args)
      }
    }
  },
  
  warn: (message: string, ...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.WARN) {
      const timestamp = new Date().toISOString()
      console.warn(`[${timestamp}] [WARN] ${message}`, ...args)
    }
  },
  
  debug: (message: string, ...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.DEBUG) {
      const timestamp = new Date().toISOString()
      console.debug(`[${timestamp}] [DEBUG] ${message}`, ...args)
    }
  },
  
  // Music-specific logging methods
  music: {
    playback: (action: string, songTitle?: string, ...args: unknown[]) => {
      logger.info(`🎵 Playback: ${action}${songTitle ? ` - ${songTitle}` : ''}`, ...args)
    },
    
    upload: (status: 'started' | 'progress' | 'completed' | 'failed', filename?: string, progress?: number) => {
      const progressText = progress !== undefined ? ` (${progress}%)` : ''
      const filenameText = filename ? ` - ${filename}` : ''
      
      if (status === 'failed') {
        logger.error(`📤 Upload failed${filenameText}`)
      } else {
        logger.info(`📤 Upload ${status}${filenameText}${progressText}`)
      }
    },
    
    database: (operation: string, table: string, ...args: unknown[]) => {
      logger.debug(`🗄️ Database ${operation} on ${table}`, ...args)
    }
  }
}
