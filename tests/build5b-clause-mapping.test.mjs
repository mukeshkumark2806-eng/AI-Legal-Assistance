import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { detectSections } from '../src/services/document/sectionDetector.ts';
import { normalizeSourceRef } from '../server/services/legalAnalyzer.ts';

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
  }

  const rawText = pages.map((p) => p.text).join('\n\n');
  return { rawText, pages };
}

// Emulate DocumentViewer paragraph-clause matching logic
function matchParagraphToClauses(paragraph, section, docClauses, pIdx = 0, selectedClauseId = null) {
  // Filter clauses that authoritatively belong to this section
  const sectionClauses = docClauses.filter((c) => {
    if (section.clauseIds?.includes(c.id)) return true;
    if (c.sourceReference && section.sourceReference && c.sourceReference.trim().toLowerCase() === section.sourceReference.trim().toLowerCase()) return true;
    if (c.sectionNumber && section.sectionNumber && String(c.sectionNumber).trim() === String(section.sectionNumber).trim()) return true;
    return false;
  });

  // Within this section, match specific paragraph by snippet text if applicable
  let matchedClauses = sectionClauses.filter((c) => {
    const snippet = (c.originalText || c.sourceText || '').trim();
    if (snippet.length > 15) {
      const normSnippet = snippet.toLowerCase().replace(/\s+/g, ' ');
      const normPara = paragraph.toLowerCase().replace(/\s+/g, ' ');
      if (normPara.includes(normSnippet.slice(0, 40)) || normSnippet.includes(normPara.slice(0, 40))) {
        return true;
      }
    }
    return false;
  });

  // If no paragraph-specific snippet match, associate with section's clauses
  if (matchedClauses.length === 0 && sectionClauses.length > 0) {
    if (sectionClauses.length === 1) {
      matchedClauses = sectionClauses;
    } else if (pIdx < sectionClauses.length) {
      matchedClauses = [sectionClauses[pIdx]];
    } else {
      matchedClauses = [sectionClauses[0]];
    }
  }

  const isAnySelected = matchedClauses.some((c) => c.id === selectedClauseId);
  const selectedClause = matchedClauses.find((c) => c.id === selectedClauseId);
  const primaryClause = selectedClause || matchedClauses[0];

  return { matchedClauses, isAnySelected, primaryClause };
}

// Emulate Workspace.tsx jump-to-clause / jump-to-section resolution logic
function resolveJumpToClauseRef(clauseRef, docSections, docClauses) {
  if (!clauseRef) return null;
  const cleanRef = clauseRef.trim();

  // Extract numerical section if present
  const numMatch = cleanRef.match(/(?:Section|Sec\.?|Clause|Art\.?|Article)?\s*(\d+(?:\.\d+)*)/i);
  const targetNum = numMatch ? numMatch[1] : null;

  // 1. Match clause by exact sourceReference, exact sectionNumber, or exact title
  const matchClause = docClauses.find((c) => {
    if (c.sourceReference && c.sourceReference.toLowerCase().trim() === cleanRef.toLowerCase()) return true;
    if (c.sectionNumber && String(c.sectionNumber).trim() === cleanRef) return true;
    if (targetNum && c.sectionNumber && (String(c.sectionNumber).trim() === targetNum || String(c.sectionNumber).trim() === `${targetNum}.0` || `${String(c.sectionNumber).trim()}.0` === targetNum)) return true;
    if (c.title && c.title.toLowerCase().trim() === cleanRef.toLowerCase()) return true;
    return false;
  });
  if (matchClause) {
    return { type: 'clause', id: matchClause.id, clause: matchClause };
  }

  // 2. Attempt to match section by exact sourceReference, sectionNumber, or exact title
  const matchedSection = docSections.find((s) => {
    if (s.sourceReference && s.sourceReference.toLowerCase().trim() === cleanRef.toLowerCase()) return true;
    if (s.sectionNumber && String(s.sectionNumber).trim() === cleanRef) return true;
    if (targetNum && s.sectionNumber && (String(s.sectionNumber).trim() === targetNum || String(s.sectionNumber).trim() === `${targetNum}.0` || `${String(s.sectionNumber).trim()}.0` === targetNum)) return true;
    if (targetNum && (s.id === `sec-${targetNum}` || s.id === `sec-p${targetNum}` || s.id === `sec-chunk-${targetNum}`)) return true;
    if (s.title && s.title.toLowerCase().trim() === cleanRef.toLowerCase()) return true;
    return false;
  });
  if (matchedSection) {
    return { type: 'section', id: matchedSection.id, section: matchedSection };
  }

  // 3. Substring match fallback for full titles (longest matching section title)
  const matchingSections = docSections
    .filter((s) => s.title && (cleanRef.toLowerCase().includes(s.title.toLowerCase()) || s.title.toLowerCase().includes(cleanRef.toLowerCase())))
    .sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0));
  if (matchingSections.length > 0) {
    return { type: 'section', id: matchingSections[0].id, section: matchingSections[0] };
  }

  return null;
}

// Emulate Workspace.tsx handleSelectClause fallback section lookup
function resolveClauseFallbackSection(clauseId, docSections, docClauses) {
  const targetClause = docClauses.find((c) => c.id === clauseId);
  if (!targetClause) return null;
  return docSections.find(
    (s) =>
      s.clauseIds?.includes(clauseId) ||
      (s.sourceReference && targetClause.sourceReference && s.sourceReference.trim().toLowerCase() === targetClause.sourceReference.trim().toLowerCase()) ||
      (s.sectionNumber && targetClause.sectionNumber && String(s.sectionNumber).trim() === String(targetClause.sectionNumber).trim()) ||
      (s.title && targetClause.title && s.title.trim().toLowerCase() === targetClause.title.trim().toLowerCase())
  );
}

describe('BUILD 5B — Clause Intelligence Source Mapping & Highlight Accuracy', async () => {
  const v2Path = path.resolve(projectRoot, 'LegalLens_Service_Agreement_v2_revised.pdf');
  const { rawText: v2RawText, pages: v2Pages } = await extractPdfTextAndPages(v2Path);
  const v2Detection = detectSections(v2RawText, v2Pages);

  test('V2 PDF detects exactly 13 contractual sections including Section 13 (Security Compliance)', () => {
    assert.equal(v2Detection.sections.length, 13, `Expected exactly 13 sections for V2, got ${v2Detection.sections.length}`);
    const sec13 = v2Detection.sections.find((s) => s.sectionNumber === '13');
    assert.ok(sec13, 'Section 13 must exist in V2');
    assert.equal(sec13.title, 'Security Compliance');
    assert.equal(sec13.sourceReference, 'Section 13 — Security Compliance');
  });

  // Construct synthetic canonical clauses reflecting legal intelligence extraction
  const clauses = [
    {
      id: 'clause-3',
      sectionNumber: '3',
      title: 'Contract Term',
      category: 'Obligation',
      importance: 'Moderate',
      originalText: 'The Agreement begins on 1 October 2026 and continues for eighteen (18) months...',
      sourceReference: 'Section 3 — Contract Term'
    },
    {
      id: 'clause-7',
      sectionNumber: '7',
      title: 'Confidentiality',
      category: 'Obligation',
      importance: 'High',
      originalText: 'Each party will keep confidential information received from the other party confidential...',
      sourceReference: 'Section 7 — Confidentiality'
    },
    {
      id: 'clause-8',
      sectionNumber: '8',
      title: 'Intellectual Property',
      category: 'Important',
      importance: 'High',
      originalText: 'Upon full payment of all undisputed amounts due for the applicable deliverable...',
      sourceReference: 'Section 8 — Intellectual Property'
    },
    {
      id: 'clause-9',
      sectionNumber: '9',
      title: 'Limitation of Liability',
      category: 'Restriction',
      importance: 'Critical',
      originalText: 'Except for confidentiality breaches and intentional misconduct, neither party will be liable...',
      sourceReference: 'Section 9 — Limitation of Liability'
    },
    {
      id: 'clause-10',
      sectionNumber: '10',
      title: 'Termination',
      category: 'Termination',
      importance: 'Critical',
      originalText: "Either party may terminate this Agreement for convenience by providing thirty (30) days' prior written notice.",
      sourceReference: 'Section 10 — Termination'
    },
    {
      id: 'clause-11',
      sectionNumber: '11',
      title: 'Data Security',
      category: 'Important',
      importance: 'High',
      originalText: 'The Service Provider will use reasonable administrative, technical, and organizational measures to protect Client data...',
      sourceReference: 'Section 11 — Data Security'
    },
    {
      id: 'clause-13',
      sectionNumber: '13',
      title: 'Security Compliance',
      category: 'Important',
      importance: 'High',
      originalText: 'The Service Provider will maintain controls reasonably designed to support SOC 2 compliance...',
      sourceReference: 'Section 13 — Security Compliance'
    }
  ];

  test('Section 7 (Confidentiality) with "three (3) years" MUST NOT match Section 3 (Contract Term)', () => {
    const sec7 = v2Detection.sections.find((s) => s.sectionNumber === '7');
    assert.ok(sec7, 'Section 7 must exist');
    assert.ok(sec7.paragraphs.length > 0, 'Section 7 must have paragraphs');
    assert.ok(sec7.text.includes('three (3) years'), 'Section 7 text must mention "three (3) years"');

    // All paragraphs belonging to Section 7 must map strictly to Section 7
    sec7.paragraphs.forEach((p, pIdx) => {
      const result = matchParagraphToClauses(p, sec7, clauses, pIdx, 'clause-7');
      assert.ok(result.primaryClause, `Primary clause must be found for Section 7 paragraph ${pIdx}`);
      assert.equal(result.primaryClause.sectionNumber, '7', `Primary clause for paragraph ${pIdx} must be Section 7, NOT Section 3`);
      assert.equal(result.primaryClause.sourceReference, 'Section 7 — Confidentiality');
      assert.equal(result.isAnySelected, true, `clause-7 must be selected for Section 7 paragraph ${pIdx}`);

      // Crucial check: Clause 3 (Contract Term) must NEVER be in matchedClauses for Section 7
      const hasClause3 = result.matchedClauses.some((c) => c.sectionNumber === '3' || c.id === 'clause-3');
      assert.equal(hasClause3, false, `Clause 3 must NOT be matched for Section 7 paragraph ${pIdx}`);

      // No paragraph from Section 7 maps to another section
      const foreignClauses = result.matchedClauses.filter((c) => c.sectionNumber !== '7');
      assert.equal(foreignClauses.length, 0, `No foreign clause can be matched for Section 7 paragraph ${pIdx}`);
    });
  });

  test('Section 10 (Termination) with "thirty (30) days" MUST NOT match Section 3 (Contract Term)', () => {
    const sec10 = v2Detection.sections.find((s) => s.sectionNumber === '10');
    assert.ok(sec10, 'Section 10 must exist');
    assert.ok(sec10.paragraphs.length > 0, 'Section 10 must have paragraphs');
    assert.ok(sec10.text.includes('thirty (30) days'), 'Section 10 text must mention "thirty (30) days"');

    // All paragraphs belonging to Section 10 must map strictly to Section 10
    sec10.paragraphs.forEach((p, pIdx) => {
      const result = matchParagraphToClauses(p, sec10, clauses, pIdx, 'clause-10');
      assert.ok(result.primaryClause, `Primary clause must be found for Section 10 paragraph ${pIdx}`);
      assert.equal(result.primaryClause.sectionNumber, '10', `Primary clause for paragraph ${pIdx} must be Section 10, NOT Section 3`);
      assert.equal(result.primaryClause.sourceReference, 'Section 10 — Termination');
      assert.equal(result.isAnySelected, true, `clause-10 must be selected for Section 10 paragraph ${pIdx}`);

      // Crucial check: Clause 3 (Contract Term) must NEVER be in matchedClauses for Section 10
      const hasClause3 = result.matchedClauses.some((c) => c.sectionNumber === '3' || c.id === 'clause-3');
      assert.equal(hasClause3, false, `Clause 3 must NOT be matched for Section 10 paragraph ${pIdx}`);

      // No paragraph from Section 10 maps to another section
      const foreignClauses = result.matchedClauses.filter((c) => c.sectionNumber !== '10');
      assert.equal(foreignClauses.length, 0, `No foreign clause can be matched for Section 10 paragraph ${pIdx}`);
    });
  });

  test('Section 11 (Data Security) with "seventy-two (72) hours" MUST NOT match Section 7 (Confidentiality)', () => {
    const sec11 = v2Detection.sections.find((s) => s.sectionNumber === '11');
    assert.ok(sec11, 'Section 11 must exist');
    assert.ok(sec11.paragraphs.length > 0, 'Section 11 must have paragraphs');
    assert.ok(sec11.text.includes('seventy-two (72) hours'), 'Section 11 text must mention "seventy-two (72) hours"');

    // All paragraphs belonging to Section 11 must map strictly to Section 11
    sec11.paragraphs.forEach((p, pIdx) => {
      const result = matchParagraphToClauses(p, sec11, clauses, pIdx, 'clause-11');
      assert.ok(result.primaryClause, `Primary clause must be found for Section 11 paragraph ${pIdx}`);
      assert.equal(result.primaryClause.sectionNumber, '11', `Primary clause for paragraph ${pIdx} must be Section 11, NOT Section 7`);
      assert.equal(result.primaryClause.sourceReference, 'Section 11 — Data Security');

      // Crucial check: Clause 7 (Confidentiality) must NEVER be in matchedClauses for Section 11
      const hasClause7 = result.matchedClauses.some((c) => c.sectionNumber === '7' || c.id === 'clause-7');
      assert.equal(hasClause7, false, `Clause 7 must NOT be matched for Section 11 paragraph ${pIdx}`);

      // No paragraph from Section 11 maps to another section
      const foreignClauses = result.matchedClauses.filter((c) => c.sectionNumber !== '11');
      assert.equal(foreignClauses.length, 0, `No foreign clause can be matched for Section 11 paragraph ${pIdx}`);
    });
  });

  test('Section 13 (Security Compliance) paragraph MUST match Section 13 (NOT Section 11 or Section 3)', () => {
    const sec13 = v2Detection.sections.find((s) => s.sectionNumber === '13');
    assert.ok(sec13, 'Section 13 must exist');
    assert.ok(sec13.paragraphs.length > 0, 'Section 13 must have paragraphs');

    sec13.paragraphs.forEach((p, pIdx) => {
      const result = matchParagraphToClauses(p, sec13, clauses, pIdx, 'clause-13');
      assert.ok(result.primaryClause, `Primary clause must be found for Section 13 paragraph ${pIdx}`);
      assert.equal(result.primaryClause.sectionNumber, '13', 'Primary clause must be Section 13');
      assert.equal(result.primaryClause.sourceReference, 'Section 13 — Security Compliance');

      const hasSec11 = result.matchedClauses.some((c) => c.sectionNumber === '11');
      assert.equal(hasSec11, false, 'Section 11 must NOT be matched for Section 13');

      // No paragraph from Section 13 maps to another section
      const foreignClauses = result.matchedClauses.filter((c) => c.sectionNumber !== '13');
      assert.equal(foreignClauses.length, 0, 'No foreign clause can be matched for Section 13');
    });
  });

  test('Inspect/Jump: "Section 10 — Termination" resolves to Section 10 (NEVER Section 1)', () => {
    const res = resolveJumpToClauseRef('Section 10 — Termination', v2Detection.sections, clauses);
    assert.ok(res, 'Jump resolution must succeed');
    const secNum = res.type === 'clause' ? res.clause.sectionNumber : res.section.sectionNumber;
    assert.equal(secNum, '10', `Expected Section 10, but got Section ${secNum}`);
  });

  test('Inspect/Jump: "Section 11 — Data Security" resolves to Section 11 (NEVER Section 1)', () => {
    const res = resolveJumpToClauseRef('Section 11 — Data Security', v2Detection.sections, clauses);
    assert.ok(res, 'Jump resolution must succeed');
    const secNum = res.type === 'clause' ? res.clause.sectionNumber : res.section.sectionNumber;
    assert.equal(secNum, '11', `Expected Section 11, but got Section ${secNum}`);
  });

  test('Inspect/Jump: "Section 12 — Governing Law" resolves to Section 12 (NEVER Section 1)', () => {
    const res = resolveJumpToClauseRef('Section 12 — Governing Law', v2Detection.sections, clauses);
    assert.ok(res, 'Jump resolution must succeed');
    const secNum = res.type === 'clause' ? res.clause.sectionNumber : res.section.sectionNumber;
    assert.equal(secNum, '12', `Expected Section 12, but got Section ${secNum}`);
  });

  test('Inspect/Jump: "Section 13 — Security Compliance" resolves to Section 13 (NEVER Section 1 or Section 3)', () => {
    const res = resolveJumpToClauseRef('Section 13 — Security Compliance', v2Detection.sections, clauses);
    assert.ok(res, 'Jump resolution must succeed');
    const secNum = res.type === 'clause' ? res.clause.sectionNumber : res.section.sectionNumber;
    assert.equal(secNum, '13', `Expected Section 13, but got Section ${secNum}`);
  });

  test('Fallback Section Lookup: clauseId fallback resolves strictly by sectionNumber or exact title', () => {
    const fallback10 = resolveClauseFallbackSection('clause-10', v2Detection.sections, clauses);
    assert.ok(fallback10, 'Fallback for clause-10 must succeed');
    assert.equal(fallback10.sectionNumber, '10', 'Fallback for clause-10 must resolve to Section 10');

    const fallback13 = resolveClauseFallbackSection('clause-13', v2Detection.sections, clauses);
    assert.ok(fallback13, 'Fallback for clause-13 must succeed');
    assert.equal(fallback13.sectionNumber, '13', 'Fallback for clause-13 must resolve to Section 13');
  });

  test('normalizeSourceRef: accurately maps numeric and title references to authoritative V2 sections', () => {
    const inputSections = v2Detection.sections.map((s) => ({
      id: s.id,
      sectionNumber: s.sectionNumber,
      title: s.title,
      paragraphs: s.paragraphs,
      sourceReference: s.sourceReference
    }));

    assert.equal(normalizeSourceRef('Section 10', inputSections), 'Section 10 — Termination');
    assert.equal(normalizeSourceRef('10', inputSections), 'Section 10 — Termination');
    assert.equal(normalizeSourceRef('Sec 11', inputSections), 'Section 11 — Data Security');
    assert.equal(normalizeSourceRef('Section 13', inputSections), 'Section 13 — Security Compliance');
    assert.equal(normalizeSourceRef('Security Compliance', inputSections), 'Section 13 — Security Compliance');
    assert.equal(normalizeSourceRef('Data Security', inputSections), 'Section 11 — Data Security');
    assert.equal(normalizeSourceRef('Confidentiality', inputSections), 'Section 7 — Confidentiality');
    assert.equal(normalizeSourceRef('Limitation of Liability', inputSections), 'Section 9 — Limitation of Liability');

    // Semantic fallback distinguishing Data Security vs Security Compliance
    const socFallback = normalizeSourceRef(null, inputSections, 'Provider shall provide SOC 2 Type II compliance audit report');
    assert.equal(socFallback, 'Section 13 — Security Compliance');

    const incidentFallback = normalizeSourceRef(null, inputSections, 'Notify client within seventy-two hours of a material security incident');
    assert.equal(incidentFallback, 'Section 11 — Data Security');
  });
});
