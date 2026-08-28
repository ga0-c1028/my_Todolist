import { describe, expect, it } from 'vitest';
import { getEnv } from './env';

describe('getEnv', () => {
  it('returns apiBaseUrl from Vite env', () => {
    const env = getEnv();
    expect(typeof env.apiBaseUrl).toBe('string');
    expect(env.apiBaseUrl.length).toBeGreaterThan(0);
  });

  it('returns isDev as boolean', () => {
    expect(typeof getEnv().isDev).toBe('boolean');
  });

  // "throws when missing" case is skipped: VITE_API_BASE_URL is baked into
  // import.meta.env at Vite config time, not reassignable per-test without
  // module-graph tricks that outweigh the value here.
});
