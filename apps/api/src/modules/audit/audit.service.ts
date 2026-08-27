import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

export interface AuditLogPayload {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: any;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  /**
   * Wraps an operation (usually a transaction containing logActionInTx) with a retry mechanism
   * that catches P2002 unique constraint violations on the audit chain, enabling graceful recovery
   * if the advisory lock fails to serialize over a proxy.
   */
  async executeWithAuditRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        // If it's a Prisma unique constraint violation (P2002), we retry
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          console.warn(`[PROXY TEST] P2002 COLLISION DETECTED! Lock failed to serialize. Retrying... (Attempt ${attempts + 1})`);
          attempts++;
          if (attempts >= maxRetries) {
            throw new InternalServerErrorException('Audit chain highly congested, please try again.');
          }
          // Exponential backoff with jitter
          const backoff = Math.pow(2, attempts) * 50 + Math.random() * 50;
          await new Promise(r => setTimeout(r, backoff));
        } else {
          throw error;
        }
      }
    }
    throw new Error('unreachable');
  }

  /**
   * MUST BE CALLED INSIDE A PRISMA TRANSACTION.
   * Assumes the caller has already acquired the org-scoped advisory lock.
   */
  async logActionInTx(
    tx: any,
    organizationId: string,
    payload: AuditLogPayload
  ) {
    // 1. Fetch the latest entry for this organization to get the previous hash
    const latestLog = await tx.auditLog.findFirst({
      where: { organizationId },
      orderBy: { id: 'desc' },
    });

    const previousHash = latestLog ? latestLog.hash : 'GENESIS';

    // 2. Compute the new hash
    const timestamp = new Date();
    const dataToHash = JSON.stringify({
      previousHash,
      action: payload.action,
      entityType: payload.entityType || null,
      entityId: payload.entityId || null,
      metadata: payload.metadata || {},
      timestamp: timestamp.toISOString(),
    });

    const hash = createHash('sha256').update(dataToHash).digest('hex');

    // 3. Insert the new log
    return tx.auditLog.create({
      data: {
        organizationId,
        userId: payload.userId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: payload.metadata || {},
        createdAt: timestamp,
        previousHash,
        hash,
      },
    });
  }

  async verifyChain(organizationId: string) {
    // 1. Find the latest verified checkpoint
    const latestCheckpoint = await this.prisma.auditCheckpoint.findFirst({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });

    let startId = BigInt(0);
    let expectedPreviousHash = 'GENESIS';

    if (latestCheckpoint) {
      // Verify checkpoint signature
      const publicKeyB64 = this.config.get<string>('SIGNING_PUBLIC_KEY_B64');
      if (!publicKeyB64) {
        throw new InternalServerErrorException('Platform public key not configured');
      }

      const publicKey = Buffer.from(publicKeyB64, 'base64');
      
      const checkpointData = JSON.stringify({
        organizationId: latestCheckpoint.organizationId,
        lastEntryId: latestCheckpoint.lastEntryId.toString(),
        headHash: latestCheckpoint.headHash,
      });

      const isValid = crypto.verify(
        null,
        Buffer.from(checkpointData),
        crypto.createPublicKey({
          key: publicKey,
          format: 'der',
          type: 'spki',
        }),
        Buffer.from(latestCheckpoint.signature, 'base64')
      );

      if (!isValid) {
        return { intact: false, error: 'Checkpoint signature invalid', brokenAtEntryId: latestCheckpoint.lastEntryId.toString() };
      }

      startId = latestCheckpoint.lastEntryId;
      expectedPreviousHash = latestCheckpoint.headHash;
    }

    // 2. Fetch all logs since the checkpoint, in ascending order
    const logs = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        id: { gt: startId },
      },
      orderBy: { id: 'asc' },
    });

    // 3. Walk the chain
    let verifiedCount = 0;
    for (const log of logs) {
      if (log.previousHash !== expectedPreviousHash) {
        return { intact: false, error: 'Chain broken', brokenAtEntryId: log.id.toString() };
      }

      const dataToHash = JSON.stringify({
        previousHash: log.previousHash,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
        timestamp: log.createdAt.toISOString(),
      });

      const calculatedHash = createHash('sha256').update(dataToHash).digest('hex');

      if (calculatedHash !== log.hash) {
        return { intact: false, error: 'Hash mismatch', brokenAtEntryId: log.id.toString() };
      }

      expectedPreviousHash = log.hash;
      verifiedCount++;
    }

    return { intact: true, verifiedEntries: verifiedCount };
  }

  async getLogs(organizationId: string) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { id: 'desc' },
      take: 100, // Limit to last 100 for basic view
      include: {
        user: {
          select: {
            id: true,
            email: true,
          }
        }
      }
    });
  }
}
