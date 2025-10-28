import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const serverUrl = 'http://localhost:8085';

// You must ensure the server is running before running these tests

describe('Storyboard API Endpoints', () => {
  let storyboardId;

  it('should generate a new storyboard', async () => {
    const res = await request(serverUrl)
      .post('/api/storyboards/generate')
      .send({ intent: 'A hero saves the world', aspectRatio: '16:9', seed: 'test-seed' });
    expect(res.status).toBe(200);
    expect(res.body.storyboardId).toBeDefined();
    expect(res.body.frames).toHaveLength(7);
    storyboardId = res.body.storyboardId;
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
    expect(res.body.plan).toHaveLength(7);
  });

  it('should edit a storyboard frame', async () => {
    const res = await request(serverUrl)
      .post('/api/storyboards/edit')
      .send({ storyboardId, frameIndex: 0, description: 'Edited frame description' });
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