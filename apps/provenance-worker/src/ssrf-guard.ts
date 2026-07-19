import { lookup as dnsLookup } from 'node:dns/promises';
import * as ipaddr from 'ipaddr.js';

export class SsrfViolation extends Error {
  constructor(public readonly code: string, public readonly detail?: Record<string, unknown>) {
    super(`SSRF Violation: ${code}`);
  }
}

const ALLOWED_HOSTS: RegExp[] = [
  /(^|\.)youtube\.com$/, /^youtu\.be$/,
  /(^|\.)tiktok\.com$/,
  /(^|\.)twitter\.com$/, /^x\.com$/,
  /(^|\.)instagram\.com$/,
  /(^|\.)vimeo\.com$/,
  // Expand deliberately; every addition is a security review, not a config tweak.
];

export interface PinnedTarget { url: URL; pinnedIp: string; }

// Allow injection of lookup for DNS rebinding tests
export type DnsLookup = typeof dnsLookup;

export async function assertSafeAndPin(rawUrl: string, lookupFn: DnsLookup = dnsLookup): Promise<PinnedTarget> {
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new SsrfViolation('MALFORMED_URL'); }

  if (url.protocol !== 'https:') throw new SsrfViolation('PROTOCOL', { protocol: url.protocol });
  if (url.username || url.password) throw new SsrfViolation('CREDENTIALS_IN_URL');
  if (url.port && url.port !== '443') throw new SsrfViolation('NONSTANDARD_PORT');

  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.some(rx => rx.test(host))) throw new SsrfViolation('HOST_NOT_ALLOWLISTED', { host });

  // Literal-IP hostnames are never allowed, even if they'd pass the range check.
  if (ipaddr.isValid(host)) throw new SsrfViolation('LITERAL_IP_HOST');

  // Resolve and validate EVERY address; pin the first safe one.
  const addrs = await lookupFn(host, { all: true, verbatim: true });
  if (addrs.length === 0) throw new SsrfViolation('NO_DNS_RESULT');
  
  for (const { address } of addrs) {
    if (!isPublicUnicast(address)) throw new SsrfViolation('PRIVATE_ADDRESS', { address });
  }
  return { url, pinnedIp: addrs[0].address };
}

function isPublicUnicast(address: string): boolean {
  try {
    const ip = ipaddr.parse(address);
    const range = ip.range();
    
    if (range !== 'unicast') return false;
    
    // ipv4-mapped IPv6 smuggling (::ffff:10.0.0.5) — unwrap and recheck.
    if (ip.kind() === 'ipv6' && (ip as ipaddr.IPv6).isIPv4MappedAddress()) {
      return isPublicUnicast((ip as ipaddr.IPv6).toIPv4Address().toString());
    }
    return true;
  } catch {
    return false;
  }
}
