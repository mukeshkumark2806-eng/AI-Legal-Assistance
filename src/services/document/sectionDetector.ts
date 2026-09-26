import type { DocumentSection, ExtractedPage, DocumentMetadata } from '../../types/document';

interface DetectedHeading {
  sectionNumber: string;
  title: string;
  matchedPattern: string;
}

// Common legal heading keywords representing valid contractual clauses
const LEGAL_SECTION_KEYWORDS = [
  'PREAMBLE',
  'RECITALS',
  'WITNESSETH',
  'DEFINITIONS',
  'DEFINED TERMS',
  'PARTIES',
  'SCOPE OF SERVICES',
  'SERVICES AND DELIVERABLES',
  'PROVISION OF SERVICES',
  'PERFORMANCE STANDARDS',
  'SERVICE LEVELS',
  'TERM AND TERMINATION',
  'CONTRACT TERM',
  'TERM',
  'TERMINATION',
  'EARLY TERMINATION',
  'FEES AND PAYMENT',
  'PAYMENT TERMS',
  'INVOICING',
  'COMPENSATION',
  'SERVICE PROVIDER OBLIGATIONS',
  'CLIENT OBLIGATIONS',
  'OBLIGATIONS',
  'CONFIDENTIALITY',
  'CONFIDENTIAL INFORMATION',
  'NON-DISCLOSURE',
  'NON-SOLICITATION',
  'NON-COMPETE',
  'INTELLECTUAL PROPERTY',
  'INTELLECTUAL PROPERTY RIGHTS',
  'PROPRIETARY RIGHTS',
  'WORK MADE FOR HIRE',
  'OWNERSHIP OF DELIVERABLES',
  'REPRESENTATIONS AND WARRANTIES',
  'WARRANTIES',
  'INDEMNIFICATION',
  'INDEMNITY',
  'DEFENSE AND INDEMNITY',
  'LIMITATION OF LIABILITY',
  'CONSEQUENTIAL DAMAGES',
  'GOVERNING LAW',
  'GOVERNING LAW AND JURISDICTION',
  'DISPUTE RESOLUTION',
  'ARBITRATION',
  'DATA SECURITY',
  'SECURITY COMPLIANCE',
  'MISCELLANEOUS',
  'GENERAL PROVISIONS',
  'NOTICES',
  'ASSIGNMENT',
  'SEVERABILITY',
  'FORCE MAJEURE',
  'ENTIRE AGREEMENT',
  'SURVIVAL',
  'SIGNATURES',
  'EXECUTION'
];

// Contractual clauses that contain the word "agreement" but are true legal sections
const CONTRACTUAL_AGREEMENT_CLAUSES = [
  'ENTIRE AGREEMENT',
  'TERM OF AGREEMENT',
  'TERMINATION OF AGREEMENT',
  'SCOPE OF AGREEMENT',
  'SUBJECT OF AGREEMENT',
  'PARTIES TO THE AGREEMENT',
  'AMENDMENT OF AGREEMENT',
  'EXECUTION OF AGREEMENT'
];

/**
 * Checks if a string represents an overall document/agreement title rather than a contractual section.
 * Examples: "SERVICE AGREEMENT", "SECTION 1.0: Service Agreement", "MASTER SERVICES AGREEMENT"
 */
export function isAgreementOrDocumentTitle(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();

  // Strip section/article prefixes like "SECTION 1.0:", "Section 1 -", etc.
  const clean = trimmed
    .replace(/^(?:SECTION|ARTICLE|CLAUSE)\s+[0-9IVXLCDM]+(?:\.[0-9]+)*[:.\-\s]+/i, '')
    .replace(/^[:.\-\s]+/, '')
    .replace(/[:.-]+$/, '')
    .trim();

  if (!clean) return false;

  const upper = clean.toUpperCase();

  // If it's a recognized contractual section (like "ENTIRE AGREEMENT"), it's not a document title
  if (CONTRACTUAL_AGREEMENT_CLAUSES.includes(upper)) {
    return false;
  }

  // Common agreement title patterns
  const titlePatterns = [
    /^(?:MASTER\s+)?(?:SERVICES?|SERVICE)\s+AGREEMENT$/i,
    /^(?:MUTUAL\s+)?(?:NON-DISCLOSURE|CONFIDENTIALITY)\s+AGREEMENT$/i,
    /^(?:CONSULTING|CONSULTING\s+SERVICES?)\s+AGREEMENT$/i,
    /^(?:SOFTWARE\s+LICENSE|LICENSE)\s+AGREEMENT$/i,
    /^(?:EMPLOYMENT|SEPARATION|INDEPENDENT\s+CONTRACTOR)\s+AGREEMENT$/i,
    /^(?:COMMERCIAL\s+LEASE|LEASE)\s+AGREEMENT$/i,
    /^STATEMENT\s+OF\s+WORK$/i,
    /^TERMS\s+OF\s+(?:SERVICE|USE)$/i,
    /^MEMORANDUM\s+OF\s+UNDERSTANDING$/i,
    /^LEGAL\s+SERVICES\s+AGREEMENT$/i,
    /^(?:VENDOR|SUPPLIER|CUSTOMER)\s+AGREEMENT$/i,
    /^[A-Z0-9\s,\-'()]+\s+(?:AGREEMENT|CONTRACT|STATEMENT\s+OF\s+WORK)$/i
  ];

  return titlePatterns.some(pattern => pattern.test(clean));
}

/**
 * Checks if a line is a version label (e.g. "Version 1 — Original", "Version 2 — Revised", "v1.0")
 */
export function isVersionLabel(text: string): boolean {
  if (!text) return false;
  const clean = text.trim();
  return (
    /^Version\s+[0-9]+(?:\.[0-9]+)*(?:\s*[\u2013\u2014-]\s*.*)?$/i.test(clean) ||
    /^v(?:er)?\.?\s*[0-9]+(?:\.[0-9]+)*(?:\s*[\u2013\u2014-]\s*.*)?$/i.test(clean) ||
    /^Draft\s+(?:v(?:er)?\.?\s*)?[0-9]+(?:\.[0-9]+)*.*$/i.test(clean)
  );
}

/**
 * Checks if a line is a fictional testing notice or legal disclaimer
 */
export function isTestingOrDisclaimerNotice(text: string): boolean {
  if (!text) return false;
  const clean = text.trim().toLowerCase();
  return (
    clean.includes('fictional testing document') ||
    clean.includes('not a real legal agreement') ||
    clean.includes('not legal advice') ||
    clean.includes('created for legallens') ||
    clean.includes('demonstration and comparison testing') ||
    clean.includes('for demonstration purposes only')
  );
}

/**
 * Checks if a line is a page marker or ingestion header/footer
 */
export function isPageMarkerOrHeader(text: string): boolean {
  if (!text) return false;
  const clean = text.trim();
  return (
    /^---\s*PAGE\s+\d+\s*---$/i.test(clean) ||
    /^Page\s+\d+(?:\s+of\s+\d+)?$/i.test(clean)
  );
}

/**
 * Checks if a trimmed line of text matches contractual legal section heading conventions.
 * Filters out document metadata, agreement titles, version labels, and testing notices.
 */
export function identifyHeading(line: string): DetectedHeading | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 120) return null;

  // Document metadata, version labels, testing notices, and page markers are NOT contractual sections
  if (isVersionLabel(trimmed) || isTestingOrDisclaimerNotice(trimmed) || isPageMarkerOrHeader(trimmed)) {
    return null;
  }
  if (isAgreementOrDocumentTitle(trimmed)) {
    return null;
  }

  // 1. Explicit prefix: "SECTION 1.0", "Section 2: Term", "ARTICLE III - INDEMNIFICATION", "Clause 4.1"
  const prefixRegex = /^(?:SECTION|ARTICLE|CLAUSE|ITEM|PART|SCHEDULE)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)[:.\-\s]+(.+)$/i;
  const prefixMatch = trimmed.match(prefixRegex);
  if (prefixMatch) {
    const rawNumber = prefixMatch[1].trim();
    const rawTitle = prefixMatch[2].replace(/^[:.\-\s]+/, '').trim();

    // If the title after "SECTION 1.0:" is an agreement title (e.g. "SECTION 1.0: Service Agreement"), reject as section
    if (isAgreementOrDocumentTitle(rawTitle)) {
      return null;
    }

    return {
      sectionNumber: rawNumber,
      title: rawTitle || `Section ${rawNumber}`,
      matchedPattern: 'prefix_pattern'
    };
  }

  // Standalone prefix like "SECTION 1" or "ARTICLE IV" without immediate title on same line
  const standalonePrefixRegex = /^(?:SECTION|ARTICLE|CLAUSE)\s+([0-9IVXLCDM]+(?:\.[0-9]+)*)\.?$/i;
  const standaloneMatch = trimmed.match(standalonePrefixRegex);
  if (standaloneMatch) {
    return {
      sectionNumber: standaloneMatch[1].trim(),
      title: `Section ${standaloneMatch[1].trim()}`,
      matchedPattern: 'standalone_prefix'
    };
  }

  // 2. Numbered outline headings: "1. Term and Termination", "1.1 Definitions", "2.0 Payment Obligations"
  const numberedOutlineRegex = /^([0-9]+(?:\.[0-9]+)*)\.?\s+([A-Za-z].+)$/;
  const outlineMatch = trimmed.match(numberedOutlineRegex);
  if (outlineMatch) {
    const num = outlineMatch[1].trim();
    const titleCandidate = outlineMatch[2].trim();

    // Reject agreement title outlines
    if (isAgreementOrDocumentTitle(titleCandidate)) {
      return null;
    }

    // Verify title candidate looks like a heading (e.g. not a long sentence ending in period)
    const isSentence = titleCandidate.length > 80 && titleCandidate.endsWith('.');
    if (!isSentence) {
      return {
        sectionNumber: num,
        title: titleCandidate,
        matchedPattern: 'numbered_outline'
      };
    }
  }

  // 3. Roman Numeral headings: "I. Definitions", "IV. Governing Law"
  const romanRegex = /^([IVXLCDM]+)\.\s+([A-Za-z].+)$/;
  const romanMatch = trimmed.match(romanRegex);
  if (romanMatch) {
    return {
      sectionNumber: romanMatch[1],
      title: romanMatch[2].trim(),
      matchedPattern: 'roman_numeral'
    };
  }

  // 4. Named legal headings: exact match or line matches keyword
  const upper = trimmed.toUpperCase().replace(/[:.-]+$/, '').trim();
  for (const keyword of LEGAL_SECTION_KEYWORDS) {
    if (upper === keyword || upper === `SECTION: ${keyword}` || upper === `ARTICLE: ${keyword}`) {
      return {
        sectionNumber: '',
        title: toTitleCase(keyword),
        matchedPattern: 'legal_keyword'
      };
    }
  }

  // 5. All-caps short line <= 50 characters (e.g. "GENERAL TERMS", "CONFIDENTIALITY")
  if (trimmed.length >= 4 && trimmed.length <= 55 && trimmed === trimmed.toUpperCase()) {
    if (isAgreementOrDocumentTitle(trimmed)) {
      return null;
    }

    const hasLetters = /[A-Z]/.test(trimmed);
    const isNotDate = !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed);
    const isNotSignatureLine = !trimmed.includes('___');
    if (hasLetters && isNotDate && isNotSignatureLine) {
      return {
        sectionNumber: '',
        title: toTitleCase(trimmed),
        matchedPattern: 'all_caps_line'
      };
    }
  }

  return null;
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface SectionDetectionResult {
  sections: DocumentSection[];
  detectedSections: DocumentSection[];
  totalDetected: number;
  documentMetadata: DocumentMetadata;
}

/**
 * Deterministically splits raw text (and optional page breakdowns) into structured contractual legal sections.
 * Excludes document titles, agreement headers, version tags, and testing notices from detected sections.
 */
export function detectSections(
  rawText: string,
  pages?: ExtractedPage[]
): SectionDetectionResult {
  const sections: DocumentSection[] = [];
  const documentMetadata: DocumentMetadata = {
    headerLines: []
  };

  const rawLines = rawText.split('\n');

  let currentSectionNumber: string | null = null;
  let currentTitle: string | null = null;
  let currentParagraphs: string[] = [];
  let currentSectionPage: number | undefined = pages && pages.length > 0 ? 1 : undefined;
  let sectionIndex = 1;
  let hasFoundFirstContractualSection = false;

  const flushCurrentSection = () => {
    if (currentTitle && currentParagraphs.length > 0) {
      // Use actual source contractual number as canonical identifier; do NOT renumber based on array position
      const secNum = currentSectionNumber || '';
      const canonicalId = currentSectionNumber ? `sec-${currentSectionNumber}` : `sec-${sectionIndex}`;
      const srcRef = currentSectionNumber ? `Section ${currentSectionNumber} — ${currentTitle}` : currentTitle;
      const text = currentParagraphs.join('\n\n');

      sections.push({
        id: canonicalId,
        sectionNumber: secNum,
        title: currentTitle,
        pageNumber: currentSectionPage,
        page: currentSectionPage,
        text,
        paragraphs: [...currentParagraphs],
        clauseIds: [],
        sourceReference: srcRef
      });
      sectionIndex++;
      currentParagraphs = [];
    }
  };

  let bufferParagraph = '';
  let currentPageNumber = 1;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();

    // Check if line indicates a page boundary marker from pdfExtractor
    const pageMarkerMatch = line.match(/^--- PAGE (\d+) ---$/);
    if (pageMarkerMatch) {
      currentPageNumber = parseInt(pageMarkerMatch[1], 10);
      continue;
    }

    if (!line) {
      if (bufferParagraph) {
        currentParagraphs.push(bufferParagraph);
        bufferParagraph = '';
      }
      continue;
    }

    // Process document-level metadata / title / headers before the first contractual section starts
    if (!hasFoundFirstContractualSection) {
      if (isAgreementOrDocumentTitle(line)) {
        documentMetadata.documentTitle = line.replace(/^(?:SECTION|ARTICLE)\s+[0-9IVXLCDM]+(?:\.[0-9]+)*[:.\-\s]+/i, '').trim();
        documentMetadata.headerLines.push(line);
        continue;
      }
      if (isVersionLabel(line)) {
        documentMetadata.version = line;
        documentMetadata.headerLines.push(line);
        continue;
      }
      if (isTestingOrDisclaimerNotice(line)) {
        documentMetadata.testingNotice = (documentMetadata.testingNotice ? documentMetadata.testingNotice + ' ' : '') + line;
        documentMetadata.headerLines.push(line);
        continue;
      }
      if (isPageMarkerOrHeader(line)) {
        continue;
      }
    }

    // Check if this line is a contractual legal heading
    const detected = identifyHeading(line);

    if (detected) {
      hasFoundFirstContractualSection = true;

      // Flush any pending paragraph buffer
      if (bufferParagraph) {
        currentParagraphs.push(bufferParagraph);
        bufferParagraph = '';
      }

      // Flush previous contractual section
      flushCurrentSection();

      currentSectionNumber = detected.sectionNumber || null;
      currentTitle = detected.title;
      currentSectionPage = currentPageNumber;
    } else {
      if (!hasFoundFirstContractualSection) {
        // Unidentified preamble line before first contractual section: capture in metadata
        if (isTestingOrDisclaimerNotice(line)) {
          documentMetadata.testingNotice = (documentMetadata.testingNotice ? documentMetadata.testingNotice + ' ' : '') + line;
          documentMetadata.headerLines.push(line);
          continue;
        }
      }

      // Regular contractual paragraph line
      if (bufferParagraph) {
        bufferParagraph += ' ' + line;
      } else {
        bufferParagraph = line;
      }
    }
  }

  // Flush remaining buffer
  if (bufferParagraph) {
    currentParagraphs.push(bufferParagraph);
  }
  flushCurrentSection();

  // Fallback: If no sections were identified (e.g. document with no standard headings),
  // split by pages or paragraph groups so content is cleanly organized
  if (sections.length === 0 || (sections.length === 1 && sections[0].paragraphs.length > 15)) {
    return createFallbackSections(rawText, pages, documentMetadata);
  }

  return {
    sections,
    detectedSections: sections,
    totalDetected: sections.length,
    documentMetadata
  };
}

/**
 * Fallback section creator for unstructured documents.
 */
function createFallbackSections(
  rawText: string,
  pages?: ExtractedPage[],
  metadata?: DocumentMetadata
): SectionDetectionResult {
  const sections: DocumentSection[] = [];
  const docMeta: DocumentMetadata = metadata || { headerLines: [] };

  if (pages && pages.length > 1) {
    pages.forEach((page) => {
      const pageParas = page.text
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (pageParas.length > 0) {
        const title = `Document Content (Page ${page.pageNumber})`;
        const srcRef = `Page ${page.pageNumber} — ${title}`;
        sections.push({
          id: `sec-p${page.pageNumber}`,
          sectionNumber: `${page.pageNumber}`,
          title,
          paragraphs: pageParas,
          clauseIds: [],
          pageNumber: page.pageNumber,
          page: page.pageNumber,
          text: pageParas.join('\n\n'),
          sourceReference: srcRef
        });
      }
    });
  } else {
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const chunkSize = 4;
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      const chunk = paragraphs.slice(i, i + chunkSize);
      const sectionNum = Math.floor(i / chunkSize) + 1;
      const title = `Section ${sectionNum}: General Provisions`;
      const srcRef = `Section ${sectionNum} — ${title}`;
      sections.push({
        id: `sec-chunk-${sectionNum}`,
        sectionNumber: `${sectionNum}`,
        title,
        paragraphs: chunk,
        clauseIds: [],
        pageNumber: 1,
        page: 1,
        text: chunk.join('\n\n'),
        sourceReference: srcRef
      });
    }
  }

  const finalSections = sections.length > 0 ? sections : [
    {
      id: 'sec-fallback-1',
      sectionNumber: '1',
      title: 'Full Document Text',
      paragraphs: [rawText],
      clauseIds: [],
      pageNumber: 1,
      page: 1,
      text: rawText,
      sourceReference: 'Section 1 — Full Document Text'
    }
  ];

  return {
    sections: finalSections,
    detectedSections: finalSections,
    totalDetected: finalSections.length,
    documentMetadata: docMeta
  };
}
