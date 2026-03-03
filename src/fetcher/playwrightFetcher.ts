import { validateUrl } from '../utils/ssrf.js';
import { FetchFailedError, InvalidUrlError } from '../utils/errors.js';
import type { HtmlFetcher } from './types.js';

const TIMEOUT_MS = 15_000;
const MAX_URL_LENGTH = 2048;

// Resource types that are heavy or not needed for text content extraction
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
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (compatible; web2md/1.0)',
      });
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(TIMEOUT_MS);
      page.setDefaultTimeout(TIMEOUT_MS);

      // SSRF protection: intercept all requests and validate each URL
      // Note: DNS rebinding mitigation is limited in browser-based rendering.
      // We validate each request URL to block private IPs, but the browser
      // performs its own DNS resolution which cannot be pinned.
      await page.route('**/*', async (route) => {
        const resourceType = route.request().resourceType();

        // Block heavy resource types not needed for text extraction
        if (BLOCKED_RESOURCE_TYPES.has(resourceType)) {
          await route.abort();
          return;
        }

        try {
          await validateUrl(route.request().url());
          await route.continue();
        } catch (e) {
          if (e instanceof InvalidUrlError) {
            await route.abort('blockedbyclient');
          } else {
            await route.abort();
          }
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
