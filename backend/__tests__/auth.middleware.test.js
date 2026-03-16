const jwt = require('jsonwebtoken');
const { protect, admin } = require('../middleware/auth');

const mockRequest = (authHeader = null, user = null) => ({
    headers: authHeader ? { authorization: authHeader } : {},
    user
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = () => jest.fn();

jest.mock('../models/User', () => ({
    findById: jest.fn()
}));

const User = require('../models/User');

describe('Auth Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('protect middleware', () => {
        it('should return 401 when no token is provided', async () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized to access this route'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token format is invalid', async () => {
            const req = mockRequest('InvalidToken');
            const res = mockResponse();
            const next = mockNext();

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when token is invalid', async () => {
            const req = mockRequest('Bearer invalid-token');
            const res = mockResponse();
            const next = mockNext();

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized to access this route'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 when user no longer exists', async () => {
            const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
            const req = mockRequest(`Bearer ${token}`);
            const res = mockResponse();
            const next = mockNext();

            User.findById.mockResolvedValue(null);

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User no longer exists'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next when valid token and user exists', async () => {
            const mockUser = { _id: 'user123', name: 'Test User', role: 'user' };
            const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
            const req = mockRequest(`Bearer ${token}`);
            const res = mockResponse();
            const next = mockNext();

            User.findById.mockResolvedValue(mockUser);

            await protect(req, res, next);

            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('admin middleware', () => {
        it('should return 403 when user is not admin', () => {
            const req = mockRequest(null, { role: 'user' });
            const res = mockResponse();
            const next = mockNext();

            admin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized as an admin'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 403 when user is missing', () => {
            const req = mockRequest();
            const res = mockResponse();
            const next = mockNext();

            admin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it('should call next when user is admin', () => {
            const req = mockRequest(null, { role: 'admin' });
            const res = mockResponse();
            const next = mockNext();

            admin(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
