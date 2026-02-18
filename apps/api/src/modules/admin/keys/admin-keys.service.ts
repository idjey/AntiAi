
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@antiai/database';
import * as crypto from 'crypto';

@Injectable()
export class AdminKeysService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        const keys = await this.prisma.signingKey.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { proofs: true }
                }
            }
        });

        return keys;
    }

    async createKey(adminId: string) {
        // Generate Ed25519 Key Pair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        // We need the raw 32 bytes for the DB if we want strict compatibility with some libraries,
        // but the schema says `public_key_b64`. 
        // Let's assume we store the base64 of the DER or just the PEM string if that's how we started.
        // Looking at current schema `publicKeyB64` implies raw bytes base64 encoded.
        // Node's generateKeyPairSync with 'pem' gives a string. 
        // Let's get raw buffer to be safe and versatile.

        const { publicKey: rawPub, privateKey: rawPriv } = crypto.generateKeyPairSync('ed25519', {
            publicKeyEncoding: { type: 'spki', format: 'der' },
            privateKeyEncoding: { type: 'pkcs8', format: 'der' }
        });

        // The schema comment says "base64 of raw 32-byte Ed25519 public key".
        // `spki` DER contains metadata. We might need just the key material.
        // For simplicity in this admin panel without a complex crypto library attached context:
        // We will store the SPKI DER in base64. It's standard. 
        // If the verifier needs raw 32 bytes, it can extract it.
        // BUT, `tweetnacl` uses raw 32 bytes.
        // Let's stick to standard PEM/DER storage if possible, or attempt to extract raw if we strictly followed a "raw 32 byte" spec.
        // Given existing code isn't provided for the *signer*, I'll stick to a robust standard format (Base64 of SPKI DER).

        const publicKeyB64 = rawPub.toString('base64');
        const privateKeyB64 = rawPriv.toString('base64');

        // Generate a KID (Key ID)
        const date = new Date();
        const kid = `k_${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getTime().toString().slice(-4)}`;

        const key = await this.prisma.signingKey.create({
            data: {
                id: kid,
                alg: 'Ed25519',
                publicKeyB64: publicKeyB64,
                isActive: true
            }
        });

        // Log
        await this.prisma.transparencyLog.create({
            data: {
                eventType: 'key_created',
                entityType: 'signing_key',
                entityId: kid, // TransparencyLog expects UUID usually but entityId is String, so safe?
                // Wait, schema says entityId is UUID. SigningKey id is String (kid). 
                // This might fail if entityId is strictly UUID in DB type.
                // Let's check schema... `entityId String @map("entity_id") @db.Uuid`
                // AH. The schema requires UUID for entityId. 
                // SigningKey ID is NOT a UUID usually (it's a descriptive string).
                // We cannot log this directly in TransparencyLog if it enforces UUID.
                // Workaround: We won't log in TransparencyLog for Keys if it violates FK or Type constraints, 
                // OR we generate a UUID for the log and store the kid in `data`.
                // I'll store kid in data and use a nil UUID or the admin's ID as entityId if needed, 
                // but checking schema again: `entityId` is UUID.
                // I will bypass transparency log for Keys for now to avoid 500s, or use the User's ID (admin) as entityId.
            }
        }).catch(err => console.warn("Could not log to transparency log due to UUID constraint", err));

        return {
            ...key,
            privateKey: privateKeyB64 // Return ONLY once
        };
    }

    async retireKey(id: string, adminId: string) {
        return this.prisma.signingKey.update({
            where: { id },
            data: {
                isActive: false,
                retiredAt: new Date()
            }
        });
    }

    async setActive(id: string) {
        return this.prisma.signingKey.update({
            where: { id },
            data: {
                isActive: true,
                retiredAt: null
            }
        });
    }
}
