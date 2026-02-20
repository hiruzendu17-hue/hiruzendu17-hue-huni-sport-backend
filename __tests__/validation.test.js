const request = require('supertest');
const app = require('../src/app');

describe('API basic routes & validation', () => {
  beforeAll(() => {
    process.env.METRICS_SECRET = 'test-secret';
  });

  test('status endpoint is OK', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('auth login validation rejects missing email', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'secret' });
    expect(res.status).toBe(400);
  });

  test('metrics requires secret', async () => {
    const res = await request(app).get('/api/metrics');
    expect([401, 403]).toContain(res.status);
  });
});
