import { spawn } from 'node:child_process';
import { validateUrl } from '../utils/ssrf.js';
import { FetchFailedError } from '../utils/errors.js';
import { TIMEOUT_MS, MAX_BODY_SIZE_BYTES, MAX_STDERR_BYTES, LIGHTPANDA_STRIP_MODE } from '../config/constants.js';
import type { HtmlFetcher } from './types.js';

export class LightpandaFetcher implements HtmlFetcher {
  async fetch(url: string): Promise<string> {
    await validateUrl(url);

    return new Promise((resolve, reject) => {
      const proc = spawn('lightpanda', [
        'fetch',
        '--dump', 'html',
        '--strip-mode', LIGHTPANDA_STRIP_MODE,
        '--wait-until', 'domcontentloaded',
        // 3s margin so lightpanda times out before Node kills the process; minimum 1s
        '--wait-ms', String(Math.max(TIMEOUT_MS - 3_000, 1_000)),
        url,
      ]);

      const chunks: Buffer[] = [];
      const errChunks: Buffer[] = [];
      let totalSize = 0;
      let errSize = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn();
      };

      const settleError = (fn: () => void) => settle(() => {
        chunks.length = 0;
        errChunks.length = 0;
        fn();
      });

      const killProc = () => {
        try {
          proc.kill('SIGKILL');
        } catch (e: unknown) {
          if ((e as NodeJS.ErrnoException).code !== 'ESRCH') throw e;
        }
      };

      timer = setTimeout(() => settleError(() => {
        killProc();
        reject(new FetchFailedError(url, new Error('lightpanda fetch timed out')));
      }), TIMEOUT_MS);

      proc.stdout.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        if (totalSize > MAX_BODY_SIZE_BYTES) {
          settleError(() => {
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
        const toStore = chunk.subarray(0, remaining);
        errChunks.push(toStore);
        errSize += toStore.length;
      });

      proc.on('close', (code) => {
        if (code === 0) {
          settle(() => resolve(Buffer.concat(chunks).toString('utf-8')));
        } else {
          const stderr = Buffer.concat(errChunks).toString('utf-8');
          settleError(() => reject(new FetchFailedError(url, new Error(stderr || `lightpanda exited with code ${code}`))));
        }
      });

      proc.on('error', (e) => settleError(() => reject(new FetchFailedError(url, e))));
    });
  }
}
