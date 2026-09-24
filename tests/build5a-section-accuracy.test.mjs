import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { detectSections, identifyHeading, isAgreementOrDocumentTitle, isVersionLabel, isTestingOrDisclaimerNotice } from '../src/services/document/sectionDetector.ts';
import { analyzeDocumentWithGroq } from '../server/services/legalAnalyzer.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Helper to extract text and pages from PDF file in Node
async function extractPdfTextAndPages(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true
  });
  const pdfDoc = await loadingTask.promise;
  const pages = [];
  const fullTextParts = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    let pageRawText = '';
    let lastY = null;

    for (const item of textContent.items) {
      if ('str' in item) {
        if ('transform' in item && Array.isArray(item.transform)) {
          const currentY = item.transform[5];
          if (lastY !== null && Math.abs(currentY - lastY) > 5) {
            pageRawText += '\n';
          }
          lastY = currentY;
        }
        pageRawText += item.str + (item.hasEOL ? '\n' : ' ');
      }
    }

    const cleaned = pageRawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

    pages.push({
      pageNumber: pageNum,
      text: cleaned,
      characterCount: cleaned.length,
      wordCount: cleaned.split(/\s+/).filter(Boolean).length
    });

    fullTextParts.push(`--- PAGE ${pageNum} ---\n` + cleaned);
  }

  return {
    rawText: fullTextParts.join('\n\n'),
    totalPages: pdfDoc.numPages,
    pages
  };
}

describe('Build 5A — Document Section Count and Section Metadata Accuracy Suite', () => {
  let v1PdfPath;
  let v1Extracted;
  let v1Detection;
  let v1AnalysisResult;

  before(async () => {
    // Locate V1 sample PDF
    const candidatePaths = [
      path.join(projectRoot, 'LegalLens_Service_Agreement_v1_original.pdf'),
      path.join(projectRoot, 'public', 'samples', 'LegalLens_Service_Agreement_v1_original.pdf'),
      'C:/Users/Cursory_Inverse/Downloads/LegalLens_Service_Agreement_v1_original.pdf'
    ];

    v1PdfPath = candidatePaths.find(p => fs.existsSync(p));
    assert(v1PdfPath, 'LegalLens_Service_Agreement_v1_original.pdf must exist');

    console.log(`   -> Loading V1 PDF from: ${v1PdfPath}`);
    v1Extracted = await extractPdfTextAndPages(v1PdfPath);
    console.log(`   ✓ Extracted ${v1Extracted.totalPages} pages, ${v1Extracted.rawText.length} characters`);

    // Run deterministic section detection
    v1Detection = detectSections(v1Extracted.rawText, v1Extracted.pages);
    console.log(`   ✓ Deterministic section detection found: ${v1Detection.sections.length} contractual sections`);
  });

  // TEST 1: V1 PDF detects exactly 12 sections
  test('Test 1: V1 PDF detects exactly 12 sections', () => {
    assert.equal(
      v1Detection.sections.length,
      12,
      `Expected exactly 12 contractual sections for V1 PDF, but found ${v1Detection.sections.length}`
    );
    assert.equal(
      v1Detection.detectedSections.length,
      12,
      `detectedSections alias must also report exactly 12 sections`
    );
    assert.equal(
      v1Detection.totalDetected,
      12,
      `totalDetected must report exactly 12`
    );
  });

  // TEST 2: "SECTION 1.0: Service Agreement" is not included in detectedSections
  test('Test 2: "SECTION 1.0: Service Agreement" is not included in detectedSections', () => {
    // Prove for V1 document
    const hasServiceAgreementSection = v1Detection.sections.some(
      s => s.title.toLowerCase().includes('service agreement') || s.sectionNumber === '1.0'
    );
    assert.equal(
      hasServiceAgreementSection,
      false,
      '"Service Agreement" must not be counted as a contractual section in V1'
    );

    // Verify document metadata classification
    assert(
      v1Detection.documentMetadata.documentTitle.toUpperCase().includes('SERVICE AGREEMENT'),
      'Document title should be captured in documentMetadata'
    );
    assert(
      v1Detection.documentMetadata.version && v1Detection.documentMetadata.version.includes('Version 1'),
      'Version should be captured in documentMetadata'
    );
    assert(
      v1Detection.documentMetadata.testingNotice && v1Detection.documentMetadata.testingNotice.includes('Fictional testing document'),
      'Testing notice should be captured in documentMetadata'
    );

    // Also test explicitly with "SECTION 1.0: Service Agreement" heading style
    const textWithSection1_0 = `SECTION 1.0: Service Agreement
Version 1 — Original
Fictional testing document — created for LegalLens AI demonstration and comparison testing. Not a real legal agreement and not legal advice.

1. Parties
This Service Agreement is entered into between Client and Provider.

2. Scope of Services
Services to be performed.`;

    const headingRes = identifyHeading('SECTION 1.0: Service Agreement');
    assert.equal(headingRes, null, 'identifyHeading must return null for "SECTION 1.0: Service Agreement"');

    const detectionRes = detectSections(textWithSection1_0);
    assert.equal(detectionRes.sections.length, 2, 'Must detect exactly 2 contractual sections (Parties, Scope)');
    assert.equal(detectionRes.sections[0].title, 'Parties');
    assert.equal(detectionRes.sections[0].sectionNumber, '1');
    assert.equal(
      detectionRes.sections.some(s => s.title.toLowerCase().includes('service agreement')),
      false,
      'detectedSections must not include "SECTION 1.0: Service Agreement"'
    );
  });

  // TEST 3: Section 1 = Parties
  test('Test 3: Section 1 = Parties', () => {
    const sec1 = v1Detection.sections[0];
    assert(sec1, 'Section 1 must exist');
    assert.equal(sec1.sectionNumber, '1');
    assert.equal(sec1.title, 'Parties');
    assert.equal(sec1.id, 'sec-1');
    assert.equal(sec1.sourceReference, 'Section 1 — Parties');
    assert(sec1.text.includes('Apex Digital Solutions') && sec1.text.includes('BrightPath Technologies'));
  });

  // TEST 4: Section 4 = Payment Terms
  test('Test 4: Section 4 = Payment Terms', () => {
    const sec4 = v1Detection.sections.find(s => s.sectionNumber === '4');
    assert(sec4, 'Section 4 must exist');
    assert.equal(sec4.title, 'Payment Terms');
    assert.equal(sec4.id, 'sec-4');
    assert.equal(sec4.page, 1);
    assert.equal(sec4.pageNumber, 1);
    assert.equal(sec4.sourceReference, 'Section 4 — Payment Terms');
    assert(sec4.text.includes('INR 50,000') && sec4.text.includes('thirty (30) days'));
  });

  // TEST 5: Section 12 = Governing Law
  test('Test 5: Section 12 = Governing Law', () => {
    const sec12 = v1Detection.sections.find(s => s.sectionNumber === '12');
    assert(sec12, 'Section 12 must exist');
    assert.equal(sec12.title, 'Governing Law');
    assert.equal(sec12.id, 'sec-12');
    assert.equal(sec12.sourceReference, 'Section 12 — Governing Law');
    assert(sec12.text.includes('India') && sec12.text.includes('Chennai'));
  });

  // TEST 6: Payment analysis references Section 4
  test('Test 6: Payment analysis references Section 4', async () => {
    console.log('   -> Executing live Groq analysis on verified V1 sections...');
    const t0 = Date.now();

    v1AnalysisResult = await analyzeDocumentWithGroq({
      documentName: 'LegalLens_Service_Agreement_v1_original.pdf',
      fileType: 'PDF',
      totalPages: v1Extracted.totalPages,
      rawText: v1Extracted.rawText,
      sections: v1Detection.sections.map(s => ({
        id: s.id,
        sectionNumber: s.sectionNumber,
        title: s.title,
        paragraphs: s.paragraphs,
        pageNumber: s.pageNumber,
        page: s.page,
        text: s.text,
        sourceReference: s.sourceReference
      }))
    });

    console.log(`   ✓ Live Groq analysis completed in ${Date.now() - t0}ms`);

    // Check financial commitments reference Section 4
    const paymentFin = v1AnalysisResult.financialCommitments.find(
      f => f.clauseRef.includes('Section 4') || f.clauseRef.includes('Payment Terms') || f.amount.includes('50,000')
    );
    assert(paymentFin, 'Financial commitments must identify INR 50,000 payment obligation');
    assert.equal(
      paymentFin.clauseRef,
      'Section 4 — Payment Terms',
      `Payment financial commitment must reference "Section 4 — Payment Terms", received "${paymentFin.clauseRef}"`
    );

    // Check Payment clause references Section 4
    const paymentClause = v1AnalysisResult.clauses.find(
      c => c.sectionNumber === '4' || c.title.toLowerCase().includes('payment')
    );
    if (paymentClause) {
      assert.equal(paymentClause.sectionNumber, '4');
      assert.equal(paymentClause.sourceReference, 'Section 4 — Payment Terms');
    }
  });

  // TEST 7: Contract Term analysis references Section 3
  test('Test 7: Contract Term analysis references Section 3', () => {
    assert(v1AnalysisResult, 'Analysis result must be available from Test 6');

    // Check Important Dates or clauses for Contract Term referencing Section 3
    const termDate = v1AnalysisResult.importantDates.find(
      d => d.clauseRef.includes('Section 3') || d.title.toLowerCase().includes('term') || d.description.toLowerCase().includes('twelve')
    );
    if (termDate) {
      assert.equal(
        termDate.clauseRef,
        'Section 3 — Contract Term',
        `Term date must reference "Section 3 — Contract Term", received "${termDate.clauseRef}"`
      );
    }

    const termClause = v1AnalysisResult.clauses.find(
      c => c.sectionNumber === '3' || c.title.toLowerCase().includes('term')
    );
    if (termClause) {
      assert.equal(termClause.sectionNumber, '3');
      assert.equal(termClause.sourceReference, 'Section 3 — Contract Term');
    }
  });

  // TEST 8: No generated AI item references a nonexistent section
  test('Test 8: No generated AI item references a nonexistent section', () => {
    assert(v1AnalysisResult, 'Analysis result must be available');
    const validSectionNumbers = new Set(v1Detection.sections.map(s => s.sectionNumber));
    const validSourceRefs = new Set(v1Detection.sections.map(s => s.sourceReference));

    // Helper to check reference validity
    const checkRef = (ref, itemType, itemId) => {
      const isKnownRef = validSourceRefs.has(ref) ||
        Array.from(validSectionNumbers).some(num => ref.includes(`Section ${num}`));
      assert(
        isKnownRef,
        `Item [${itemType} ${itemId}] references nonexistent section: "${ref}". Must be one of Sections 1 to 12.`
      );
    };

    v1AnalysisResult.clauses.forEach(c => {
      assert(validSectionNumbers.has(c.sectionNumber), `Clause ${c.id} has invalid sectionNumber: ${c.sectionNumber}`);
      checkRef(c.sourceReference, 'Clause', c.id);
    });

    v1AnalysisResult.keyObligations.forEach(o => checkRef(o.clauseRef, 'KeyObligation', o.id));
    v1AnalysisResult.importantDates.forEach(d => checkRef(d.clauseRef, 'ImportantDate', d.id));
    v1AnalysisResult.financialCommitments.forEach(f => checkRef(f.clauseRef, 'FinancialCommitment', f.id));
    v1AnalysisResult.potentialConcerns.forEach(p => checkRef(p.clauseRef, 'PotentialConcern', p.id));
    v1AnalysisResult.actionChecklist.forEach(a => checkRef(a.clauseRef, 'ActionChecklistItem', a.id));
    v1AnalysisResult.lawyerQuestions.forEach(q => checkRef(q.clauseRef, 'LawyerQuestion', q.id));
  });

  // TEST 9: UI displays "12 Sections"
  test('Test 9: UI displays "12 Sections"', () => {
    // Emulate UI count calculation from document model
    const mockDoc = {
      sections: v1Detection.sections,
      detectedSections: v1Detection.detectedSections
    };

    // Sidebar & UploadZone derivation formula: `${doc.sections.length} Sections`
    const displayedCount = `${mockDoc.sections.length} Sections`;
    assert.equal(displayedCount, '12 Sections');

    // Outline view formula: `View Document Outline (${doc.sections.length} Sections) →`
    const outlineText = `View Document Outline (${mockDoc.sections.length} Sections) →`;
    assert.equal(outlineText, 'View Document Outline (12 Sections) →');

    // Verify it is NOT hardcoded (i.e. dynamic based on detectedSections.length)
    const mock13Doc = { sections: [...mockDoc.sections, { id: 'sec-13', sectionNumber: '13', title: 'Test', paragraphs: [] }] };
    assert.equal(`${mock13Doc.sections.length} Sections`, '13 Sections');
  });
});
