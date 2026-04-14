describe('Health Check Endpoint', () => {
  it('GET /health - should return 200 and status', async () => {
    const express = require('express');
    const healthRouter = require('../routes/health');
    const request = require('supertest');
    
    const app = express();
    app.use('/health', healthRouter);
    
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe('ok');
  });
});

describe('Rate Limiter', () => {
  it('should have apiLimiter and authLimiter exports', () => {
    const { apiLimiter, authLimiter, userApiLimiter } = require('../middlewares/rateLimiter');
    expect(apiLimiter).toBeDefined();
    expect(authLimiter).toBeDefined();
    expect(userApiLimiter).toBeDefined();
  });
});

describe('Parser Service Exports', () => {
  it('should export all parser functions', () => {
    const parser = require('../services/parserService');
    expect(typeof parser.parseResume).toBe('function');
    expect(typeof parser.extractSkills).toBe('function');
    expect(typeof parser.extractExperience).toBe('function');
    expect(typeof parser.extractEducation).toBe('function');
  });
});