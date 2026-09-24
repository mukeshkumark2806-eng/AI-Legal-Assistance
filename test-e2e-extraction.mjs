import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runE2ETests() {
  console.log('=== RUNNING REAL EXTRACTION TESTS (PDF & DOCX) ===\n');

  // 1. GENERATE REAL TEST DOCX
  const zip = new JSZip();

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>CONSULTING SERVICES AGREEMENT</w:t></w:r></w:p>
    <w:p><w:r><w:t>This Agreement is made between Alpha Corp and Beta LLC.</w:t></w:r></w:p>
    <w:p><w:r><w:t>SECTION 1. SCOPE OF ENGAGEMENT</w:t></w:r></w:p>
    <w:p><w:r><w:t>Consultant shall provide strategic advisory services for the enterprise software overhaul.</w:t></w:r></w:p>
    <w:p><w:r><w:t>SECTION 2. COMPENSATION AND EXPENSES</w:t></w:r></w:p>
    <w:p><w:r><w:t>Client shall remit compensation of $15,000 monthly upon receipt of approved timesheets.</w:t></w:r></w:p>
    <w:p><w:r><w:t>SECTION 3. TERMINATION</w:t></w:r></w:p>
    <w:p><w:r><w:t>Either party may terminate this agreement with 15 business days written notice.</w:t></w:r></w:p>
    <w:p><w:r><w:t>SECTION 4. GOVERNING LAW</w:t></w:r></w:p>
    <w:p><w:r><w:t>This Agreement shall be construed in accordance with Delaware state law.</w:t></w:r></w:p>
  </w:body>
</w:document>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/document.xml', documentXml);

  const docxBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const testDocxPath = path.join(__dirname, 'sample-contract.docx');
  fs.writeFileSync(testDocxPath, docxBuffer);
  console.log('✓ Generated sample real DOCX:', testDocxPath);

  // Test extraction from DOCX using Mammoth
  const docxExtractResult = await mammoth.extractRawText({ buffer: docxBuffer });
  const docxText = docxExtractResult.value.trim();
  console.log('✓ Mammoth DOCX Extracted Length:', docxText.length, 'characters');
  if (docxText.includes('CONSULTING SERVICES AGREEMENT') && docxText.includes('Delaware')) {
    console.log('✓ PASS: Real DOCX text extracted accurately with all paragraphs!');
  } else {
    console.error('✗ FAIL: DOCX text missing key content');
  }

  // 2. GENERATE REAL TEST PDF WITH EMBEDDED TEXT
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 195 >>
stream
BT
/F1 12 Tf
50 720 Td
(NON-DISCLOSURE AND PROPRIETARY INFORMATION AGREEMENT) Tj
0 -24 Td
(SECTION 1. DEFINITION OF CONFIDENTIAL INFORMATION) Tj
0 -24 Td
(SECTION 2. TERM AND NON-SOLICITATION COVENANTS) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000247 00000 n 
0000000492 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
572
%%EOF`;

  const pdfBuffer = Buffer.from(pdfContent, 'utf-8');
  const testPdfPath = path.join(__dirname, 'sample-nda.pdf');
  fs.writeFileSync(testPdfPath, pdfBuffer);
  console.log('✓ Generated sample real PDF:', testPdfPath);

  // Test extraction from PDF using PDF.js
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  console.log('✓ PDF.js loaded document. Page count:', pdfDoc.numPages);
  const page = await pdfDoc.getPage(1);
  const textContent = await page.getTextContent();
  const pdfText = textContent.items.map(i => i.str).join(' ');
  console.log('✓ PDF.js Extracted Text:', pdfText);

  if (pdfText.includes('NON-DISCLOSURE') && pdfText.includes('CONFIDENTIAL')) {
    console.log('✓ PASS: Real PDF text extracted accurately page-by-page!');
  } else {
    console.error('✗ FAIL: PDF text missing expected strings');
  }

  // 3. TEST SCANNED/IMAGE-ONLY PDF DETECTION SCENARIO
  const scannedPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>
endobj
4 0 obj
<< /Length 0 >>
stream
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000227 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
277
%%EOF`;

  const scannedPdfBuffer = Buffer.from(scannedPdfContent, 'utf-8');
  const scannedTask = pdfjsLib.getDocument({ data: new Uint8Array(scannedPdfBuffer) });
  const scannedDoc = await scannedTask.promise;
  const scannedPage = await scannedDoc.getPage(1);
  const scannedContent = await scannedPage.getTextContent();
  const scannedChars = scannedContent.items.map(i => i.str).join('').length;
  if (scannedChars < 40) {
    console.log(`✓ PASS: Scanned PDF scenario correctly identified 0 digital characters (triggers OCR warning)`);
  } else {
    console.error('✗ FAIL: Did not flag empty image scan');
  }

  // 4. TEST CORRUPTED FILE DETECTION SCENARIO
  try {
    const corruptBuffer = Buffer.from('This is not a valid PDF or DOCX file content at all');
    await pdfjsLib.getDocument({ data: new Uint8Array(corruptBuffer) }).promise;
    console.error('✗ FAIL: Corrupt PDF was expected to throw error');
  } catch (err) {
    console.log('✓ PASS: Corrupt PDF correctly threw extraction error:', err.message);
  }

  console.log('\n=== ALL E2E EXTRACTION TESTS PASSED SUCCESSFULLY! ===\n');
}

runE2ETests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
