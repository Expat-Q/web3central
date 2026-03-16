const jwt = require('jsonwebtoken');
const { protect, admin } = require('../../middleware/auth');

// Mock User model
jest.mock('../../models/User', () => ({
  findById: jest.fn()
}));

const User = require('../../models/User');

describe('Auth Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('protect middleware', () => {
    it('should return 401 if no authorization header is provided', async () => {
      await protect(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized to access this route'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      mockReq.headers.authorization = 'Basic sometoken';
      
      await protect(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      
      await protect(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user no longer exists', async () => {
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;
      User.findById.mockResolvedValue(null);
      
      await protect(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User no longer exists'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next and set req.user if token is valid', async () => {
      const mockUser = { _id: 'user123', name: 'Test User', role: 'user' };
      const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;
      User.findById.mockResolvedValue(mockUser);
      
      await protect(mockReq, mockRes, mockNext);
      
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should handle expired tokens', async () => {
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
      mockReq.headers.authorization = `Bearer ${token}`;
      
      await protect(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('admin middleware', () => {
    it('should call next if user is admin', () => {
      mockReq.user = { role: 'admin' };
      
      admin(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not admin', () => {
      mockReq.user = { role: 'user' };
      
      admin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not authorized as an admin'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if no user is set on request', () => {
      mockReq.user = null;
      
      admin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user object has no role', () => {
      mockReq.user = { name: 'Test User' };
      
      admin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
