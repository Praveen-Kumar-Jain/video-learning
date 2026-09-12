import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
const app = createApp();

describe('assignment and reporting routes', () => {
  it('requires authentication to create an assignment', async () => {
    expect((await request(app).post('/api/assignments').send({})).status).toBe(401);
  });
  it.each([
    '/api/assignments',
    '/api/assignments/me',
    '/api/assignments/a/play',
    '/api/reports/videos/a/progress',
    '/api/reports/videos/a/responses',
    '/api/users/learners',
  ])('requires authentication for GET %s', async (path) => {
    expect((await request(app).get(path)).status).toBe(401);
  });
});
