/**
 * Structured JSON Logger
 * 
 * Provides consistent, structured logging with:
 * - JSON output format
 * - Correlation/request ID tracking
 * - Sensitive data filtering
 * - Log levels (debug, info, warn, error)
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'jwt',
  'apikey',
  'api_key',
  'privatekey',
  'private_key',
  'credential',
  'bearer',
  'signature',
  'wallet_signature',
  'mnemonic',
  'seed_phrase'
];

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const envLogLevel = process.env.LOG_LEVEL?.toLowerCase();
const currentLogLevel = LOG_LEVELS[envLogLevel] ?? LOG_LEVELS.info;
if (envLogLevel && LOG_LEVELS[envLogLevel] === undefined) {
  console.warn(`Invalid LOG_LEVEL "${process.env.LOG_LEVEL}", defaulting to "info"`);
}

const SERVICE_NAME = process.env.SERVICE_NAME || 'web3central-backend';
const NODE_ENV = process.env.NODE_ENV || 'development';

function sanitizeValue(value, key = '') {
  if (value === null || value === undefined) {
    return value;
  }

  const lowerKey = key.toLowerCase();
  if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
    return '[REDACTED]';
  }

  if (typeof value === 'object') {
    return sanitizeObject(value);
  }

  if (typeof value === 'string' && value.length > 500) {
    return value.substring(0, 500) + '...[truncated]';
  }

  return value;
}

function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, index) => sanitizeValue(item, String(index)));
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value, key);
  }
  return sanitized;
}

function formatLog(level, message, meta = {}) {
  const sanitizedMeta = sanitizeObject(meta);
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: SERVICE_NAME,
    environment: NODE_ENV,
    ...sanitizedMeta
  };

  return JSON.stringify(logEntry);
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= currentLogLevel;
}

const logger = {
  debug(message, meta = {}) {
    if (shouldLog('debug')) {
      console.log(formatLog('debug', message, meta));
    }
  },

  info(message, meta = {}) {
    if (shouldLog('info')) {
      console.log(formatLog('info', message, meta));
    }
  },

  warn(message, meta = {}) {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, meta));
    }
  },

  error(message, meta = {}) {
    if (shouldLog('error')) {
      if (meta.error instanceof Error) {
        meta = {
          ...meta,
          errorMessage: meta.error.message,
          errorStack: NODE_ENV !== 'production' ? meta.error.stack : undefined,
          errorName: meta.error.name
        };
        delete meta.error;
      }
      console.error(formatLog('error', message, meta));
    }
  },

  child(defaultMeta = {}) {
    const sanitizedDefaultMeta = sanitizeObject(defaultMeta);
    return {
      debug: (message, meta = {}) => logger.debug(message, { ...sanitizedDefaultMeta, ...meta }),
      info: (message, meta = {}) => logger.info(message, { ...sanitizedDefaultMeta, ...meta }),
      warn: (message, meta = {}) => logger.warn(message, { ...sanitizedDefaultMeta, ...meta }),
      error: (message, meta = {}) => logger.error(message, { ...sanitizedDefaultMeta, ...meta })
    };
  }
};

module.exports = {
  logger,
  sanitizeObject,
  sanitizeValue,
  SENSITIVE_KEYS,
  formatLog
};
