import type { Request, Response } from 'express';
import { groqService } from '../server/services/groqService';

export default function handler(_req: Request, res: Response) {
  const hasApiKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);
  const configuredModel = groqService.getModel();

  return res.status(200).json({
    status: 'ok',
    service: 'LegalLens AI Backend',
    hasApiKey,
    model: configuredModel,
    version: 'Build 3 GenAI'
  });
}
