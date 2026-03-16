const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

const STATUS_CODES = {
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.AUTH_ERROR]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.RATE_LIMIT]: 429,
  [ERROR_CODES.NETWORK_ERROR]: 502,
  [ERROR_CODES.DATABASE_ERROR]: 500,
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 502,
  [ERROR_CODES.UNKNOWN_ERROR]: 500
};

class AppError extends Error {
  constructor(message, code = ERROR_CODES.UNKNOWN_ERROR, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = STATUS_CODES[code] || 500;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        timestamp: this.timestamp
      }
    };
  }

  static validation(message, details = null) {
    return new AppError(message, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static auth(message = 'Authentication required') {
    return new AppError(message, ERROR_CODES.AUTH_ERROR);
  }

  static forbidden(message = 'Access denied') {
    return new AppError(message, ERROR_CODES.FORBIDDEN);
  }

  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, ERROR_CODES.NOT_FOUND);
  }

  static conflict(message) {
    return new AppError(message, ERROR_CODES.CONFLICT);
  }

  static rateLimit(message = 'Too many requests, please try again later') {
    return new AppError(message, ERROR_CODES.RATE_LIMIT);
  }

  static database(message = 'Database operation failed') {
    return new AppError(message, ERROR_CODES.DATABASE_ERROR);
  }

  static externalService(service, message = 'External service error') {
    return new AppError(message, ERROR_CODES.EXTERNAL_SERVICE_ERROR, { service });
  }

  static fromMongooseError(err) {
    if (err.name === 'ValidationError') {
      const details = Object.keys(err.errors).reduce((acc, key) => {
        acc[key] = err.errors[key].message;
        return acc;
      }, {});
      return AppError.validation('Validation failed', details);
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return AppError.conflict(`A record with this ${field} already exists`);
    }

    return new AppError(err.message, ERROR_CODES.DATABASE_ERROR);
  }
}

module.exports = { AppError, ERROR_CODES };
