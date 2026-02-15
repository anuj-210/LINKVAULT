import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

export const PORT = process.env.PORT || 5000;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkvault';
export const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
export const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
export const FILE_ACCESS_TOKEN_TTL_MS = 5 * 60 * 1000;

export const ALLOWED_MIME_TYPES = (process.env.ALLOWED_MIME_TYPES || '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
