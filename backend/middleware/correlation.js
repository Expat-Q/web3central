/**
 * Request Correlation Middleware
 * 
 * Generates and propagates correlation IDs through the request lifecycle.
 * - Creates unique request ID for each incoming request
 * - Attaches ID to request object for downstream use
 * - Sets X-Correlation-ID response header for client-side tracing
 * - Provides request-scoped logger with correlation context
 */

const crypto = require('crypto');
const { logger } = require('../lib/logger');

function generateCorrelationId() {
  return `req-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function correlationMiddleware(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || 
                        req.headers['x-request-id'] || 
                        generateCorrelationId();
  
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  req.log = logger.child({
    correlationId,
    route: req.path,
    method: req.method
  });

  next();
}

module.exports = {
  correlationMiddleware,
  generateCorrelationId
};
