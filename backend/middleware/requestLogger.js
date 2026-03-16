/**
 * Request Logging Middleware
 * 
 * Logs incoming requests and outgoing responses with:
 * - Request method, path, and correlation ID
 * - Response status code
 * - Request latency in milliseconds
 * - Error context for failed requests
 */

const { logger } = require('../lib/logger');

function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);
    
    const latencyMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const log = req.log || logger;
    
    const logData = {
      correlationId: req.correlationId,
      method: req.method,
      route: req.originalUrl || req.path,
      statusCode,
      latencyMs,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress
    };

    if (statusCode >= 500) {
      log.error('Request completed with server error', logData);
    } else if (statusCode >= 400) {
      log.warn('Request completed with client error', logData);
    } else {
      log.info('Request completed', logData);
    }
  };

  next();
}

module.exports = { requestLogger };
