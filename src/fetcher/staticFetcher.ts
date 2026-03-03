import { validateUrl } from '../utils/ssrf.js';
import { FetchFailedError } from '../utils/errors.js';
import type { HtmlFetcher } from './types.js';

const MAX_BODY_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const TIMEOUT_MS = 15_000;
const USER_AGENT = 'Mozilla/5.0 (compatible; web2md/1.0)';
const MAX_URL_LENGTH = 2048;

export class StaticFetcher implements HtmlFetcher {
  async fetch(url: string): Promise<string> {
    if (url.length > MAX_URL_LENGTH) {
      const { InvalidUrlError } = await import('../utils/errors.js');
      throw new InvalidUrlError(url);
    }

    await validateUrl(url);

    let response: Response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip',
        },
      });
    } catch (e) {
      clearTimeout(timeout);
      throw new FetchFailedError(url, e);
    }

    if (!response.ok) {
      clearTimeout(timeout);
      throw new FetchFailedError(url, new Error(`HTTP ${response.status} ${response.statusText}`));
    }

    // Stream body with size guard to prevent memory exhaustion
    try {
      const reader = response.body?.getReader();
      if (!reader) {
        clearTimeout(timeout);
        throw new FetchFailedError(url, new Error('Response body is not readable'));
      }

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        totalBytes += value.byteLength;
        if (totalBytes > MAX_BODY_SIZE_BYTES) {
          await reader.cancel();
          throw new Error('Response body exceeds 5MB limit');
        }
        chunks.push(value);
      }

      clearTimeout(timeout);

      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return new TextDecoder().decode(combined);
    } catch (e) {
      clearTimeout(timeout);
      if (e instanceof FetchFailedError) throw e;
      throw new FetchFailedError(url, e);
    }
  }
}
