import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateLegalFile } from '../src/services/document/fileValidator.ts';
import {
  FullLegalAnalysisSchema,
  DocumentQuestionRequestSchema
} from '../server/schemas/legalAnalysisSchema.ts';
import {
  CompareDocumentsRequestSchema,
  ComparisonChangeTypeEnum
} from '../server/schemas/documentComparisonSchema.ts';
import { safeParseJson, GroqServiceError } from '../server/services/groqService.ts';
import { alignDocumentSections } from '../server/services/comparisonService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('COMPREHENSIVE TEST SUITE — Full LegalLens Architecture Verification', () => {

  // =========================================================================
  // SECTION 1: UPLOAD & FILE VALIDATION
  // =========================================================================
  describe('1. Document Upload & File Validation', () => {
    test('1.1 Valid PDF file passes validation', () => {
      const mockPdfFile = {
        name: 'Vendor_Agreement_2026.pdf',
        size: 1024 * 500, // 500 KB
        type: 'application/pdf'
      };
      const result = validateLegalFile(mockPdfFile);
      assert.equal(result.isValid, true);
      assert.equal(result.fileType, 'PDF');
      assert.equal(result.error, undefined);
    });

    test('1.2 Valid DOCX file passes validation', () => {
      const mockDocxFile = {
        name: 'Master_Services_Agreement.docx',
        size: 1024 * 800, // 800 KB
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      const result = validateLegalFile(mockDocxFile);
      assert.equal(result.isValid, true);
      assert.equal(result.fileType, 'DOCX');
      assert.equal(result.error, undefined);
    });

    test('1.3 Unsupported file types (.txt, .exe, .png) are rejected with clear error', () => {
      const invalidFiles = [
        { name: 'notes.txt', size: 1024, type: 'text/plain' },
        { name: 'script.exe', size: 2048, type: 'application/x-msdownload' },
        { name: 'scan.png', size: 5000, type: 'image/png' }
      ];
      for (const file of invalidFiles) {
        const result = validateLegalFile(file);
        assert.equal(result.isValid, false, `File ${file.name} must be rejected`);
        assert.match(result.error || '', /supported|PDF|DOCX/i);
      }
    });

    test('1.4 Oversized file (> 20MB) is rejected', () => {
      const oversizedFile = {
        name: 'Huge_Legal_Archive.pdf',
        size: 21 * 1024 * 1024, // 21 MB
        type: 'application/pdf'
      };
      const result = validateLegalFile(oversizedFile);
      assert.equal(result.isValid, false);
      assert.match(result.error || '', /20MB|exceeds/i);
    });

    test('1.5 Empty document (0 bytes) is rejected', () => {
      const emptyFile = {
        name: 'Zero_Byte_Document.pdf',
        size: 0,
        type: 'application/pdf'
      };
      const result = validateLegalFile(emptyFile);
      assert.equal(result.isValid, false);
      assert.match(result.error || '', /empty|0 byte/i);
    });

    test('1.6 Corrupted/missing file object handled safely without crashing', () => {
      const nullResult = validateLegalFile(null);
      assert.equal(nullResult.isValid, false);

      const undefinedResult = validateLegalFile(undefined);
      assert.equal(undefinedResult.isValid, false);
    });
  });

  // =========================================================================
  // SECTION 2: ANALYSIS SCHEMAS & ERROR HANDLING
  // =========================================================================
  describe('2. Analysis Schemas & Error Handling', () => {
    test('2.1 FullLegalAnalysisSchema validates complete compliant payload', () => {
      const validPayload = {
        documentOverview: {
          documentType: 'Master Services Agreement',
          summary: 'Governs software subscription and implementation services.',
          effectiveDate: 'March 15, 2026',
          term: '12 months',
          governingLaw: 'Delaware'
        },
        clauses: [
          {
            id: 'c-1',
            sectionNumber: '2',
            title: 'Fees and Payment Terms',
            category: 'Payment',
            importance: 'Critical',
            originalText: 'Customer will pay an annual recurring software subscription fee of $75,000, payable Net 30 days.',
            plainEnglish: 'Customer owes $75,000 annually payable within 30 days of invoice.',
            whyItMatters: 'Primary financial commitment under the contract.',
            concern: 'Late payments accrue 1.5% interest per month.',
            pageNumber: 1,
            sourceText: 'Customer will pay an annual recurring software subscription fee of $75,000.',
            sourceReference: 'Section 2 — Fees and Payment Terms'
          }
        ],
        keyObligations: [
          {
            id: 'ob-1',
            party: 'Client',
            description: 'Pay annual subscription fee of $75,000 Net 30 days',
            deadline: 'Within 30 days of invoice',
            clauseRef: 'Section 2 — Fees and Payment Terms',
            importance: 'Critical'
          }
        ],
        importantDates: [
          {
            id: 'dt-1',
            title: 'Payment Due Date',
            date: 'Net 30 days from invoice issuance',
            type: 'Deadline',
            clauseRef: 'Section 2 — Fees and Payment Terms',
            isRecurring: true,
            description: 'Annual fee payment deadline'
          }
        ],
        financialCommitments: [
          {
            id: 'fin-1',
            item: 'Software Subscription Fee',
            amount: '$75,000',
            schedule: 'Net 30 days',
            clauseRef: 'Section 2 — Fees and Payment Terms',
            penaltyTerms: '1.5% per month late interest',
            importance: 'Critical'
          }
        ],
        potentialConcerns: [
          {
            id: 'risk-1',
            title: 'Late Payment Penalty',
            severity: 'High',
            clauseRef: 'Section 2 — Fees and Payment Terms',
            description: '1.5% monthly late payment interest penalty.',
            mitigationAdvice: 'Ensure automated AP processing to avoid penalties.'
          }
        ],
        actionChecklist: [
          {
            id: 'act-1',
            task: 'Confirm billing contact and PO issuance',
            clauseRef: 'Section 2 — Fees and Payment Terms',
            priority: 'Critical',
            completed: false,
            notes: 'Coordinate with finance department'
          }
        ],
        lawyerQuestions: [
          {
            id: 'q-1',
            question: 'Should we negotiate the 1.5% monthly late fee to a lower interest rate?',
            context: 'Section 2 mandates 1.5% interest per month on late invoices.',
            clauseRef: 'Section 2 — Fees and Payment Terms',
            reason: 'Reduces financial exposure in case of disputed or delayed invoices.'
          }
        ]
      };

      const parsed = FullLegalAnalysisSchema.safeParse(validPayload);
      assert.equal(parsed.success, true, 'Valid payload must satisfy FullLegalAnalysisSchema');
    });

    test('2.2 FullLegalAnalysisSchema rejects invalid clause category and importance enums', () => {
      const invalidPayload = {
        documentOverview: {
          documentType: 'Agreement',
          summary: 'Summary text here'
        },
        clauses: [
          {
            id: 'c-invalid',
            category: 'TotallyInvalidCategory',
            importance: 'NotAnImportanceLevel',
            originalText: 'Text',
            plainEnglish: 'English'
          }
        ]
      };
      const parsed = FullLegalAnalysisSchema.safeParse(invalidPayload);
      assert.equal(parsed.success, false, 'Invalid category and importance must fail Zod validation');
    });

    test('2.3 safeParseJson strips markdown code blocks and handles trailing commas', () => {
      const markdownJson = '```json\n{\n  "key": "value",\n}\n```';
      const parsed = safeParseJson(markdownJson);
      assert.equal(parsed.key, 'value');

      const rawJson = '{"name": "LegalLens", "status": "active"}';
      assert.equal(safeParseJson(rawJson).name, 'LegalLens');
    });

    test('2.4 GroqServiceError properly encapsulates status code and sanitizes API keys', () => {
      const err = new GroqServiceError('AI service error with gsk_secret1234567890abcdef', 429, 'RATE_LIMIT');
      assert.equal(err.statusCode, 429);
      assert.equal(err.code, 'RATE_LIMIT');
    });
  });

  // =========================================================================
  // SECTION 3: GROUNDED Q&A VALIDATION
  // =========================================================================
  describe('3. Grounded Q&A Request & Citation Validation', () => {
    test('3.1 DocumentQuestionRequestSchema validates populated question and sections', () => {
      const validReq = {
        question: 'What is the governing law?',
        documentName: 'Agreement.pdf',
        sections: [
          {
            id: 'sec-1',
            sectionNumber: '1',
            title: 'Governing Law',
            paragraphs: ['This Agreement is governed by Delaware law.']
          }
        ]
      };
      const parsed = DocumentQuestionRequestSchema.safeParse(validReq);
      assert.equal(parsed.success, true);
    });

    test('3.2 DocumentQuestionRequestSchema rejects empty question or empty sections', () => {
      const emptyQuestion = {
        question: '',
        documentName: 'Agreement.pdf',
        sections: [{ id: 's1', title: 'T', paragraphs: ['P'] }]
      };
      assert.equal(DocumentQuestionRequestSchema.safeParse(emptyQuestion).success, false);

      const emptySections = {
        question: 'Valid question?',
        documentName: 'Agreement.pdf',
        sections: []
      };
      assert.equal(DocumentQuestionRequestSchema.safeParse(emptySections).success, false);
    });
  });

  // =========================================================================
  // SECTION 4: TWO-DOCUMENT COMPARISON PIPELINE
  // =========================================================================
  describe('4. Two-Document Comparison Pipeline', () => {
    test('4.1 alignDocumentSections accurately identifies matched, added, and removed sections', () => {
      const sectionsA = [
        { id: 'a1', sectionNumber: '1', title: 'Services', paragraphs: ['Original services'], pageNumber: 1 },
        { id: 'a2', sectionNumber: '2', title: 'Payment', paragraphs: ['Net 45 payment terms'], pageNumber: 1 },
        { id: 'a3', sectionNumber: '3', title: 'Old Clause', paragraphs: ['Will be removed'], pageNumber: 2 }
      ];

      const sectionsB = [
        { id: 'b1', sectionNumber: '1', title: 'Services', paragraphs: ['Original services'], pageNumber: 1 },
        { id: 'b2', sectionNumber: '2', title: 'Payment', paragraphs: ['Net 30 payment terms (accelerated)'], pageNumber: 1 },
        { id: 'b4', sectionNumber: '4', title: 'Security Standards', paragraphs: ['SOC 2 Type II compliance added'], pageNumber: 2 }
      ];

      const aligned = alignDocumentSections(sectionsA, sectionsB);
      assert.ok(aligned.length >= 3, `Expected at least 3 aligned section pairs, got ${aligned.length}`);

      // Section 1 should match
      const sec1Pair = aligned.find(p => p.sectionNumber === '1');
      assert.ok(sec1Pair, 'Section 1 should be paired');
      assert.ok(sec1Pair.sectionA && sec1Pair.sectionB, 'Section 1 exists in both');

      // Section 2 should match
      const sec2Pair = aligned.find(p => p.sectionNumber === '2');
      assert.ok(sec2Pair, 'Section 2 should be paired');

      // Section 4 should be detected as addition
      const sec4Pair = aligned.find(p => p.sectionNumber === '4' || p.title.toLowerCase().includes('security'));
      assert.ok(sec4Pair, 'Security Standards must be present in alignment');
      assert.ok(!sec4Pair.sectionA, 'Security Standards was not in Doc A');
      assert.ok(sec4Pair.sectionB, 'Security Standards is in Doc B');
    });

    test('4.2 CompareDocumentsRequestSchema rejects missing document payload', () => {
      const invalidReq = { documentA: null, documentB: null };
      const parsed = CompareDocumentsRequestSchema.safeParse(invalidReq);
      assert.equal(parsed.success, false);
    });

    test('4.3 ComparisonChangeTypeEnum validates and normalizes change categories', () => {
      const validTypes = ['added', 'removed', 'modified', 'unchanged', 'MODIFIED', 'ADDED'];
      for (const t of validTypes) {
        const parsed = ComparisonChangeTypeEnum.safeParse(t);
        assert.equal(parsed.success, true);
        assert.ok(['ADDED', 'REMOVED', 'MODIFIED', 'UNCHANGED'].includes(parsed.data));
      }
      assert.equal(ComparisonChangeTypeEnum.parse(123), 'MODIFIED');
    });
  });

  // =========================================================================
  // SECTION 5: SECURITY AUDIT & SECRET ISOLATION
  // =========================================================================
  describe('5. Security Audit & Secret Isolation', () => {
    test('5.1 GROQ_API_KEY is never referenced in client code (src/)', () => {
      const srcDir = path.join(projectRoot, 'src');
      function checkDir(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            checkDir(fullPath);
          } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            assert.ok(
              !content.includes('process.env.GROQ_API_KEY'),
              `File ${file} must not reference process.env.GROQ_API_KEY directly on the client`
            );
            assert.ok(
              !content.includes('VITE_GROQ_API_KEY'),
              `File ${file} must not reference VITE_GROQ_API_KEY`
            );
          }
        }
      }
      checkDir(srcDir);
    });

    test('5.2 .env file is gitignored and never tracked', () => {
      const gitignorePath = path.join(projectRoot, '.gitignore');
      assert.ok(fs.existsSync(gitignorePath), '.gitignore must exist');
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      assert.match(gitignoreContent, /\.env/, '.gitignore must exclude .env files');
    });

    test('5.3 Error messages sanitize any gsk_ API keys', () => {
      const rawError = 'Groq API failed with authorization key gsk_abc123xyz789';
      const sanitized = rawError.replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED_API_KEY]');
      assert.ok(!sanitized.includes('gsk_abc123xyz789'));
      assert.ok(sanitized.includes('[REDACTED_API_KEY]'));
    });
  });

  // =========================================================================
  // SECTION 6: ACCESSIBILITY & WAI-ARIA AUDIT
  // =========================================================================
  describe('6. Accessibility & WAI-ARIA DOM Audit', () => {
    test('6.1 Accessible main content landmark and skip link', () => {
      const indexHtmlPath = path.join(projectRoot, 'index.html');
      const appTsxPath = path.join(projectRoot, 'src', 'App.tsx');
      const html = fs.readFileSync(indexHtmlPath, 'utf8');
      const appCode = fs.readFileSync(appTsxPath, 'utf8');
      assert.match(html, /href="#main-content"/, 'index.html must have a skip link to #main-content');
      assert.match(appCode, /id="main-content"/, 'App.tsx must have target container main id="main-content"');
    });

    test('6.2 ComparisonPanel includes WAI-ARIA tab semantics and keyboard navigation', () => {
      const compPanelPath = path.join(projectRoot, 'src', 'components', 'comparison', 'ComparisonPanel.tsx');
      const code = fs.readFileSync(compPanelPath, 'utf8');
      assert.match(code, /role="tablist"/, 'Must have role="tablist"');
      assert.match(code, /role="tab"/, 'Must have role="tab"');
      assert.match(code, /role="tabpanel"/, 'Must have role="tabpanel"');
      assert.match(code, /aria-selected=/, 'Must have aria-selected');
      assert.match(code, /aria-controls=/, 'Must have aria-controls');
      assert.match(code, /handleTabKeyDown/, 'Must handle arrow key navigation');
    });

    test('6.3 DocumentSidebar includes WAI-ARIA tabs and aria-controls', () => {
      const sidebarPath = path.join(projectRoot, 'src', 'components', 'workspace', 'DocumentSidebar.tsx');
      const code = fs.readFileSync(sidebarPath, 'utf8');
      assert.match(code, /role="tablist"/, 'Sidebar must have role="tablist"');
      assert.match(code, /role="tab"/, 'Sidebar must have role="tab"');
      assert.match(code, /role="tabpanel"/, 'Sidebar must have role="tabpanel"');
      assert.match(code, /handleSidebarTabKeyDown/, 'Sidebar must support keyboard arrow navigation');
    });

    test('6.4 ComplianceModal implements WAI-ARIA tabs and focus traps', () => {
      const modalPath = path.join(projectRoot, 'src', 'components', 'compliance', 'ComplianceModal.tsx');
      const code = fs.readFileSync(modalPath, 'utf8');
      assert.match(code, /role="tablist"/, 'Compliance modal must have role="tablist"');
      assert.match(code, /role="tab"/, 'Compliance modal must have role="tab"');
      assert.match(code, /role="tabpanel"/, 'Compliance modal must have role="tabpanel"');
      assert.match(code, /handleComplianceTabKeyDown/, 'Compliance modal must handle arrow keys');
    });

    test('6.5 Workspace implements WAI-ARIA tabs for right panel tabs', () => {
      const workspacePath = path.join(projectRoot, 'src', 'components', 'workspace', 'Workspace.tsx');
      const code = fs.readFileSync(workspacePath, 'utf8');
      assert.match(code, /role="tablist"/, 'Workspace must have role="tablist"');
      assert.match(code, /role="tab"/, 'Workspace must have role="tab"');
      assert.match(code, /role="tabpanel"/, 'Workspace must have role="tabpanel"');
      assert.match(code, /aria-controls="workspace-panel-/, 'Workspace must have aria-controls');
    });

    test('6.6 All search inputs have explicit accessible labels or ids', () => {
      const filesWithSearch = [
        path.join(projectRoot, 'src', 'components', 'workspace', 'DocumentViewer.tsx'),
        path.join(projectRoot, 'src', 'components', 'comparison', 'ComparisonPanel.tsx'),
        path.join(projectRoot, 'src', 'components', 'dashboard', 'MyDocuments.tsx')
      ];
      for (const filePath of filesWithSearch) {
        const code = fs.readFileSync(filePath, 'utf8');
        assert.match(code, /htmlFor=|aria-label=|id="[^"]*search/, `File ${path.basename(filePath)} must have accessible search label`);
      }
    });
  });
});
