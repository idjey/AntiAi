import { HttpLog } from '@prisma/client';

export interface LogSinkProvider {
    type: string;
    validate(config: Record<string, any>): Promise<{ valid: boolean; error?: string }>;
    testConnection(config: Record<string, any>): Promise<{ success: boolean; message: string }>;
    forward(logs: HttpLog[], config: Record<string, any>): Promise<{ sent: number; failed: number; error?: string }>;
}
