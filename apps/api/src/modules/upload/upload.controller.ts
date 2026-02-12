
import { Controller, Post, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
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
    uploadFile(@UploadedFile(
        new ParseFilePipe({
            validators: [
                new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
                new FileTypeValidator({ fileType: /.*/ }), // Temporarily allow all types to debug
            ],
        }),
    ) file: any) {
        console.log('File uploaded:', file);
        if (file) {
            console.log('MimeType:', file.mimetype);
        }
        if (!file) {
            throw new Error('File not received');
        }
        // Return the public URL
        const apiUrl = process.env.API_URL || 'http://localhost:4000';
        return {
            url: `${apiUrl}/uploads/${file.filename}`,
            mimetype: file.mimetype // Returning for debug purposes
        };
    }
}
