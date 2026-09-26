import type {
  LegalDocument,
  Clause,
  DocumentAnalysis,
  ActionChecklistItem,
  LawyerQuestion
} from '../../types/document';

export interface AnalysisStageUpdate {
  stage: string;
  percent: number;
}

export interface GroundedQuestionResult {
  answer: string;
  isFoundInDocument: boolean;
  citations: {
    sectionNumber: string;
    title: string;
    pageNumber?: number | null;
    sourceSnippet: string;
  }[];
  disclaimer: string;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

// In-memory frontend cache for current session to prevent redundant API calls
const sessionAnalysisCache = new Map<string, any>();

/**
 * Health check to verify backend server is running and Groq key is configured.
 */
export async function checkBackendHealth(): Promise<{
  isOnline: boolean;
  hasApiKey: boolean;
  model?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) {
      return { isOnline: false, hasApiKey: false, error: `Backend returned status ${res.status}` };
    }

    const data = await res.json();
    return {
      isOnline: true,
      hasApiKey: Boolean(data.hasApiKey),
      model: data.model
    };
  } catch {
    return {
      isOnline: false,
      hasApiKey: false,
      error: 'Backend server is not reachable. Ensure the server is running on port 3001.'
    };
  }
}

/**
 * Send structured extracted document to the backend Groq pipeline.
 */
export async function analyzeDocumentWithAi(
  doc: LegalDocument,
  onProgress?: (update: AnalysisStageUpdate) => void
): Promise<LegalDocument> {
  const cacheKey = `${doc.name}-${doc.rawText?.length || 0}-${doc.sections.length}`;

  // Check in-memory session cache first
  if (sessionAnalysisCache.has(cacheKey)) {
    onProgress?.({ stage: 'Loading analysis from session cache...', percent: 100 });
    const cachedAnalysis = sessionAnalysisCache.get(cacheKey);
    return applyAnalysisToDocument(doc, cachedAnalysis);
  }

  // Realistic stage progression
  onProgress?.({ stage: 'Connecting to LegalLens pipeline...', percent: 15 });

  // Input sections with verified canonical metadata
  const inputSections = doc.sections.map((s) => ({
    id: s.id,
    sectionNumber: s.sectionNumber || '',
    title: s.title || 'Untitled Section',
    paragraphs: s.paragraphs,
    pageNumber: s.pageNumber,
    page: s.page !== undefined ? s.page : s.pageNumber,
    text: s.text || s.paragraphs.join('\n\n'),
    sourceReference: s.sourceReference || (s.sectionNumber ? `Section ${s.sectionNumber} — ${s.title}` : s.title)
  }));

  if (!doc.rawText || doc.rawText.trim().length === 0) {
    throw new ApiError('Document raw text is empty. Cannot perform analysis.', 'EMPTY_DOCUMENT', 400);
  }

  const payload = {
    documentName: doc.name,
    fileType: doc.fileType,
    totalPages: doc.totalPages,
    rawText: doc.rawText,
    sections: inputSections
  };

  // Intermediate state notifications
  const stageTimer1 = setTimeout(() => {
    onProgress?.({ stage: 'Analyzing clauses & risk language...', percent: 35 });
  }, 600);

  const stageTimer2 = setTimeout(() => {
    onProgress?.({ stage: 'Identifying obligations & payment terms...', percent: 60 });
  }, 1400);

  const stageTimer3 = setTimeout(() => {
    onProgress?.({ stage: 'Compiling action checklist & lawyer inquiries...', percent: 85 });
  }, 2200);

  try {
    const res = await fetch('/api/analyze-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    clearTimeout(stageTimer1);
    clearTimeout(stageTimer2);
    clearTimeout(stageTimer3);

    if (!res.ok) {
      let errorData: any;
      try {
        errorData = await res.json();
      } catch {
        errorData = { error: `Server error (${res.status} ${res.statusText})` };
      }

      if (res.status === 503 && errorData.code === 'MISSING_API_KEY') {
        throw new ApiError(
          'GROQ_API_KEY is not configured in .env. Please set GROQ_API_KEY to enable live GenAI analysis.',
          'MISSING_API_KEY',
          503
        );
      }
      if (res.status === 429) {
        throw new ApiError(
          'Groq API rate limit reached. Please wait a moment and try again.',
          'RATE_LIMIT',
          429
        );
      }
      if (res.status === 413) {
        throw new ApiError(
          'Document is too large for the current model context window.',
          'DOCUMENT_TOO_LARGE',
          413
        );
      }

      throw new ApiError(
        errorData.error || errorData.details?.join(', ') || 'Failed to analyze document with Groq.',
        errorData.code || 'API_ERROR',
        res.status
      );
    }

    const data = await res.json();
    if (!data.success || !data.analysis) {
      throw new ApiError('Received invalid analysis payload from server.', 'INVALID_RESPONSE', 502);
    }

    onProgress?.({ stage: 'Analysis verified and ready!', percent: 100 });

    // Store in session cache
    sessionAnalysisCache.set(cacheKey, data.analysis);

    return applyAnalysisToDocument(doc, data.analysis);
  } catch (err: any) {
    clearTimeout(stageTimer1);
    clearTimeout(stageTimer2);
    clearTimeout(stageTimer3);

    if (err instanceof ApiError) {
      throw err;
    }

    // Network / connection failure
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new ApiError(
        'Cannot connect to LegalLens backend. Please verify that the backend server is running.',
        'BACKEND_UNAVAILABLE',
        503
      );
    }

    throw new ApiError(err.message || 'An unexpected error occurred during document analysis.', 'UNKNOWN_ERROR', 500);
  }
}

/**
 * Ask a grounded question against the document text via Groq.
 */
export async function askDocumentQuestion(
  question: string,
  doc: LegalDocument
): Promise<GroundedQuestionResult> {
  const inputSections = doc.sections.map((s) => ({
    id: s.id,
    sectionNumber: s.sectionNumber || '',
    title: s.title,
    paragraphs: s.paragraphs,
    pageNumber: s.pageNumber,
    page: s.page !== undefined ? s.page : s.pageNumber,
    text: s.text || s.paragraphs.join('\n\n'),
    sourceReference: s.sourceReference || (s.sectionNumber ? `Section ${s.sectionNumber} — ${s.title}` : s.title)
  }));

  const payload = {
    question,
    documentName: doc.name,
    rawText: doc.rawText,
    sections: inputSections
  };

  try {
    const res = await fetch('/api/document-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let errData: any;
      try {
        errData = await res.json();
      } catch {
        errData = { error: 'Failed to process question' };
      }
      throw new ApiError(
        errData.error || 'Failed to obtain answer from document inquisitor.',
        errData.code || 'QA_ERROR',
        res.status
      );
    }

    const data = await res.json();
    return {
      answer: data.answer,
      isFoundInDocument: Boolean(data.isFoundInDocument),
      citations: Array.isArray(data.citations) ? data.citations : [],
      disclaimer: data.disclaimer || 'AI-generated informational assistance. This does not replace professional legal advice.'
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err.message || 'Error communicating with document question service.',
      'NETWORK_ERROR',
      500
    );
  }
}

/**
 * Merges raw AI analysis output into canonical LegalDocument data structures.
 */
function applyAnalysisToDocument(doc: LegalDocument, rawAnalysis: any): LegalDocument {
  // Map AI clauses to Canonical Clause type and attach them to corresponding sections
  const mappedClauses: Clause[] = (rawAnalysis.clauses || []).map((c: any, index: number) => {
    // Match against authoritative sections by sourceReference, sectionNumber, or exact title
    const cSecNum = c.sectionNumber ? String(c.sectionNumber).trim() : '';
    const cSrcRef = (c.sourceReference || c.clauseRef || '').trim().toLowerCase();

    // Extract numerical section if present
    const numMatch = (c.sourceReference || c.clauseRef || cSecNum).match(/(?:Section|Sec\.?|Clause|Art\.?|Article)?\s*(\d+(?:\.\d+)*)/i);
    const targetNum = numMatch ? numMatch[1] : cSecNum;

    const matchSec = doc.sections.find((s) => {
      if (s.sourceReference && cSrcRef && s.sourceReference.toLowerCase().trim() === cSrcRef) return true;
      if (s.sectionNumber && cSecNum && String(s.sectionNumber).trim() === cSecNum) return true;
      if (targetNum && s.sectionNumber && (String(s.sectionNumber).trim() === targetNum || String(s.sectionNumber).trim() === `${targetNum}.0` || `${String(s.sectionNumber).trim()}.0` === targetNum)) return true;
      if (s.title && c.title && s.title.trim().toLowerCase() === c.title.trim().toLowerCase()) return true;
      return false;
    });

    const pageNum = c.pageNumber || matchSec?.page || matchSec?.pageNumber || 1;
    const secNum = matchSec?.sectionNumber || c.sectionNumber || `${index + 1}`;
    const srcRef = matchSec?.sourceReference || c.sourceReference || (secNum ? `Section ${secNum} — ${c.title || matchSec?.title}` : c.title);

    return {
      id: c.id || `clause-${index + 1}`,
      sectionNumber: secNum,
      title: c.title || matchSec?.title || 'Extracted Clause',
      category: c.category || 'Important',
      importance: c.importance || 'Moderate',
      originalText: c.originalText || c.sourceText || '',
      plainEnglishExplanation: c.plainEnglish || c.plainEnglishExplanation || '',
      pageNumber: pageNum,
      page: pageNum,
      riskNote: c.concern || undefined,
      whyItMatters: c.whyItMatters || undefined,
      sourceText: c.sourceText || c.originalText || '',
      sourceReference: srcRef
    };
  });

  // Link clauses to sections using canonical IDs and section numbers
  const updatedSections = doc.sections.map((sec) => {
    const matchingClauseIds = mappedClauses
      .filter((c) => {
        if (sec.sectionNumber && c.sectionNumber && String(sec.sectionNumber).trim() === String(c.sectionNumber).trim()) {
          return true;
        }
        if (sec.sourceReference && c.sourceReference && sec.sourceReference.trim().toLowerCase() === c.sourceReference.trim().toLowerCase()) {
          return true;
        }
        if (sec.title && c.title && sec.title.trim().toLowerCase() === c.title.trim().toLowerCase()) {
          return true;
        }
        return false;
      })
      .map((c) => c.id);

    return {
      ...sec,
      clauseIds: [...new Set([...sec.clauseIds, ...matchingClauseIds])]
    };
  });

  // Structured Analysis Object
  const documentAnalysis: DocumentAnalysis = {
    overview: {
      executiveSummary: rawAnalysis.documentOverview?.summary || doc.summary,
      documentType: rawAnalysis.documentOverview?.documentType || `${doc.fileType} Contract`,
      effectiveDate: rawAnalysis.documentOverview?.effectiveDate || 'Not specified in document',
      termLength: rawAnalysis.documentOverview?.term || 'Not specified in document',
      governingLaw: rawAnalysis.documentOverview?.governingLaw || 'Not specified in document',
      disputeResolution: 'As specified in document'
    },
    keyObligations: (rawAnalysis.keyObligations || []).map((o: any, idx: number) => ({
      id: o.id || `ob-${idx + 1}`,
      party: o.party || 'Mutual',
      description: o.description,
      deadline: o.deadline || undefined,
      clauseRef: o.clauseRef || 'Document Body',
      importance: o.importance || 'Standard'
    })),
    importantDates: (rawAnalysis.importantDates || []).map((d: any, idx: number) => ({
      id: d.id || `date-${idx + 1}`,
      title: d.title,
      date: d.date,
      type: d.type || 'Deadline',
      clauseRef: d.clauseRef || 'Document Body',
      isRecurring: Boolean(d.isRecurring),
      description: d.description
    })),
    financialCommitments: (rawAnalysis.financialCommitments || []).map((f: any, idx: number) => ({
      id: f.id || `fin-${idx + 1}`,
      item: f.item,
      amount: f.amount,
      schedule: f.schedule,
      clauseRef: f.clauseRef || 'Document Body',
      penaltyTerms: f.penaltyTerms || undefined,
      importance: f.importance || 'Moderate'
    })),
    potentialConcerns: (rawAnalysis.potentialConcerns || []).map((p: any, idx: number) => ({
      id: p.id || `concern-${idx + 1}`,
      title: p.title,
      severity: p.severity || 'Moderate',
      clauseRef: p.clauseRef || 'Document Body',
      description: p.description,
      mitigationAdvice: p.mitigationAdvice
    })),
    questionsToConsider: (rawAnalysis.lawyerQuestions || []).map((q: any, idx: number) => ({
      id: q.id || `qc-${idx + 1}`,
      question: q.question,
      category: 'Legal Review',
      clauseRef: q.clauseRef,
      rationale: q.reason
    }))
  };

  // Action Checklist
  const checklist: ActionChecklistItem[] = (rawAnalysis.actionChecklist || []).map(
    (a: any, idx: number) => ({
      id: a.id || `chk-ai-${idx + 1}`,
      task: a.task,
      clauseRef: a.clauseRef || 'Document Section',
      priority: a.priority || 'Standard',
      completed: false,
      notes: a.notes || undefined
    })
  );

  // Lawyer Questions
  const lawyerQuestions: LawyerQuestion[] = (rawAnalysis.lawyerQuestions || []).map(
    (q: any, idx: number) => ({
      id: q.id || `lq-ai-${idx + 1}`,
      question: q.question,
      context: q.context || 'Identified in agreement text',
      clauseRef: q.clauseRef || 'Document Section',
      reason: q.reason || 'Recommended topic for legal counsel clarification'
    })
  );

  return {
    ...doc,
    clauses: mappedClauses,
    sections: updatedSections,
    analysis: documentAnalysis,
    checklist: checklist.length > 0 ? checklist : doc.checklist,
    lawyerQuestions: lawyerQuestions.length > 0 ? lawyerQuestions : doc.lawyerQuestions,
    isAiAnalyzed: true,
    aiModelUsed: 'Groq (openai/gpt-oss-20b)'
  };
}
