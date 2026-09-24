import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import dotenv from 'dotenv';
import { detectSections } from '../src/services/document/sectionDetector.ts';
import { analyzeDocumentWithGroq } from '../server/services/legalAnalyzer.ts';
import { answerDocumentQuestion } from '../server/services/qaService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('E2E Real Document Ingestion & Live Groq Analysis', () => {
  test('E2E Real DOCX: extract binary file -> structure sections -> Groq analysis -> Grounded Q&A', async () => {
    const docxPath = path.join(projectRoot, 'sample-contract.docx');
    assert(fs.existsSync(docxPath), `Expected sample-contract.docx to exist at ${docxPath}`);

    const buffer = fs.readFileSync(docxPath);
    console.log(`   -> Reading real DOCX binary: ${buffer.length} bytes`);

    // 1. Extract raw text with Mammoth
    const extractResult = await mammoth.extractRawText({ buffer });
    const rawText = extractResult.value.trim();
    assert(rawText.length > 50, 'DOCX raw text must be extracted');
    console.log(`   ✓ Extracted ${rawText.length} characters from sample-contract.docx`);

    // 2. Section detection
    const { sections } = detectSections(rawText);
    assert(sections.length >= 3, `Expected at least 3 sections, found ${sections.length}`);
    console.log(`   ✓ Detected ${sections.length} legal sections`);

    // 3. Live Groq Analysis
    console.log('   -> Sending real extracted DOCX document to live Groq API...');
    const t0 = Date.now();
    const analysis = await analyzeDocumentWithGroq({
      documentName: 'sample-contract.docx',
      fileType: 'DOCX',
      totalPages: 1,
      rawText,
      sections: sections.map(s => ({
        id: s.id,
        sectionNumber: s.sectionNumber || '',
        title: s.title,
        paragraphs: s.paragraphs,
        pageNumber: s.pageNumber
      }))
    });
    console.log(`   ✓ Groq analyzed real DOCX in ${Date.now() - t0}ms`);

    // 4. Verify Analysis Content
    assert(analysis.documentOverview.summary.length > 10);
    assert(analysis.clauses.length >= 3, 'Must extract at least 3 clauses from contract');
    
    // Check compensation & termination detected
    const hasPayment = analysis.financialCommitments.some(f => f.amount.includes('15,000') || f.schedule.toLowerCase().includes('monthly'));
    assert(hasPayment, 'Must capture $15,000 monthly fee in financial commitments');

    // 5. Grounded Q&A on Real DOCX
    console.log('   -> Testing grounded Q&A on extracted DOCX...');
    const qaRes = await answerDocumentQuestion({
      question: 'How much is the monthly fee for the consultant in this agreement?',
      documentName: 'sample-contract.docx',
      sections: sections.map(s => ({
        id: s.id,
        sectionNumber: s.sectionNumber || '',
        title: s.title,
        paragraphs: s.paragraphs,
        pageNumber: s.pageNumber
      }))
    });

    console.log(`   ✓ Q&A Answer: "${qaRes.answer}"`);
    assert.equal(qaRes.isFoundInDocument, true);
    assert(qaRes.answer.includes('15,000'), 'Q&A answer must state $15,000');
    assert(qaRes.citations.length > 0, 'Must include section citation');
  });
});
