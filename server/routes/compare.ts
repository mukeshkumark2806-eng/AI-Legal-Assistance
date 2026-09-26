import { Router, type Request, type Response } from 'express';
import { CompareDocumentsRequestSchema } from '../schemas/documentComparisonSchema.ts';
import { compareDocumentsWithGroq } from '../services/comparisonService.ts';
import { GroqServiceError } from '../services/groqService.ts';

export const compareRouter = Router();

compareRouter.post('/compare-documents', async (req: Request, res: Response) => {
  try {
    const parseResult = CompareDocumentsRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid document comparison request payload',
        details: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      });
    }

    const comparison = await compareDocumentsWithGroq(parseResult.data);
    return res.status(200).json({
      success: true,
      comparison
    });
  } catch (err: any) {
    console.error('Error comparing documents:', err);
    if (err instanceof GroqServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code
      });
    }

    return res.status(500).json({
      error: 'An unexpected server error occurred during document comparison.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});
