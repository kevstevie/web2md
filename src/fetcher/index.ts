import { StaticFetcher } from './staticFetcher.js';
import { PlaywrightFetcher } from './playwrightFetcher.js';
import type { HtmlFetcher } from './types.js';

export function createFetcher(jsEnabled: boolean): HtmlFetcher {
  if (jsEnabled) {
    return new PlaywrightFetcher();
  }
  return new StaticFetcher();
}

export type { HtmlFetcher };
