import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Axios keeps registered interceptors on `.handlers` at runtime; that isn't in
 * the public types, so we reach in with a narrow local shape to exercise them.
 */
type InterceptorHandler = {
  fulfilled: (value: unknown) => unknown;
  rejected: (error: unknown) => unknown;
};

type HttpWithHandlers = {
  interceptors: {
    request: { handlers: InterceptorHandler[] };
    response: { handlers: InterceptorHandler[] };
  };
};

// The module reads env at load time, so import fresh after stubbing env.
const loadHttp = async () => {
  const mod = await import('./interceptor');
  return mod.http as unknown as HttpWithHandlers;
};

const requestInterceptor = (http: HttpWithHandlers) => http.interceptors.request.handlers[0];
const responseInterceptor = (http: HttpWithHandlers) => http.interceptors.response.handlers[0];

describe('http interceptor', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('request interceptor', () => {
    it('adds a Bearer Authorization header when a token is configured', async () => {
      vi.stubEnv('VITE_TOKEN', 'test-token');
      const http = await loadHttp();

      const config = { headers: {} } as { headers: Record<string, unknown> };
      const result = requestInterceptor(http).fulfilled(config) as typeof config;

      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('leaves the Authorization header off when no token is configured', async () => {
      vi.stubEnv('VITE_TOKEN', '');
      const http = await loadHttp();

      const config = { headers: {} } as { headers: Record<string, unknown> };
      const result = requestInterceptor(http).fulfilled(config) as typeof config;

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    it('unwraps and returns response.data on success', async () => {
      const http = await loadHttp();

      const payload = [{ _id: '1', message: 'hi' }];
      const result = responseInterceptor(http).fulfilled({ data: payload });

      expect(result).toEqual(payload);
    });

    it('rejects with the API-provided message when present', async () => {
      const http = await loadHttp();

      const error = {
        response: { data: { message: 'Validation failed' } },
        message: 'Request failed with status code 400',
      };

      await expect(responseInterceptor(http).rejected(error)).rejects.toThrow(
        'Validation failed',
      );
    });

    it('falls back to the axios error message when no API message exists', async () => {
      const http = await loadHttp();

      const error = { message: 'Network Error' };

      await expect(responseInterceptor(http).rejected(error)).rejects.toThrow(
        'Network Error',
      );
    });

    it('falls back to a generic message when nothing else is available', async () => {
      const http = await loadHttp();

      await expect(responseInterceptor(http).rejected({})).rejects.toThrow(
        'Something went wrong',
      );
    });

    it('always rejects with an Error instance', async () => {
      const http = await loadHttp();

      await expect(responseInterceptor(http).rejected({ message: 'boom' })).rejects.toBeInstanceOf(
        Error,
      );
    });
  });
});
