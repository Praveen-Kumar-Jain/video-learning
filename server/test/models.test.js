import { describe, expect, it } from 'vitest';
import { User } from '../src/models/User.js';
import { Video } from '../src/models/Video.js';
import { Question } from '../src/models/Question.js';
import { Assignment } from '../src/models/Assignment.js';
import { Progress } from '../src/models/Progress.js';
import { Response } from '../src/models/Response.js';

describe('Mongoose schemas', () => {
  it('requires the fields needed by each persisted resource', () => {
    expect(new User().validateSync().errors).toHaveProperty('email');
    expect(new Video().validateSync().errors).toHaveProperty('videoUrl');
    expect(new Question().validateSync().errors).toHaveProperty('prompt');
    expect(new Assignment().validateSync().errors).toHaveProperty('videoId');
    expect(new Progress().validateSync().errors).toHaveProperty('assignmentId');
    expect(new Response().validateSync().errors).toHaveProperty('questionId');
  });
  it('enforces valid roles, question types, and progress statuses', () => {
    expect(new User({ name: 'A', email: 'a@example.com', passwordHash: 'hash', role: 'owner' }).validateSync().errors.role).toBeDefined();
    expect(new Question({ videoId: '507f1f77bcf86cd799439011', timestampSeconds: 1, type: 'essay', prompt: 'Why?' }).validateSync().errors.type).toBeDefined();
    expect(new Progress({ assignmentId: '507f1f77bcf86cd799439011', status: 'paused' }).validateSync().errors.status).toBeDefined();
  });
});
