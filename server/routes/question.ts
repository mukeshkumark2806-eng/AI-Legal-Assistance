import { Router, type Request, type Response } from 'express';
import { DocumentQuestionRequestSchema } from '../schemas/legalAnalysisSchema.ts';
import { answerDocumentQuestion } from '../services/qaService.ts';
import { GroqServiceError } from '../services/groqService.ts';

export const questionRouter = Router();

questionRouter.post('/document-question', async (req: Request, res: Response) => {
  try {
    const parseResult = DocumentQuestionRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid question payload',
        details: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      });
    }

    const answerResponse = await answerDocumentQuestion(parseResult.data);
    return res.status(200).json({
      success: true,
      ...answerResponse
    });
  } catch (err: any) {
    console.error('Error answering document question:', err);
    if (err instanceof GroqServiceError || err?.name === 'GroqServiceError') {
      return res.status(err.statusCode || 500).json({
        error: err.message,
        code: err.code || 'GROQ_ERROR'
      });
    }

    return res.status(500).json({
      error: err?.message || 'An unexpected server error occurred while answering document question.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});
