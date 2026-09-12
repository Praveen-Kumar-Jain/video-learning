import { Router } from 'express';
import { User } from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/learners', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const learners = await User.find({ role: 'learner' }).select('name email role').sort({ name: 1 });
  res.json({ learners });
}));

export default router;
