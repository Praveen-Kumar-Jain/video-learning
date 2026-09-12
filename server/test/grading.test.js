import { describe, expect, it } from 'vitest';
import { Question } from '../src/models/Question.js';
import { gradeResponse } from '../src/utils/grading.js';

function buildQuestion(overrides) {
  return new Question({
    videoId: '507f1f77bcf86cd799439011',
    timestampSeconds: 1,
    prompt: 'Question prompt',
    ...overrides,
  });
}

describe('gradeResponse', () => {
  it('grades single-choice answers against the correct option id', () => {
    const question = buildQuestion({
      type: 'single',
      options: [{ text: 'Right' }, { text: 'Wrong' }],
    });
    question.correctOptionIds = [question.options[0]._id];
    expect(gradeResponse(question, String(question.options[0]._id))).toBe(true);
    expect(gradeResponse(question, String(question.options[1]._id))).toBe(false);
  });

  it('grades multiple-choice answers regardless of submitted order', () => {
    const question = buildQuestion({
      type: 'multiple',
      options: [{ text: 'A' }, { text: 'B' }, { text: 'C' }],
    });
    const [a, b, c] = question.options;
    question.correctOptionIds = [a._id, b._id];
    expect(gradeResponse(question, [String(b._id), String(a._id)])).toBe(true);
    expect(gradeResponse(question, [String(a._id)])).toBe(false);
    expect(gradeResponse(question, [String(a._id), String(b._id), String(c._id)])).toBe(false);
  });

  it('grades short answers case-insensitively and trimmed', () => {
    const question = buildQuestion({ type: 'short', acceptedAnswers: ['Paris'] });
    expect(gradeResponse(question, '  paris  ')).toBe(true);
    expect(gradeResponse(question, 'London')).toBe(false);
  });
});
