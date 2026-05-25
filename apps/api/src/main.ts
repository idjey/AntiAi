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
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        rawBody: true,
    });

    // Global Exception Filter
    app.useGlobalFilters(new GlobalExceptionFilter());

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
                    ['https://antiai.me', 'https://www.antiai.me', 'http://localhost:3000'].includes(origin) ||
                    origin.startsWith('chrome-extension://') ||
                    origin.startsWith('moz-extension://') ||
                    origin.startsWith('http://localhost')
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

    // Swagger Documentation
    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('AntiAI.me API')
            .setDescription('The core API for AntiAI cryptographic proofs and verification.')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api-docs', app, document);
    }

    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 AntiAI.me API running on port ${port}`);
}

bootstrap().catch(err => {
    console.error('Fatal error during bootstrap:', err);
    process.exit(1);
});
