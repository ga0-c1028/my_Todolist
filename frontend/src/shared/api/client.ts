import { getEnv } from '../config/env';

const ACCESS_TOKEN_KEY = 'my_todolist_access_token';
const REFRESH_TOKEN_KEY = 'my_todolist_refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function setAccessToken(accessToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

const AUTH_ENDPOINTS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/signup'];

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${getEnv().apiBaseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        setAccessToken(data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${getEnv().apiBaseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !AUTH_ENDPOINTS.includes(path)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${getAccessToken()}` },
      });
    } else {
      clearTokens();
      window.location.href = '/login';
    }
  }

  return response;
}

export const api = {
  get: (path: string, options?: RequestInit) => apiFetch(path, { ...options, method: 'GET' }),
  post: (path: string, body?: unknown, options?: RequestInit) =>
    apiFetch(path, { ...options, method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: (path: string, body?: unknown, options?: RequestInit) =>
    apiFetch(path, { ...options, method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: (path: string, options?: RequestInit) => apiFetch(path, { ...options, method: 'DELETE' }),
};

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, code: string | undefined, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.code, body?.message ?? '요청 처리 중 오류가 발생했습니다.');
  }
  return response.json() as Promise<T>;
}
