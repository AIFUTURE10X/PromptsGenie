import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const serverUrl = 'http://localhost:8085';

// You must ensure the server is running before running these tests

describe('Storyboard API Endpoints', () => {
  let storyboardId;
  let plan;

  beforeAll(async () => {
    // Generate storyboardId and plan first
    storyboardId = 'sb_test_' + Date.now();
    const planRes = await request(serverUrl)
      .post('/api/storyboards/plan')
      .send({ storyboardId, intent: 'A hero saves the world' });
    plan = planRes.body;
  });

  it('should generate a new storyboard', async () => {
    const res = await request(serverUrl)
      .post('/api/storyboards/generate')
      .send({ storyboardId, plan });
    expect(res.status).toBe(200);
    expect(res.body.storyboardId).toBeDefined();
    expect(res.body.frames).toHaveLength(7);
  });

  it('should extend an existing storyboard', async () => {
    const res = await request(serverUrl)
      .post('/api/storyboards/extend')
      .send({ storyboardId, numFrames: 2 });
    expect(res.status).toBe(200);
    expect(res.body.frames.length).toBeGreaterThan(7);
  });

  it('should plan a storyboard', async () => {
    const res = await request(serverUrl)
      .post('/api/storyboards/plan')
      .send({ storyboardId, intent: 'A hero saves the world' });
    expect(res.status).toBe(200);
    expect(res.body.frames).toHaveLength(7);
  });

  it('should edit a storyboard frame', async () => {
    const res = await request(serverUrl)
      .post('/api/storyboards/edit')
      .send({ storyboardId, frameIndex: 0, newDescription: 'Edited frame description' });
    expect(res.status).toBe(200);
    expect(res.body.frames[0].description).toBe('Edited frame description');
  });

  it('should return metrics', async () => {
    const res = await request(serverUrl)
      .get('/api/storyboards/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('requests');
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('errors');
  });

  it('should enforce rate limiting', async () => {
    // Simulate multiple requests to trigger rate limit
    let rateLimited = false;
    for (let i = 0; i < 15; i++) {
      const res = await request(serverUrl)
        .post('/api/storyboards/generate')
        .send({ intent: 'Test rate limit', aspectRatio: '16:9', seed: 'test-seed' });
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    expect(rateLimited).toBe(true);
  });
});