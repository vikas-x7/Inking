import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/src/shared/config/env';

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export const httpClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = httpClient
      .post('/auth/refresh')
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (!originalRequest || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retried) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;

    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      return Promise.reject(error);
    }

    return httpClient(originalRequest);
  },
);
