import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';


export const CloudinaryProvider: Provider = {
  provide: 'CLOUDINARY',
  useFactory: (configService: ConfigService) => {
    cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
    
    const storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file: Express.Multer.File) => ({
        folder: 'attachments',
        format: file.mimetype.split('/')[1],
        public_id: `${Date.now()}-${file.originalname}`,
      }),
    });

    return { cloudinary, storage };
  },
  inject: [ConfigService],
};
