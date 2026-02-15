import { Router } from 'express';
import {
  checkShare,
  deleteShare,
  downloadShareFile,
  getShare,
  uploadFile,
  uploadText
} from '../controllers/share.controller.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { upload } from '../services/upload.service.js';

const router = Router();

router.post('/upload/text', optionalAuth, uploadText);
router.post('/upload/file', optionalAuth, upload.single('file'), uploadFile);
router.get('/share/:shareId/check', optionalAuth, checkShare);
router.post('/share/:shareId', optionalAuth, getShare);
router.get('/share/:shareId/download', downloadShareFile);
router.delete('/share/:shareId', optionalAuth, deleteShare);

export default router;
