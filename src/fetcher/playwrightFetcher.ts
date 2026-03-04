import { validateUrl } from '../utils/ssrf.js';
import { FetchFailedError, InvalidUrlError } from '../utils/errors.js';
import { MAX_URL_LENGTH, TIMEOUT_MS, USER_AGENT } from '../config/constants.js';
import type { HtmlFetcher } from './types.js';

// Resource types not needed for text content extraction
const BLOCKED_RESOURCE_TYPES = new Set(['media', 'font', 'image', 'stylesheet', 'websocket', 'eventsource']);

export class PlaywrightFetcher implements HtmlFetcher {
  async fetch(url: string): Promise<string> {
    if (url.length > MAX_URL_LENGTH) {
      throw new InvalidUrlError(url);
    }

    await validateUrl(url);

    let chromium: import('playwright').BrowserType;
    try {
      const pw = await import('playwright');
      chromium = pw.chromium;
    } catch {
      throw new FetchFailedError(url, new Error('Playwright is not installed. Run: playwright install chromium'));
    }

    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ userAgent: USER_AGENT });
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(TIMEOUT_MS);
      page.setDefaultTimeout(TIMEOUT_MS);

      // SSRF protection: intercept all requests and validate each URL.
      // Note: DNS rebinding mitigation is limited in browser-based rendering
      // since the browser performs its own DNS resolution.
      await page.route('**/*', async (route) => {
        if (BLOCKED_RESOURCE_TYPES.has(route.request().resourceType())) {
          await route.abort();
          return;
        }
        try {
          await validateUrl(route.request().url());
          await route.continue();
        } catch (e) {
          await route.abort(e instanceof InvalidUrlError ? 'blockedbyclient' : undefined);
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded' });
      return await page.content();
    } catch (e) {
      if (e instanceof InvalidUrlError || e instanceof FetchFailedError) throw e;
      throw new FetchFailedError(url, e);
    } finally {
      await browser.close();
    }
  }
}
