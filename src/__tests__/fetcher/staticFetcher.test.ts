import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InvalidUrlError, FetchFailedError } from '../../utils/errors.js';

vi.mock('node:dns/promises', () => ({
  resolve4: vi.fn().mockResolvedValue(['93.184.216.34']),
  resolve6: vi.fn().mockRejectedValue(new Error('ENODATA')),
}));

// global fetch mock
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { StaticFetcher } from '../../fetcher/staticFetcher.js';

const fetcher = new StaticFetcher();

function makeReadableStream(data: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(data);
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoded);
      controller.close();
    },
  });
}

function makeResponse(body: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(),
    body: makeReadableStream(body),
  } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('StaticFetcher — SSRF 차단', () => {
  it.each([
    'http://127.0.0.1',
    'http://10.0.0.1',
    'http://192.168.1.1',
    'http://172.16.0.1',
    'http://169.254.169.254',
  ])('%s 차단', async (url) => {
    await expect(fetcher.fetch(url)).rejects.toThrow(InvalidUrlError);
  });

  it('ftp:// 프로토콜 차단', async () => {
    await expect(fetcher.fetch('ftp://example.com')).rejects.toThrow(InvalidUrlError);
  });
});

describe('StaticFetcher — 정상 fetch', () => {
  it('HTML 응답 반환', async () => {
    mockFetch.mockResolvedValue(makeResponse('<html><body>Hello</body></html>'));
    const result = await fetcher.fetch('https://example.com');
    expect(result).toContain('Hello');
  });

  it('올바른 헤더로 요청', async () => {
    mockFetch.mockResolvedValue(makeResponse('<html></html>'));
    await fetcher.fetch('https://example.com');
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['User-Agent']).toContain('web2md');
    expect(headers['Accept']).toContain('text/html');
  });
});

describe('StaticFetcher — HTTP 오류 처리', () => {
  it('HTTP 404 → FetchFailedError', async () => {
    mockFetch.mockResolvedValue(makeResponse('Not Found', 404));
    await expect(fetcher.fetch('https://example.com')).rejects.toThrow(FetchFailedError);
  });

  it('HTTP 500 → FetchFailedError', async () => {
    mockFetch.mockResolvedValue(makeResponse('Server Error', 500));
    await expect(fetcher.fetch('https://example.com')).rejects.toThrow(FetchFailedError);
  });

  it('fetch 자체 실패 → FetchFailedError', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    await expect(fetcher.fetch('https://example.com')).rejects.toThrow(FetchFailedError);
  });
});

describe('StaticFetcher — 5MB 크기 제한', () => {
  it('5MB 초과 응답은 FetchFailedError', async () => {
    const largeData = 'x'.repeat(5 * 1024 * 1024 + 1);
    mockFetch.mockResolvedValue(makeResponse(largeData));
    await expect(fetcher.fetch('https://example.com')).rejects.toThrow(FetchFailedError);
  });

  it('5MB 이하 응답은 정상 처리', async () => {
    const okData = '<html>' + 'x'.repeat(100) + '</html>';
    mockFetch.mockResolvedValue(makeResponse(okData));
    const result = await fetcher.fetch('https://example.com');
    expect(result).toContain('<html>');
  });
});
