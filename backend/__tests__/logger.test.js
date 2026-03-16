const { 
  logger, 
  sanitizeObject, 
  sanitizeValue, 
  SENSITIVE_KEYS,
  formatLog 
} = require('../lib/logger');

describe('Logger - Sensitive Data Filtering', () => {
  describe('sanitizeValue', () => {
    it('should redact password fields', () => {
      expect(sanitizeValue('secret123', 'password')).toBe('[REDACTED]');
      expect(sanitizeValue('secret123', 'userPassword')).toBe('[REDACTED]');
      expect(sanitizeValue('secret123', 'PASSWORD')).toBe('[REDACTED]');
    });

    it('should redact token fields', () => {
      expect(sanitizeValue('abc123token', 'token')).toBe('[REDACTED]');
      expect(sanitizeValue('abc123', 'accessToken')).toBe('[REDACTED]');
      expect(sanitizeValue('xyz789', 'jwt_token')).toBe('[REDACTED]');
    });

    it('should redact authorization headers', () => {
      expect(sanitizeValue('Bearer xyz', 'authorization')).toBe('[REDACTED]');
      expect(sanitizeValue('Basic abc', 'Authorization')).toBe('[REDACTED]');
    });

    it('should redact API keys', () => {
      expect(sanitizeValue('key123', 'apikey')).toBe('[REDACTED]');
      expect(sanitizeValue('key456', 'api_key')).toBe('[REDACTED]');
      expect(sanitizeValue('key789', 'APIKEY')).toBe('[REDACTED]');
    });

    it('should redact private keys and secrets', () => {
      expect(sanitizeValue('0x123...', 'privatekey')).toBe('[REDACTED]');
      expect(sanitizeValue('0x456...', 'private_key')).toBe('[REDACTED]');
      expect(sanitizeValue('secret', 'client_secret')).toBe('[REDACTED]');
    });

    it('should redact wallet-related sensitive data', () => {
      expect(sanitizeValue('sig123', 'wallet_signature')).toBe('[REDACTED]');
      expect(sanitizeValue('word1 word2...', 'mnemonic')).toBe('[REDACTED]');
      expect(sanitizeValue('word1 word2...', 'seed_phrase')).toBe('[REDACTED]');
    });

    it('should not redact non-sensitive fields', () => {
      expect(sanitizeValue('john@example.com', 'email')).toBe('john@example.com');
      expect(sanitizeValue('John Doe', 'name')).toBe('John Doe');
      expect(sanitizeValue('user123', 'userId')).toBe('user123');
      expect(sanitizeValue('/api/tools', 'route')).toBe('/api/tools');
    });

    it('should truncate very long strings', () => {
      const longString = 'a'.repeat(600);
      const result = sanitizeValue(longString, 'description');
      expect(result.length).toBeLessThan(longString.length);
      expect(result).toContain('...[truncated]');
    });

    it('should handle null and undefined', () => {
      expect(sanitizeValue(null, 'field')).toBeNull();
      expect(sanitizeValue(undefined, 'field')).toBeUndefined();
    });
  });

  describe('sanitizeObject', () => {
    it('should recursively sanitize nested objects', () => {
      const input = {
        user: {
          name: 'John',
          password: 'secret123',
          credentials: {
            token: 'abc123',
            email: 'john@example.com'
          }
        }
      };

      const result = sanitizeObject(input);

      expect(result.user.name).toBe('John');
      expect(result.user.password).toBe('[REDACTED]');
      expect(result.user.credentials.token).toBe('[REDACTED]');
      expect(result.user.credentials.email).toBe('john@example.com');
    });

    it('should sanitize arrays', () => {
      const input = {
        items: ['item1', 'item2'],
        users: [
          { name: 'User1', password: 'pass1' },
          { name: 'User2', password: 'pass2' }
        ]
      };

      const result = sanitizeObject(input);

      expect(result.items).toEqual(['item1', 'item2']);
      expect(result.users[0].name).toBe('User1');
      expect(result.users[0].password).toBe('[REDACTED]');
      expect(result.users[1].password).toBe('[REDACTED]');
    });

    it('should handle empty objects and arrays', () => {
      expect(sanitizeObject({})).toEqual({});
      expect(sanitizeObject([])).toEqual([]);
    });

    it('should handle null and undefined', () => {
      expect(sanitizeObject(null)).toBeNull();
      expect(sanitizeObject(undefined)).toBeUndefined();
    });
  });
});

describe('Logger - Log Formatting', () => {
  describe('formatLog', () => {
    it('should produce valid JSON', () => {
      const result = formatLog('info', 'Test message', { key: 'value' });
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should include required fields', () => {
      const result = JSON.parse(formatLog('info', 'Test message', {}));
      
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('level', 'info');
      expect(result).toHaveProperty('message', 'Test message');
      expect(result).toHaveProperty('service');
      expect(result).toHaveProperty('environment');
    });

    it('should include metadata fields', () => {
      const meta = { 
        correlationId: 'req-123', 
        route: '/api/test',
        statusCode: 200 
      };
      const result = JSON.parse(formatLog('info', 'Test', meta));

      expect(result.correlationId).toBe('req-123');
      expect(result.route).toBe('/api/test');
      expect(result.statusCode).toBe(200);
    });

    it('should sanitize sensitive data in metadata', () => {
      const meta = { 
        userId: 'user123',
        password: 'secret',
        token: 'abc123'
      };
      const result = JSON.parse(formatLog('info', 'Test', meta));

      expect(result.userId).toBe('user123');
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
    });

    it('should use ISO timestamp format', () => {
      const result = JSON.parse(formatLog('info', 'Test', {}));
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});

describe('Logger - Child Logger', () => {
  it('should include default metadata in all logs', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const childLog = logger.child({ 
      correlationId: 'test-123',
      service: 'test-service'
    });

    childLog.info('Test message');

    expect(consoleSpy).toHaveBeenCalled();
    const logOutput = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logOutput.correlationId).toBe('test-123');

    consoleSpy.mockRestore();
  });

  it('should allow overriding default metadata', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const childLog = logger.child({ correlationId: 'default-123' });
    childLog.info('Test', { correlationId: 'override-456' });

    const logOutput = JSON.parse(consoleSpy.mock.calls[0][0]);
    expect(logOutput.correlationId).toBe('override-456');

    consoleSpy.mockRestore();
  });
});

describe('SENSITIVE_KEYS constant', () => {
  it('should include common sensitive field names', () => {
    expect(SENSITIVE_KEYS).toContain('password');
    expect(SENSITIVE_KEYS).toContain('token');
    expect(SENSITIVE_KEYS).toContain('secret');
    expect(SENSITIVE_KEYS).toContain('authorization');
    expect(SENSITIVE_KEYS).toContain('jwt');
    expect(SENSITIVE_KEYS).toContain('apikey');
    expect(SENSITIVE_KEYS).toContain('private_key');
    expect(SENSITIVE_KEYS).toContain('mnemonic');
  });
});
