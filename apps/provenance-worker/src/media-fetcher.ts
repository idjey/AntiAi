import * as https from 'https';
import * as http from 'http';
import { assertSafeAndPin, SsrfViolation, DnsLookup } from './ssrf-guard';

const MAX_REDIRECTS = 3;
const MAX_BYTES = 200 * 1024 * 1024;   // 200 MB
const TOTAL_TIMEOUT_MS = 120_000;

export class FetchFailed extends Error {
  constructor(public readonly statusCode: number) {
    super(`Fetch failed with status: ${statusCode}`);
  }
}

export async function fetchPinned(rawUrl: string, lookupFn?: DnsLookup): Promise<Buffer> {
  let current = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const { url, pinnedIp } = await assertSafeAndPin(current, lookupFn);

    const isHttps = url.protocol === 'https:';
    
    // Connect to the pinned IP; present the original hostname for TLS SNI + Host header.
    const agentOptions = {
      lookup: (_hostname: string, options: any, cb: any) => {
        const family = pinnedIp.includes(':') ? 6 : 4;
        if (options && options.all) {
          cb(null, [{ address: pinnedIp, family }]);
        } else {
          cb(null, pinnedIp, family);
        }
      },
      ...(isHttps && process.env.NODE_ENV === 'test' && (global as any).TEST_CA_CERT ? { ca: (global as any).TEST_CA_CERT } : {})
    };
    
    const agent = isHttps ? new https.Agent(agentOptions) : new http.Agent(agentOptions);
    const requestFn = isHttps ? https.request : http.request;
    
    const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
      const req = requestFn(url, {
        agent,
        method: 'GET',
        headers: { 'user-agent': 'AntiAI-ProvenanceBot/1.0 (+https://antiai.me/bot)' },
        timeout: TOTAL_TIMEOUT_MS,
      });
      
      req.on('response', (response) => {
        resolve(response);
      });
      
      req.on('error', (err) => {
        reject(err);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });

    if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode)) {
      const loc = res.headers['location'];
      if (!loc || Array.isArray(loc)) throw new SsrfViolation('BAD_REDIRECT');
      res.resume(); // consume the body to free memory
      current = new URL(loc, url).toString();
      continue;
    }
    
    if (res.statusCode !== 200) throw new FetchFailed(res.statusCode || 500);

    const declared = Number(res.headers['content-length'] ?? 0);
    if (declared > MAX_BYTES) throw new SsrfViolation('TOO_LARGE', { declared });

    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      let total = 0;
      
      res.on('data', (chunk: Buffer) => {
        total += chunk.length;
        if (total > MAX_BYTES) {
          res.destroy();
          reject(new SsrfViolation('TOO_LARGE', { total }));
        }
        chunks.push(chunk);
      });
      
      res.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      res.on('error', (err) => {
        reject(err);
      });
    });
  }
  throw new SsrfViolation('TOO_MANY_REDIRECTS');
}
