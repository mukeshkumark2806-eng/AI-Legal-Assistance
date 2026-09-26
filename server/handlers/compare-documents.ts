import { CompareDocumentsRequestSchema } from '../schemas/documentComparisonSchema.ts';
import { compareDocumentsWithGroq } from '../services/comparisonService.ts';
import { GroqServiceError } from '../services/groqService.ts';

async function getRequestBody(req: any): Promise<any> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return req.body;
      }
    }
    return req.body;
  }

  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk: any) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(raw);
      }
    });
    req.on('error', () => {
      resolve(undefined);
    });
  });
}

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
    const body = await getRequestBody(req);
    const parseResult = CompareDocumentsRequestSchema.safeParse(body);
    if (!parseResult.success) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(
        JSON.stringify({
          error: 'Invalid document comparison request payload',
          details: parseResult.error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`)
        })
      );
    }

    const comparison = await compareDocumentsWithGroq(parseResult.data);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: true,
        comparison
      })
    );
  } catch (err: any) {
    console.error('Error comparing documents:', err);
    res.statusCode = err instanceof GroqServiceError ? err.statusCode : (err?.statusCode || 500);
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: err?.message || 'An unexpected server error occurred during document comparison.',
        code: err?.code || 'INTERNAL_SERVER_ERROR'
      })
    );
  }
}
