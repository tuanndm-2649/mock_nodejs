import { BadRequestException } from '@nestjs/common';
import multer, { memoryStorage } from 'multer';
import { join } from 'path';

export const UPLOAD_ROOT = join(process.cwd(), 'uploads');
export const PRODUCT_IMAGES_PREFIX = 'products';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export const productImageMulterOptions: multer.Options = {
  storage: memoryStorage(),
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      callback(new BadRequestException('Unsupported image file type'));
      return;
    }

    callback(null, true);
  },
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
};
