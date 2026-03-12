
import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { Request } from 'express';
import * as crypto from 'crypto';
import sharp from 'sharp';

const ALLOWED_MIME_TYPES: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

const MAGIC_NUMBERS: Record<string, string[]> = {
    'image/jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8'],
    'image/png': ['89504e47'],
    'image/webp': ['52494646'], // 'RIFF'
};

@Controller('upload')
export class UploadController {
    @Post()
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
        fileFilter: (req: Request, file, callback) => {
            if (!ALLOWED_MIME_TYPES[file.mimetype]) {
                return callback(new BadRequestException(`Invalid file type. Allowed: jpg, png, webp`), false);
            }
            callback(null, true);
        },
        storage: diskStorage({
            destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => {
                const uploadPath = join(process.cwd(), 'uploads');
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req: Request, file: any, callback: (error: Error | null, filename: string) => void) => {
                const uniqueSuffix = crypto.randomUUID();
                const safeExt = ALLOWED_MIME_TYPES[file.mimetype as keyof typeof ALLOWED_MIME_TYPES];
                callback(null, `${uniqueSuffix}${safeExt}`);
            },
        }),
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File not received');
        }

        try {
            // 1. Magic Number Validation
            const fd = fs.openSync(file.path, 'r');
            const buffer = Buffer.alloc(12);
            fs.readSync(fd, buffer, 0, 12, 0);
            fs.closeSync(fd);

            const hex = buffer.toString('hex').substring(0, 8);
            
            let isValidSigma = false;
            if (file.mimetype === 'image/webp') {
                const riffHex = buffer.toString('hex').substring(0, 8); // 4 bytes
                const webpHex = buffer.toString('hex').substring(16, 24); // next 4 bytes at offset 8
                isValidSigma = (riffHex === MAGIC_NUMBERS['image/webp'][0] && webpHex === '57454250'); // 'WEBP'
            } else {
                isValidSigma = MAGIC_NUMBERS[file.mimetype]?.some(magic => hex.startsWith(magic)) ?? false;
            }

            if (!isValidSigma) {
                fs.unlinkSync(file.path);
                throw new BadRequestException('File content does not match MIME type (Invalid Header Signature)');
            }

            // 2. Image Sanitization (Strip EXIF and ensure valid parseable image)
            const tempPath = `${file.path}_temp`;
            await sharp(file.path)
                .toFile(tempPath); // By default, sharp strips all metadata unless withMetadata() is explicitly called
                
            // Replace original upload with sanitized version
            fs.unlinkSync(file.path);
            fs.renameSync(tempPath, file.path);

        } catch (error) {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            // If sharp fails to process it, it's not a valid image
            if (error instanceof Error && error.message.toLowerCase().includes('sharp')) {
                 throw new BadRequestException('Invalid image content: Failed to process image');
            }
            throw new BadRequestException('Invalid image content: Failed to process image');
        }

        console.log('File uploaded safely:', {
            originalname: file.originalname,
            savedAs: file.filename,
            mimetype: file.mimetype,
            size: fs.statSync(file.path).size // size after sharp processing
        });

        // Return the public URL
        const apiUrl = process.env.API_URL || 'http://localhost:4000';
        return {
            url: `${apiUrl}/uploads/${file.filename}`,
            mimetype: file.mimetype
        };
    }
}
