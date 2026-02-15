import fs from 'fs';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { MAX_FILE_SIZE, UPLOADS_DIR } from '../config/env.js';

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${nanoid(6)}-${file.originalname}`)
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE }
});
