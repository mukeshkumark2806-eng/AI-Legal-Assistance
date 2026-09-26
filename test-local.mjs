import http from 'http';
import app from './api/index.ts';

const server = http.createServer(app).listen(0, async () => {
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3001;

  try {
    // 1. Check health
    const healthRes = await fetch(`http://localhost:${port}/api/health`);
    const healthData = await healthRes.json();
    console.log('LOCAL_HEALTH_STATUS:', healthRes.status, healthData);

    // 2. Check analyze-document
    const payload = {
      documentName: 'Test Agreement.pdf',
      fileType: 'PDF',
      totalPages: 1,
      rawText: 'SECTION 1: TERM\nThis agreement shall remain effective for twelve (12) months from signing.',
      sections: [{
        id: 'sec-1',
        sectionNumber: '1',
        title: 'TERM',
        paragraphs: ['This agreement shall remain effective for twelve (12) months from signing.'],
        pageNumber: 1
      }]
    };

    console.log('Testing live analyze-document endpoint...');
    const analyzeRes = await fetch(`http://localhost:${port}/api/analyze-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const analyzeData = await analyzeRes.json();
    console.log('LOCAL_ANALYZE_STATUS:', analyzeRes.status, 'SUCCESS:', analyzeData.success, 'CLAUSES_EXTRACTED:', analyzeData.analysis?.clauses?.length);
  } catch (err) {
    console.error('TEST ERROR:', err);
  } finally {
    server.close();
    process.exit(0);
  }
});
