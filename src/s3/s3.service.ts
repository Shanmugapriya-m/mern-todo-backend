import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Credentials come from the default AWS chain: AWS_ACCESS_KEY_ID /
// AWS_SECRET_ACCESS_KEY env vars, ~/.aws/credentials, or the EC2 instance role.
@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket?: string;

  constructor(config: ConfigService) {
    this.client = new S3Client({
      region: config.get<string>('AWS_REGION', 'ap-south-1'),
    });
    this.bucket = config.get<string>('S3_BUCKET') || undefined;
  }

  async upload(key: string, body: Buffer, contentType: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.getBucket(),
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  getDownloadUrl(key: string, fileName: string, expiresIn = 300) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.getBucket(),
        Key: key,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      }),
      { expiresIn },
    );
  }

  async delete(key: string) {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.getBucket(), Key: key }),
    );
  }

  async deleteMany(keys: string[]) {
    if (!keys.length) return;
    await this.client.send(
      new DeleteObjectsCommand({
        Bucket: this.getBucket(),
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      }),
    );
  }

  private getBucket() {
    if (!this.bucket) {
      throw new ServiceUnavailableException(
        'File uploads are not configured (S3_BUCKET is not set)',
      );
    }
    return this.bucket;
  }
}
