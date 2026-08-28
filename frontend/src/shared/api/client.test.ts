import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  api,
  apiFetch,
  ApiError,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  parseJsonOrThrow,
  setAccessToken,
  setTokens,
} from './client';

function mockResponse(init: { status: number; ok: boolean; json?: () => Promise<unknown> }) {
  return init as unknown as Response;
}

describe('token helpers', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips setTokens/getAccessToken/getRefreshToken/clearTokens', () => {
    setTokens('a1', 'r1');
    expect(getAccessToken()).toBe('a1');
    expect(getRefreshToken()).toBe('r1');

    clearTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('setAccessToken only updates the access token', () => {
    setTokens('a1', 'r1');
    setAccessToken('a2');
    expect(getAccessToken()).toBe('a2');
    expect(getRefreshToken()).toBe('r1');
  });
});

describe('apiFetch', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, href: '' },
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('does not send Authorization header when no access token stored', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ status: 200, ok: true }));

    await apiFetch('/api/todos');

    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('sends Authorization header when an access token is stored', async () => {
    setTokens('at1', 'rt1');
    vi.mocked(fetch).mockResolvedValue(mockResponse({ status: 200, ok: true }));

    await apiFetch('/api/todos');

    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer at1');
  });

  it('returns the response directly on success without retrying', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ status: 200, ok: true }));

    const res = await apiFetch('/api/todos');

    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('refreshes the token and retries once when refresh succeeds', async () => {
    setTokens('old-at', 'rt1');
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/api/auth/refresh')) {
        return mockResponse({ status: 200, ok: true, json: async () => ({ accessToken: 'new-at' }) });
      }
      if (fetchMock.mock.calls.length === 1) {
        return mockResponse({ status: 401, ok: false });
      }
      return mockResponse({ status: 200, ok: true });
    });

    const res = await apiFetch('/api/todos');

    expect(res.status).toBe(200);
    expect(getAccessToken()).toBe('new-at');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retryHeaders = fetchMock.mock.calls[2][1]?.headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer new-at');
  });

  it('clears tokens and redirects to /login when refresh fails', async () => {
    setTokens('old-at', 'rt1');
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation(async (url: string | URL | Request) => {
      const urlStr = String(url);
      if (urlStr.endsWith('/api/auth/refresh')) {
        return mockResponse({ status: 401, ok: false });
      }
      return mockResponse({ status: 401, ok: false });
    });

    await apiFetch('/api/todos');

    expect(getAccessToken()).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('does not attempt refresh for /api/auth/login 401 responses', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ status: 401, ok: false }));

    await apiFetch('/api/auth/login');

    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe('api helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
    vi.mocked(fetch).mockResolvedValue(mockResponse({ status: 200, ok: true }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('api.post sends POST with JSON body', async () => {
    await api.post('/x', { a: 1 });

    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(options?.method).toBe('POST');
    expect(options?.body).toBe(JSON.stringify({ a: 1 }));
  });

  it('api.get sends GET', async () => {
    await api.get('/x');
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('GET');
  });

  it('api.patch sends PATCH', async () => {
    await api.patch('/x', { a: 1 });
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('PATCH');
  });

  it('api.delete sends DELETE', async () => {
    await api.delete('/x');
    expect(vi.mocked(fetch).mock.calls[0][1]?.method).toBe('DELETE');
  });
});

describe('parseJsonOrThrow', () => {
  it('resolves with the parsed body when response.ok is true', async () => {
    const res = mockResponse({ status: 200, ok: true, json: async () => ({ foo: 'bar' }) });

    await expect(parseJsonOrThrow(res)).resolves.toEqual({ foo: 'bar' });
  });

  it('rejects with an ApiError built from the error body when response.ok is false', async () => {
    const res = mockResponse({
      status: 404,
      ok: false,
      json: async () => ({ code: 'NOT_FOUND', message: '찾을 수 없습니다.' }),
    });

    const error = (await parseJsonOrThrow(res).catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('찾을 수 없습니다.');
  });

  it('falls back to a default message when the error body is not valid JSON', async () => {
    const res = mockResponse({
      status: 500,
      ok: false,
      json: () => Promise.reject(new Error('bad json')),
    });

    const error = (await parseJsonOrThrow(res).catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.message).toBe('요청 처리 중 오류가 발생했습니다.');
  });

  it('ApiError is an instance of Error', () => {
    expect(new ApiError(400, 'X', 'msg')).toBeInstanceOf(Error);
  });
});
