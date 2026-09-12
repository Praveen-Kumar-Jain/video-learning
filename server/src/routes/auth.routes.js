import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const credentials = z.object({ email: z.string().email(), password: z.string().min(8) });
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const tokenFor = (user) => jwt.sign({ sub: user.id, role: user.role }, env().jwtSecret, { expiresIn: '8h' });

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: tokenFor(user), user: publicUser(user) });
}));
router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));
export default router;
