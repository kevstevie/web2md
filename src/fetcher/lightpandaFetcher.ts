import { spawn } from 'node:child_process';
import { validateUrl } from '../utils/ssrf.js';
import { FetchFailedError, InvalidUrlError } from '../utils/errors.js';
import { MAX_URL_LENGTH, TIMEOUT_MS, MAX_BODY_SIZE_BYTES } from '../config/constants.js';
import type { HtmlFetcher } from './types.js';

export class LightpandaFetcher implements HtmlFetcher {
  async fetch(url: string): Promise<string> {
    if (url.length > MAX_URL_LENGTH) throw new InvalidUrlError(url);
    await validateUrl(url);

    return new Promise((resolve, reject) => {
      const proc = spawn('lightpanda', [
        'fetch',
        '--dump', 'html',
        '--strip-mode', 'js,css',
        '--wait-until', 'domcontentloaded',
        '--wait-ms', String(Math.max(TIMEOUT_MS - 3_000, 1_000)),
        url,
      ]);

      const chunks: Buffer[] = [];
      const errChunks: Buffer[] = [];
      let totalSize = 0;
      let timer: ReturnType<typeof setTimeout>;
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn();
      };

      timer = setTimeout(() => settle(() => {
        try { proc.kill('SIGKILL'); } catch { /* already gone */ }
        reject(new FetchFailedError(url, new Error('lightpanda fetch timed out')));
      }), TIMEOUT_MS);

      proc.stdout.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_BODY_SIZE_BYTES) {
          settle(() => {
            try { proc.kill('SIGKILL'); } catch { /* already gone */ }
            reject(new FetchFailedError(url, new Error('Response too large')));
          });
          return;
        }
        chunks.push(chunk);
      });
      proc.stderr.on('data', (chunk: Buffer) => errChunks.push(chunk));

      proc.on('close', (code) => settle(() => {
        if (code === 0) {
          resolve(Buffer.concat(chunks).toString('utf-8'));
        } else {
          const stderr = Buffer.concat(errChunks).toString('utf-8');
          reject(new FetchFailedError(url, new Error(stderr || `lightpanda exited with code ${code}`)));
        }
      }));

      proc.on('error', (e) => settle(() => reject(new FetchFailedError(url, e))));
    });
  }
}
