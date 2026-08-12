import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get<string>('UPLOAD_TEMP_DIR', './uploads/temp'),
          filename: (req, file, callback) => {
            const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
            callback(null, uniqueName);
          },
        }),
        limits: {
          fileSize: configService.get<number>('MAX_FILE_SIZE', 10) * 1024 * 1024, // 10MB default
        },
        fileFilter: (req, file, callback) => {
          // SVG deliberately excluded — XSS when served on cookie-bearing origin
          const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ];
          const ext = extname(file.originalname || '').toLowerCase();
          const blockedExt = ['.svg', '.svgz', '.html', '.htm', '.js', '.mjs', '.xml'];
          if (blockedExt.includes(ext)) {
            callback(new Error(`File extension not allowed: ${ext}`), false);
            return;
          }
          if (allowedMimeTypes.includes(file.mimetype)) {
            callback(null, true);
          } else {
            callback(new Error(`File type not allowed: ${file.mimetype}`), false);
          }
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UploadService],
  controllers: [UploadController],
  exports: [UploadService],
})
export class UploadModule {}
