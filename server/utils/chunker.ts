import type { InputSection } from '../schemas/legalAnalysisSchema';

export interface DocumentChunk {
  chunkIndex: number;
  sectionId: string;
  sectionNumber: string;
  sectionTitle: string;
  pageNumber: number | null;
  text: string;
  characterCount: number;
  paragraphCount: number;
}

const MAX_CHUNK_CHARACTERS = 3000;
const CHUNK_OVERLAP_CHARACTERS = 200;

/**
 * Splits detected legal sections into structured, metadata-preserving chunks
 * suitable for LLM context windows without exceeding rate or token limits.
 */
export function chunkDocumentSections(sections: InputSection[]): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const pageNumber = section.pageNumber ?? null;
    const secNum = section.sectionNumber || '';
    const secTitle = section.title || 'Untitled Section';

    // Combine paragraphs
    const paragraphs = section.paragraphs.map(p => p.trim()).filter(Boolean);

    if (paragraphs.length === 0) {
      continue;
    }

    let currentChunkParagraphs: string[] = [];
    let currentLength = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const pLength = p.length;

      // If single paragraph is larger than MAX_CHUNK_CHARACTERS, split by sentences
      if (pLength > MAX_CHUNK_CHARACTERS) {
        // Flush any accumulated paragraphs first
        if (currentChunkParagraphs.length > 0) {
          const text = currentChunkParagraphs.join('\n\n');
          chunks.push({
            chunkIndex: chunkIndex++,
            sectionId: section.id,
            sectionNumber: secNum,
            sectionTitle: secTitle,
            pageNumber,
            text,
            characterCount: text.length,
            paragraphCount: currentChunkParagraphs.length
          });
          currentChunkParagraphs = [];
          currentLength = 0;
        }

        // Split long paragraph into sentence segments
        const sentences = p.match(/[^.!?]+[.!?]+(\s|$)/g) || [p];
        let subSentences: string[] = [];
        let subLength = 0;

        for (const s of sentences) {
          if (subLength + s.length > MAX_CHUNK_CHARACTERS && subSentences.length > 0) {
            const text = subSentences.join(' ').trim();
            chunks.push({
              chunkIndex: chunkIndex++,
              sectionId: section.id,
              sectionNumber: secNum,
              sectionTitle: secTitle,
              pageNumber,
              text,
              characterCount: text.length,
              paragraphCount: 1
            });
            subSentences = [];
            subLength = 0;
          }
          subSentences.push(s);
          subLength += s.length;
        }

        if (subSentences.length > 0) {
          const text = subSentences.join(' ').trim();
          chunks.push({
            chunkIndex: chunkIndex++,
            sectionId: section.id,
            sectionNumber: secNum,
            sectionTitle: secTitle,
            pageNumber,
            text,
            characterCount: text.length,
            paragraphCount: 1
          });
        }
        continue;
      }

      // If adding paragraph exceeds limit, commit current chunk
      if (currentLength + pLength > MAX_CHUNK_CHARACTERS && currentChunkParagraphs.length > 0) {
        const text = currentChunkParagraphs.join('\n\n');
        chunks.push({
          chunkIndex: chunkIndex++,
          sectionId: section.id,
          sectionNumber: secNum,
          sectionTitle: secTitle,
          pageNumber,
          text,
          characterCount: text.length,
          paragraphCount: currentChunkParagraphs.length
        });

        // Small overlap: keep the last paragraph if small
        const lastP = currentChunkParagraphs[currentChunkParagraphs.length - 1];
        if (lastP && lastP.length <= CHUNK_OVERLAP_CHARACTERS) {
          currentChunkParagraphs = [lastP, p];
          currentLength = lastP.length + pLength;
        } else {
          currentChunkParagraphs = [p];
          currentLength = pLength;
        }
      } else {
        currentChunkParagraphs.push(p);
        currentLength += pLength + 2; // account for newlines
      }
    }

    // Flush remaining paragraphs in section
    if (currentChunkParagraphs.length > 0) {
      const text = currentChunkParagraphs.join('\n\n');
      chunks.push({
        chunkIndex: chunkIndex++,
        sectionId: section.id,
        sectionNumber: secNum,
        sectionTitle: secTitle,
        pageNumber,
        text,
        characterCount: text.length,
        paragraphCount: currentChunkParagraphs.length
      });
    }
  }

  return chunks;
}
