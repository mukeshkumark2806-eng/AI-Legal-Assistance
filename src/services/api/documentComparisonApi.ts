import type { LegalDocument } from '../../types/document';
import { ApiError } from './legalAnalysisApi';

export type ComparisonChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';

export type ComparisonCategory =
  | 'PAYMENT'
  | 'TERMINATION'
  | 'LIABILITY'
  | 'CONFIDENTIALITY'
  | 'OBLIGATION'
  | 'DEADLINE'
  | 'RESTRICTION'
  | 'GOVERNING_LAW'
  | 'RENEWAL'
  | 'GENERAL';

export type ComparisonSeverity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFORMATIONAL';

export interface ComparisonClauseChange {
  id: string;
  changeType: ComparisonChangeType;
  category: ComparisonCategory;
  severity: ComparisonSeverity;
  sectionNumber: string;
  sectionTitle: string;
  oldText: string | null;
  newText: string | null;
  explanation: string;
  whyItMatters: string;
  legalImpact: string;
  actionRequired: string | null;
  pageNumberA: number | null;
  pageNumberB: number | null;
  sourceA: string | null;
  sourceB: string | null;
}

export interface ComparisonSummary {
  totalChanges: number;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  unchangedCount: number;
  executiveSummary: string;
}

export interface KeyChange {
  id: string;
  title: string;
  description: string;
  category: ComparisonCategory;
  severity: ComparisonSeverity;
  clauseRef: string;
}

export interface RiskChange {
  id: string;
  title: string;
  description: string;
  severity: ComparisonSeverity;
  clauseRef: string;
  mitigation: string;
}

export interface ChangedObligation {
  party: 'Client' | 'Counterparty' | 'Mutual';
  oldObligation: string | null;
  newObligation: string | null;
  impact: string;
  clauseRef: string;
}

export interface ChangedDeadline {
  title: string;
  oldDeadline: string | null;
  newDeadline: string | null;
  impact: string;
  clauseRef: string;
}

export interface ChangedFinancialTerm {
  item: string;
  oldValue: string | null;
  newValue: string | null;
  impact: string;
  clauseRef: string;
}

export interface ComparisonActionItem {
  id: string;
  task: string;
  clauseRef: string;
  priority: 'Critical' | 'Recommended' | 'Standard';
  completed: boolean;
  notes?: string | null;
}

export interface ComparisonLawyerQuestion {
  id: string;
  question: string;
  context: string;
  clauseRef: string;
  reason: string;
}

export interface FullComparisonResult {
  documentA: {
    fileName: string;
    documentType: string;
    fileSize?: string;
    totalPages?: number;
  };
  documentB: {
    fileName: string;
    documentType: string;
    fileSize?: string;
    totalPages?: number;
  };
  summary: ComparisonSummary;
  changes: ComparisonClauseChange[];
  keyChanges: KeyChange[];
  riskChanges: RiskChange[];
  changedObligations: ChangedObligation[];
  changedDeadlines: ChangedDeadline[];
  changedFinancialTerms: ChangedFinancialTerm[];
  actionChecklist: ComparisonActionItem[];
  lawyerQuestions: ComparisonLawyerQuestion[];
  disclaimer: string;
}

export interface ComparisonStageUpdate {
  stage: string;
  percent: number;
}

// In-memory cache across user session for duplicate comparisons
const comparisonCache = new Map<string, FullComparisonResult>();

export async function compareDocumentsWithAi(
  docA: LegalDocument,
  docB: LegalDocument,
  onProgress?: (update: ComparisonStageUpdate) => void
): Promise<FullComparisonResult> {
  const cacheKey = `${docA.name}_${docA.rawText?.length || 0}_vs_${docB.name}_${docB.rawText?.length || 0}`;

  if (comparisonCache.has(cacheKey)) {
    onProgress?.({ stage: 'Loading comparison from session cache...', percent: 100 });
    return comparisonCache.get(cacheKey)!;
  }

  if (!docA.rawText || docA.rawText.trim().length === 0) {
    throw new ApiError('Document A has no extractable text.', 'EMPTY_DOC_A', 400);
  }
  if (!docB.rawText || docB.rawText.trim().length === 0) {
    throw new ApiError('Document B has no extractable text.', 'EMPTY_DOC_B', 400);
  }

  onProgress?.({ stage: 'Reading Document A (Baseline)...', percent: 10 });

  const inputSectionsA = docA.sections.map((s) => ({
    id: s.id,
    sectionNumber: s.sectionNumber || '',
    title: s.title || 'Untitled Section',
    paragraphs: s.paragraphs,
    pageNumber: s.pageNumber
  }));

  const inputSectionsB = docB.sections.map((s) => ({
    id: s.id,
    sectionNumber: s.sectionNumber || '',
    title: s.title || 'Untitled Section',
    paragraphs: s.paragraphs,
    pageNumber: s.pageNumber
  }));

  const payload = {
    documentA: {
      name: docA.name,
      fileType: docA.fileType,
      fileSize: docA.fileSize,
      totalPages: docA.totalPages || 1,
      rawText: docA.rawText,
      sections: inputSectionsA
    },
    documentB: {
      name: docB.name,
      fileType: docB.fileType,
      fileSize: docB.fileSize,
      totalPages: docB.totalPages || 1,
      rawText: docB.rawText,
      sections: inputSectionsB
    }
  };

  // Intermediate state progression timers
  const timer1 = setTimeout(() => {
    onProgress?.({ stage: 'Reading Document B (Revised)...', percent: 25 });
  }, 400);

  const timer2 = setTimeout(() => {
    onProgress?.({ stage: 'Aligning & matching corresponding legal sections...', percent: 45 });
  }, 1200);

  const timer3 = setTimeout(() => {
    onProgress?.({ stage: 'Comparing clauses & detecting legal deltas...', percent: 65 });
  }, 2200);

  const timer4 = setTimeout(() => {
    onProgress?.({ stage: 'Identifying material changes & risk shifts...', percent: 85 });
  }, 3500);

  try {
    const res = await fetch('/api/compare-documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    clearTimeout(timer1);
    clearTimeout(timer2);
    clearTimeout(timer3);
    clearTimeout(timer4);

    if (!res.ok) {
      let errMessage = `Document comparison failed with status ${res.status}`;
      let errCode = 'SERVER_ERROR';

      try {
        const errJson = await res.json();
        if (errJson.error) errMessage = errJson.error;
        if (errJson.code) errCode = errJson.code;
      } catch {
        // use default message
      }

      throw new ApiError(errMessage, errCode, res.status);
    }

    const data = await res.json();
    if (!data.success || !data.comparison) {
      throw new ApiError('Backend returned an invalid comparison response.', 'INVALID_RESPONSE', 500);
    }

    onProgress?.({ stage: 'Finalizing redline comparison report...', percent: 98 });

    const result = data.comparison as FullComparisonResult;
    comparisonCache.set(cacheKey, result);

    onProgress?.({ stage: 'Comparison ready!', percent: 100 });
    return result;
  } catch (err: any) {
    clearTimeout(timer1);
    clearTimeout(timer2);
    clearTimeout(timer3);
    clearTimeout(timer4);

    if (err instanceof ApiError) {
      throw err;
    }

    console.error('Comparison API error:', err);
    throw new ApiError(
      err.message || 'Unable to connect to LegalLens AI comparison server.',
      'NETWORK_ERROR',
      503
    );
  }
}
