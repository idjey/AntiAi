// Polyfill: Node 18 doesn't expose crypto globally (needed by @nestjs/schedule)
import { webcrypto } from 'node:crypto';
if (typeof globalThis.crypto === 'undefined') {
    (globalThis as any).crypto = webcrypto;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        rawBody: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Security Headers
    app.use(helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));

    // CORS
    app.enableCors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (process.env.NODE_ENV === 'production') {
                if (
                    ['https://antiai.me', 'https://www.antiai.me'].includes(origin) ||
                    origin.startsWith('chrome-extension://') ||
                    origin.startsWith('moz-extension://')
                ) {
                    return callback(null, true);
                }
                return callback(null, false);
            }
            if (
                origin.startsWith('http://localhost') ||
                origin.startsWith('chrome-extension://') ||
                origin.startsWith('moz-extension://')
            ) {
                return callback(null, true);
            }
            callback(null, false);
        },
        credentials: true,
    });

    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 AntiAI.me API running on port ${port}`);
}

bootstrap().catch(err => {
    console.error('Fatal error during bootstrap:', err);
    process.exit(1);
});
