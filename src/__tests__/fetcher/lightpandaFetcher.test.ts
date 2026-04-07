import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { InvalidUrlError, FetchFailedError } from '../../utils/errors.js';
import { TIMEOUT_MS } from '../../config/constants.js';

vi.mock('node:dns/promises', () => ({
  resolve4: vi.fn().mockResolvedValue(['93.184.216.34']),
  resolve6: vi.fn().mockRejectedValue(new Error('ENODATA')),
}));

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

import { spawn } from 'node:child_process';
import { LightpandaFetcher } from '../../fetcher/lightpandaFetcher.js';

class MockProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill = vi.fn();
}

let mockProc: MockProcess;
const fetcher = new LightpandaFetcher();

// setTimeout(fn, 0) ensures all pending microtasks (validateUrl's async DNS resolution)
// complete before emitting, so proc event listeners are already attached.
function emitSuccess(html: string): Promise<void> {
  return new Promise(resolve => setTimeout(() => {
    mockProc.stdout.emit('data', Buffer.from(html));
    mockProc.emit('close', 0);
    resolve();
  }, 0));
}

function emitFailure(code: number, stderr = ''): Promise<void> {
  return new Promise(resolve => setTimeout(() => {
    if (stderr) mockProc.stderr.emit('data', Buffer.from(stderr));
    mockProc.emit('close', code);
    resolve();
  }, 0));
}

function emitError(err: Error): Promise<void> {
  return new Promise(resolve => setTimeout(() => {
    mockProc.emit('error', err);
    resolve();
  }, 0));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockProc = new MockProcess();
  vi.mocked(spawn).mockReturnValue(mockProc as unknown as ReturnType<typeof spawn>);
});

describe('LightpandaFetcher — 기본 동작', () => {
  it('정상 URL에서 렌더링된 HTML 반환', async () => {
    const html = '<html><body><h1>Hello</h1></body></html>';
    const [result] = await Promise.all([
      fetcher.fetch('https://example.com'),
      emitSuccess(html),
    ]);
    expect(result).toBe(html);
  });

  it('올바른 lightpanda 인자로 spawn 호출', async () => {
    await Promise.all([
      fetcher.fetch('https://example.com'),
      emitSuccess('<html></html>'),
    ]);
    expect(spawn).toHaveBeenCalledWith('lightpanda', [
      'fetch',
      '--dump', 'html',
      '--strip-mode', 'js,css',
      '--wait-until', 'domcontentloaded',
      '--wait-ms', expect.any(String),
      'https://example.com',
    ]);
  });

  it('여러 stdout chunk를 이어붙여 반환', async () => {
    const [result] = await Promise.all([
      fetcher.fetch('https://example.com'),
      new Promise<void>(resolve => setTimeout(() => {
        mockProc.stdout.emit('data', Buffer.from('<html>'));
        mockProc.stdout.emit('data', Buffer.from('<body>hi</body>'));
        mockProc.stdout.emit('data', Buffer.from('</html>'));
        mockProc.emit('close', 0);
        resolve();
      }, 0)),
    ]);
    expect(result).toBe('<html><body>hi</body></html>');
  });
});

describe('LightpandaFetcher — SSRF 차단', () => {
  it('사설 IP URL은 InvalidUrlError', async () => {
    await expect(fetcher.fetch('http://127.0.0.1')).rejects.toThrow(InvalidUrlError);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('2048자 초과 URL은 InvalidUrlError', async () => {
    const longUrl = 'https://example.com/?' + 'a'.repeat(2050);
    await expect(fetcher.fetch(longUrl)).rejects.toThrow(InvalidUrlError);
    expect(spawn).not.toHaveBeenCalled();
  });
});

describe('LightpandaFetcher — 오류 처리', () => {
  it('비정상 종료 코드(non-zero)는 FetchFailedError', async () => {
    await expect(Promise.all([
      fetcher.fetch('https://example.com'),
      emitFailure(1, 'something went wrong'),
    ])).rejects.toThrow(FetchFailedError);
  });

  it('stderr 내용이 없어도 FetchFailedError 발생', async () => {
    await expect(Promise.all([
      fetcher.fetch('https://example.com'),
      emitFailure(1),
    ])).rejects.toThrow(FetchFailedError);
  });

  it('spawn 자체 오류(ENOENT 등)는 FetchFailedError', async () => {
    await expect(Promise.all([
      fetcher.fetch('https://example.com'),
      emitError(new Error('ENOENT: lightpanda not found')),
    ])).rejects.toThrow(FetchFailedError);
  });
});

describe('LightpandaFetcher — 타임아웃', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('TIMEOUT_MS 초과 시 proc.kill 호출 후 FetchFailedError', async () => {
    vi.useFakeTimers();

    const fetchPromise = fetcher.fetch('https://example.com');

    // t=0: DNS Promise.allSettled 마이크로태스크 완료 + spawn 후 타이머 등록 대기
    await vi.advanceTimersByTimeAsync(0);

    // TIMEOUT_MS 경과 → settle 콜백 실행
    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);

    await expect(fetchPromise).rejects.toThrow(FetchFailedError);
    expect(mockProc.kill).toHaveBeenCalledWith('SIGKILL');
  });
});
