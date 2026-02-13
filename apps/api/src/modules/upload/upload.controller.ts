
import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { Request } from 'express';

@Controller('upload')
export class UploadController {
    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => {
                const uploadPath = './uploads';
                if (!fs.existsSync(uploadPath)) {
                    fs.mkdirSync(uploadPath, { recursive: true });
                }
                cb(null, uploadPath);
            },
            filename: (req: Request, file: any, callback: (error: Error | null, filename: string) => void) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
        }),
    }))
    uploadFile(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('File not received');
        }

        console.log('File uploaded:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });

        // Manual Validation
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: jpg, png, svg, webp`);
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            throw new BadRequestException('File size exceeds 5MB limit');
        }

        // Return the public URL
        const apiUrl = process.env.API_URL || 'http://localhost:4000';
        return {
            url: `${apiUrl}/uploads/${file.filename}`,
            mimetype: file.mimetype
        };
    }
}
