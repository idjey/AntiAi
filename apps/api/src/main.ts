import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

let cachedServer: any;

async function bootstrap() {
    // Run database migrations on startup in production (bypassing Railway/Nixpacks script limitations)
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
        try {
            console.log('🔄 Running runtime database schema push...');
            const isRoot = fs.existsSync(path.join(process.cwd(), 'packages', 'database', 'prisma', 'schema.prisma'));
            const schemaPath = isRoot
                ? 'packages/database/prisma/schema.prisma'
                : '../../packages/database/prisma/schema.prisma';
            execSync(`npx prisma@5.22.0 db push --schema=${schemaPath} --accept-data-loss`, { stdio: 'inherit' });
            console.log('✅ Database schema updated successfully');
        } catch (error) {
            console.error('❌ Failed to push database schema. The API might crash if columns are missing:', error);
        }
    }

    if (!cachedServer) {
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

        // CORS
        app.enableCors({
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);
                if (process.env.NODE_ENV === 'production') {
                    if (['https://antiai.me', 'https://www.antiai.me'].includes(origin) || origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
                        return callback(null, true);
                    }
                    return callback(null, false);
                }
                if (origin.startsWith('http://localhost') || origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
                    return callback(null, true);
                }
                callback(null, false);
            },
            credentials: true,
        });

        await app.init();
        cachedServer = app.getHttpAdapter().getInstance();
    }
    return cachedServer;
}

if (process.env.NODE_ENV !== 'production') {
    bootstrap().then(server => {
        const port = process.env.PORT || 4000;
        server.listen(port, () => {
            console.log(`🚀 AntiAI.me API running on port ${port}`);
        });
    });
}

// Railway / EC2 / any persistent server — start normally
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    bootstrap().then(server => {
        const port = process.env.PORT || 4000;
        server.listen(port, () => {
            console.log(`🚀 AntiAI.me API running on port ${port}`);
        });
    });
}

// Vercel Serverless Function export
export default async (req: any, res: any) => {
    const server = await bootstrap();
    return server(req, res);
};
