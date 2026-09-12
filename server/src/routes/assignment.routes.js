import { Router } from 'express';
import { z } from 'zod';
import { Assignment } from '../models/Assignment.js';
import { Video } from '../models/Video.js';
import { Question } from '../models/Question.js';
import { Progress } from '../models/Progress.js';
import { Response } from '../models/Response.js';
import { User } from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const assignmentInput = z.object({ videoId: z.string(), learnerId: z.string() });
const progressInput = z.object({ lastWatchedSecond: z.number().min(0), completionPercentage: z.number().min(0).max(100), status: z.enum(['not_started', 'in_progress', 'completed']) });
const responseInput = z.object({ questionId: z.string(), answer: z.union([z.string(), z.array(z.string())]) });

async function learnerAssignment(id, learnerId) { return Assignment.findOne({ _id: id, learnerId }); }
router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const input = assignmentInput.parse(req.body);
  const video = await Video.findById(input.videoId); if (!video) return res.status(404).json({ message: 'Video not found' });
  if (!video.isPublished) return res.status(400).json({ message: 'Publish the video before assigning it to learners' });
  const learner = await User.findOne({ _id: input.learnerId, role: 'learner' });
  if (!learner) return res.status(400).json({ message: 'Assignments can only be made to learners' });
  const assignment = await Assignment.create({ ...input, assignedBy: req.user.id });
  res.status(201).json({ assignment });
}));
router.get('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const filters = req.query.videoId ? { videoId: req.query.videoId } : {};
  const assignments = await Assignment.find(filters)
    .populate('videoId', 'title isPublished')
    .populate('learnerId', 'name email')
    .sort({ createdAt: -1 });
  res.json({ assignments });
}));
router.get('/me', requireAuth, requireRole('learner'), asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ learnerId: req.user.id })
    .populate({ path: 'videoId', match: { isPublished: true } })
    .sort({ createdAt: -1 });
  const availableAssignments = assignments.filter((assignment) => assignment.videoId);
  const progress = await Progress.find({ assignmentId: { $in: availableAssignments.map((a) => a.id) } });
  const byAssignment = new Map(progress.map((p) => [String(p.assignmentId), p]));
  res.json({ assignments: availableAssignments.map((a) => ({ assignment: a, video: a.videoId, progress: byAssignment.get(a.id) || null })) });
}));
router.get('/:assignmentId/play', requireAuth, requireRole('learner'), asyncHandler(async (req, res) => {
  const assignment = await learnerAssignment(req.params.assignmentId, req.user.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  const [video, questions, progress] = await Promise.all([Video.findById(assignment.videoId), Question.find({ videoId: assignment.videoId }).sort({ timestampSeconds: 1 }), Progress.findOne({ assignmentId: assignment.id })]);
  if (!video?.isPublished) return res.status(404).json({ message: 'Video is unavailable' });
  res.json({ assignment, video, questions: questions.map((q) => ({ id: q.id, timestampSeconds: q.timestampSeconds, type: q.type, prompt: q.prompt, options: q.options })), progress });
}));
router.patch('/:assignmentId/progress', requireAuth, requireRole('learner'), asyncHandler(async (req, res) => {
  const assignment = await learnerAssignment(req.params.assignmentId, req.user.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  const progress = await Progress.findOneAndUpdate({ assignmentId: assignment.id }, progressInput.parse(req.body), { new: true, upsert: true, runValidators: true });
  res.json({ progress });
}));
router.post('/:assignmentId/responses', requireAuth, requireRole('learner'), asyncHandler(async (req, res) => {
  const assignment = await learnerAssignment(req.params.assignmentId, req.user.id);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  const input = responseInput.parse(req.body);
  const question = await Question.findOne({ _id: input.questionId, videoId: assignment.videoId });
  if (!question) return res.status(400).json({ message: 'Question does not belong to this video' });
  const response = await Response.findOneAndUpdate({ assignmentId: assignment.id, questionId: question.id }, { answer: input.answer }, { new: true, upsert: true, runValidators: true });
  const progress = await Progress.findOneAndUpdate({ assignmentId: assignment.id }, { $addToSet: { answeredQuestionIds: question.id } }, { new: true, upsert: true });
  res.status(201).json({ response, progress });
}));
router.delete('/:assignmentId', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const assignment = await Assignment.findByIdAndDelete(req.params.assignmentId);
  if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
  await Promise.all([
    Progress.deleteOne({ assignmentId: assignment.id }),
    Response.deleteMany({ assignmentId: assignment.id }),
  ]);
  res.status(204).end();
}));
export default router;
