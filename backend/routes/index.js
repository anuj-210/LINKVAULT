import { Router } from 'express';
import authRoutes from './auth.routes.js';
import shareRoutes from './share.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/api/auth', authRoutes);
router.use('/api', userRoutes);
router.use('/api', shareRoutes);

export default router;
