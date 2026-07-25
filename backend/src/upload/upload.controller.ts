import {
  Controller,
  Post,
  Delete,
  Param,
  Req,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { UploadService, UploadResult } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { requireRequestUserId } from '../auth/utils/request-user';
import { assertUploadDeleteAccess } from './utils/upload-access';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload single image',
    description: 'Upload a single image file to the server',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, WebP) - Max 10MB',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or file too large' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Upload failed' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<{ success: boolean; message: string; data: UploadResult }> {
    const userId = requireRequestUserId(req.user);
    const result = await this.uploadService.uploadImage(file, userId);
    return {
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    };
  }

  @Post('images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload multiple images',
    description: 'Upload up to 10 images at once',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Array of image files (JPEG, PNG, GIF, WebP) - Max 10MB each',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid files' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Upload failed' })
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ): Promise<{ success: boolean; message: string; data: UploadResult[] }> {
    const userId = requireRequestUserId(req.user);
    const results = await this.uploadService.uploadMultiple(files, userId);
    return {
      success: true,
      message: `${results.length} images uploaded successfully`,
      data: results,
    };
  }

  @Post('thumbnail')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload and generate thumbnail',
    description: 'Upload an image and generate a thumbnail version',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded and thumbnail generated' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<{ success: boolean; message: string; data: UploadResult }> {
    const userId = requireRequestUserId(req.user);
    const result = await this.uploadService.generateThumbnail(file, userId);
    return {
      success: true,
      message: 'Image uploaded and thumbnail generated',
      data: result,
    };
  }

  @Delete('bulk/:publicIds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete multiple images (admin)',
    description: 'Delete multiple images by their public IDs (comma-separated)',
  })
  @ApiParam({
    name: 'publicIds',
    description: 'Comma-separated public IDs',
    example: 'abc123.jpg,def456.jpg',
  })
  @ApiResponse({ status: 200, description: 'Images deleted' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async deleteMultipleImages(@Param('publicIds') publicIds: string) {
    const ids = publicIds.split(',').map((id) => id.trim());
    const results = [];

    for (const id of ids) {
      try {
        const result = await this.uploadService.deleteImage(id);
        results.push({ publicId: id, ...result });
      } catch (error) {
        results.push({ publicId: id, success: false, message: error.message });
      }
    }

    return {
      success: true,
      message: `${results.filter((r) => r.success).length} of ${results.length} images deleted`,
      data: results,
    };
  }

  @Delete(':publicId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete image',
    description:
      'Delete an image by public ID. Owners may delete their scoped uploads; staff may delete any.',
  })
  @ApiParam({
    name: 'publicId',
    description: 'Public ID or filename of the image',
    example: 'u_550e8400-e29b-41d4-a716-446655440000_1710000000_abc.jpg',
  })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid public ID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not your upload' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async deleteImage(@Param('publicId') publicId: string, @Req() req: any) {
    const userId = requireRequestUserId(req.user);
    assertUploadDeleteAccess(publicId, userId, req.user?.role);
    const result = await this.uploadService.deleteImage(publicId);
    return {
      success: true,
      ...result,
    };
  }
}
