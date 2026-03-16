import { ApiError, ERROR_CODES } from './errors';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api'
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.activeRequests = new Map();
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  createAbortController(requestKey) {
    if (requestKey && this.activeRequests.has(requestKey)) {
      this.activeRequests.get(requestKey).abort();
    }

    const controller = new AbortController();
    if (requestKey) {
      this.activeRequests.set(requestKey, controller);
    }
    return controller;
  }

  cleanupRequest(requestKey) {
    if (requestKey) {
      this.activeRequests.delete(requestKey);
    }
  }

  cancelRequest(requestKey) {
    if (this.activeRequests.has(requestKey)) {
      this.activeRequests.get(requestKey).abort();
      this.activeRequests.delete(requestKey);
    }
  }

  cancelAllRequests() {
    this.activeRequests.forEach((controller) => controller.abort());
    this.activeRequests.clear();
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body,
      auth = false,
      requestKey,
      signal: externalSignal
    } = options;

    const controller = this.createAbortController(requestKey);
    const signal = externalSignal || controller.signal;

    const headers = {
      'Content-Type': 'application/json',
      ...(auth ? this.getAuthHeaders() : {})
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw ApiError.fromResponse(response, data);
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new ApiError(ERROR_CODES.UNKNOWN_ERROR, 'Request cancelled', null);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof TypeError || error.message === 'Failed to fetch') {
        throw ApiError.networkError(error);
      }

      throw ApiError.unknown(error.message);
    } finally {
      this.cleanupRequest(requestKey);
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

export default apiClient;
