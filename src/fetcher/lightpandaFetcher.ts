import { spawn } from 'node:child_process';
import { validateUrl } from '../utils/ssrf.js';
import { FetchFailedError } from '../utils/errors.js';
import { TIMEOUT_MS, MAX_BODY_SIZE_BYTES } from '../config/constants.js';
import type { HtmlFetcher } from './types.js';

export class LightpandaFetcher implements HtmlFetcher {
  async fetch(url: string): Promise<string> {
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
      let errSize = 0;
      const MAX_STDERR_BYTES = 64 * 1024;
      let timer: ReturnType<typeof setTimeout>;
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn();
      };

      const killProc = () => {
        try {
          proc.kill('SIGKILL');
        } catch (e: unknown) {
          if ((e as NodeJS.ErrnoException).code !== 'ESRCH') throw e;
        }
      };

      timer = setTimeout(() => settle(() => {
        killProc();
        reject(new FetchFailedError(url, new Error('lightpanda fetch timed out')));
      }), TIMEOUT_MS);

      proc.stdout.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_BODY_SIZE_BYTES) {
          settle(() => {
            killProc();
            reject(new FetchFailedError(url, new Error('Response too large')));
          });
          return;
        }
        chunks.push(chunk);
      });
      proc.stderr.on('data', (chunk: Buffer) => {
        const remaining = MAX_STDERR_BYTES - errSize;
        if (remaining <= 0) return;
        errChunks.push(chunk.subarray(0, remaining));
        errSize += chunk.length;
      });

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
