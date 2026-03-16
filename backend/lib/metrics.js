/**
 * Metrics Adapter
 * 
 * Provides lightweight metrics instrumentation with a stub/adapter pattern.
 * Currently stores metrics in-memory for diagnostic endpoints.
 * Can be extended to integrate with Prometheus, DataDog, etc.
 * 
 * Tracked metrics:
 * - Request counts by route and status
 * - Error rates (5xx errors)
 * - Request latency histograms
 * - Auth failure counts
 * - Transaction/web3 operation failures
 */

const metrics = {
  requests: {
    total: 0,
    byStatus: {},
    byRoute: {}
  },
  errors: {
    total: 0,
    server: 0,
    client: 0,
    auth: 0,
    transaction: 0
  },
  latency: {
    samples: [],
    maxSamples: 1000
  },
  startTime: Date.now()
};

function incrementRequestCount(route, statusCode) {
  metrics.requests.total++;
  
  const statusGroup = Math.floor(statusCode / 100) + 'xx';
  metrics.requests.byStatus[statusGroup] = (metrics.requests.byStatus[statusGroup] || 0) + 1;
  
  if (!metrics.requests.byRoute[route]) {
    metrics.requests.byRoute[route] = { total: 0, errors: 0 };
  }
  metrics.requests.byRoute[route].total++;
  
  if (statusCode >= 400) {
    metrics.requests.byRoute[route].errors++;
  }
}

function recordLatency(latencyMs) {
  metrics.latency.samples.push(latencyMs);
  if (metrics.latency.samples.length > metrics.latency.maxSamples) {
    metrics.latency.samples.shift();
  }
}

function incrementError(type) {
  metrics.errors.total++;
  
  switch (type) {
    case 'server':
      metrics.errors.server++;
      break;
    case 'client':
      metrics.errors.client++;
      break;
    case 'auth':
      metrics.errors.auth++;
      break;
    case 'transaction':
      metrics.errors.transaction++;
      break;
  }
}

function getLatencyStats() {
  const samples = metrics.latency.samples;
  if (samples.length === 0) {
    return { p50: 0, p95: 0, p99: 0, avg: 0 };
  }
  
  const sorted = [...samples].sort((a, b) => a - b);
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);
  
  return {
    p50: sorted[p50Index] || 0,
    p95: sorted[p95Index] || 0,
    p99: sorted[p99Index] || 0,
    avg: sorted.reduce((a, b) => a + b, 0) / sorted.length
  };
}

function getMetricsSummary() {
  const uptimeMs = Date.now() - metrics.startTime;
  const latencyStats = getLatencyStats();
  
  const totalRequests = metrics.requests.total || 1;
  const errorRate = ((metrics.errors.server + metrics.errors.client) / totalRequests * 100).toFixed(2);
  const serverErrorRate = (metrics.errors.server / totalRequests * 100).toFixed(2);
  
  return {
    uptime: {
      ms: uptimeMs,
      formatted: formatUptime(uptimeMs)
    },
    requests: {
      total: metrics.requests.total,
      byStatus: metrics.requests.byStatus,
      topRoutes: getTopRoutes(5)
    },
    errors: {
      total: metrics.errors.total,
      server: metrics.errors.server,
      client: metrics.errors.client,
      auth: metrics.errors.auth,
      transaction: metrics.errors.transaction,
      rate: parseFloat(errorRate),
      serverErrorRate: parseFloat(serverErrorRate)
    },
    latency: {
      ...latencyStats,
      samples: metrics.latency.samples.length
    }
  };
}

function getTopRoutes(limit) {
  return Object.entries(metrics.requests.byRoute)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, limit)
    .map(([route, data]) => ({ route, ...data }));
}

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function metricsMiddleware(req, res, next) {
  const startTime = Date.now();
  
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    res.end = originalEnd;
    res.end(chunk, encoding);
    
    const latencyMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const route = req.route?.path || req.path;
    
    incrementRequestCount(route, statusCode);
    recordLatency(latencyMs);
    
    if (statusCode >= 500) {
      incrementError('server');
    } else if (statusCode >= 400 && statusCode < 500) {
      incrementError('client');
    }
  };
  
  next();
}

function resetMetrics() {
  metrics.requests = { total: 0, byStatus: {}, byRoute: {} };
  metrics.errors = { total: 0, server: 0, client: 0, auth: 0, transaction: 0 };
  metrics.latency = { samples: [], maxSamples: 1000 };
  metrics.startTime = Date.now();
}

module.exports = {
  metricsMiddleware,
  incrementError,
  incrementRequestCount,
  recordLatency,
  getMetricsSummary,
  resetMetrics,
  metrics
};
