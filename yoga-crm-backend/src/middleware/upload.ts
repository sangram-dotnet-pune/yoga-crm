import multer from 'multer';
import { maxUploadBytes } from '../config/storage';

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadBytes, files: 1 },
}).single('image');
