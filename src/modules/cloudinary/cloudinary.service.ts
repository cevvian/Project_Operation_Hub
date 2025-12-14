import { Inject, Injectable } from '@nestjs/common';
import { v2 as CloudinaryType } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY') private readonly cloudinaryClient: { cloudinary: typeof CloudinaryType; storage: any },
  ) {}

  async uploadFile(file: Express.Multer.File) {
    const options = {
      folder: 'attachments',
      public_id: `${Date.now()}-${file.originalname}`,
      resource_type: 'auto' as const,
    };

    // If multer stored a temp file on disk (has path)
    if ((file as any).path) {
      const result = await this.cloudinaryClient.cloudinary.uploader.upload((file as any).path, options);
      return result;
    }

    // Otherwise, upload from buffer via stream
    return await new Promise((resolve, reject) => {
      const uploadStream = this.cloudinaryClient.cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(publicId: string) {
    if (!publicId) return null;
    const result = await this.cloudinaryClient.cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    return result;
  }
}
