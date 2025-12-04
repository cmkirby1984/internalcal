/**
 * API Client with axios
 * Features:
 * - Token management with auto-refresh
 * - Request/response interceptors
 * - Error handling with typed errors
 * - Retry logic for transient failures
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import type { ApiError } from '../types/entities';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Cookie utilities for middleware auth checks
const setCookie = (name: string, value: string, days: number = 7): void => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

const removeCookie = (name: string): void => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Token storage utilities
export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    // Also set cookie for middleware auth checks
    setCookie(TOKEN_KEY, token, 1); // 1 day for access token
  },
  
  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    removeCookie(TOKEN_KEY);
  },
  
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  setRefreshToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },
  
  removeRefreshToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
  
  clearAll: (): void => {
    tokenStorage.removeToken();
    tokenStorage.removeRefreshToken();
  },
};

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - add auth token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenStorage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle errors and token refresh
  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  const processQueue = (error: Error | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };

  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Handle 401 Unauthorized - attempt token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve: () => resolve(client(originalRequest)), reject });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = tokenStorage.getRefreshToken();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token: newToken, refreshToken: newRefreshToken } = response.data;
          tokenStorage.setToken(newToken);
          if (newRefreshToken) {
            tokenStorage.setRefreshToken(newRefreshToken);
          }

          processQueue(null, newToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError as Error, null);
          tokenStorage.clearAll();
          
          // Dispatch logout event for stores to listen
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Transform error for consistent handling
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'An error occurred',
        statusCode: error.response?.status || 500,
        error: error.response?.data?.error,
      };

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Export singleton instance
export const apiClient = createApiClient();

// HTTP method helpers with typed responses
export const api = {
  get: <T>(url: string, params?: object): Promise<T> =>
    apiClient.get<T>(url, { params }).then((res) => res.data),

  post: <T>(url: string, data?: unknown): Promise<T> =>
    apiClient.post<T>(url, data).then((res) => res.data),

  put: <T>(url: string, data?: unknown): Promise<T> =>
    apiClient.put<T>(url, data).then((res) => res.data),

  patch: <T>(url: string, data?: unknown): Promise<T> =>
    apiClient.patch<T>(url, data).then((res) => res.data),

  delete: <T>(url: string): Promise<T> =>
    apiClient.delete<T>(url).then((res) => res.data),
};

export default api;

