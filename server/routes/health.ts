import { Router, type Request, type Response } from 'express';
import { groqService } from '../services/groqService';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  const hasApiKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  const configuredModel = groqService.getModel();

  return res.status(200).json({
    status: 'ok',
    service: 'LegalLens AI Backend',
    hasApiKey,
    model: configuredModel,
    version: 'Build 3 GenAI'
  });
});
