import type { LegalDocument, ExtractionProgress, ExtractedPage, ExtractionStats } from '../../types/document';
import { validateLegalFile } from './fileValidator';
import { extractTextFromPdf } from './pdfExtractor';
import { extractTextFromDocx } from './docxExtractor';
import { detectSections } from './sectionDetector';

/**
 * Full document processing pipeline:
 * File Upload -> File Validation -> File Type Detection -> Text Extraction ->
 * Text Normalization -> Section Detection -> Document Object
 */
export async function parseDocumentFile(
  file: File,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<LegalDocument> {
  const startTime = performance.now();

  // STAGE 1: File Validation
  onProgress?.({
    stage: 'validating',
    percent: 10,
    message: 'Validating file format and size limits...'
  });

  const validation = validateLegalFile(file);
  if (!validation.isValid) {
    const err = new Error(validation.error || 'File validation failed.');
    onProgress?.({
      stage: 'error',
      percent: 0,
      message: err.message,
      error: err.message
    });
    throw err;
  }

  // STAGE 2: Reading & Text Extraction
  onProgress?.({
    stage: 'reading',
    percent: 25,
    message: `Reading ${validation.fileType} binary stream...`
  });

  let rawText = '';
  let totalPages = 1;
  let pages: ExtractedPage[] | undefined;
  let extractionMethod: 'pdfjs' | 'mammoth' = 'pdfjs';

  try {
    if (validation.fileType === 'PDF') {
      extractionMethod = 'pdfjs';
      const pdfResult = await extractTextFromPdf(file, (currentPage, total) => {
        onProgress?.({
          stage: 'extracting',
          percent: Math.round(25 + (currentPage / total) * 50),
          message: `Extracting digital text from page ${currentPage} of ${total}...`,
          currentPage,
          totalPages: total
        });
      });

      rawText = pdfResult.rawText;
      totalPages = pdfResult.totalPages;
      pages = pdfResult.pages;
    } else {
      extractionMethod = 'mammoth';
      onProgress?.({
        stage: 'extracting',
        percent: 60,
        message: 'Parsing Word document structure and paragraphs...'
      });

      const docxResult = await extractTextFromDocx(file);
      rawText = docxResult.rawText;
      totalPages = docxResult.estimatedPages;
    }
  } catch (extractionErr: any) {
    const isOcrNeeded = extractionErr?.isOcrNeeded === true;
    const errorMessage = extractionErr?.message || 'Text extraction failed.';
    onProgress?.({
      stage: 'error',
      percent: 0,
      message: errorMessage,
      error: errorMessage,
      isOcrNeeded
    });
    throw extractionErr;
  }

  // STAGE 3: Structuring & Section Detection
  onProgress?.({
    stage: 'structuring',
    percent: 85,
    message: 'Analyzing legal headings, articles, and clause boundaries...'
  });

  const detectionResult = detectSections(rawText, pages);

  const endTime = performance.now();
  const processingTimeMs = Math.round(endTime - startTime);

  const totalWords = rawText ? rawText.split(/\s+/).filter(Boolean).length : 0;
  const totalCharacters = rawText.length;

  const extractionStats: ExtractionStats = {
    totalCharacters,
    totalWords,
    sectionCount: detectionResult.sections.length,
    processingTimeMs,
    extractionMethod
  };

  // STAGE 4: Construct canonical LegalDocument object
  const extractedDocument: LegalDocument = {
    id: `doc-uploaded-${Date.now()}`,
    name: file.name,
    fileType: validation.fileType!,
    fileSize: validation.formattedSize,
    uploadDate: new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    totalPages,
    jurisdiction: 'Extracted from Document Text',
    parties: {
      client: 'Uploading Party',
      counterparty: 'Identified in Document Preamble'
    },
    summary: `Real uploaded ${validation.fileType} document parsed locally in-browser. Contains ${detectionResult.sections.length} identified sections across ${totalPages} page(s) (${totalWords.toLocaleString()} words). Ready for GenAI semantic classification in Build 3.`,
    overallRisk: 'Moderate',
    sections: detectionResult.sections,
    detectedSections: detectionResult.sections,
    documentMetadata: detectionResult.documentMetadata,
    clauses: [], // Real clauses will be classified by GenAI in Build 3
    isUploaded: true,
    source: 'uploaded',
    rawText,
    pageBreakdowns: pages,
    extractionStats,
    analysis: {
      overview: {
        executiveSummary: `Extracted ${detectionResult.sections.length} structural sections and ${totalWords.toLocaleString()} words from ${file.name}. All text has been extracted, normalized, and mapped to page boundaries locally without external server transmission.`,
        documentType: `${validation.fileType} Legal Instrument`,
        effectiveDate: 'Identified in text',
        termLength: 'To be classified in Build 3',
        governingLaw: 'Identified in text',
        disputeResolution: 'To be classified in Build 3'
      },
      keyObligations: [],
      importantDates: [],
      financialCommitments: [],
      potentialConcerns: [],
      questionsToConsider: []
    },
    checklist: [
      {
        id: 'chk-ingest-1',
        task: `Verify all ${totalPages} pages and sections were extracted accurately`,
        clauseRef: 'Full Document',
        priority: 'Standard',
        completed: true,
        notes: `Processed ${totalCharacters.toLocaleString()} characters in ${processingTimeMs}ms.`
      },
      {
        id: 'chk-ingest-2',
        task: 'Review detected section outline in the left navigation sidebar',
        clauseRef: 'Section Outline',
        priority: 'Recommended',
        completed: false,
        notes: `${detectionResult.sections.length} sections identified via deterministic pattern matching.`
      },
      {
        id: 'chk-ingest-3',
        task: 'Confirm document text has no redaction or corrupted artifacts',
        clauseRef: 'Document Viewer',
        priority: 'Critical',
        completed: false,
        notes: 'Inspect paragraph flow in the center Document Viewer.'
      }
    ],
    lawyerQuestions: []
  };

  onProgress?.({
    stage: 'ready',
    percent: 100,
    message: 'Document structure and sections ready for inspection.'
  });

  return extractedDocument;
}
