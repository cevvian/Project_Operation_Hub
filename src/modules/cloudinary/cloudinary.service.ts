import { Inject, Injectable } from '@nestjs/common';
import { v2 as CloudinaryType } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY') private readonly cloudinaryClient: { cloudinary: typeof CloudinaryType; storage: any },
  ) {}

  async uploadFile(file: Express.Multer.File) {
    const result = await this.cloudinaryClient.cloudinary.uploader.upload(file.path, {
      folder: 'attachments',
      public_id: `${Date.now()}-${file.originalname}`,
      resource_type: 'auto',
    });

    return result; // chứa url, public_id, format, size, ...
  }

  async deleteFile(publicId: string) {
    if (!publicId) return null;
    const result = await this.cloudinaryClient.cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
    return result;
  }
}
