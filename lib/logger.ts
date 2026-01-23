/**
 * Logger Utility
 * Centralized logging with environment-based control
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  prefix?: string
}

class Logger {
  private config: LoggerConfig

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      level: 'debug',
      prefix: '',
      ...config,
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.config.level)
    const messageLevelIndex = levels.indexOf(level)

    return messageLevelIndex >= currentLevelIndex
  }

  private formatMessage(message: string): string {
    return this.config.prefix ? `[${this.config.prefix}] ${message}` : message
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage(message), ...args)
    }
  }
}

// Default logger instance
export const logger = new Logger()

// Create logger with prefix
export const createLogger = (prefix: string, config?: Partial<LoggerConfig>) => {
  return new Logger({ ...config, prefix })
}

// Export Logger class for custom instances
export { Logger }
export type { LogLevel, LoggerConfig }
