import { assertSafeAndPin, SsrfViolation } from './ssrf-guard';
import { fetchPinned } from './media-fetcher';
import { createServer, Server } from 'http';
import { AddressInfo } from 'net';

describe('SSRF Guard', () => {
  it('blocks private IP', async () => {
    await expect(assertSafeAndPin('https://10.0.0.5')).rejects.toThrow(SsrfViolation);
  });

  it('blocks metadata IP', async () => {
    // 169.254.169.254 is link-local, but our guard intercepts it as a LITERAL_IP_HOST
    await expect(assertSafeAndPin('https://169.254.169.254')).rejects.toThrow(SsrfViolation);
  });

  it('blocks IPv4-mapped IPv6 targeting private networks', async () => {
    const mockDnsLookup = async () => [{ address: '::ffff:10.0.0.5', family: 6 }];
    await expect(assertSafeAndPin('https://youtube.com', mockDnsLookup as any))
      .rejects.toThrow(new SsrfViolation('PRIVATE_ADDRESS', { address: '::ffff:10.0.0.5' }));
  });

  it('blocks IPv4-mapped IPv6 targeting localhost', async () => {
    const mockDnsLookup = async () => [{ address: '0:0:0:0:0:ffff:127.0.0.1', family: 6 }];
    await expect(assertSafeAndPin('https://youtube.com', mockDnsLookup as any))
      .rejects.toThrow(new SsrfViolation('PRIVATE_ADDRESS', { address: '0:0:0:0:0:ffff:127.0.0.1' }));
  });

  it('allows safe IP after DNS lookup', async () => {
    const mockDnsLookup = async () => [{ address: '8.8.8.8', family: 4 }];
    const res = await assertSafeAndPin('https://youtube.com', mockDnsLookup as any);
    expect(res.pinnedIp).toBe('8.8.8.8');
    expect(res.url.hostname).toBe('youtube.com');
  });

  it('blocks DNS rebinding attempt', async () => {
    const mockDnsLookup = async () => [{ address: '10.0.0.5', family: 4 }];
    await expect(assertSafeAndPin('https://youtube.com', mockDnsLookup as any))
      .rejects.toThrow(SsrfViolation);
  });

  it('blocks non-allowlisted host', async () => {
    const mockDnsLookup = async () => [{ address: '8.8.8.8', family: 4 }];
    await expect(assertSafeAndPin('https://evil.com', mockDnsLookup as any))
      .rejects.toThrow(SsrfViolation);
  });
});

import { setGlobalDispatcher, MockAgent } from 'undici';

jest.mock('undici', () => {
  return {
    Agent: class {},
    request: jest.fn(),
  };
});
import { request } from 'undici';

describe('Media Fetcher SSRF and Redirects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks redirect to internal IP (redirect laundering)', async () => {
    (request as jest.Mock).mockResolvedValueOnce({
      statusCode: 302,
      headers: { location: 'https://10.0.0.5/admin' },
      body: { dump: jest.fn() }
    });

    const mockDnsLookup = async () => [{ address: '8.8.8.8', family: 4 }];
    
    await expect(fetchPinned('https://youtube.com/redirect-internal', mockDnsLookup as any))
      .rejects.toThrow(new SsrfViolation('HOST_NOT_ALLOWLISTED', { host: '10.0.0.5' }));
  });

  it('blocks redirect to metadata IP', async () => {
    (request as jest.Mock).mockResolvedValueOnce({
      statusCode: 301,
      headers: { location: 'http://169.254.169.254/latest/meta-data' },
      body: { dump: jest.fn() }
    });

    const mockDnsLookup = async () => [{ address: '8.8.8.8', family: 4 }];
    
    await expect(fetchPinned('https://youtube.com/redirect-metadata', mockDnsLookup as any))
      .rejects.toThrow(new SsrfViolation('PROTOCOL', { protocol: 'http:' }));
  });

  it('blocks redirect laundering through DNS rebinding (localhost)', async () => {
    (request as jest.Mock).mockResolvedValueOnce({
      statusCode: 307,
      headers: { location: 'https://evil-redirect.com' },
      body: { dump: jest.fn() }
    });

    const mockDnsLookup = async (host: string) => {
      if (host === 'youtube.com') return [{ address: '8.8.8.8', family: 4 }];
      return [{ address: '127.0.0.1', family: 4 }];
    };
    
    await expect(fetchPinned('https://youtube.com/redirect-evil', mockDnsLookup as any))
      .rejects.toThrow(new SsrfViolation('HOST_NOT_ALLOWLISTED', { host: 'evil-redirect.com' }));
  });
});
