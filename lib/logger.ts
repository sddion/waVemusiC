// Simple logging utility for the application
const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.log(`[v0] ${message}`, ...args)
    }
  },
  
  error: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(`[v0] ${message}`, ...args)
    }
  },
  
  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.warn(`[v0] ${message}`, ...args)
    }
  },
  
  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
      console.debug(`[v0] ${message}`, ...args)
    }
  }
}
