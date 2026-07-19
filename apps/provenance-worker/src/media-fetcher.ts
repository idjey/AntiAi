import { Agent, request } from 'undici';
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
    const { url, pinnedIp } = await assertSafeAndPin(current, lookupFn);   // EVERY hop re-validated

    // Connect to the pinned IP; present the original hostname for TLS SNI + Host header.
    const agent = new Agent({
      connect: { lookup: (_h, _o, cb) => cb(null, [{ address: pinnedIp, family: pinnedIp.includes(':') ? 6 : 4 }]) },
      bodyTimeout: TOTAL_TIMEOUT_MS,
      headersTimeout: 30_000,
    });

    const res = await request(url, {
      dispatcher: agent,
      method: 'GET',
      headers: { 'user-agent': 'AntiAI-ProvenanceBot/1.0 (+https://antiai.me/bot)' },
    });

    if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
      const loc = res.headers['location'];
      if (!loc || Array.isArray(loc)) throw new SsrfViolation('BAD_REDIRECT');
      await res.body.dump();
      current = new URL(loc, url).toString();   // resolve relative redirects against current
      continue;
    }
    if (res.statusCode !== 200) throw new FetchFailed(res.statusCode);

    const declared = Number(res.headers['content-length'] ?? 0);
    if (declared > MAX_BYTES) throw new SsrfViolation('TOO_LARGE', { declared });

    // Stream with a hard byte cap — content-length lies.
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of res.body) {
      total += chunk.length;
      if (total > MAX_BYTES) { res.body.destroy(); throw new SsrfViolation('TOO_LARGE', { total }); }
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }
  throw new SsrfViolation('TOO_MANY_REDIRECTS');
}
