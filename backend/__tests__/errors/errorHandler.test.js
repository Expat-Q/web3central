const { AppError, ERROR_CODES } = require('../../errors/AppError');
const {
  errorHandler,
  requestIdMiddleware,
  notFoundHandler,
  asyncHandler
} = require('../../errors/errorHandler');

describe('errorHandler middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = { path: '/api/test', method: 'GET' };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should handle AppError correctly', () => {
    const appError = AppError.validation('Invalid input');
    
    errorHandler(appError, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid input'
        }),
        requestId: expect.any(String)
      })
    );
  });

  it('should handle mongoose validation errors', () => {
    const mongooseError = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Invalid email' }
      }
    };
    
    errorHandler(mongooseError, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: ERROR_CODES.VALIDATION_ERROR
        })
      })
    );
  });

  it('should handle JWT errors', () => {
    const jwtError = { name: 'JsonWebTokenError' };
    
    errorHandler(jwtError, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should handle TokenExpiredError', () => {
    const expiredError = { name: 'TokenExpiredError' };
    
    errorHandler(expiredError, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should handle CastError', () => {
    const castError = {
      name: 'CastError',
      path: '_id',
      value: 'invalid-id'
    };
    
    errorHandler(castError, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it('should handle unknown errors with 500 status', () => {
    const unknownError = new Error('Something broke');
    
    errorHandler(unknownError, mockReq, mockRes, mockNext);
    
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false
      })
    );
  });

  it('should use requestId from request if available', () => {
    mockReq.requestId = 'req_test_12345';
    const error = AppError.validation('Test');
    
    errorHandler(error, mockReq, mockRes, mockNext);
    
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req_test_12345'
      })
    );
  });
});

describe('requestIdMiddleware', () => {
  it('should add requestId to request object', () => {
    const mockReq = {};
    const mockRes = {
      setHeader: jest.fn()
    };
    const mockNext = jest.fn();
    
    requestIdMiddleware(mockReq, mockRes, mockNext);
    
    expect(mockReq.requestId).toBeDefined();
    expect(mockReq.requestId).toMatch(/^req_/);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', mockReq.requestId);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('notFoundHandler', () => {
  it('should create a not found error and call next', () => {
    const mockReq = { originalUrl: '/api/unknown', method: 'GET' };
    const mockRes = {};
    const mockNext = jest.fn();
    
    notFoundHandler(mockReq, mockRes, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Endpoint not found'
      })
    );
  });
});

describe('asyncHandler', () => {
  it('should call the wrapped function', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();
    
    const wrapped = asyncHandler(mockFn);
    await wrapped(mockReq, mockRes, mockNext);
    
    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  it('should catch errors and pass to next', async () => {
    const error = new Error('Async error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();
    
    const wrapped = asyncHandler(mockFn);
    await wrapped(mockReq, mockRes, mockNext);
    
    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
