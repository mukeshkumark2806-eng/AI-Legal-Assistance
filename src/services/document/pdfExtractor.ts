import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { ExtractedPage } from '../../types/document';

// Configure worker for Vite environment
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
}

export interface PdfExtractionResult {
  rawText: string;
  totalPages: number;
  pages: ExtractedPage[];
  isOcrNeeded?: boolean;
}

export async function extractTextFromPdf(
  file: File,
  onPageProgress?: (currentPage: number, totalPages: number) => void
): Promise<PdfExtractionResult> {
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    throw new Error('Failed to read file from local disk. Please check file permissions and try again.');
  }

  let pdfDocument: pdfjsLib.PDFDocumentProxy;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });
    pdfDocument = await loadingTask.promise;
  } catch (err: any) {
    if (err?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected. Please upload an unprotected version of the document.');
    }
    throw new Error('Unable to parse PDF document. The file appears to be corrupted, truncated, or formatted incorrectly.');
  }

  const totalPages = pdfDocument.numPages;
  if (totalPages === 0) {
    throw new Error('The PDF document contains 0 pages.');
  }

  const pages: ExtractedPage[] = [];
  const fullTextParts: string[] = [];
  let totalCharacterCount = 0;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onPageProgress?.(pageNum, totalPages);

    try {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let pageRawText = '';
      let lastY: number | null = null;

      for (const item of textContent.items) {
        if ('str' in item) {
          const str = item.str;
          // Check for line break based on vertical position if available
          if ('transform' in item && Array.isArray(item.transform)) {
            const currentY = item.transform[5];
            if (lastY !== null && Math.abs(currentY - lastY) > 5) {
              pageRawText += '\n';
            }
            lastY = currentY;
          }
          pageRawText += str + (item.hasEOL ? '\n' : ' ');
        }
      }

      // Clean redundant spaces and carriage returns
      const cleanedPageText = pageRawText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      const charCount = cleanedPageText.length;
      const wordCount = cleanedPageText ? cleanedPageText.split(/\s+/).length : 0;
      totalCharacterCount += charCount;

      pages.push({
        pageNumber: pageNum,
        text: cleanedPageText,
        characterCount: charCount,
        wordCount
      });

      if (cleanedPageText) {
        fullTextParts.push(`--- PAGE ${pageNum} ---\n` + cleanedPageText);
      }
    } catch (pageErr) {
      console.warn(`Error extracting text on page ${pageNum}:`, pageErr);
      pages.push({
        pageNumber: pageNum,
        text: '',
        characterCount: 0,
        wordCount: 0
      });
    }
  }

  // Check for scanned / image-only PDFs
  // If the document has pages but total characters are extremely low (< 40 total or < 15 avg per page)
  const averageCharsPerPage = totalCharacterCount / totalPages;
  if (totalCharacterCount < 40 || averageCharsPerPage < 15) {
    const error = new Error(
      'This PDF appears to be a scanned image or contains no selectable digital text. Optical Character Recognition (OCR) will be added in Build 3. Please upload a PDF with selectable text or a DOCX document.'
    );
    (error as any).isOcrNeeded = true;
    throw error;
  }

  const rawText = fullTextParts.join('\n\n');

  return {
    rawText,
    totalPages,
    pages,
    isOcrNeeded: false
  };
}
