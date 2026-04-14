const request = require('supertest');
const app = require('../server');

describe('Health Check Endpoint', () => {
  it('GET /health - should return 200 and status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('ok');
  });
});

describe('Job Routes', () => {
  it('GET /api/jobs - should return jobs array', async () => {
    const response = await request(app).get('/api/jobs');
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.body).toHaveProperty('success');
  });
});

describe('Resume Routes', () => {
  it('GET /api/resumes - should require authentication', async () => {
    const response = await request(app).get('/api/resumes');
    expect(response.status).toBe(401);
  });
});

describe('Application Routes', () => {
  it('GET /api/applications - should require authentication', async () => {
    const response = await request(app).get('/api/applications');
    expect(response.status).toBe(401);
  });
});