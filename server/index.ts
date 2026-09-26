import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeRouter } from './routes/analyze.ts';
import { questionRouter } from './routes/question.ts';
import { healthRouter } from './routes/health.ts';
import { compareRouter } from './routes/compare.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware
app.use(cors());

// In Vercel serverless functions, Vercel pre-parses req.body.
// Only consume the stream via express body parsers when req.body has not been pre-parsed.
app.use((req, res, next) => {
  if (req.body !== undefined) {
    return next();
  }
  express.json({ limit: '20mb' })(req, res, (err) => {
    if (err) return next(err);
    express.urlencoded({ extended: true, limit: '20mb' })(req, res, next);
  });
});

// Request logger for observability
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Mount routes at root level (Vercel rewrites strip '/api' prefix before reaching this handler)
app.use(healthRouter);
app.use(analyzeRouter);
app.use(questionRouter);
app.use(compareRouter);

// Also mount with '/api' prefix for local development (where Express serves directly)
app.use('/api', healthRouter);
app.use('/api', analyzeRouter);
app.use('/api', questionRouter);
app.use('/api', compareRouter);

// Root fallback
app.get('/', (_req, res) => {
  res.json({
    name: 'LegalLens AI Backend Server',
    description: 'Trusted GenAI Intelligence Layer for LegalLens AI',
    status: 'online',
    endpoints: [
      'GET  /api/health',
      'POST /api/analyze-document',
      'POST /api/document-question',
      'POST /api/compare-documents'
    ]
  });
});

// Global error handling middleware (sanitizes errors, handles invalid JSON and limits)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    return res.status(400).json({
      error: 'Invalid JSON payload received',
      code: 'INVALID_JSON'
    });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload exceeds maximum limit (20MB)',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }
  console.error('[Server Error]', err?.message || err);
  const isProd = process.env.NODE_ENV === 'production';
  return res.status(err?.status || 500).json({
    error: isProd ? 'Internal Server Error' : (err?.message || 'Internal Server Error'),
    code: err?.code || 'SERVER_ERROR'
  });
});

// Start server
if (
  process.env.NODE_ENV !== 'test' &&
  process.env.npm_lifecycle_event !== 'test' &&
  !process.env.NODE_TEST_CONTEXT &&
  !process.env.VERCEL
) {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 LegalLens AI Backend Server running on http://localhost:${PORT}`);
    console.log(`🔐 Groq API Key: ${process.env.GROQ_API_KEY ? 'Configured (Hidden)' : 'MISSING'}`);
    console.log(`🤖 Groq Model: ${process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'}`);
    console.log(`==================================================`);
  });
}

export default app;
