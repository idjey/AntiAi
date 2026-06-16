import { Controller, Get, Header } from '@nestjs/common';
import { openApiSpec } from './openapi';

@Controller()
export class HealthController {
    @Get()
    root() {
        return {
            status: 'ok',
            message: 'Welcome to the AntiAI API',
            docs: '/openapi.json',
        };
    }

    @Get('health')
    health() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'antiai-api',
        };
    }

    @Get('openapi.json')
    getOpenApiSpec() {
        return openApiSpec;
    }

    @Get('robots.txt')
    @Header('Content-Type', 'text/plain')
    getRobotsTxt() {
        return 'User-agent: *\nDisallow: /\n';
    }
}
