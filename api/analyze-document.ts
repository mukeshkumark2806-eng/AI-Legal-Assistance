import { AnalyzeDocumentRequestSchema } from '../server/schemas/legalAnalysisSchema.ts';
import { analyzeDocumentWithGroq } from '../server/services/legalAnalyzer.ts';
import { GroqServiceError } from '../server/services/groqService.ts';

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  try {
    const parseResult = AnalyzeDocumentRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          error: 'Invalid document payload',
          details: parseResult.error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`)
        })
      );
    }

    const analysis = await analyzeDocumentWithGroq(parseResult.data);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: true,
        analysis
      })
    );
  } catch (err: any) {
    console.error('Error analyzing document:', err);
    res.statusCode = err instanceof GroqServiceError ? err.statusCode : 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: err.message || 'An unexpected server error occurred during legal document analysis.',
        code: err.code || 'INTERNAL_SERVER_ERROR'
      })
    );
  }
}
