import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

const geoip = require('geoip-lite');

const SKIP_PATHS = ['/health', '/healthz', '/favicon.ico'];

function parseDevice(ua: string): string {
    const lower = ua.toLowerCase();
    if (/bot|crawler|spider|crawling/.test(lower)) return 'bot';
    if (/tablet|ipad/.test(lower)) return 'tablet';
    if (/mobile|android|iphone/.test(lower)) return 'mobile';
    return 'desktop';
}

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(HttpLoggingInterceptor.name);

    constructor(private readonly prisma: PrismaService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();

        const path = req.originalUrl;

        if (SKIP_PATHS.some((p) => path.startsWith(p))) {
            return next.handle();
        }

        const startTime = Date.now();
        const correlationId = randomUUID();
        res.setHeader('X-Correlation-Id', correlationId);

        const method = req.method;
        const queryString = req.originalUrl.includes('?')
            ? req.originalUrl.split('?')[1]
            : null;
        const contentLength = req.headers['content-length']
            ? parseInt(req.headers['content-length'] as string, 10)
            : null;
        const ipAddress =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            req.ip ||
            null;
        const userAgent = (req.headers['user-agent'] as string) || null;
        const origin = (req.headers['origin'] as string) || null;
        const referer = (req.headers['referer'] as string) || null;
        const userId = (req as any).user?.id || null;
        const routePattern = (req as any).route?.path || null;
        const device = userAgent ? parseDevice(userAgent) : null;

        let geo: { country?: string; city?: string; region?: string } = {};
        if (ipAddress) {
            const lookup = geoip.lookup(ipAddress);
            if (lookup) {
                geo = { country: lookup.country, city: lookup.city, region: lookup.region };
            }
        }

        let errorMessage: string | null = null;

        return next.handle().pipe(
            catchError((err) => {
                errorMessage = err?.message || err?.toString() || 'Unknown error';
                throw err;
            }),
            finalize(() => {
                const durationMs = Date.now() - startTime;
                const statusCode = res.statusCode;
                const responseContentLength = res.getHeader('content-length')
                    ? parseInt(res.getHeader('content-length') as string, 10)
                    : null;

                this.prisma.httpLog
                    .create({
                        data: {
                            method,
                            path: path.split('?')[0],
                            routePattern,
                            queryString,
                            requestContentLength: contentLength,
                            statusCode,
                            responseContentLength,
                            durationMs,
                            errorMessage,
                            ipAddress,
                            userAgent,
                            origin,
                            referer,
                            userId,
                            country: geo.country || null,
                            city: geo.city ? (geo.region ? `${geo.city}, ${geo.region}` : geo.city) : null,
                            device,
                            correlationId,
                        },
                    })
                    .catch((err) => {
                        this.logger.error('Failed to write HTTP log', err?.message);
                    });
            })
        );
    }
}
