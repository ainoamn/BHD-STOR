import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync, promises as fsPromises } from 'fs';
import { join, basename } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import {
  assertSafePublicId,
  buildOwnedCloudinaryFolder,
  buildOwnedUploadBasename,
} from './utils/upload-access';

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  size: number;
  thumbnailUrl?: string;
}

export interface ThumbnailOptions {
  width: number;
  height: number;
  crop?: string;
  quality?: number;
}

@Injectable()
export class UploadService {
  private readonly uploadDir: string;
  private readonly useCloudinary: boolean;
  private readonly useS3: boolean;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.useCloudinary = this.configService.get<boolean>('USE_CLOUDINARY', false);
    this.useS3 = this.configService.get<boolean>('USE_S3', false);

    // Initialize Cloudinary if enabled
    if (this.useCloudinary) {
      cloudinary.config({
        cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      });
    }

    // Ensure upload directory exists
    this.ensureDirectoryExists(this.uploadDir);
  }

  /**
   * Upload a single image (publicId is owner-scoped for delete authorization).
   */
  async uploadImage(
    file: Express.Multer.File,
    ownerUserId: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!ownerUserId) {
      throw new BadRequestException('Uploader identity is required');
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${allowedImageTypes.join(', ')}`,
      );
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large: ${file.size} bytes. Maximum: ${maxSize} bytes`,
      );
    }

    if (this.useCloudinary) {
      return this.uploadToCloudinary(file, ownerUserId);
    }

    return this.uploadToLocal(file, false, undefined, ownerUserId);
  }

  /**
   * Upload multiple images
   */
  async uploadMultiple(
    files: Express.Multer.File[],
    ownerUserId: string,
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadImage(file, ownerUserId);
        results.push(result);
      } catch (error) {
        // Continue with other files, but log the error
        console.error(`Failed to upload file ${file.originalname}:`, error.message);
      }
    }

    if (results.length === 0) {
      throw new BadRequestException('All file uploads failed');
    }

    return results;
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(publicId: string): Promise<{ success: boolean; message: string }> {
    assertSafePublicId(publicId);

    if (this.useCloudinary) {
      try {
        await cloudinary.uploader.destroy(publicId);
        return { success: true, message: 'Image deleted from Cloudinary' };
      } catch (error) {
        throw new InternalServerErrorException(
          `Failed to delete image: ${error.message}`,
        );
      }
    }

    // Local file deletion (basename only — no path segments)
    try {
      const safeName = basename(publicId);
      assertSafePublicId(safeName);
      const filePath = join(this.uploadDir, safeName);
      if (existsSync(filePath)) {
        await fsPromises.unlink(filePath);

        // Also delete thumbnail if exists
        const thumbnailPath = join(this.uploadDir, 'thumbnails', safeName);
        if (existsSync(thumbnailPath)) {
          await fsPromises.unlink(thumbnailPath);
        }
      }
      return { success: true, message: 'Image deleted from local storage' };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete image: ${error.message}`,
      );
    }
  }

  /**
   * Generate thumbnail from image
   */
  async generateThumbnail(
    file: Express.Multer.File,
    ownerUserId: string,
    options: ThumbnailOptions = { width: 300, height: 300, crop: 'fill', quality: 80 },
  ): Promise<UploadResult> {
    if (this.useCloudinary) {
      // Cloudinary generates thumbnails on-the-fly via URL transformations
      const uploadResult = await this.uploadToCloudinary(file, ownerUserId);
      const thumbnailUrl = cloudinary.url(uploadResult.publicId, {
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
        quality: options.quality || 80,
      });

      return {
        ...uploadResult,
        thumbnailUrl,
      };
    }

    // For local storage, save the original and generate thumbnail
    return this.uploadToLocal(file, true, options, ownerUserId);
  }

  /**
   * Get file URL
   */
  getFileUrl(filename: string): string {
    const baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/${filename}`;
  }

  /**
   * Get thumbnail URL
   */
  getThumbnailUrl(filename: string): string {
    const baseUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/thumbnails/${filename}`;
  }

  // ==================== Private Methods ====================

  /**
   * Upload file to Cloudinary
   */
  private async uploadToCloudinary(
    file: Express.Multer.File,
    ownerUserId: string,
  ): Promise<UploadResult> {
    try {
      const baseFolder = this.configService.get<string>(
        'CLOUDINARY_FOLDER',
        'bhd-marketplace',
      );
      const folder = buildOwnedCloudinaryFolder(baseFolder, ownerUserId);
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );

        const readable = new Readable();
        readable.push(file.buffer);
        readable.push(null);
        readable.pipe(uploadStream);
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        thumbnailUrl: cloudinary.url(result.public_id, {
          width: 300,
          height: 300,
          crop: 'fill',
        }),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Cloudinary upload failed: ${error.message}`,
      );
    }
  }

  /**
   * Upload file to local storage
   * Generates thumbnail by copying the original file to the thumbnails directory.
   * When Sharp is available, it will resize and optimize the thumbnail.
   */
  private async uploadToLocal(
    file: Express.Multer.File,
    generateThumb: boolean = false,
    thumbOptions?: ThumbnailOptions,
    ownerUserId?: string,
  ): Promise<UploadResult> {
    try {
      if (!ownerUserId) {
        throw new BadRequestException('Uploader identity is required');
      }
      const filename = buildOwnedUploadBasename(ownerUserId, file.originalname);
      const filepath = join(this.uploadDir, filename);

      // Write file
      await fsPromises.writeFile(filepath, file.buffer);

      // Generate thumbnail if requested
      let thumbnailUrl: string | undefined;
      if (generateThumb) {
        const thumbDir = join(this.uploadDir, 'thumbnails');
        this.ensureDirectoryExists(thumbDir);
        thumbnailUrl = this.getThumbnailUrl(filename);

        // Copy original file as thumbnail placeholder
        // When Sharp is available, use sharp(file.buffer).resize(width, height).toFile(thumbPath)
        await fsPromises.copyFile(filepath, join(thumbDir, filename));
      }

      const dot = filename.lastIndexOf('.');
      const format = dot >= 0 ? filename.slice(dot + 1) : '';

      return {
        url: this.getFileUrl(filename),
        publicId: filename,
        format,
        size: file.size,
        thumbnailUrl,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        `Local upload failed: ${error.message}`,
      );
    }
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectoryExists(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}
