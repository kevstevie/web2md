import { describe, it, expect, vi } from 'vitest';

vi.mock('../../fetcher/staticFetcher.js', () => ({
  StaticFetcher: class { fetch = vi.fn(); },
}));

vi.mock('../../fetcher/playwrightFetcher.js', () => ({
  PlaywrightFetcher: class { fetch = vi.fn(); },
}));

import { createFetcher } from '../../fetcher/index.js';
import { PlaywrightFetcher } from '../../fetcher/playwrightFetcher.js';

describe('createFetcher', () => {
  it('Promise<HtmlFetcher>를 반환함', async () => {
    const fetcher = await createFetcher();
    expect(typeof fetcher.fetch).toBe('function');
  });

  it('playwright 설치 환경에서 PlaywrightFetcher 반환', async () => {
    const fetcher = await createFetcher();
    expect(fetcher).toBeInstanceOf(PlaywrightFetcher);
  });

  it('동일 인스턴스 반환 (memoized)', async () => {
    const a = await createFetcher();
    const b = await createFetcher();
    expect(a).toBe(b);
  });
});
