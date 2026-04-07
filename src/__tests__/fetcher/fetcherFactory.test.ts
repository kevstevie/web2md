import { describe, it, expect, vi, beforeEach } from 'vitest';

// lightpanda 없음 → Playwright 사용 경로
vi.mock('node:child_process', () => ({
  execFile: (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error | null) => void) => {
    cb(new Error('not found'));
  },
  promisify: (fn: unknown) => fn,
}));

vi.mock('node:util', () => ({
  promisify: (fn: (...args: unknown[]) => void) =>
    (...args: unknown[]) =>
      new Promise((_resolve, reject) => fn(...args, (err: Error | null) => err ? reject(err) : _resolve(undefined))),
}));

vi.mock('../../fetcher/staticFetcher.js', () => ({
  StaticFetcher: class { fetch = vi.fn(); },
}));

vi.mock('../../fetcher/playwrightFetcher.js', () => ({
  PlaywrightFetcher: class { fetch = vi.fn(); },
}));

vi.mock('../../fetcher/lightpandaFetcher.js', () => ({
  LightpandaFetcher: class { fetch = vi.fn(); },
}));

import { createFetcher, _resetFetcher } from '../../fetcher/index.js';
import { PlaywrightFetcher } from '../../fetcher/playwrightFetcher.js';

beforeEach(() => _resetFetcher());

describe('createFetcher — lightpanda 없음, playwright 있음', () => {
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
