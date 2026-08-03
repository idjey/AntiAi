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

describe('Media Fetcher SSRF and Redirects', () => {
  let server: Server;
  let serverUrl: string;
  let requests: { url: string }[] = [];

  beforeAll((done) => {
    server = createServer((req, res) => {
      requests.push({ url: req.url || '' });
      if (req.url === '/redirect-internal') {
        res.writeHead(302, { location: 'https://10.0.0.5/admin' });
        res.end();
      } else if (req.url === '/redirect-metadata') {
        res.writeHead(301, { location: 'http://169.254.169.254/latest/meta-data' });
        res.end();
      } else if (req.url === '/redirect-evil') {
        res.writeHead(307, { location: 'https://evil-redirect.com' });
        res.end();
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      serverUrl = `http://127.0.0.1:${port}`;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    requests = [];
  });

  it('blocks redirect to internal IP (redirect laundering)', async () => {
    // The initial DNS lookup for the first URL resolves to the local server
    const mockDnsLookup = async () => [{ address: '127.0.0.1', family: 4 as const }];
    
    await expect(fetchPinned(`${serverUrl}/redirect-internal`, mockDnsLookup as any))
      .rejects.toThrow(new SsrfViolation('HOST_NOT_ALLOWLISTED', { host: '10.0.0.5' }));
  });

  it('blocks redirect to metadata IP', async () => {
    const mockDnsLookup = async () => [{ address: '127.0.0.1', family: 4 as const }];
    
    await expect(fetchPinned(`${serverUrl}/redirect-metadata`, mockDnsLookup as any))
      .rejects.toThrow(new SsrfViolation('PROTOCOL', { protocol: 'http:' }));
  });

  it('blocks redirect laundering through DNS rebinding (localhost)', async () => {
    // Initial request resolves to 127.0.0.1 (our test server)
    // The redirect goes to evil-redirect.com, which we simulate resolving to localhost
    const mockDnsLookup = async (host: string) => {
      if (host === 'evil-redirect.com') return [{ address: '127.0.0.1', family: 4 as const }];
      return [{ address: '127.0.0.1', family: 4 as const }];
    };
    
    await expect(fetchPinned(`${serverUrl}/redirect-evil`, mockDnsLookup as any))
      .rejects.toThrow(new SsrfViolation('HOST_NOT_ALLOWLISTED', { host: 'evil-redirect.com' }));
  });
});
