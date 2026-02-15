import { Router } from 'express';
import { getMyShares } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/my/shares', requireAuth, getMyShares);

export default router;
