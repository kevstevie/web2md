import { describe, it, expect, vi } from 'vitest';

const mockStaticFetch = vi.fn();
const mockPlaywrightFetch = vi.fn();

vi.mock('../../fetcher/staticFetcher.js', () => ({
  StaticFetcher: class {
    fetch = mockStaticFetch;
  },
}));

vi.mock('../../fetcher/playwrightFetcher.js', () => ({
  PlaywrightFetcher: class {
    fetch = mockPlaywrightFetch;
  },
}));

import { createFetcher } from '../../fetcher/index.js';
import { StaticFetcher } from '../../fetcher/staticFetcher.js';
import { PlaywrightFetcher } from '../../fetcher/playwrightFetcher.js';

describe('createFetcher', () => {
  it('jsEnabled=false → StaticFetcher 인스턴스 반환', () => {
    const fetcher = createFetcher(false);
    expect(fetcher).toBeInstanceOf(StaticFetcher);
  });

  it('jsEnabled=true → PlaywrightFetcher 인스턴스 반환', () => {
    const fetcher = createFetcher(true);
    expect(fetcher).toBeInstanceOf(PlaywrightFetcher);
  });

  it('반환된 fetcher는 fetch 메서드를 가짐', () => {
    const staticFetcher = createFetcher(false);
    const playwrightFetcher = createFetcher(true);
    expect(typeof staticFetcher.fetch).toBe('function');
    expect(typeof playwrightFetcher.fetch).toBe('function');
  });
});
