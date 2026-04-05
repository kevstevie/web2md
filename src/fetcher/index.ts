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
    await execFileAsync('lightpanda', ['--version']);
    return true;
  } catch {
    return false;
  }
}

// Probe once at module load; result is memoized for all subsequent calls.
// Priority: Lightpanda > Playwright/Chromium > Static
const _fetcher: Promise<HtmlFetcher> = isLightpandaAvailable()
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

export function createFetcher(): Promise<HtmlFetcher> {
  return _fetcher;
}

export type { HtmlFetcher };
