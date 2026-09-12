import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
const app = createApp();

describe('video and question routes', () => {
  it.each([
    ['get', '/api/videos'], ['post', '/api/videos'], ['get', '/api/videos/a/questions'], ['post', '/api/videos/a/questions'],
  ])('requires authentication for %s %s', async (method, path) => {
    const response = await request(app)[method](path).send({});
    expect(response.status).toBe(401);
  });
});
