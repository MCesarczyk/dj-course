/**
 * Structured JSON logger for the server side.
 *
 * Built on winston directly (we dropped nuxt3-winston-log because its format was
 * hardcoded text and it monkeypatched console globally).
 *
 * Every log line is a single JSON object written to stdout, e.g.:
 *   {"level":"info","timestamp":"2026-06-22 10:00:00","service":"customer-portal",
 *    "scope":"API:transportation:create","message":"Created transportation request: TR123"}
 *
 * stdout is what Docker captures and Promtail ships to Loki, so JSON here means
 * we can filter by level / scope / service in Grafana.
 */
import * as winston from 'winston'

const { createLogger, format, transports } = winston

// Single shared instance across the whole Nitro server runtime.
const winstonLogger = createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  // service label lets Loki/Grafana distinguish this app from other containers
  defaultMeta: { service: 'customer-portal' },
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    // stdout — the source Promtail reads
    new transports.Console()
  ]
})

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    winstonLogger.info(message, meta || {})
  },

  error: (message: string, error?: Error | any, meta?: Record<string, any>) => {
    winstonLogger.error(message, {
      err_message: error?.message ?? (error !== undefined ? String(error) : undefined),
      stack: error?.stack,
      ...meta
    })
  },

  warn: (message: string, meta?: Record<string, any>) => {
    winstonLogger.warn(message, meta || {})
  },

  debug: (message: string, meta?: Record<string, any>) => {
    winstonLogger.debug(message, meta || {})
  }
}

/**
 * Create a scoped logger. The scope is attached as a structured `scope` field
 * (not prefixed into the message) so it can be filtered on directly in Grafana.
 */
export function createScopedLogger(scope: string) {
  return {
    info: (message: string, meta?: Record<string, any>) => {
      logger.info(message, { scope, ...meta })
    },
    error: (message: string, error?: Error | any, meta?: Record<string, any>) => {
      logger.error(message, error, { scope, ...meta })
    },
    warn: (message: string, meta?: Record<string, any>) => {
      logger.warn(message, { scope, ...meta })
    },
    debug: (message: string, meta?: Record<string, any>) => {
      logger.debug(message, { scope, ...meta })
    }
  }
}
