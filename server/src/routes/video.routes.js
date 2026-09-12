import { Router } from 'express';
import { z } from 'zod';
import { Video } from '../models/Video.js';
import { Question } from '../models/Question.js';
import { Assignment } from '../models/Assignment.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const videoInput = z.object({ title: z.string().min(1).max(160), description: z.string().max(3000).optional(), thumbnailUrl: z.string().url().or(z.literal('')).optional(), videoUrl: z.string().url(), durationSeconds: z.number().positive() });
const questionInput = z.object({ timestampSeconds: z.number().min(0), type: z.enum(['single', 'multiple', 'short']), prompt: z.string().min(1).max(1000), options: z.array(z.object({ text: z.string().min(1) })).default([]), correctOptionIds: z.array(z.string()).default([]), acceptedAnswers: z.array(z.string()).default([]) });

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') return res.json({ videos: await Video.find().sort({ createdAt: -1 }) });
  const assignments = await Assignment.find({ learnerId: req.user.id }).populate({ path: 'videoId', match: { isPublished: true } });
  res.json({ videos: assignments.filter((a) => a.videoId).map((a) => ({ ...a.videoId.toObject(), assignmentId: a.id })) });
}));
router.post('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const video = await Video.create({ ...videoInput.parse(req.body), createdBy: req.user.id });
  res.status(201).json({ video });
}));
router.patch('/:videoId', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const video = await Video.findByIdAndUpdate(req.params.videoId, videoInput.partial().parse(req.body), { new: true, runValidators: true });
  if (!video) return res.status(404).json({ message: 'Video not found' });
  res.json({ video });
}));
router.delete('/:videoId', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const video = await Video.findByIdAndDelete(req.params.videoId);
  if (!video) return res.status(404).json({ message: 'Video not found' });
  await Promise.all([Question.deleteMany({ videoId: video.id }), Assignment.deleteMany({ videoId: video.id })]);
  res.status(204).end();
}));
router.patch('/:videoId/publish', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const input = z.object({ isPublished: z.boolean() }).parse(req.body);
  const video = await Video.findByIdAndUpdate(req.params.videoId, input, { new: true });
  if (!video) return res.status(404).json({ message: 'Video not found' });
  res.json({ video });
}));
router.get('/:videoId/questions', requireAuth, asyncHandler(async (req, res) => {
  const questions = await Question.find({ videoId: req.params.videoId }).sort({ timestampSeconds: 1 });
  const safeQuestions = questions.map((question) => {
    const { correctOptionIds, acceptedAnswers, ...safeQuestion } = question.toObject();
    return safeQuestion;
  });
  res.json({ questions: req.user.role === 'admin' ? questions : safeQuestions });
}));
router.post('/:videoId/questions', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.videoId);
  if (!video) return res.status(404).json({ message: 'Video not found' });
  const input = questionInput.parse(req.body);
  if (input.timestampSeconds >= video.durationSeconds) return res.status(400).json({ message: 'Question timestamp must be within the video duration' });
  if (input.type !== 'short' && input.options.length < 2) return res.status(400).json({ message: 'Choice questions need at least two options' });
  const question = await Question.create({ ...input, videoId: video.id });
  res.status(201).json({ question });
}));
router.patch('/questions/:questionId', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndUpdate(req.params.questionId, questionInput.partial().parse(req.body), { new: true, runValidators: true });
  if (!question) return res.status(404).json({ message: 'Question not found' });
  res.json({ question });
}));
router.delete('/questions/:questionId', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndDelete(req.params.questionId);
  if (!question) return res.status(404).json({ message: 'Question not found' });
  res.status(204).end();
}));
export default router;
