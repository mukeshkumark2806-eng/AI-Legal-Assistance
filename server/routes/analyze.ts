import { Router, type Request, type Response } from 'express';
import { AnalyzeDocumentRequestSchema } from '../schemas/legalAnalysisSchema';
import { analyzeDocumentWithGroq } from '../services/legalAnalyzer';
import { GroqServiceError } from '../services/groqService';

export const analyzeRouter = Router();

analyzeRouter.post('/analyze-document', async (req: Request, res: Response) => {
  try {
    const parseResult = AnalyzeDocumentRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid document payload',
        details: parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      });
    }

    const analysis = await analyzeDocumentWithGroq(parseResult.data);
    return res.status(200).json({
      success: true,
      analysis
    });
  } catch (err: any) {
    console.error('Error analyzing document:', err);
    if (err instanceof GroqServiceError) {
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code
      });
    }

    return res.status(500).json({
      error: 'An unexpected server error occurred during legal document analysis.',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
});
