export default function handler(_req: any, res: any) {
  // Support both Express/Vercel (res.status.json) and native Node (res.writeHead/end)
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json({
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
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      name: 'LegalLens AI Backend Server',
      description: 'Trusted GenAI Intelligence Layer for LegalLens AI',
      status: 'online',
      endpoints: [
        'GET  /api/health',
        'POST /api/analyze-document',
        'POST /api/document-question',
        'POST /api/compare-documents'
      ]
    })
  );
}
