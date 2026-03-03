import { validateUrl } from '../utils/ssrf.js';
import { FetchFailedError, InvalidUrlError } from '../utils/errors.js';
import { MAX_URL_LENGTH, TIMEOUT_MS, MAX_BODY_SIZE_BYTES, USER_AGENT } from '../config/constants.js';
import type { HtmlFetcher } from './types.js';

export class StaticFetcher implements HtmlFetcher {
  async fetch(url: string): Promise<string> {
    if (url.length > MAX_URL_LENGTH) {
      throw new InvalidUrlError(url);
    }

    await validateUrl(url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      let response: Response;
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
        throw new FetchFailedError(url, e);
      }

      if (!response.ok) {
        throw new FetchFailedError(url, new Error(`HTTP ${response.status} ${response.statusText}`));
      }

      const reader = response.body?.getReader();
      if (!reader) {
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
          throw new FetchFailedError(url, new Error(`Response body exceeds ${MAX_BODY_SIZE_BYTES / 1024 / 1024}MB limit`));
        }
        chunks.push(value);
      }

      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return new TextDecoder().decode(combined);
    } catch (e) {
      if (e instanceof InvalidUrlError || e instanceof FetchFailedError) throw e;
      throw new FetchFailedError(url, e);
    } finally {
      clearTimeout(timeout);
    }
  }
}
