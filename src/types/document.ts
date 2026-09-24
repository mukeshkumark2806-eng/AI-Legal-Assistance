export type ClauseCategory = 
  | 'Obligation' 
  | 'Payment' 
  | 'Termination' 
  | 'Deadline' 
  | 'Restriction' 
  | 'Important';

export type ImportanceLevel = 'Low' | 'Medium' | 'High' | 'Critical' | 'Moderate' | 'Standard';

export interface Clause {
  id: string;
  sectionNumber: string;
  title: string;
  category: ClauseCategory;
  importance: ImportanceLevel;
  originalText: string;
  plainEnglishExplanation: string;
  pageNumber: number;
  riskNote?: string;
  whyItMatters?: string;
  sourceText?: string;
  concern?: string | null;
  sourceReference?: string;
}

export interface DocumentMetadata {
  documentTitle?: string;
  version?: string;
  testingNotice?: string;
  headerLines: string[];
  preamble?: string;
}

export interface DocumentSection {
  id: string;
  sectionNumber: string;
  title: string;
  paragraphs: string[];
  clauseIds: string[];
  pageNumber?: number; // Preserved page boundary when available (PDF)
  page?: number;       // Canonical alias matching { page: 1 }
  text?: string;       // Joined textual content of the section
  sourceReference?: string; // Canonical source reference, e.g. "Section 4 — Payment Terms"
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  characterCount: number;
  wordCount: number;
}

export interface ExtractionStats {
  totalCharacters: number;
  totalWords: number;
  sectionCount: number;
  processingTimeMs: number;
  extractionMethod: 'pdfjs' | 'mammoth';
  isOcrNeeded?: boolean;
}

export type ExtractionStage = 
  | 'idle'
  | 'validating' 
  | 'reading' 
  | 'extracting' 
  | 'structuring' 
  | 'ready' 
  | 'error';

export interface ExtractionProgress {
  stage: ExtractionStage;
  percent: number;
  message: string;
  currentPage?: number;
  totalPages?: number;
  error?: string;
  isOcrNeeded?: boolean;
}

export interface LegalDocument {
  id: string;
  name: string;
  fileType: 'PDF' | 'DOCX';
  fileSize: string;
  uploadDate: string;
  totalPages: number;
  jurisdiction: string;
  parties: {
    client: string;
    counterparty: string;
  };
  summary: string;
  overallRisk: 'Low' | 'Moderate' | 'High';
  sections: DocumentSection[];
  detectedSections?: DocumentSection[];
  clauses: Clause[];
  analysis: DocumentAnalysis;
  checklist: ActionChecklistItem[];
  lawyerQuestions: LawyerQuestion[];
  documentMetadata?: DocumentMetadata;
  // Build 2 Ingestion fields
  isUploaded?: boolean;
  source?: 'sample' | 'uploaded';
  rawText?: string;
  pageBreakdowns?: ExtractedPage[];
  extractionStats?: ExtractionStats;
  // Build 3 GenAI fields
  isAiAnalyzed?: boolean;
  aiModelUsed?: string;
}

export interface DocumentAnalysis {
  overview: {
    executiveSummary: string;
    documentType: string;
    effectiveDate: string;
    termLength: string;
    governingLaw: string;
    disputeResolution: string;
  };
  keyObligations: {
    id: string;
    party: 'Client' | 'Counterparty' | 'Mutual';
    description: string;
    deadline?: string;
    clauseRef: string;
    importance: ImportanceLevel;
  }[];
  importantDates: {
    id: string;
    title: string;
    date: string;
    type: 'Effective' | 'Deadline' | 'Renewal' | 'Termination';
    clauseRef: string;
    isRecurring?: boolean;
    description: string;
  }[];
  financialCommitments: {
    id: string;
    item: string;
    amount: string;
    schedule: string;
    clauseRef: string;
    penaltyTerms?: string;
    importance: ImportanceLevel;
  }[];
  potentialConcerns: {
    id: string;
    title: string;
    severity: ImportanceLevel;
    clauseRef: string;
    description: string;
    mitigationAdvice: string;
  }[];
  questionsToConsider: {
    id: string;
    question: string;
    category: string;
    clauseRef?: string;
    rationale: string;
  }[];
}

export interface ActionChecklistItem {
  id: string;
  task: string;
  clauseRef: string;
  priority: 'Critical' | 'Recommended' | 'Standard';
  completed: boolean;
  notes?: string;
}

export interface LawyerQuestion {
  id: string;
  question: string;
  context: string;
  clauseRef: string;
  reason: string;
}

export type ComparisonChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface ComparisonChange {
  id: string;
  sectionNumber: string;
  title: string;
  type: ComparisonChangeType;
  importance: ImportanceLevel;
  originalSnippet?: string;
  newSnippet?: string;
  summary: string;
  legalImpact: string;
}

export interface ComparisonData {
  originalDoc: {
    name: string;
    version: string;
    date: string;
    size: string;
  };
  newDoc: {
    name: string;
    version: string;
    date: string;
    size: string;
  };
  summary: {
    totalChanges: number;
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
    unchangedCount: number;
  };
  changes: ComparisonChange[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: {
    clauseRef: string;
    title: string;
    pageNumber?: number | null;
    sourceSnippet?: string;
    sectionNumber?: string;
  }[];
  isFoundInDocument?: boolean;
}
