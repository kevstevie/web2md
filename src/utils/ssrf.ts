import * as dns from 'node:dns/promises';
import { InvalidUrlError } from './errors.js';

// Explicitly blocked cloud metadata IPs
const BLOCKED_IPS = new Set(['168.63.129.16']);

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  const [a, b] = parts;
  return (
    a === 127 ||                            // 127.0.0.0/8 loopback
    a === 10 ||                             // 10.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) ||   // 172.16.0.0/12
    (a === 192 && b === 168) ||             // 192.168.0.0/16
    (a === 169 && b === 254) ||             // 169.254.0.0/16 link-local (AWS/GCP IMDS)
    (a >= 224 && a <= 239) ||              // 224.0.0.0/4 multicast
    a === 0                                // 0.0.0.0/8
  );
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase().replace(/^\[|\]$/g, '');

  // IPv4-mapped IPv6 (::ffff:x.x.x.x) — check the embedded IPv4 part
  if (lower.startsWith('::ffff:')) {
    const ipv4Part = lower.slice(7);
    if (ipv4Part.includes('.')) return isPrivateIpv4(ipv4Part);
  }

  return (
    lower === '::1' ||                     // loopback
    lower === '::' ||                      // unspecified
    lower.startsWith('fe80:') ||           // fe80::/10 link-local
    lower.startsWith('fe9') ||             // fe80::/10 link-local (cont.)
    lower.startsWith('fea') ||
    lower.startsWith('feb') ||
    lower.startsWith('fc') ||              // fc00::/7 unique-local
    lower.startsWith('fd') ||
    lower.startsWith('ff')                // ff00::/8 multicast
  );
}

function isPrivateIp(ip: string): boolean {
  if (BLOCKED_IPS.has(ip)) return true;
  if (ip.includes(':')) return isPrivateIpv6(ip);
  return isPrivateIpv4(ip);
}

export async function validateUrl(url: string): Promise<void> {
  if (!url || url.trim() === '') {
    throw new InvalidUrlError(url);
  }

  if (url.length > 2048) {
    throw new InvalidUrlError(url);
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new InvalidUrlError(url);
  }

  const scheme = parsed.protocol.toLowerCase();
  if (scheme !== 'http:' && scheme !== 'https:') {
    throw new InvalidUrlError(url);
  }

  const hostname = parsed.hostname;
  if (!hostname) {
    throw new InvalidUrlError(url);
  }

  // Check if hostname is already an IP literal
  if (isPrivateIp(hostname)) {
    throw new InvalidUrlError(url);
  }

  // DNS resolution: fail-closed (block if resolution fails or resolves to private IP)
  try {
    const [ipv4Result, ipv6Result] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolve6(hostname),
    ]);

    const ips: string[] = [];
    if (ipv4Result.status === 'fulfilled') ips.push(...ipv4Result.value);
    if (ipv6Result.status === 'fulfilled') ips.push(...ipv6Result.value);

    // If both DNS lookups failed (NXDOMAIN, SERVFAIL, etc.), block it
    if (ips.length === 0) {
      throw new InvalidUrlError(url);
    }

    // Block if any resolved IP is private
    if (ips.some(isPrivateIp)) {
      throw new InvalidUrlError(url);
    }
  } catch (e) {
    if (e instanceof InvalidUrlError) throw e;
    // DNS lookup failure → fail-closed
    throw new InvalidUrlError(url);
  }
}
