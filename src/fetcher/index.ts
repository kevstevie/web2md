import { existsSync } from 'node:fs';
import { StaticFetcher } from './staticFetcher.js';
import { PlaywrightFetcher } from './playwrightFetcher.js';
import type { HtmlFetcher } from './types.js';

// Probe once at module load; result is memoized for all subsequent calls.
// Checks both: (1) playwright npm package importable, (2) Chromium binary exists.
const _fetcher: Promise<HtmlFetcher> = import('playwright')
  .then(({ chromium }) => {
    if (!existsSync(chromium.executablePath())) {
      throw new Error('Chromium not installed');
    }
    return new PlaywrightFetcher() as HtmlFetcher;
  })
  .catch(() => new StaticFetcher());

export function createFetcher(): Promise<HtmlFetcher> {
  return _fetcher;
}

export type { HtmlFetcher };
