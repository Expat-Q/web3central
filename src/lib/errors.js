export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export class ApiError extends Error {
  constructor(code, message, details = null, requestId = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    this.isApiError = true;
  }

  get isAuthError() {
    return this.code === ERROR_CODES.AUTH_ERROR;
  }

  get isValidationError() {
    return this.code === ERROR_CODES.VALIDATION_ERROR;
  }

  get isNetworkError() {
    return this.code === ERROR_CODES.NETWORK_ERROR;
  }

  get isNotFound() {
    return this.code === ERROR_CODES.NOT_FOUND;
  }

  get isRateLimit() {
    return this.code === ERROR_CODES.RATE_LIMIT;
  }

  static fromResponse(response, data) {
    const error = data?.error || {};
    return new ApiError(
      error.code || ERROR_CODES.UNKNOWN_ERROR,
      error.message || `HTTP error ${response.status}`,
      error.details,
      data?.requestId
    );
  }

  static networkError(originalError) {
    return new ApiError(
      ERROR_CODES.NETWORK_ERROR,
      originalError?.message === 'Failed to fetch'
        ? 'Unable to connect to server. Please check your internet connection.'
        : originalError?.message || 'Network error occurred'
    );
  }

  static unknown(message = 'An unexpected error occurred') {
    return new ApiError(ERROR_CODES.UNKNOWN_ERROR, message);
  }
}

export const getErrorMessage = (error) => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

export const getUserFriendlyMessage = (error) => {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ERROR_CODES.AUTH_ERROR:
        return 'Please log in to continue';
      case ERROR_CODES.FORBIDDEN:
        return 'You do not have permission to perform this action';
      case ERROR_CODES.NOT_FOUND:
        return 'The requested resource was not found';
      case ERROR_CODES.RATE_LIMIT:
        return 'Too many requests. Please wait a moment and try again.';
      case ERROR_CODES.NETWORK_ERROR:
        return 'Unable to connect. Please check your internet connection.';
      case ERROR_CODES.VALIDATION_ERROR:
        return error.message;
      default:
        return error.message || 'Something went wrong. Please try again.';
    }
  }

  return 'Something went wrong. Please try again.';
};
