import { describe, it, expect, vi, beforeEach } from 'vitest';

// lightpanda 있음 → LightpandaFetcher 사용 경로
vi.mock('node:child_process', () => ({
  execFile: (_cmd: string, _args: string[], _opts: unknown, cb: (err: Error | null) => void) => {
    cb(null); // lightpanda version 성공
  },
  promisify: (fn: unknown) => fn,
}));

vi.mock('node:util', () => ({
  promisify: (fn: (...args: unknown[]) => void) =>
    (...args: unknown[]) =>
      new Promise((resolve, reject) => fn(...args, (err: Error | null) => err ? reject(err) : resolve(undefined))),
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
import { LightpandaFetcher } from '../../fetcher/lightpandaFetcher.js';

beforeEach(() => _resetFetcher());

describe('createFetcher — lightpanda 있음', () => {
  it('LightpandaFetcher를 최우선으로 반환', async () => {
    const fetcher = await createFetcher();
    expect(fetcher).toBeInstanceOf(LightpandaFetcher);
  });

  it('동일 인스턴스 반환 (memoized)', async () => {
    const a = await createFetcher();
    const b = await createFetcher();
    expect(a).toBe(b);
  });
});
