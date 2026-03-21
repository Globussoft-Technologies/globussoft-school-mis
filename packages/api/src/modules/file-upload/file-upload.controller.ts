import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileUploadService } from './file-upload.service';
import { randomUUID } from 'crypto';
import * as path from 'path';

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'ppt', 'pptx',
  'mp4', 'mp3',
  'jpg', 'jpeg', 'png', 'gif', 'webp',
]);

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

@ApiTags('File Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file to MinIO (organised storage)' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', required: false, description: 'Optional subfolder prefix, e.g. class-10/math/videos' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds the 2 GB limit');
    }

    // Validate extension
    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException(
        `File type ".${ext}" is not allowed. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`,
      );
    }

    const uniqueName = `${folder ? folder.replace(/\/$/, '') + '/' : ''}${randomUUID()}.${ext}`;

    const url = await this.fileUploadService.uploadFile(file.buffer, uniqueName, file.mimetype);

    return {
      success: true,
      fileName: uniqueName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
    };
  }

  @Get('browse')
  @ApiOperation({ summary: 'Browse files by folder prefix (non-recursive)' })
  @ApiQuery({ name: 'prefix', required: false, description: 'Folder prefix, e.g. class-10/math/videos/' })
  async browseFiles(@Query('prefix') prefix?: string) {
    const result = await this.fileUploadService.listByFolder(prefix ?? '');
    return {
      prefix: prefix ?? '',
      folders: result.folders,
      files: result.files.map((f) => ({
        name: f.name,
        size: f.size,
        lastModified: f.lastModified,
        etag: f.etag,
      })),
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Storage statistics: total files, total size, breakdown by type' })
  async getStorageStats() {
    return this.fileUploadService.getStorageStats();
  }

  @Get()
  @ApiOperation({ summary: 'List all files in bucket (recursive)' })
  async listFiles(@Query('prefix') prefix?: string) {
    const files = await this.fileUploadService.listFiles(prefix);
    return {
      files: files.map((f) => ({
        name: f.name,
        size: f.size,
        lastModified: f.lastModified,
        etag: f.etag,
      })),
      total: files.length,
    };
  }

  @Get('info/:fileName(*)')
  @ApiOperation({ summary: 'Get metadata for a specific file' })
  async getFileInfo(@Param('fileName') fileName: string) {
    if (!fileName) throw new BadRequestException('File name is required');
    try {
      return await this.fileUploadService.getFileInfo(fileName);
    } catch {
      throw new NotFoundException(`File "${fileName}" not found`);
    }
  }

  @Get(':fileName(*)')
  @ApiOperation({ summary: 'Get signed download URL for a file' })
  async getSignedUrl(@Param('fileName') fileName: string) {
    if (!fileName) {
      throw new BadRequestException('File name is required');
    }

    try {
      const url = await this.fileUploadService.getSignedUrl(fileName);
      return { fileName, signedUrl: url };
    } catch {
      throw new NotFoundException(`File "${fileName}" not found`);
    }
  }

  @Delete(':fileName(*)')
  @ApiOperation({ summary: 'Delete a file from MinIO' })
  async deleteFile(@Param('fileName') fileName: string) {
    if (!fileName) {
      throw new BadRequestException('File name is required');
    }

    await this.fileUploadService.deleteFile(fileName);
    return { success: true, message: `File "${fileName}" deleted successfully` };
  }
}
