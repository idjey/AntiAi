import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
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

    // CORS for frontend
    // CORS for frontend and extension
    app.enableCors({
        origin: true, // Allow all origins (for extension development)
        credentials: true,
    });

    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 AntiAI.me API running on ${await app.getUrl()}`);
}

bootstrap();
