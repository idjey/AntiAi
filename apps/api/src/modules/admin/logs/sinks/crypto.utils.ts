import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
    const keyString = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default_insecure_key_do_not_use!';
    return crypto.scryptSync(keyString, 'salt', 32);
}

export function encryptConfig(plaintext: string): string {
    if (!plaintext) return '';
    
    const iv = crypto.randomBytes(16);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    
    return `${iv.toString('base64')}:${encrypted}:${authTag}`;
}

export function decryptConfig(encryptedData: string): string {
    if (!encryptedData) return '';
    
    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) throw new Error('Invalid encrypted config format');
        
        const [ivBase64, encrypted, authTagBase64] = parts;
        const iv = Buffer.from(ivBase64, 'base64');
        const authTag = Buffer.from(authTagBase64, 'base64');
        const key = getKey();
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Failed to decrypt config', error);
        return '{}'; // Return empty JSON on failure
    }
}
