import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
const app = createApp();

describe('auth routes', () => {
  it('rejects malformed login input before accessing data', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: 'short' });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });
  it('requires a token for the current-user endpoint', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });
});
