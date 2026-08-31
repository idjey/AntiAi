import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { signProof } from '@antiai/crypto';

@Injectable()
export class PendingProofsCronService {
    private readonly logger = new Logger(PendingProofsCronService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    @Cron(CronExpression.EVERY_MINUTE)
    async handlePendingProofs() {
        this.logger.debug('Checking for stalled pending proofs...');

        // Find proofs that have been pending for > 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const stalledProofs = await this.prisma.proof.findMany({
            where: {
                status: 'pending' as any,
                createdAt: { lt: fiveMinutesAgo }
            },
            include: {
                video: { select: { platformId: true, title: true, channel: { select: { platformId: true } } } },
            }
        });

        if (stalledProofs.length === 0) return;

        this.logger.warn(`Found ${stalledProofs.length} stalled pending proofs. Rerouting to legacy signer.`);

        const kid = this.configService.get<string>('SIGNING_KEY_ID');
        const privateKeyB64 = this.configService.get<string>('SIGNING_PRIVATE_KEY_B64');

        if (!kid || !privateKeyB64) {
            this.logger.error('Signing keys not configured. Cannot process stalled proofs.');
            return;
        }

        for (const proof of stalledProofs) {
            try {
                // We need to fetch perceptual hashes if they exist
                let phashes: Record<string, string> | undefined = undefined;
                let phashVersion: number | undefined = undefined;

                const rawHashes = await this.prisma.$queryRaw<Array<{ anchor_fraction: number, phash_bin: string, version: number }>>`
                    SELECT anchor_fraction, phash_bits::varchar as phash_bin, version 
                    FROM proof_perceptual_hashes 
                    WHERE proof_id = ${proof.id}::uuid
                `;
                
                if (rawHashes.length > 0) {
                    phashes = {};
                    for (const row of rawHashes) {
                        const hex = BigInt('0b' + row.phash_bin).toString(16).padStart(16, '0');
                        phashes[row.anchor_fraction.toString()] = hex;
                        phashVersion = row.version;
                    }
                }

                const signedProof = await signProof({
                    kid,
                    youtubeVideoId: proof.video.platformId,
                    youtubeChannelId: proof.video.channel.platformId,
                    expiresAt: proof.expiresAt,
                    privateKeyB64,
                    contentHash: proof.contentHash || undefined,
                    perceptualHashes: phashes,
                    perceptualHashVersion: phashVersion
                });

                await this.prisma.proof.update({
                    where: { id: proof.id },
                    data: {
                        alg: signedProof.alg,
                        kid: signedProof.kid,
                        payloadJson: signedProof.payload_json as any,
                        payloadB64: signedProof.payload_b64,
                        signatureB64: signedProof.signature_b64,
                        status: 'active' as any,
                    },
                });

                this.logger.log(`Recovered and signed stalled proof ${proof.id} via legacy signer.`);
            } catch (error) {
                this.logger.error(`Failed to process stalled proof ${proof.id}:`, error);
            }
        }
    }
}
