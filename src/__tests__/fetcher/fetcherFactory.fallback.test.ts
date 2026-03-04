import { describe, it, expect, vi } from 'vitest';

// Hoisted: causes import('playwright') inside fetcher/index.ts to reject
vi.mock('playwright', () => { throw new Error('playwright not installed'); });

vi.mock('../../fetcher/staticFetcher.js', () => ({
  StaticFetcher: class { fetch = vi.fn(); },
}));

vi.mock('../../fetcher/playwrightFetcher.js', () => ({
  PlaywrightFetcher: class { fetch = vi.fn(); },
}));

import { createFetcher } from '../../fetcher/index.js';
import { StaticFetcher } from '../../fetcher/staticFetcher.js';

describe('createFetcher — playwright 미설치 fallback', () => {
  it('playwright import 실패 시 StaticFetcher 반환', async () => {
    const fetcher = await createFetcher();
    expect(fetcher).toBeInstanceOf(StaticFetcher);
  });

  it('동일 인스턴스 반환 (memoized)', async () => {
    const a = await createFetcher();
    const b = await createFetcher();
    expect(a).toBe(b);
  });
});
