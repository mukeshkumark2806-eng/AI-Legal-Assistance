import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeRouter } from './routes/analyze';
import { questionRouter } from './routes/question';
import { healthRouter } from './routes/health';
import { compareRouter } from './routes/compare';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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
    console.log(`🤖 Groq Model: ${process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'}`);
    console.log(`==================================================`);
  });
}

export default app;
