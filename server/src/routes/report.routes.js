import { Router } from 'express';
import { Assignment } from '../models/Assignment.js';
import { Progress } from '../models/Progress.js';
import { Response } from '../models/Response.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/videos/:videoId/progress', asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ videoId: req.params.videoId }).populate('learnerId', 'name email').sort({ createdAt: -1 });
  const progress = await Progress.find({ assignmentId: { $in: assignments.map((a) => a.id) } });
  const byAssignment = new Map(progress.map((item) => [String(item.assignmentId), item]));
  res.json({ learners: assignments.map((assignment) => ({ assignmentId: assignment.id, learner: assignment.learnerId, progress: byAssignment.get(assignment.id) || { status: 'not_started', completionPercentage: 0, lastWatchedSecond: 0 } })) });
}));
router.get('/videos/:videoId/responses', asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ videoId: req.params.videoId }).populate('learnerId', 'name email');
  const responses = await Response.find({ assignmentId: { $in: assignments.map((a) => a.id) } }).populate('questionId', 'prompt timestampSeconds');
  const learnerByAssignment = new Map(assignments.map((a) => [a.id, a.learnerId]));
  res.json({ responses: responses.map((response) => ({ ...response.toObject(), learner: learnerByAssignment.get(String(response.assignmentId)) })) });
}));
export default router;
