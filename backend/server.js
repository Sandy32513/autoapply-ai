require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const healthRouter = require('./routes/health');
const usersRouter = require('./routes/users');
const resumesRouter = require('./routes/resumes');
const applicationsRouter = require('./routes/applications');
const jobsRouter = require('./routes/jobs');

const { errorHandler } = require('./middlewares/errorHandler');
const { apiLimiter } = require('./middlewares/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS Configuration ────────────────────────────────────────────────────────
const getCorsOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  // Add common production origins if not configured
  if (process.env.NODE_ENV === 'production') {
    return [
      ...origins,
      'https://autoapply-ai.vercel.app',
      'https://autoapply-ai-*.vercel.app',
    ];
  }
  return origins;
};

app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
}));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/users', usersRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/jobs', jobsRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AutoApply AI Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;