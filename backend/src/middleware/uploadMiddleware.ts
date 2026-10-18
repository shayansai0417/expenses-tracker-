import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Store files in memory buffer for immediate stream processing
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  const isCsvMime = [
    'text/csv',
    'application/vnd.ms-excel',
    'text/plain',
    'application/csv'
  ].includes(file.mimetype);

  const isCsvExt = file.originalname.toLowerCase().endsWith('.csv');

  if (isCsvMime || isCsvExt) {
    callback(null, true);
  } else {
    callback(new Error('Invalid file type. Only CSV statement files (.csv) are allowed.'));
  }
};

export const uploadCsvMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max statement size
  },
  fileFilter
}).single('file');

