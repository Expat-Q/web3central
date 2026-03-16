const { 
  metricsMiddleware, 
  incrementError, 
  incrementRequestCount,
  recordLatency,
  getMetricsSummary,
  resetMetrics,
  metrics 
} = require('../lib/metrics');

describe('Metrics - Request Tracking', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('incrementRequestCount', () => {
    it('should increment total request count', () => {
      incrementRequestCount('/api/test', 200);
      incrementRequestCount('/api/test', 200);
      
      expect(metrics.requests.total).toBe(2);
    });

    it('should track requests by status code group', () => {
      incrementRequestCount('/api/test', 200);
      incrementRequestCount('/api/test', 201);
      incrementRequestCount('/api/test', 400);
      incrementRequestCount('/api/test', 500);
      
      expect(metrics.requests.byStatus['2xx']).toBe(2);
      expect(metrics.requests.byStatus['4xx']).toBe(1);
      expect(metrics.requests.byStatus['5xx']).toBe(1);
    });

    it('should track requests by route', () => {
      incrementRequestCount('/api/tools', 200);
      incrementRequestCount('/api/tools', 200);
      incrementRequestCount('/api/auth', 200);
      incrementRequestCount('/api/auth', 401);
      
      expect(metrics.requests.byRoute['/api/tools'].total).toBe(2);
      expect(metrics.requests.byRoute['/api/tools'].errors).toBe(0);
      expect(metrics.requests.byRoute['/api/auth'].total).toBe(2);
      expect(metrics.requests.byRoute['/api/auth'].errors).toBe(1);
    });
  });

  describe('recordLatency', () => {
    it('should store latency samples', () => {
      recordLatency(100);
      recordLatency(200);
      recordLatency(150);
      
      expect(metrics.latency.samples).toContain(100);
      expect(metrics.latency.samples).toContain(200);
      expect(metrics.latency.samples).toContain(150);
    });

    it('should limit samples to maxSamples', () => {
      const maxSamples = metrics.latency.maxSamples;
      
      for (let i = 0; i < maxSamples + 100; i++) {
        recordLatency(i);
      }
      
      expect(metrics.latency.samples.length).toBe(maxSamples);
    });
  });

  describe('incrementError', () => {
    it('should increment server errors', () => {
      incrementError('server');
      incrementError('server');
      
      expect(metrics.errors.server).toBe(2);
      expect(metrics.errors.total).toBe(2);
    });

    it('should increment client errors', () => {
      incrementError('client');
      
      expect(metrics.errors.client).toBe(1);
    });

    it('should increment auth errors', () => {
      incrementError('auth');
      incrementError('auth');
      incrementError('auth');
      
      expect(metrics.errors.auth).toBe(3);
    });

    it('should increment transaction errors', () => {
      incrementError('transaction');
      
      expect(metrics.errors.transaction).toBe(1);
    });

    it('should always increment total', () => {
      incrementError('server');
      incrementError('client');
      incrementError('auth');
      incrementError('transaction');
      
      expect(metrics.errors.total).toBe(4);
    });
  });
});

describe('Metrics - Summary', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('getMetricsSummary', () => {
    it('should return uptime information', () => {
      const summary = getMetricsSummary();
      
      expect(summary.uptime).toHaveProperty('ms');
      expect(summary.uptime).toHaveProperty('formatted');
      expect(summary.uptime.ms).toBeGreaterThanOrEqual(0);
    });

    it('should return request statistics', () => {
      incrementRequestCount('/api/test', 200);
      incrementRequestCount('/api/test', 500);
      
      const summary = getMetricsSummary();
      
      expect(summary.requests.total).toBe(2);
      expect(summary.requests.byStatus).toHaveProperty('2xx');
      expect(summary.requests.byStatus).toHaveProperty('5xx');
    });

    it('should calculate error rates', () => {
      incrementRequestCount('/api/test', 200);
      incrementRequestCount('/api/test', 200);
      incrementRequestCount('/api/test', 200);
      incrementRequestCount('/api/test', 200);
      incrementError('server');
      
      const summary = getMetricsSummary();
      
      expect(summary.errors.total).toBe(1);
      expect(summary.errors.server).toBe(1);
      expect(summary.errors.rate).toBeGreaterThan(0);
    });

    it('should return latency percentiles', () => {
      for (let i = 1; i <= 100; i++) {
        recordLatency(i * 10);
      }
      
      const summary = getMetricsSummary();
      
      expect(summary.latency.p50).toBeGreaterThan(0);
      expect(summary.latency.p95).toBeGreaterThan(summary.latency.p50);
      expect(summary.latency.p99).toBeGreaterThan(summary.latency.p95);
      expect(summary.latency.avg).toBeGreaterThan(0);
    });

    it('should handle empty latency samples', () => {
      const summary = getMetricsSummary();
      
      expect(summary.latency.p50).toBe(0);
      expect(summary.latency.p95).toBe(0);
      expect(summary.latency.avg).toBe(0);
    });

    it('should return top routes', () => {
      incrementRequestCount('/api/popular', 200);
      incrementRequestCount('/api/popular', 200);
      incrementRequestCount('/api/popular', 200);
      incrementRequestCount('/api/less-popular', 200);
      
      const summary = getMetricsSummary();
      
      expect(summary.requests.topRoutes.length).toBeGreaterThan(0);
      expect(summary.requests.topRoutes[0].route).toBe('/api/popular');
      expect(summary.requests.topRoutes[0].total).toBe(3);
    });
  });
});

describe('Metrics - Middleware', () => {
  it('should be a function', () => {
    expect(typeof metricsMiddleware).toBe('function');
  });

  it('should call next()', () => {
    const mockReq = { path: '/api/test', route: { path: '/test' } };
    const mockRes = {
      statusCode: 200,
      end: jest.fn()
    };
    const mockNext = jest.fn();

    metricsMiddleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

describe('Metrics - Reset', () => {
  it('should reset all metrics to initial state', () => {
    incrementRequestCount('/api/test', 200);
    incrementError('server');
    recordLatency(100);
    
    resetMetrics();
    
    expect(metrics.requests.total).toBe(0);
    expect(metrics.errors.total).toBe(0);
    expect(metrics.latency.samples.length).toBe(0);
  });
});
