import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import http from 'node:http';
import app from '../server/index.ts';
import {
  alignDocumentSections,
  compareDocumentsWithGroq
} from '../server/services/comparisonService.ts';
import {
  FullComparisonResultSchema,
  CompareDocumentsRequestSchema,
  ComparisonChangeTypeEnum,
  ComparisonCategoryEnum,
  ComparisonSeverityEnum
} from '../server/schemas/documentComparisonSchema.ts';

dotenv.config();

// Contract Fixtures for deterministic testing
const docABaseline = {
  name: 'Master Services Agreement (v1.0 Baseline)',
  fileType: 'PDF',
  fileSize: '1.2 MB',
  totalPages: 2,
  rawText: `MASTER SERVICES AGREEMENT (v1.0 Baseline)
SECTION 1: SERVICES
Provider agrees to deliver managed cloud infrastructure and support services.

SECTION 2: PAYMENT TERMS
Customer shall remit payment for all invoices within forty-five (45) days of receipt (Net 45).

SECTION 3: TERMINATION FOR CONVENIENCE
Either party may terminate this agreement without cause upon sixty (60) days prior written notice.

SECTION 4: LIMITATION OF LIABILITY
The total aggregate liability of either party shall not exceed two times (2x) the total fees paid in the preceding 12 months.

SECTION 5: GOVERNING LAW
This agreement is governed by the laws of the State of Delaware.`,
  sections: [
    {
      id: 'sec-1',
      sectionNumber: '1',
      title: 'SERVICES',
      paragraphs: ['Provider agrees to deliver managed cloud infrastructure and support services.'],
      pageNumber: 1
    },
    {
      id: 'sec-2',
      sectionNumber: '2',
      title: 'PAYMENT TERMS',
      paragraphs: ['Customer shall remit payment for all invoices within forty-five (45) days of receipt (Net 45).'],
      pageNumber: 1
    },
    {
      id: 'sec-3',
      sectionNumber: '3',
      title: 'TERMINATION FOR CONVENIENCE',
      paragraphs: ['Either party may terminate this agreement without cause upon sixty (60) days prior written notice.'],
      pageNumber: 2
    },
    {
      id: 'sec-4',
      sectionNumber: '4',
      title: 'LIMITATION OF LIABILITY',
      paragraphs: ['The total aggregate liability of either party shall not exceed two times (2x) the total fees paid in the preceding 12 months.'],
      pageNumber: 2
    },
    {
      id: 'sec-5',
      sectionNumber: '5',
      title: 'GOVERNING LAW',
      paragraphs: ['This agreement is governed by the laws of the State of Delaware.'],
      pageNumber: 2
    }
  ]
};

const docBRevised = {
  name: 'Master Services Agreement (v2.0 Redline Revised)',
  fileType: 'DOCX',
  fileSize: '1.4 MB',
  totalPages: 2,
  rawText: `MASTER SERVICES AGREEMENT (v2.0 Redline Revised)
SECTION 1: SERVICES
Provider agrees to deliver managed cloud infrastructure and support services.

SECTION 2: PAYMENT TERMS
Customer shall remit payment for all invoices within thirty (30) days of receipt (Net 30). Late payments shall incur 1.5% interest per month.

SECTION 3: TERMINATION FOR CONVENIENCE
Either party may terminate this agreement without cause upon thirty (30) days prior written notice.

SECTION 4: LIMITATION OF LIABILITY
The total aggregate liability of either party shall not exceed one times (1x) the total fees actually paid in the preceding 12 months.

SECTION 5: DATA SECURITY & SOC 2 COMPLIANCE
Provider warrants that it shall maintain annual SOC 2 Type II certification and notify Customer within 48 hours of any confirmed breach.

SECTION 6: GOVERNING LAW
This agreement is governed by the laws of the State of Delaware.`,
  sections: [
    {
      id: 'sec-b-1',
      sectionNumber: '1',
      title: 'SERVICES',
      paragraphs: ['Provider agrees to deliver managed cloud infrastructure and support services.'],
      pageNumber: 1
    },
    {
      id: 'sec-b-2',
      sectionNumber: '2',
      title: 'PAYMENT TERMS',
      paragraphs: ['Customer shall remit payment for all invoices within thirty (30) days of receipt (Net 30). Late payments shall incur 1.5% interest per month.'],
      pageNumber: 1
    },
    {
      id: 'sec-b-3',
      sectionNumber: '3',
      title: 'TERMINATION FOR CONVENIENCE',
      paragraphs: ['Either party may terminate this agreement without cause upon thirty (30) days prior written notice.'],
      pageNumber: 2
    },
    {
      id: 'sec-b-4',
      sectionNumber: '4',
      title: 'LIMITATION OF LIABILITY',
      paragraphs: ['The total aggregate liability of either party shall not exceed one times (1x) the total fees actually paid in the preceding 12 months.'],
      pageNumber: 2
    },
    {
      id: 'sec-b-5',
      sectionNumber: '5',
      title: 'DATA SECURITY & SOC 2 COMPLIANCE',
      paragraphs: ['Provider warrants that it shall maintain annual SOC 2 Type II certification and notify Customer within 48 hours of any confirmed breach.'],
      pageNumber: 2
    },
    {
      id: 'sec-b-6',
      sectionNumber: '6',
      title: 'GOVERNING LAW',
      paragraphs: ['This agreement is governed by the laws of the State of Delaware.'],
      pageNumber: 2
    }
  ]
};

describe('Build 4 Document Comparison & Redline Intelligence Test Suite', () => {

  // TEST 1: Schema Rejection of Missing/Empty Documents
  test('1. Schema Validation: rejects empty requests or missing documents with 400 schema error', () => {
    // Missing documentB
    const invalidPayload1 = {
      documentA: docABaseline
    };
    const res1 = CompareDocumentsRequestSchema.safeParse(invalidPayload1);
    assert.equal(res1.success, false, 'Should fail when documentB is missing');

    // Empty sections in documentA
    const invalidPayload2 = {
      documentA: { ...docABaseline, sections: [] },
      documentB: docBRevised
    };
    const res2 = CompareDocumentsRequestSchema.safeParse(invalidPayload2);
    assert.equal(res2.success, false, 'Should fail when sections are empty');

    // Valid payload passes
    const validPayload = {
      documentA: docABaseline,
      documentB: docBRevised
    };
    const res3 = CompareDocumentsRequestSchema.safeParse(validPayload);
    assert.equal(res3.success, true, 'Valid payload should parse successfully');
  });

  // TEST 2: Section Alignment Logic
  test('2. Section Alignment: accurately matches aligned sections, detects additions, and preserves metadata', () => {
    const aligned = alignDocumentSections(docABaseline.sections, docBRevised.sections);

    assert(aligned.length >= 5, `Expected at least 5 aligned section pairs, got ${aligned.length}`);

    // Section 1 (Services) should be MATCHED
    const pair1 = aligned.find(p => p.title.includes('SERVICES'));
    assert(pair1, 'Services section should be aligned');
    assert.equal(pair1.status, 'MATCHED');
    assert.equal(pair1.sectionA?.title, 'SERVICES');
    assert.equal(pair1.sectionB?.title, 'SERVICES');

    // Section 2 (Payment Terms) should be MATCHED
    const pair2 = aligned.find(p => p.title.includes('PAYMENT'));
    assert(pair2, 'Payment section should be aligned');
    assert.equal(pair2.status, 'MATCHED');

    // Section 5 in B (DATA SECURITY & SOC 2) is brand new -> ADDED_IN_B
    const pairAdded = aligned.find(p => p.title.includes('SOC 2') || p.title.includes('DATA SECURITY'));
    assert(pairAdded, 'SOC 2 section should be found in aligned pairs');
    assert.equal(pairAdded.status, 'ADDED_IN_B');
    assert(pairAdded.sectionB, 'Should contain sectionB content');
    assert(!pairAdded.sectionA, 'Should not contain sectionA content');
  });

  // TEST 3: Case-Tolerant Enum Preprocessing
  test('3. Enums: preprocesses and normalizes case and aliases correctly', () => {
    assert.equal(ComparisonChangeTypeEnum.parse('added'), 'ADDED');
    assert.equal(ComparisonChangeTypeEnum.parse('MODIFIED'), 'MODIFIED');
    assert.equal(ComparisonChangeTypeEnum.parse('deleted'), 'REMOVED');
    assert.equal(ComparisonChangeTypeEnum.parse('unchanged'), 'UNCHANGED');

    assert.equal(ComparisonCategoryEnum.parse('payment terms'), 'PAYMENT');
    assert.equal(ComparisonCategoryEnum.parse('termination clause'), 'TERMINATION');
    assert.equal(ComparisonCategoryEnum.parse('liability limitation'), 'LIABILITY');
    assert.equal(ComparisonCategoryEnum.parse('confidentiality'), 'CONFIDENTIALITY');

    assert.equal(ComparisonSeverityEnum.parse('critical'), 'CRITICAL');
    assert.equal(ComparisonSeverityEnum.parse('high'), 'HIGH');
    assert.equal(ComparisonSeverityEnum.parse('moderate'), 'MODERATE');
  });

  // TEST 4: FullComparisonResultSchema Completeness
  test('4. FullComparisonResultSchema: validates all required redline sections and fields', () => {
    const mockOutput = {
      documentA: {
        fileName: 'ContractA.pdf',
        documentType: 'Baseline'
      },
      documentB: {
        fileName: 'ContractB.pdf',
        documentType: 'Revised Redline'
      },
      summary: {
        totalChanges: 3,
        addedCount: 1,
        removedCount: 0,
        modifiedCount: 2,
        unchangedCount: 2,
        executiveSummary: 'Substantive changes to payment schedule and liability cap.'
      },
      changes: [
        {
          id: 'chg-1',
          changeType: 'MODIFIED',
          category: 'PAYMENT',
          severity: 'HIGH',
          sectionNumber: '2',
          sectionTitle: 'PAYMENT TERMS',
          oldText: 'Net 45',
          newText: 'Net 30 with 1.5% late interest',
          explanation: 'Payment accelerated from 45 to 30 days.',
          whyItMatters: 'Requires faster accounting approval.',
          legalImpact: 'Introduces late payment fee exposure.',
          actionRequired: 'Confirm AP capabilities.',
          pageNumberA: 1,
          pageNumberB: 1,
          sourceA: 'Net 45',
          sourceB: 'Net 30'
        }
      ],
      keyChanges: [
        {
          id: 'kc-1',
          title: 'Payment Window Accelerated',
          description: 'Payment changed from Net 45 to Net 30.',
          category: 'PAYMENT',
          severity: 'HIGH',
          clauseRef: 'Section 2'
        }
      ],
      riskChanges: [
        {
          id: 'rc-1',
          title: 'Late Interest Fee Risk',
          description: '1.5% interest on overdue balances.',
          severity: 'HIGH',
          clauseRef: 'Section 2',
          mitigation: 'Negotiate a 15-day grace period.'
        }
      ],
      changedObligations: [
        {
          party: 'Client',
          oldObligation: 'Pay Net 45',
          newObligation: 'Pay Net 30',
          impact: 'Accelerates payment obligation',
          clauseRef: 'Section 2'
        }
      ],
      changedDeadlines: [
        {
          title: 'Invoice Payment',
          oldDeadline: '45 days',
          newDeadline: '30 days',
          impact: 'Shortens payment timeline',
          clauseRef: 'Section 2'
        }
      ],
      changedFinancialTerms: [
        {
          item: 'Late fee interest',
          oldValue: 'None',
          newValue: '1.5% monthly',
          impact: 'Added penalty cost',
          clauseRef: 'Section 2'
        }
      ],
      actionChecklist: [
        {
          id: 'act-1',
          task: 'Verify accounting schedule',
          clauseRef: 'Section 2',
          priority: 'Critical',
          completed: false,
          notes: 'Check with AP'
        }
      ],
      lawyerQuestions: [
        {
          id: 'lq-1',
          question: 'Can we push back to Net 45?',
          context: 'Section 2 changed from Net 45 to Net 30',
          clauseRef: 'Section 2',
          reason: 'Company accounts payable standard is Net 45'
        }
      ],
      disclaimer: 'LegalLens AI comparison disclaimer.'
    };

    const parsed = FullComparisonResultSchema.safeParse(mockOutput);
    assert.equal(parsed.success, true, 'Mock full output should satisfy schema');
  });

  // TEST 5: Live Groq API Comparison Call
  test('5. Live Groq Comparison: generates structured redline identifying Net 30 payment change and SOC 2 insertion', async () => {
    if (!process.env.GROQ_API_KEY) {
      console.warn('Skipping Live Groq test: GROQ_API_KEY not found in environment.');
      return;
    }

    const startTime = performance.now();
    const result = await compareDocumentsWithGroq({
      documentA: docABaseline,
      documentB: docBRevised
    });
    const durationMs = Math.round(performance.now() - startTime);

    console.log(`[TEST] Live Groq Document Comparison completed in ${durationMs}ms`);
    console.log(`[TEST] Total changes detected: ${result.summary.totalChanges}`);
    console.log(`[TEST] Executive Summary: ${result.summary.executiveSummary.substring(0, 150)}...`);

    // Verify Document metadata
    assert.equal(result.documentA.fileName, docABaseline.name);
    assert.equal(result.documentB.fileName, docBRevised.name);

    // Verify Summary
    assert(result.summary.totalChanges >= 2, `Expected at least 2 changes, got ${result.summary.totalChanges}`);
    assert(result.summary.executiveSummary.length > 20, 'Executive summary must be informative');

    // Verify Changes list
    assert(result.changes.length >= 2, `Expected at least 2 changed clauses, got ${result.changes.length}`);

    // Verify detection of payment term change
    const paymentChange = result.changes.find(c => 
      c.category === 'PAYMENT' || 
      c.sectionTitle.toLowerCase().includes('payment') ||
      c.explanation.toLowerCase().includes('30') ||
      c.explanation.toLowerCase().includes('45')
    );
    assert(paymentChange, 'Groq must detect the Net 45 -> Net 30 payment terms change');
    assert.equal(paymentChange.changeType, 'MODIFIED', 'Payment terms change must be classified as MODIFIED');

    // Verify detection of newly inserted SOC 2 or Data Security clause
    const soc2Change = result.changes.find(c => 
      c.sectionTitle.toLowerCase().includes('soc') ||
      c.sectionTitle.toLowerCase().includes('security') ||
      (c.newText && c.newText.toLowerCase().includes('soc 2'))
    );
    assert(soc2Change, 'Groq must detect the SOC 2 clause');
    assert.equal(soc2Change.changeType, 'ADDED', 'SOC 2 clause must be classified as ADDED');

    // Verify Key Changes & Risk Changes
    assert(result.keyChanges.length > 0, 'Must produce at least one key change');
    assert(result.riskChanges.length > 0, 'Must produce at least one risk change');

    // Verify Obligations & Deadlines
    assert(result.changedObligations.length > 0, 'Must extract changed obligations');
    assert(result.changedDeadlines.length > 0, 'Must extract changed deadlines');

    // Verify Action Checklist & Lawyer Questions
    assert(result.actionChecklist.length > 0, 'Must produce action checklist items');
    assert(result.lawyerQuestions.length > 0, 'Must produce lawyer questions');
  });

  // TEST 6: Live Express Route POST /api/compare-documents
  test('6. Express Route: POST /api/compare-documents responds with 200 and structured comparison', async () => {
    if (!process.env.GROQ_API_KEY) {
      console.warn('Skipping Live Route test: GROQ_API_KEY not found in environment.');
      return;
    }

    const testPort = 3099;
    const server = http.createServer(app);

    await new Promise((resolve) => server.listen(testPort, resolve));

    try {
      const response = await fetch(`http://localhost:${testPort}/api/compare-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentA: docABaseline,
          documentB: docBRevised
        })
      });

      assert.equal(response.status, 200, `Expected 200 OK, got ${response.status}`);
      const body = await response.json();
      assert.equal(body.success, true);
      assert(body.comparison);
      assert(body.comparison.summary.totalChanges >= 2);
      assert(body.comparison.changes.length >= 2);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
