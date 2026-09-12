import { Router } from 'express';
import { Assignment } from '../models/Assignment.js';
import { Progress } from '../models/Progress.js';
import { Response } from '../models/Response.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { gradeResponse } from '../utils/grading.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

function optionLabels(question, optionIds) {
  const ids = (Array.isArray(optionIds) ? optionIds : [optionIds]).map(String);
  return question.options.filter((option) => ids.includes(String(option._id))).map((option) => option.text);
}

function answerLabel(question, answer) {
  if (question.type === 'short') return answer;
  return optionLabels(question, answer).join(', ') || '(no matching option)';
}

router.get(
  '/videos/:videoId/progress',
  asyncHandler(async (req, res) => {
    const assignments = await Assignment.find({ videoId: req.params.videoId })
      .populate('learnerId', 'name email')
      .sort({ createdAt: -1 });
    const progressList = await Progress.find({ assignmentId: { $in: assignments.map((a) => a.id) } });
    const byAssignment = new Map(progressList.map((item) => [String(item.assignmentId), item]));
    res.json({
      learners: assignments.map((assignment) => ({
        assignmentId: assignment.id,
        learner: assignment.learnerId,
        progress: byAssignment.get(assignment.id) || {
          status: 'not_started',
          completionPercentage: 0,
          lastWatchedSecond: 0,
        },
      })),
    });
  }),
);

router.get(
  '/videos/:videoId/responses',
  asyncHandler(async (req, res) => {
    const assignments = await Assignment.find({ videoId: req.params.videoId }).populate('learnerId', 'name email');
    const responses = await Response.find({ assignmentId: { $in: assignments.map((a) => a.id) } })
      .populate('questionId')
      .sort({ createdAt: 1 });
    const learnerByAssignment = new Map(assignments.map((a) => [a.id, a.learnerId]));
    res.json({
      responses: responses
        .filter((response) => response.questionId)
        .map((response) => {
          const question = response.questionId;
          return {
            id: response.id,
            assignmentId: response.assignmentId,
            learner: learnerByAssignment.get(String(response.assignmentId)),
            question: {
              id: question.id,
              prompt: question.prompt,
              timestampSeconds: question.timestampSeconds,
              type: question.type,
            },
            learnerAnswerLabel: answerLabel(question, response.answer),
            correctAnswerLabel:
              question.type === 'short'
                ? question.acceptedAnswers.join(', ')
                : optionLabels(question, question.correctOptionIds).join(', '),
            isCorrect: gradeResponse(question, response.answer),
            submittedAt: response.createdAt,
          };
        }),
    });
  }),
);

export default router;
