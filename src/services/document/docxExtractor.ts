import mammoth from 'mammoth';

export interface DocxExtractionResult {
  rawText: string;
  paragraphs: string[];
  estimatedPages: number;
}

export async function extractTextFromDocx(file: File): Promise<DocxExtractionResult> {
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch {
    throw new Error('Failed to read DOCX file from local disk. Please check file permissions and try again.');
  }

  try {
    // Support both browser ArrayBuffer and Node buffer environments
    const globalBuffer = (globalThis as any).Buffer;
    const options: any = {
      arrayBuffer,
      buffer: globalBuffer ? globalBuffer.from(arrayBuffer) : undefined
    };

    const result = await mammoth.extractRawText(options);
    const rawText = (result.value || '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    if (!rawText || rawText.length === 0) {
      throw new Error('The DOCX document contains no readable text content.');
    }

    // Split into readable paragraphs preserving legal indentations
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.replace(/[ \t]+/g, ' ').trim())
      .filter((p) => p.length > 0);

    if (paragraphs.length === 0) {
      throw new Error('No paragraphs or legal clauses could be identified in this DOCX file.');
    }

    // Word count estimate: ~350-400 words per standard legal page
    const totalWords = rawText.split(/\s+/).length;
    const estimatedPages = Math.max(1, Math.ceil(totalWords / 380));

    return {
      rawText,
      paragraphs,
      estimatedPages
    };
  } catch (err: any) {
    if (err?.message && err.message.includes('readable text content')) {
      throw err;
    }
    throw new Error(
      'Unable to parse Word (.docx) document. The file may be corrupted, password-protected, or in an older non-standard XML format.'
    );
  }
}
