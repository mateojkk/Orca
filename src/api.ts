/**
 * Shared API helpers: axios instance with auth header + address validation.
 */
import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

const ETH_RE = /^0x[0-9a-fA-F]{40}$/;
const AUTH_TOKEN_KEY = 'orca_auth_token';

export function isValidAddress(addr: string): boolean {
  return ETH_RE.test(addr);
}

// In production (Vercel): '' → same-origin, routes /api/* to the serverless function.
// In dev: '' → Vite proxy in vite.config.ts forwards /api → http://127.0.0.1:8080.
const API_BASE_URL = import.meta.env.VITE_RELAYER_URL || import.meta.env.VITE_API_URL || '';

export function setAuthToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export const baseApi = axios.create({
  baseURL: API_BASE_URL
});

baseApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAuthToken();
  const headers = config.headers as any;
  const existingAuthorization = typeof headers?.get === 'function'
    ? headers.get('Authorization')
    : headers?.Authorization ?? headers?.authorization;

  if (token && !existingAuthorization) {
    config.headers = headers || {};
    if (typeof (config.headers as any).set === 'function') {
      (config.headers as any).set('Authorization', `Bearer ${token}`);
    } else {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function authAxios(walletAddress: string | undefined) {
  const instance = axios.create({
    baseURL: API_BASE_URL
  });
  if (walletAddress) {
    instance.defaults.headers.common['X-Wallet-Address'] = walletAddress;
  }
  return instance;
}

export function getErrorMessage(err: any): string {
  if (err.response?.data?.detail) {
    if (typeof err.response.data.detail === 'string') {
      return err.response.data.detail;
    }
    if (Array.isArray(err.response.data.detail)) {
      return err.response.data.detail[0]?.msg || 'validation error';
    }
  }
  if (err.response?.status === 404) {
    return 'resource not found (404)';
  }
  if (err.response?.status === 401) {
    return 'unauthorized (401)';
  }
  if (err.response?.status === 500) {
    return `server error (500): ${err.response?.data?.message || err.response?.data || 'unknown'}`;
  }
  if (err.message === 'Network Error') {
    return 'Network Error: Check backend server status';
  }
  return err.message || 'unknown error';
}
