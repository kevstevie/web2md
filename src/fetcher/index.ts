import { StaticFetcher } from './staticFetcher.js';
import { PlaywrightFetcher } from './playwrightFetcher.js';
import type { HtmlFetcher } from './types.js';

// Probe once at module load; result is memoized for all subsequent calls.
const _fetcher: Promise<HtmlFetcher> = import('playwright')
  .then(() => new PlaywrightFetcher() as HtmlFetcher)
  .catch(() => new StaticFetcher());

export function createFetcher(): Promise<HtmlFetcher> {
  return _fetcher;
}

export type { HtmlFetcher };
