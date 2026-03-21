import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

export interface FileInfo {
  name: string;
  size: number;
  mimeType: string;
  lastModified: Date;
  etag?: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, { count: number; size: number }>;
}

const MIME_TO_TYPE: Record<string, string> = {
  'video/mp4': 'VIDEO',
  'video/webm': 'VIDEO',
  'audio/mpeg': 'AUDIO',
  'audio/mp3': 'AUDIO',
  'audio/ogg': 'AUDIO',
  'application/pdf': 'DOCUMENT',
  'application/msword': 'DOCUMENT',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCUMENT',
  'application/vnd.ms-powerpoint': 'PRESENTATION',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PRESENTATION',
  'image/jpeg': 'IMAGE',
  'image/png': 'IMAGE',
  'image/gif': 'IMAGE',
  'image/webp': 'IMAGE',
};

function extToType(ext: string): string {
  const map: Record<string, string> = {
    mp4: 'VIDEO', webm: 'VIDEO',
    mp3: 'AUDIO', ogg: 'AUDIO',
    pdf: 'DOCUMENT', doc: 'DOCUMENT', docx: 'DOCUMENT',
    ppt: 'PRESENTATION', pptx: 'PRESENTATION',
    jpg: 'IMAGE', jpeg: 'IMAGE', png: 'IMAGE', gif: 'IMAGE', webp: 'IMAGE',
  };
  return map[ext.toLowerCase()] ?? 'OTHER';
}

@Injectable()
export class FileUploadService implements OnModuleInit {
  private readonly logger = new Logger(FileUploadService.name);
  private client: Minio.Client;
  private bucket: string;

  constructor(private config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    const url = new URL(endpoint);

    this.bucket = this.config.get<string>('S3_BUCKET', 'mis-uploads');

    this.client = new Minio.Client({
      endPoint: url.hostname,
      port: url.port ? parseInt(url.port, 10) : url.protocol === 'https:' ? 443 : 9000,
      useSSL: url.protocol === 'https:',
      accessKey: this.config.get<string>('S3_ACCESS_KEY', 'minioadmin'),
      secretKey: this.config.get<string>('S3_SECRET_KEY', 'minioadmin'),
    });
  }

  async onModuleInit() {
    await this.ensureBucket();
  }

  async ensureBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        this.logger.log(`Bucket "${this.bucket}" created.`);
      } else {
        this.logger.log(`Bucket "${this.bucket}" already exists.`);
      }
    } catch (err) {
      this.logger.error(`Failed to ensure bucket: ${err.message}`);
    }
  }

  /**
   * Build an organised storage path:
   *   {classGrade}/{subjectCode}/{type}/
   * e.g. class-10/math/videos/
   */
  buildOrganisedPath(
    classGrade: string,
    subjectCode: string,
    type: string,
    fileName: string,
  ): string {
    const safeClass = classGrade.toLowerCase().replace(/\s+/g, '-');
    const safeSubject = subjectCode.toLowerCase().replace(/\s+/g, '-');
    const safeType = type.toLowerCase() + 's'; // e.g. "videos", "documents"
    return `${safeClass}/${safeSubject}/${safeType}/${fileName}`;
  }

  async uploadFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    await this.client.putObject(this.bucket, fileName, file, file.length, {
      'Content-Type': mimeType,
    });

    const endpoint = this.config.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    const url = `${endpoint}/${this.bucket}/${fileName}`;
    this.logger.log(`Uploaded file: ${fileName}`);
    return url;
  }

  async getSignedUrl(fileName: string, expiry = 3600): Promise<string> {
    const url = await this.client.presignedGetObject(this.bucket, fileName, expiry);
    return url;
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.client.removeObject(this.bucket, fileName);
    this.logger.log(`Deleted file: ${fileName}`);
  }

  async listFiles(prefix?: string): Promise<Minio.BucketItem[]> {
    return new Promise((resolve, reject) => {
      const files: Minio.BucketItem[] = [];
      const stream = this.client.listObjects(this.bucket, prefix ?? '', true);
      stream.on('data', (obj: Minio.BucketItem) => {
        if (obj.name !== undefined) {
          files.push(obj as Minio.BucketItem);
        }
      });
      stream.on('end', () => resolve(files));
      stream.on('error', (err) => reject(err));
    });
  }

  /**
   * List files in a folder (non-recursive, returns both prefixes/folders and objects).
   */
  async listByFolder(prefix: string): Promise<{ folders: string[]; files: Minio.BucketItem[] }> {
    return new Promise((resolve, reject) => {
      const folders: string[] = [];
      const files: Minio.BucketItem[] = [];

      // Use non-recursive listing to get folder-level view
      const stream = this.client.listObjects(this.bucket, prefix, false);
      stream.on('data', (obj: any) => {
        if (obj.prefix) {
          folders.push(obj.prefix);
        } else if (obj.name !== undefined) {
          files.push(obj as Minio.BucketItem);
        }
      });
      stream.on('end', () => resolve({ folders, files }));
      stream.on('error', (err) => reject(err));
    });
  }

  /**
   * Get metadata for a specific file.
   */
  async getFileInfo(fileName: string): Promise<FileInfo> {
    const stat = await this.client.statObject(this.bucket, fileName);
    return {
      name: fileName,
      size: stat.size,
      mimeType: (stat.metaData?.['content-type'] as string) ?? 'application/octet-stream',
      lastModified: stat.lastModified,
      etag: stat.etag,
    };
  }

  /**
   * Aggregate storage statistics across all files in the bucket.
   */
  async getStorageStats(): Promise<StorageStats> {
    const files = await this.listFiles('');

    const stats: StorageStats = {
      totalFiles: 0,
      totalSize: 0,
      byType: {},
    };

    for (const f of files) {
      if (!f.name) continue;
      stats.totalFiles += 1;
      stats.totalSize += f.size ?? 0;

      const ext = f.name.split('.').pop() ?? '';
      const type = extToType(ext);

      if (!stats.byType[type]) {
        stats.byType[type] = { count: 0, size: 0 };
      }
      stats.byType[type].count += 1;
      stats.byType[type].size += f.size ?? 0;
    }

    return stats;
  }
}
