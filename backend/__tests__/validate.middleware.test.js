const { validate, validators } = require('../middleware/validate');

const mockRequest = (body = {}, params = {}, query = {}) => ({
    body,
    params,
    query
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = () => jest.fn();

describe('Validation Middleware', () => {
    describe('validate function', () => {
        it('should call next when all validations pass', () => {
            const schema = {
                body: {
                    name: ['required', { type: 'string', minLength: 2 }],
                    email: ['required', 'email']
                }
            };

            const req = mockRequest({ name: 'John', email: 'john@example.com' });
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 400 when required field is missing', () => {
            const schema = {
                body: {
                    name: ['required']
                }
            };

            const req = mockRequest({});
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'name', message: 'name is required' }]
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 400 when string is too short', () => {
            const schema = {
                body: {
                    name: [{ type: 'string', minLength: 5 }]
                }
            };

            const req = mockRequest({ name: 'ab' });
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'name', message: 'name must be at least 5 characters' }]
            });
        });

        it('should return 400 when string is too long', () => {
            const schema = {
                body: {
                    name: [{ type: 'string', maxLength: 5 }]
                }
            };

            const req = mockRequest({ name: 'verylongname' });
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'name', message: 'name must be at most 5 characters' }]
            });
        });

        it('should return 400 for invalid email', () => {
            const schema = {
                body: {
                    email: ['email']
                }
            };

            const req = mockRequest({ email: 'invalid-email' });
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'email', message: 'Please provide a valid email address' }]
            });
        });

        it('should return 400 for invalid URL', () => {
            const schema = {
                body: {
                    website: ['url']
                }
            };

            const req = mockRequest({ website: 'not-a-url' });
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'website', message: 'website must be a valid URL' }]
            });
        });

        it('should return 400 for invalid enum value', () => {
            const schema = {
                body: {
                    role: [{ type: 'enum', values: ['user', 'admin'] }]
                }
            };

            const req = mockRequest({ role: 'superuser' });
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'role', message: 'role must be one of: user, admin' }]
            });
        });

        it('should return 400 for number out of range', () => {
            const schema = {
                body: {
                    score: [{ type: 'number', min: 0, max: 100 }]
                }
            };

            const req = mockRequest({ score: 150 });
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'score', message: 'score must be at most 100' }]
            });
        });

        it('should validate params and query', () => {
            const schema = {
                params: {
                    id: ['required', { type: 'string', minLength: 1 }]
                },
                query: {
                    page: [{ type: 'number', min: 1 }]
                }
            };

            const req = mockRequest({}, {}, { page: 0 });
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: expect.arrayContaining([
                    { field: 'id', message: 'id is required' },
                    { field: 'page', message: 'page must be at least 1' }
                ])
            });
        });

        it('should return 400 for array validation failures', () => {
            const schema = {
                body: {
                    items: [{ type: 'array', minLength: 1 }]
                }
            };

            const req = mockRequest({ items: [] });
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Validation failed',
                errors: [{ field: 'items', message: 'items must have at least 1 items' }]
            });
        });

        it('should skip validation for optional empty fields', () => {
            const schema = {
                body: {
                    name: [{ type: 'string', minLength: 2 }]
                }
            };

            const req = mockRequest({});
            const res = mockResponse();
            const next = mockNext();

            validate(schema)(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
});
