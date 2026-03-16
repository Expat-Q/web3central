process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests';
process.env.NODE_ENV = 'test';

jest.setTimeout(10000);

afterAll(() => {
  jest.clearAllMocks();
});
