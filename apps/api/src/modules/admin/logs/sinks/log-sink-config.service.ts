import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { encryptConfig, decryptConfig } from './crypto.utils';
import { LogSinkManager } from './log-sink.manager';

@Injectable()
export class LogSinkConfigService {
    constructor(
        private prisma: PrismaService,
        private manager: LogSinkManager
    ) {}

    async findAll() {
        const sinks = await this.prisma.logSinkConfig.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Decrypt configs but mask sensitive info before returning to UI
        return sinks.map(sink => {
            const rawConfig = decryptConfig(sink.config);
            let parsed: Record<string, any> = {};
            try {
                parsed = JSON.parse(rawConfig);
                
                // Mask sensitive fields
                if (parsed['connectionString']) {
                    parsed['connectionString'] = 'postgres://***:***@***';
                }
            } catch (e) {}

            return {
                ...sink,
                config: parsed
            };
        });
    }

    async create(data: any) {
        // Validate config with the specific provider before saving
        const provider = this.manager.getProvider(data.type);
        if (!provider) throw new BadRequestException('Unsupported sink type');

        const { valid, error } = await provider.validate(data.config);
        if (!valid) throw new BadRequestException(`Config validation failed: ${error}`);

        const encrypted = encryptConfig(JSON.stringify(data.config));

        return this.prisma.logSinkConfig.create({
            data: {
                name: data.name,
                type: data.type,
                enabled: data.enabled,
                config: encrypted,
                filterMethods: data.filterMethods || [],
                filterPaths: data.filterPaths || [],
                filterMinStatus: data.filterMinStatus
            }
        });
    }

    async update(id: string, data: any) {
        const sink = await this.prisma.logSinkConfig.findUnique({ where: { id } });
        if (!sink) throw new NotFoundException('Sink not found');

        const updateData: any = {
            name: data.name,
            enabled: data.enabled,
            filterMethods: data.filterMethods,
            filterPaths: data.filterPaths,
            filterMinStatus: data.filterMinStatus
        };

        if (data.config) {
            const provider = this.manager.getProvider(sink.type);
            if (!provider) throw new BadRequestException('Unsupported sink type');

            // If we are passing partially masked data from UI, we might need special handling
            // We assume the UI sends the full real config or we merge it.
            // For now, assume data.config is the full complete config.
            const { valid, error } = await provider.validate(data.config);
            if (!valid) throw new BadRequestException(`Config validation failed: ${error}`);

            updateData.config = encryptConfig(JSON.stringify(data.config));
        }

        return this.prisma.logSinkConfig.update({
            where: { id },
            data: updateData
        });
    }

    async delete(id: string) {
        await this.prisma.logSinkConfig.delete({ where: { id } });
        return { success: true };
    }

    async testConnection(id: string, testConfig?: any) {
        const sink = await this.prisma.logSinkConfig.findUnique({ where: { id } });
        if (!sink && !testConfig) throw new NotFoundException('Sink not found');

        const type = testConfig?.type || sink?.type;
        const configStr = testConfig?.config ? JSON.stringify(testConfig.config) : (sink ? decryptConfig(sink.config) : '{}');
        
        let config = {};
        try {
            config = JSON.parse(configStr);
        } catch (e) {}

        const provider = this.manager.getProvider(type);
        if (!provider) throw new BadRequestException('Unsupported sink type');

        return provider.testConnection(config);
    }
    
    async resetErrors(id: string) {
        return this.prisma.logSinkConfig.update({
            where: { id },
            data: {
                errorCount: 0,
                lastError: null,
                enabled: true
            }
        });
    }
}
