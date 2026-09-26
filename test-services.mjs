import { validateLegalFile } from './src/services/document/fileValidator.ts';
import { identifyHeading, detectSections } from './src/services/document/sectionDetector.ts';

console.log('=== RUNNING TESTS FOR LEGALLENS AI EXTRACTION PIPELINE ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// TEST 1: File Validator - Valid PDF
const mockPdfFile = {
  name: 'NonDisclosureAgreement.pdf',
  size: 1024 * 1024 * 2, // 2MB
  type: 'application/pdf'
};
const pdfVal = validateLegalFile(mockPdfFile);
assert(pdfVal.isValid && pdfVal.fileType === 'PDF', 'Valid PDF passes validation');

// TEST 2: File Validator - Valid DOCX
const mockDocxFile = {
  name: 'EmploymentContract.docx',
  size: 1024 * 500, // 500KB
  type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};
const docxVal = validateLegalFile(mockDocxFile);
assert(docxVal.isValid && docxVal.fileType === 'DOCX', 'Valid DOCX passes validation');

// TEST 3: File Validator - Invalid File Type (.exe)
const mockExeFile = {
  name: 'malware.exe',
  size: 1024 * 100,
  type: 'application/x-msdownload'
};
const exeVal = validateLegalFile(mockExeFile);
assert(!exeVal.isValid && exeVal.error.includes('Unsupported file type'), 'Rejects unsupported file type (.exe)');

// TEST 4: File Validator - Invalid File Type (.txt)
const mockTxtFile = {
  name: 'notes.txt',
  size: 1024 * 10,
  type: 'text/plain'
};
const txtVal = validateLegalFile(mockTxtFile);
assert(!txtVal.isValid && txtVal.error.includes('supports PDF (.pdf) and Word (.docx)'), 'Rejects unsupported plain text file');

// TEST 5: File Validator - Empty Document (0 bytes)
const mockEmptyFile = {
  name: 'EmptyContract.pdf',
  size: 0,
  type: 'application/pdf'
};
const emptyVal = validateLegalFile(mockEmptyFile);
assert(!emptyVal.isValid && emptyVal.error.includes('empty (0 bytes)'), 'Rejects empty 0-byte file');

// TEST 6: File Validator - Oversized Document (> 25 MB)
const mockBigFile = {
  name: 'HugeArchive.pdf',
  size: 30 * 1024 * 1024, // 30 MB
  type: 'application/pdf'
};
const bigVal = validateLegalFile(mockBigFile);
assert(!bigVal.isValid && bigVal.error.includes('exceeds the 25 MB limit'), 'Rejects oversized file > 25MB');

// TEST 7: Section Heading Detector - Numbered Patterns
const h1 = identifyHeading('1. DEFINITIONS');
assert(h1 && h1.sectionNumber === '1' && h1.title.toUpperCase().includes('DEFINITIONS'), 'Identifies "1. DEFINITIONS"');

const h2 = identifyHeading('1.1 Scope of Technical Deliverables');
assert(h2 && h2.sectionNumber === '1.1', 'Identifies "1.1 Scope of Technical Deliverables"');

const h3 = identifyHeading('SECTION 3.0: TERM AND TERMINATION');
assert(h3 && h3.sectionNumber === '3.0' && h3.title.toUpperCase().includes('TERM AND TERMINATION'), 'Identifies "SECTION 3.0: TERM AND TERMINATION"');

const h4 = identifyHeading('ARTICLE IV - GOVERNING LAW AND JURISDICTION');
assert(h4 && h4.sectionNumber === 'IV' && h4.title.toUpperCase().includes('GOVERNING LAW'), 'Identifies "ARTICLE IV - GOVERNING LAW"');

// TEST 8: Section Heading Detector - Legal Keywords
const h5 = identifyHeading('CONFIDENTIALITY');
assert(h5 && h5.title.toUpperCase().includes('CONFIDENTIALITY'), 'Identifies standalone keyword "CONFIDENTIALITY"');

const h6 = identifyHeading('INDEMNIFICATION');
assert(h6 && h6.title.toUpperCase().includes('INDEMNIFICATION'), 'Identifies standalone keyword "INDEMNIFICATION"');

// TEST 9: Section Heading Detector - Non-headings are ignored
const notH1 = identifyHeading('The Client agrees to remit payment within thirty days.');
assert(notH1 === null, 'Ignores long body sentence ending in period');

// TEST 10: Full Document Structure and Section Partitioning
const sampleContractText = `CONFIDENTIAL SERVICES AGREEMENT
This agreement is entered into as of January 1, 2026.

1. SCOPE OF SERVICES
Provider will render technical consulting services in accordance with Schedule A.
Consultant shall dedicate 40 hours per month.

2. COMPENSATION AND PAYMENT
Client will pay $10,000 monthly within 30 days of invoice receipt.
Late payments accrue 1.5% interest per month.

3. TERM AND TERMINATION
This agreement expires on December 31, 2026.
Either party may terminate with 30 days written notice.

4. GOVERNING LAW
This contract is governed by the laws of Delaware.`;

const structured = detectSections(sampleContractText);
assert(structured.sections.length >= 4, `Structured document into ${structured.sections.length} legal sections`);
const sectionTitles = structured.sections.map(s => s.title.toUpperCase());
assert(sectionTitles.some(t => t.includes('SCOPE')), 'Extracted Scope section');
assert(sectionTitles.some(t => t.includes('COMPENSATION') || t.includes('PAYMENT')), 'Extracted Payment section');
assert(sectionTitles.some(t => t.includes('TERMINATION')), 'Extracted Termination section');
assert(sectionTitles.some(t => t.includes('GOVERNING LAW')), 'Extracted Governing Law section');

console.log(`\n=== SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED ===\n`);
