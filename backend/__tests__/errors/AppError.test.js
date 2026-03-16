const { AppError, ERROR_CODES } = require('../../errors/AppError');

describe('AppError', () => {
  describe('constructor', () => {
    it('should create an error with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ERROR_CODES.UNKNOWN_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.details).toBeNull();
      expect(error.timestamp).toBeDefined();
    });

    it('should create an error with custom code', () => {
      const error = new AppError('Validation failed', ERROR_CODES.VALIDATION_ERROR);
      
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('should include details when provided', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = new AppError('Validation failed', ERROR_CODES.VALIDATION_ERROR, details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('toJSON', () => {
    it('should return proper JSON structure', () => {
      const error = new AppError('Test error', ERROR_CODES.VALIDATION_ERROR);
      const json = error.toJSON();
      
      expect(json.success).toBe(false);
      expect(json.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(json.error.message).toBe('Test error');
      expect(json.error.timestamp).toBeDefined();
    });

    it('should include details in JSON when present', () => {
      const details = { field: 'name' };
      const error = new AppError('Invalid', ERROR_CODES.VALIDATION_ERROR, details);
      const json = error.toJSON();
      
      expect(json.error.details).toEqual(details);
    });
  });

  describe('static factory methods', () => {
    it('should create validation error', () => {
      const error = AppError.validation('Invalid input', { field: 'email' });
      
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create auth error with default message', () => {
      const error = AppError.auth();
      
      expect(error.code).toBe(ERROR_CODES.AUTH_ERROR);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication required');
    });

    it('should create auth error with custom message', () => {
      const error = AppError.auth('Invalid token');
      
      expect(error.message).toBe('Invalid token');
    });

    it('should create forbidden error', () => {
      const error = AppError.forbidden('Admin only');
      
      expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Admin only');
    });

    it('should create not found error', () => {
      const error = AppError.notFound('User');
      
      expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should create conflict error', () => {
      const error = AppError.conflict('Email already exists');
      
      expect(error.code).toBe(ERROR_CODES.CONFLICT);
      expect(error.statusCode).toBe(409);
    });

    it('should create rate limit error', () => {
      const error = AppError.rateLimit();
      
      expect(error.code).toBe(ERROR_CODES.RATE_LIMIT);
      expect(error.statusCode).toBe(429);
    });

    it('should create database error', () => {
      const error = AppError.database('Connection failed');
      
      expect(error.code).toBe(ERROR_CODES.DATABASE_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it('should create external service error with service name', () => {
      const error = AppError.externalService('DeFiLlama', 'API timeout');
      
      expect(error.code).toBe(ERROR_CODES.EXTERNAL_SERVICE_ERROR);
      expect(error.statusCode).toBe(502);
      expect(error.details).toEqual({ service: 'DeFiLlama' });
    });
  });

  describe('fromMongooseError', () => {
    it('should handle mongoose validation errors', () => {
      const mongooseError = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Invalid email format' },
          name: { message: 'Name is required' }
        }
      };
      
      const error = AppError.fromMongooseError(mongooseError);
      
      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({
        email: 'Invalid email format',
        name: 'Name is required'
      });
    });

    it('should handle duplicate key errors', () => {
      const mongooseError = {
        code: 11000,
        keyPattern: { email: 1 }
      };
      
      const error = AppError.fromMongooseError(mongooseError);
      
      expect(error.code).toBe(ERROR_CODES.CONFLICT);
      expect(error.message).toContain('email');
    });

    it('should handle other database errors', () => {
      const mongooseError = {
        name: 'MongoError',
        message: 'Connection refused'
      };
      
      const error = AppError.fromMongooseError(mongooseError);
      
      expect(error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    });
  });
});

describe('ERROR_CODES', () => {
  it('should have all expected error codes', () => {
    expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ERROR_CODES.AUTH_ERROR).toBe('AUTH_ERROR');
    expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
    expect(ERROR_CODES.CONFLICT).toBe('CONFLICT');
    expect(ERROR_CODES.RATE_LIMIT).toBe('RATE_LIMIT');
    expect(ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ERROR_CODES.DATABASE_ERROR).toBe('DATABASE_ERROR');
    expect(ERROR_CODES.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
    expect(ERROR_CODES.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
  });
});
