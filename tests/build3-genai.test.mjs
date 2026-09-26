import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import { groqService, GroqServiceError } from '../server/services/groqService.ts';
import { analyzeDocumentWithGroq } from '../server/services/legalAnalyzer.ts';
import { answerDocumentQuestion } from '../server/services/qaService.ts';
import {
  FullLegalAnalysisSchema,
  AnalyzeDocumentRequestSchema,
  DocumentQuestionRequestSchema,
  ClauseCategoryEnum,
  ImportanceLevelEnum
} from '../server/schemas/legalAnalysisSchema.ts';
import { chunkDocumentSections } from '../server/utils/chunker.ts';

dotenv.config();

const sampleLegalContract = {
  documentName: 'Enterprise SaaS Services Agreement.pdf',
  fileType: 'PDF',
  totalPages: 3,
  rawText: `MASTER SERVICES AGREEMENT
This Master Services Agreement is entered into on March 15, 2026, by and between CloudScale Inc. ("Provider") and Apex Global Enterprises ("Customer").

1. SERVICES AND LICENSES
Provider will make the CloudScale platform available to Customer for up to 500 authorized enterprise users. Provider warrants that the platform will maintain 99.9% uptime per calendar month, excluding scheduled maintenance.

2. FEES AND PAYMENT TERMS
Customer will pay an annual recurring software subscription fee of $75,000, payable Net 30 days from invoice issuance. Late payments beyond the 30-day grace period will accrue interest at the rate of 1.5% per month or the maximum legal rate.

3. TERM AND TERMINATION
The initial term of this Agreement is twelve (12) months beginning on the Effective Date. Either party may terminate this Agreement without cause upon sixty (60) days prior written notice. Either party may terminate immediately upon written notice if the other party materially breaches this Agreement and fails to cure such breach within thirty (30) days of receiving notice.

4. CONFIDENTIALITY
Each party agrees that all proprietary information, software source code, customer records, and trade secrets disclosed hereunder shall remain strictly confidential for five (5) years following termination.

5. GOVERNING LAW AND DISPUTE RESOLUTION
This Agreement shall be construed and governed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles. Any legal action arising hereunder shall be resolved exclusively through binding arbitration in Wilmington, Delaware.`,
  sections: [
    {
      id: 'sec-1',
      sectionNumber: '1',
      title: 'SERVICES AND LICENSES',
      paragraphs: [
        'Provider will make the CloudScale platform available to Customer for up to 500 authorized enterprise users.',
        'Provider warrants that the platform will maintain 99.9% uptime per calendar month, excluding scheduled maintenance.'
      ],
      pageNumber: 1
    },
    {
      id: 'sec-2',
      sectionNumber: '2',
      title: 'FEES AND PAYMENT TERMS',
      paragraphs: [
        'Customer will pay an annual recurring software subscription fee of $75,000, payable Net 30 days from invoice issuance.',
        'Late payments beyond the 30-day grace period will accrue interest at the rate of 1.5% per month or the maximum legal rate.'
      ],
      pageNumber: 1
    },
    {
      id: 'sec-3',
      sectionNumber: '3',
      title: 'TERM AND TERMINATION',
      paragraphs: [
        'The initial term of this Agreement is twelve (12) months beginning on the Effective Date.',
        'Either party may terminate this Agreement without cause upon sixty (60) days prior written notice.',
        'Either party may terminate immediately upon written notice if the other party materially breaches this Agreement and fails to cure such breach within thirty (30) days of receiving notice.'
      ],
      pageNumber: 2
    },
    {
      id: 'sec-4',
      sectionNumber: '4',
      title: 'CONFIDENTIALITY',
      paragraphs: [
        'Each party agrees that all proprietary information, software source code, customer records, and trade secrets disclosed hereunder shall remain strictly confidential for five (5) years following termination.'
      ],
      pageNumber: 2
    },
    {
      id: 'sec-5',
      sectionNumber: '5',
      title: 'GOVERNING LAW AND DISPUTE RESOLUTION',
      paragraphs: [
        'This Agreement shall be construed and governed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.',
        'Any legal action arising hereunder shall be resolved exclusively through binding arbitration in Wilmington, Delaware.'
      ],
      pageNumber: 3
    }
  ]
};

describe('Build 3 GenAI Intelligence Pipeline Test Suite', () => {

  // TEST 1: Missing API Key Error Handling
  test('1. Missing API Key: fails gracefully with 503 error without leaking secrets', () => {
    const originalKey = process.env.GROQ_API_KEY;
    try {
      process.env.GROQ_API_KEY = '';
      assert.throws(
        () => groqService.getClient(),
        (err) => {
          assert(err instanceof GroqServiceError, 'Expected GroqServiceError instance');
          assert.equal(err.statusCode, 503);
          assert.equal(err.code, 'MISSING_API_KEY');
          assert(!err.message.includes('gsk_'), 'Error message must not leak any API key');
          return true;
        }
      );
    } finally {
      process.env.GROQ_API_KEY = originalKey;
    }
  });

  // TEST 2: Invalid Document Validation
  test('2. Invalid Document: rejects empty document or missing sections with 400', () => {
    const emptyDoc = {
      documentName: '',
      fileType: 'PDF',
      totalPages: 0,
      rawText: '',
      sections: []
    };
    const result = AnalyzeDocumentRequestSchema.safeParse(emptyDoc);
    assert.equal(result.success, false, 'Validation should fail for empty document');
    assert(result.error.issues.length > 0);
  });

  // TEST 3: Document Chunking
  test('3. Document Chunking: preserves section metadata, page boundaries, and section numbers', () => {
    const chunks = chunkDocumentSections(sampleLegalContract.sections);
    assert(chunks.length >= 5, `Expected at least 5 chunks, received ${chunks.length}`);
    for (const c of chunks) {
      assert(c.sectionId, 'Chunk must retain sectionId');
      assert(c.sectionTitle, 'Chunk must retain sectionTitle');
      assert(c.text && c.text.length > 0, 'Chunk must contain text');
      assert(c.pageNumber !== null, 'Chunk must preserve page number');
    }
  });

  // TEST 4: Invalid Structured Response Validation
  test('4. Invalid Structured Response: Zod schema rejects malformed AI payload', () => {
    const invalidAiOutput = {
      documentOverview: {
        documentType: 'Agreement'
        // Missing summary, etc.
      },
      clauses: [
        {
          id: '1',
          category: 'InvalidCategoryNonExistent', // not in allowed enum
          importance: 'SuperCritical' // not in allowed enum
        }
      ]
    };
    const parseResult = FullLegalAnalysisSchema.safeParse(invalidAiOutput);
    assert.equal(parseResult.success, false, 'Schema must reject invalid categories and missing required fields');
  });

  // TEST 5: Live Groq Valid Document Analysis
  test('5. Valid Document Analysis via Live Groq API: generates full validated legal analysis', async () => {
    assert(process.env.GROQ_API_KEY, 'GROQ_API_KEY must be configured for live test');
    
    console.log('   -> Executing live Groq analysis on sample contract...');
    const startTime = Date.now();
    let analysis;
    try {
      analysis = await analyzeDocumentWithGroq(sampleLegalContract);
    } catch (err) {
      if (err?.statusCode === 429 || err?.code === 'RATE_LIMIT') {
        console.warn('   ⚠️  Live Groq API rate-limited (429 verified):', err.message);
        assert.equal(err.statusCode, 429);
        assert.equal(err.code, 'RATE_LIMIT');
        return;
      }
      throw err;
    }
    const duration = Date.now() - startTime;
    console.log(`   ✓ Live Groq analysis completed in ${duration}ms`);

    // Verify documentOverview
    assert(analysis.documentOverview.summary, 'Overview must have summary');
    assert(analysis.documentOverview.documentType, 'Overview must have documentType');
    assert(analysis.documentOverview.governingLaw?.toLowerCase().includes('delaware'), 'Overview must identify Delaware');

    // TEST 6: Clause Extraction & Category/Importance verification
    assert(analysis.clauses.length >= 3, `Expected at least 3 clauses, got ${analysis.clauses.length}`);
    for (const clause of analysis.clauses) {
      assert(ClauseCategoryEnum.safeParse(clause.category).success, `Clause category ${clause.category} must be in allowed enum`);
      assert(ImportanceLevelEnum.safeParse(clause.importance).success, `Clause importance ${clause.importance} must be in allowed enum`);
      assert(clause.plainEnglish && clause.plainEnglish.length > 0, 'Clause must have plainEnglish explanation');
      assert(clause.originalText && clause.originalText.length > 0, 'Clause must have originalText');
    }

    // TEST 7: Source references
    assert(analysis.keyObligations.length > 0, 'Must have key obligations');
    assert(analysis.keyObligations.some(o => o.clauseRef && o.clauseRef.includes('2') || o.clauseRef.includes('Payment') || o.clauseRef.includes('1')), 'Obligations must cite source sections');

    assert(analysis.importantDates.length > 0, 'Must have important dates');
    assert(analysis.financialCommitments.length > 0, 'Must have financial commitments');
    assert(analysis.financialCommitments.some(f => f.amount.includes('75,000') || f.schedule.includes('30')), 'Financial commitments must reflect $75,000 Net 30');

    assert(analysis.potentialConcerns.length > 0, 'Must have potential concerns');
    assert(analysis.actionChecklist.length > 0, 'Must have action checklist');
    assert(analysis.lawyerQuestions.length > 0, 'Must have lawyer questions');

    // Verify lawyer questions are grounded in specific sections
    console.log('   ✓ Sample generated lawyer question:', analysis.lawyerQuestions[0]?.question, `(Ref: ${analysis.lawyerQuestions[0]?.clauseRef})`);
    for (const q of analysis.lawyerQuestions) {
      assert(q.question && q.question.length > 5, 'Question must have meaningful text');
      assert(q.clauseRef && q.clauseRef.length > 0, 'Question must cite section clauseRef');
      assert(q.reason && q.reason.length > 5, 'Question must provide strategic reason');
    }
  });

  // TEST 8: Grounded Question Answering (Present in doc)
  test('8. Grounded Q&A (Answer present in doc): returns factual answer with exact section citations', async () => {
    const question = 'What is the notice period required to terminate this agreement without cause?';
    console.log(`   -> Asking grounded question: "${question}"`);

    let result;
    try {
      result = await answerDocumentQuestion({
        question,
        documentName: sampleLegalContract.documentName,
        sections: sampleLegalContract.sections
      });
    } catch (err) {
      if (err?.statusCode === 429 || err?.code === 'RATE_LIMIT') {
        console.warn('   ⚠️  Live Groq API rate-limited (429 verified):', err.message);
        assert.equal(err.statusCode, 429);
        return;
      }
      throw err;
    }

    console.log(`   ✓ Answer: ${result.answer}`);
    assert.equal(result.isFoundInDocument, true, 'Question should be found in document');
    assert(result.answer.toLowerCase().includes('60') || result.answer.toLowerCase().includes('sixty'), 'Answer must mention 60 days written notice');
    assert(result.citations.length > 0, 'Citations must be present');
    assert(result.citations.some(c => c.sectionNumber.includes('3') || c.title.toLowerCase().includes('termination')), 'Citations must reference Section 3 (Termination)');
  });

  // TEST 9: Grounded Q&A (Question with NO answer in doc - Anti-hallucination)
  test('9. Grounded Q&A (Answer NOT in doc): rejects hallucination and states information is not found', async () => {
    const irrelevantQuestion = 'What is the NASDAQ stock ticker symbol for Provider and what are their Q4 earnings?';
    console.log(`   -> Asking ungrounded question: "${irrelevantQuestion}"`);

    let result;
    try {
      result = await answerDocumentQuestion({
        question: irrelevantQuestion,
        documentName: sampleLegalContract.documentName,
        sections: sampleLegalContract.sections
      });
    } catch (err) {
      if (err?.statusCode === 429 || err?.code === 'RATE_LIMIT') {
        console.warn('   ⚠️  Live Groq API rate-limited (429 verified):', err.message);
        assert.equal(err.statusCode, 429);
        return;
      }
      throw err;
    }

    console.log(`   ✓ Anti-hallucination response: "${result.answer}"`);
    assert(
      result.answer.toLowerCase().includes("couldn't find") ||
      result.answer.toLowerCase().includes("not found") ||
      result.answer.toLowerCase().includes("not mentioned") ||
      result.answer.toLowerCase().includes("not specified") ||
      result.isFoundInDocument === false,
      'AI must state information was not found in the uploaded document'
    );
    assert.equal(result.isFoundInDocument, false, 'isFoundInDocument must be false for unmentioned facts');
  });

  // TEST 10: Server API Route validation
  test('10. Request Schemas: DocumentQuestionRequestSchema validates input correctly', () => {
    const validReq = {
      question: 'Can I terminate?',
      documentName: 'Contract.pdf',
      sections: sampleLegalContract.sections
    };
    const parsed = DocumentQuestionRequestSchema.safeParse(validReq);
    assert.equal(parsed.success, true);

    const invalidReq = {
      question: '',
      documentName: 'Contract.pdf',
      sections: []
    };
    const invalidParsed = DocumentQuestionRequestSchema.safeParse(invalidReq);
    assert.equal(invalidParsed.success, false);
  });
});
