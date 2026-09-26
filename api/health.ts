import type { IncomingMessage, ServerResponse } from 'http';

export default function handler(req: IncomingMessage, res: any) {
  // Support both Express/Vercel (res.status.json) and native Node (res.writeHead/end)
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(200).json({
      status: 'ok',
      service: 'LegalLens AI Backend'
    });
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      status: 'ok',
      service: 'LegalLens AI Backend'
    })
  );
}
