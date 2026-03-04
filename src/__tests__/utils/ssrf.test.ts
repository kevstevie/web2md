import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InvalidUrlError } from '../../utils/errors.js';

// dns mock은 모듈 최상단에서 선언해야 hoisting 적용됨
vi.mock('node:dns/promises', () => ({
  resolve4: vi.fn(),
  resolve6: vi.fn(),
}));

import * as dns from 'node:dns/promises';
import { validateUrl } from '../../utils/ssrf.js';

const mockedResolve4 = vi.mocked(dns.resolve4);
const mockedResolve6 = vi.mocked(dns.resolve6);

function mockPublicDns(ip = '93.184.216.34') {
  mockedResolve4.mockResolvedValue([ip]);
  mockedResolve6.mockRejectedValue(new Error('ENODATA'));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('validateUrl — 프로토콜 검증', () => {
  it.each(['ftp://example.com', 'file:///etc/passwd', 'javascript:alert(1)', 'data:text/html,hi'])(
    '%s 는 InvalidUrlError 반환',
    async (url) => {
      await expect(validateUrl(url)).rejects.toThrow(InvalidUrlError);
    }
  );

  it('빈 문자열은 InvalidUrlError', async () => {
    await expect(validateUrl('')).rejects.toThrow(InvalidUrlError);
  });

  it('스킴 없는 URL은 InvalidUrlError', async () => {
    await expect(validateUrl('example.com')).rejects.toThrow(InvalidUrlError);
  });

  it('형식이 잘못된 URL은 InvalidUrlError', async () => {
    await expect(validateUrl('not a url at all')).rejects.toThrow(InvalidUrlError);
  });

  it('2048자 초과 URL은 InvalidUrlError', async () => {
    const url = 'https://example.com/?' + 'a'.repeat(2050);
    await expect(validateUrl(url)).rejects.toThrow(InvalidUrlError);
  });
});

describe('validateUrl — 사설 IP 차단', () => {
  it.each([
    ['loopback IPv4', 'http://127.0.0.1'],
    ['loopback IPv4 port', 'https://127.0.0.1:8080'],
    ['class A private', 'http://10.0.0.1'],
    ['class B private', 'http://172.16.0.1'],
    ['class B private 상한', 'http://172.31.255.255'],
    ['class C private', 'http://192.168.1.1'],
    ['link-local', 'http://169.254.169.254'],
    ['multicast', 'http://224.0.0.1'],
    ['unspecified', 'http://0.0.0.0'],
    ['Azure IMDS', 'http://168.63.129.16'],
  ])('%s (%s) 차단', async (_label, url) => {
    await expect(validateUrl(url)).rejects.toThrow(InvalidUrlError);
  });

  it('IPv6 loopback (::1) 차단', async () => {
    await expect(validateUrl('http://[::1]')).rejects.toThrow(InvalidUrlError);
  });

  it('IPv6 link-local (fe80::) 차단', async () => {
    await expect(validateUrl('http://[fe80::1]')).rejects.toThrow(InvalidUrlError);
  });

  it('IPv6 unique-local (fc00::) 차단', async () => {
    await expect(validateUrl('http://[fc00::1]')).rejects.toThrow(InvalidUrlError);
  });

  it('IPv4-mapped IPv6 (::ffff:127.0.0.1) 차단', async () => {
    await expect(validateUrl('http://[::ffff:127.0.0.1]')).rejects.toThrow(InvalidUrlError);
  });

  it('IPv4-mapped IPv6 (::ffff:192.168.1.1) 차단', async () => {
    await expect(validateUrl('http://[::ffff:192.168.1.1]')).rejects.toThrow(InvalidUrlError);
  });
});

describe('validateUrl — DNS 검증', () => {
  it('공개 IP로 해석되면 통과', async () => {
    mockPublicDns('93.184.216.34');
    await expect(validateUrl('https://example.com')).resolves.toBeUndefined();
  });

  it('DNS 해석 결과가 사설 IP면 차단', async () => {
    mockedResolve4.mockResolvedValue(['10.0.0.1']);
    mockedResolve6.mockRejectedValue(new Error('ENODATA'));
    await expect(validateUrl('https://internal.example.com')).rejects.toThrow(InvalidUrlError);
  });

  it('DNS 조회 실패(NXDOMAIN)는 fail-closed 차단', async () => {
    mockedResolve4.mockRejectedValue(new Error('ENOTFOUND'));
    mockedResolve6.mockRejectedValue(new Error('ENOTFOUND'));
    await expect(validateUrl('https://this-domain-does-not-exist-xyz123abc.com')).rejects.toThrow(InvalidUrlError);
  });

  it('IPv4 결과가 없고 IPv6만 공개 IP면 통과', async () => {
    mockedResolve4.mockRejectedValue(new Error('ENODATA'));
    mockedResolve6.mockResolvedValue(['2001:db8::1']);
    await expect(validateUrl('https://ipv6only.example.com')).resolves.toBeUndefined();
  });

  it('IPv4/IPv6 중 하나라도 사설 IP면 차단', async () => {
    mockedResolve4.mockResolvedValue(['93.184.216.34', '10.0.0.1']); // mixed
    mockedResolve6.mockRejectedValue(new Error('ENODATA'));
    await expect(validateUrl('https://mixed.example.com')).rejects.toThrow(InvalidUrlError);
  });

  it('http와 https 모두 허용', async () => {
    mockPublicDns();
    await expect(validateUrl('http://example.com')).resolves.toBeUndefined();
    await expect(validateUrl('https://example.com')).resolves.toBeUndefined();
  });

  it('대문자 스킴도 허용', async () => {
    mockPublicDns();
    await expect(validateUrl('HTTPS://example.com')).resolves.toBeUndefined();
  });
});
