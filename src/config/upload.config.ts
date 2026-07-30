import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import multer, { diskStorage } from 'multer';
import { extname, join } from 'path';

export const UPLOAD_ROOT = join(process.cwd(), 'uploads');
export const PRODUCT_IMAGES_DIR = join(UPLOAD_ROOT, 'products');
export const PRODUCT_IMAGES_URL_PREFIX = '/uploads/products';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });

export const productImageMulterOptions: multer.Options = {
  storage: diskStorage({
    destination: PRODUCT_IMAGES_DIR,
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      callback(new BadRequestException('Unsupported image file type'));
      return;
    }

    callback(null, true);
  },
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
};
