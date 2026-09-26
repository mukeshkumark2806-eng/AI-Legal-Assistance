export default function handler(_req: any, res: any) {
  const info = {
    name: 'LegalLens AI Backend Server',
    description: 'Trusted GenAI Intelligence Layer for LegalLens AI',
    status: 'online',
    version: '1.0.1',
    groqModel: 'openai/gpt-oss-20b',
    endpoints: [
      'GET  /api/health',
      'POST /api/analyze-document',
      'POST /api/document-question',
      'POST /api/compare-documents'
    ]
  };

  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json(info);
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(info));
}
