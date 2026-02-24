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
        crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS for frontend and extension
    app.enableCors({
        origin: function (origin, callback) {
            // allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (process.env.NODE_ENV === 'production') {
                if (['https://antiai.me', 'https://www.antiai.me'].includes(origin) || origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
                    return callback(null, true);
                }
                return callback(null, false);
            }
            // in development
            if (origin.startsWith('http://localhost') || origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
                return callback(null, true);
            }
            callback(null, false);
        },
        credentials: true,
    });

    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 AntiAI.me API running on ${await app.getUrl()}`);
}

bootstrap();
