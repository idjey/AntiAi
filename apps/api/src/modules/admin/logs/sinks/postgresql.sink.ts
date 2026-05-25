import { HttpLog } from '@prisma/client';
import { LogSinkProvider } from './log-sink.interface';
import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'pg';

@Injectable()
export class PostgresqlSink implements LogSinkProvider {
    type = 'postgresql';
    private readonly logger = new Logger(PostgresqlSink.name);

    async validate(config: Record<string, any>): Promise<{ valid: boolean; error?: string }> {
        if (!config.connectionString || typeof config.connectionString !== 'string' || !config.connectionString.startsWith('postgres')) {
            return { valid: false, error: 'Invalid or missing connectionString' };
        }
        if (!config.tableName || typeof config.tableName !== 'string') {
            return { valid: false, error: 'Invalid or missing tableName' };
        }
        return { valid: true };
    }

    async testConnection(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
        const client = new Client({
            connectionString: config.connectionString,
            connectionTimeoutMillis: 5000,
        });

        try {
            await client.connect();
            
            // Ensure table exists or can be created
            const tableName = config.tableName;
            const schema = config.schema || 'public';
            const fullTableName = `"${schema}"."${tableName}"`;
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS ${fullTableName} (
                    id UUID PRIMARY KEY,
                    timestamp TIMESTAMP NOT NULL,
                    method VARCHAR(10) NOT NULL,
                    path TEXT NOT NULL,
                    status_code INTEGER NOT NULL,
                    duration_ms INTEGER NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    user_id UUID,
                    correlation_id UUID
                )
            `);
            
            return { success: true, message: 'Successfully connected and verified table schema' };
        } catch (error: any) {
            return { success: false, message: `Connection failed: ${error.message}` };
        } finally {
            await client.end().catch(() => {});
        }
    }

    async forward(logs: HttpLog[], config: Record<string, any>): Promise<{ sent: number; failed: number; error?: string }> {
        if (logs.length === 0) return { sent: 0, failed: 0 };
        
        const client = new Client({
            connectionString: config.connectionString,
            connectionTimeoutMillis: 10000,
        });

        try {
            await client.connect();
            
            const tableName = config.tableName;
            const schema = config.schema || 'public';
            const fullTableName = `"${schema}"."${tableName}"`;

            // Prepare bulk insert
            const values: any[] = [];
            const placeholders: string[] = [];
            
            logs.forEach((log, index) => {
                const offset = index * 10;
                placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10})`);
                values.push(
                    log.id,
                    log.timestamp,
                    log.method,
                    log.path,
                    log.statusCode,
                    log.durationMs,
                    log.ipAddress,
                    log.userAgent,
                    log.userId,
                    log.correlationId
                );
            });

            const query = `
                INSERT INTO ${fullTableName} (
                    id, timestamp, method, path, status_code, duration_ms, ip_address, user_agent, user_id, correlation_id
                ) VALUES ${placeholders.join(', ')}
                ON CONFLICT (id) DO NOTHING
            `;

            await client.query(query, values);
            
            return { sent: logs.length, failed: 0 };
        } catch (error: any) {
            this.logger.error(`PostgreSQL forward failed: ${error.message}`);
            return { sent: 0, failed: logs.length, error: error.message };
        } finally {
            await client.end().catch(() => {});
        }
    }
}
