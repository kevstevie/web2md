// lightpanda 없음 + playwright 없음 → StaticFetcher 사용 경로
vi.mock('node:child_process', () => ({
  execFile: (_cmd: string, _args: string[], cb: (err: Error | null) => void) => {
    cb(new Error('not found'));
  },
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

vi.mock('playwright', () => { throw new Error('playwright not installed'); });

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFetcher, _resetFetcher } from '../../fetcher/index.js';
import { StaticFetcher } from '../../fetcher/staticFetcher.js';

beforeEach(() => _resetFetcher());

describe('createFetcher — lightpanda 없음, playwright 없음', () => {
  it('StaticFetcher로 fallback', async () => {
    const fetcher = await createFetcher();
    expect(fetcher).toBeInstanceOf(StaticFetcher);
  });
});
