export default async function handler(req: any, res: any) {
  try {
    const { default: app } = await import('../server/index.ts');
    return app(req, res);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: 'CRASH_IN_HANDLER',
        message: err?.message || String(err),
        stack: err?.stack || 'No stack trace available'
      })
    );
  }
}
