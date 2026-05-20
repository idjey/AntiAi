import { Controller, Get } from '@nestjs/common';
import { openApiSpec } from './openapi';

@Controller()
export class HealthController {
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
}
