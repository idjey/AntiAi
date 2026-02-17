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
    app.use(helmet());

    // CORS for frontend and extension
    app.enableCors({
        origin: process.env.NODE_ENV === 'production'
            ? ['https://antiai.me', 'https://www.antiai.me']
            : ['http://localhost:3000', 'chrome-extension://*'],
        credentials: true,
    });

    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 AntiAI.me API running on ${await app.getUrl()}`);
}

bootstrap();
