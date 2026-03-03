import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvalidUrlError, FetchFailedError } from '../../utils/errors.js';

vi.mock('node:dns/promises', () => ({
  resolve4: vi.fn().mockResolvedValue(['93.184.216.34']),
  resolve6: vi.fn().mockRejectedValue(new Error('ENODATA')),
}));

// Playwright mock
const mockPage = {
  setDefaultNavigationTimeout: vi.fn(),
  setDefaultTimeout: vi.fn(),
  route: vi.fn(),
  goto: vi.fn(),
  content: vi.fn().mockResolvedValue('<html><body>Rendered</body></html>'),
};
const mockContext = {
  newPage: vi.fn().mockResolvedValue(mockPage),
};
const mockBrowser = {
  newContext: vi.fn().mockResolvedValue(mockContext),
  close: vi.fn(),
};
const mockChromium = {
  launch: vi.fn().mockResolvedValue(mockBrowser),
};

vi.mock('playwright', () => ({
  chromium: mockChromium,
}));

import { PlaywrightFetcher } from '../../fetcher/playwrightFetcher.js';

const fetcher = new PlaywrightFetcher();

beforeEach(() => {
  vi.clearAllMocks();
  mockPage.content.mockResolvedValue('<html><body>Rendered</body></html>');
  mockPage.route.mockImplementation(async (_pattern: string, handler: (route: unknown) => Promise<void>) => {
    // route handler 등록만 확인, 실제 호출은 goto 이후
    void handler;
  });
  mockPage.goto.mockResolvedValue(undefined);
  mockBrowser.close.mockResolvedValue(undefined);
  mockChromium.launch.mockResolvedValue(mockBrowser);
  mockBrowser.newContext.mockResolvedValue(mockContext);
  mockContext.newPage.mockResolvedValue(mockPage);
});

describe('PlaywrightFetcher — 기본 동작', () => {
  it('정상 URL에서 HTML 반환', async () => {
    const result = await fetcher.fetch('https://example.com');
    expect(result).toContain('Rendered');
    expect(mockChromium.launch).toHaveBeenCalledWith({ headless: true });
  });

  it('항상 브라우저 close 호출', async () => {
    await fetcher.fetch('https://example.com');
    expect(mockBrowser.close).toHaveBeenCalledOnce();
  });

  it('페이지 오류 발생 시에도 브라우저 close 호출', async () => {
    mockPage.goto.mockRejectedValue(new Error('Navigation failed'));
    await expect(fetcher.fetch('https://example.com')).rejects.toThrow(FetchFailedError);
    expect(mockBrowser.close).toHaveBeenCalledOnce();
  });
});

describe('PlaywrightFetcher — SSRF 차단', () => {
  it('사설 IP URL은 InvalidUrlError', async () => {
    await expect(fetcher.fetch('http://127.0.0.1')).rejects.toThrow(InvalidUrlError);
    // browser.launch는 호출되지 않아야 함
    expect(mockChromium.launch).not.toHaveBeenCalled();
  });

  it('2048자 초과 URL은 InvalidUrlError', async () => {
    const longUrl = 'https://example.com/?' + 'a'.repeat(2050);
    await expect(fetcher.fetch(longUrl)).rejects.toThrow(InvalidUrlError);
    expect(mockChromium.launch).not.toHaveBeenCalled();
  });
});

describe('PlaywrightFetcher — 타임아웃 설정', () => {
  it('페이지 타임아웃을 설정', async () => {
    await fetcher.fetch('https://example.com');
    expect(mockPage.setDefaultNavigationTimeout).toHaveBeenCalled();
    expect(mockPage.setDefaultTimeout).toHaveBeenCalled();
  });
});
