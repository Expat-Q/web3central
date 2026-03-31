const { AppError, ERROR_CODES } = require('./AppError');

const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || generateRequestId();

  if (err instanceof AppError) {
    console.error(`[${requestId}] AppError:`, {
      code: err.code,
      message: err.message,
      path: req.path,
      method: req.method
    });

    return res.status(err.statusCode).json({
      ...err.toJSON(),
      requestId
    });
  }

  if (err.name === 'ValidationError' || err.code === 11000) {
    const appError = AppError.fromMongooseError(err);
    console.error(`[${requestId}] MongooseError:`, {
      message: err.message,
      path: req.path,
      method: req.method
    });

    return res.status(appError.statusCode).json({
      ...appError.toJSON(),
      requestId
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const appError = AppError.auth('Invalid or expired token');
    console.error(`[${requestId}] JWTError:`, {
      name: err.name,
      path: req.path
    });

    return res.status(appError.statusCode).json({
      ...appError.toJSON(),
      requestId
    });
  }

  if (err.name === 'CastError') {
    const appError = AppError.validation(`Invalid ${err.path}: ${err.value}`);
    console.error(`[${requestId}] CastError:`, {
      path: err.path,
      value: err.value
    });

    return res.status(appError.statusCode).json({
      ...appError.toJSON(),
      requestId
    });
  }

  const fs = require('fs');
  const path = require('path');
  const logDir = '/tmp';
  const logFile = path.join(logDir, 'backend_error.log');

  const errorLog = {
    timestamp: new Date().toISOString(),
    requestId,
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  };

  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, JSON.stringify(errorLog, null, 2) + '\n---\n');
  } catch (fsErr) {
    console.error('Failed to write to error log file:', fsErr.message);
  }

  console.error(`[${requestId}] UnhandledError:`, {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    error: {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: isProduction ? 'An unexpected error occurred' : err.message,
      timestamp: new Date().toISOString()
    },
    requestId
  });
};

const requestIdMiddleware = (req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

const notFoundHandler = (req, res, next) => {
  const error = AppError.notFound('Endpoint');
  error.details = { path: req.originalUrl, method: req.method };
  next(error);
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  requestIdMiddleware,
  notFoundHandler,
  asyncHandler
};
