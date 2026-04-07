import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { StaticFetcher } from './staticFetcher.js';
import { PlaywrightFetcher } from './playwrightFetcher.js';
import { LightpandaFetcher } from './lightpandaFetcher.js';
import type { HtmlFetcher } from './types.js';

const execFileAsync = promisify(execFile);

async function isLightpandaAvailable(): Promise<boolean> {
  try {
    await execFileAsync('lightpanda', ['version']);
    return true;
  } catch {
    return false;
  }
}

// Priority: Lightpanda > Playwright/Chromium > Static
// Resolved lazily on first call; subsequent calls return the memoized promise.
let _fetcher: Promise<HtmlFetcher> | null = null;

function buildFetcher(): Promise<HtmlFetcher> {
  return isLightpandaAvailable()
    .then((available) => {
      if (available) return new LightpandaFetcher() as HtmlFetcher;
      return import('playwright').then(({ chromium }) => {
        if (!existsSync(chromium.executablePath())) {
          throw new Error('Chromium not installed');
        }
        return new PlaywrightFetcher() as HtmlFetcher;
      });
    })
    .catch(() => new StaticFetcher());
}

export function createFetcher(): Promise<HtmlFetcher> {
  if (!_fetcher) _fetcher = buildFetcher();
  return _fetcher;
}

/** Reset memoized fetcher — for use in tests only. */
export function _resetFetcher(): void {
  _fetcher = null;
}

export type { HtmlFetcher };
