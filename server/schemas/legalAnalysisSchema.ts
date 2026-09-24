import { z } from 'zod';

// Raw allowed values
const rawCategories = ['Obligation', 'Payment', 'Termination', 'Deadline', 'Restriction', 'Important'] as const;
const rawImportance = ['Critical', 'High', 'Moderate', 'Standard'] as const;

// Helper to normalize strings to Title Case
function toTitleCase(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Category with tolerant preprocessing
export const ClauseCategoryEnum = z.preprocess((val) => {
  if (typeof val !== 'string') return 'Important';
  const v = toTitleCase(val.trim());
  if ((rawCategories as readonly string[]).includes(v)) return v;
  const lower = val.toLowerCase();
  if (lower.includes('pay') || lower.includes('fee') || lower.includes('cost')) return 'Payment';
  if (lower.includes('terminat') || lower.includes('cancel')) return 'Termination';
  if (lower.includes('date') || lower.includes('dead') || lower.includes('time')) return 'Deadline';
  if (lower.includes('restrict') || lower.includes('prohibit') || lower.includes('liabil')) return 'Restriction';
  if (lower.includes('obligat') || lower.includes('duties')) return 'Obligation';
  return 'Important';
}, z.enum(rawCategories));
export type ClauseCategory = z.infer<typeof ClauseCategoryEnum>;

// Importance with tolerant preprocessing
export const ImportanceLevelEnum = z.preprocess((val) => {
  if (typeof val !== 'string') return 'Standard';
  const v = toTitleCase(val.trim());
  if (v === 'Low') return 'Standard';
  if (v === 'Medium') return 'Moderate';
  if ((rawImportance as readonly string[]).includes(v)) return v;
  const lower = val.toLowerCase();
  if (lower.includes('crit')) return 'Critical';
  if (lower.includes('high')) return 'High';
  if (lower.includes('mod') || lower.includes('med')) return 'Moderate';
  return 'Standard';
}, z.enum(rawImportance));
export type ImportanceLevel = z.infer<typeof ImportanceLevelEnum>;

// Document Overview Schema
export const DocumentOverviewSchema = z.object({
  documentType: z.string().default('Legal Agreement'),
  summary: z.string().describe('Plain English executive summary of the document'),
  effectiveDate: z.string().nullable().default(null).describe('Effective date or "Not specified in document"'),
  term: z.string().nullable().default(null).describe('Term length / duration or "Not specified in document"'),
  governingLaw: z.string().nullable().default(null).describe('Governing law jurisdiction or "Not specified in document"')
});
export type DocumentOverview = z.infer<typeof DocumentOverviewSchema>;

// Individual Clause Schema
export const ClauseSchema = z.object({
  id: z.string(),
  sectionNumber: z.string().describe('Section or article number like "1.2" or "Section 3"'),
  title: z.string().describe('Descriptive clause title'),
  category: ClauseCategoryEnum,
  importance: ImportanceLevelEnum,
  originalText: z.string().describe('Verbatim or faithful original clause text from document'),
  plainEnglish: z.string().describe('Plain English translation for non-lawyers'),
  whyItMatters: z.string().describe('Business or legal significance of this clause'),
  concern: z.string().nullable().default(null).describe('Potential concern or risk note if present, or null'),
  pageNumber: z.number().nullable().default(null).describe('Page number where found, or null'),
  page: z.number().nullable().optional().describe('Alias for page number'),
  sourceText: z.string().describe('Exact source snippet from the document'),
  sourceReference: z.string().optional().describe('Canonical section reference matching authoritative section list')
});
export type Clause = z.infer<typeof ClauseSchema>;

// Key Obligation Schema (normalizes contract party names like Customer, Provider, etc.)
export const KeyObligationSchema = z.object({
  id: z.string(),
  party: z.preprocess((val) => {
    if (typeof val !== 'string') return 'Mutual';
    const lower = val.toLowerCase();
    if (lower.includes('client') || lower.includes('customer') || lower.includes('buyer') || lower.includes('user') || lower.includes('apex')) {
      return 'Client';
    }
    if (lower.includes('counterparty') || lower.includes('provider') || lower.includes('vendor') || lower.includes('seller') || lower.includes('cloudscale')) {
      return 'Counterparty';
    }
    if (lower.includes('mutual') || lower.includes('both') || lower.includes('each') || lower.includes('parties')) {
      return 'Mutual';
    }
    return 'Mutual';
  }, z.enum(['Client', 'Counterparty', 'Mutual'])).default('Mutual'),
  description: z.string().describe('Specific obligation required by the agreement'),
  deadline: z.string().nullable().default(null).describe('Cutoff date/timeframe if applicable, or null'),
  clauseRef: z.string().describe('Reference to the section, e.g. "Section 2.1"'),
  importance: ImportanceLevelEnum.default('Standard')
});
export type KeyObligation = z.infer<typeof KeyObligationSchema>;

// Important Date Schema
export const ImportantDateSchema = z.object({
  id: z.string(),
  title: z.string().describe('Title of the milestone or date event'),
  date: z.string().describe('Date string or relative period like "30 days after signing"'),
  type: z.preprocess((val) => {
    if (typeof val !== 'string') return 'Deadline';
    const v = toTitleCase(val.trim());
    if (['Effective', 'Deadline', 'Renewal', 'Termination'].includes(v)) return v;
    const lower = val.toLowerCase();
    if (lower.includes('effect') || lower.includes('start') || lower.includes('commence')) return 'Effective';
    if (lower.includes('renew')) return 'Renewal';
    if (lower.includes('term') || lower.includes('expir') || lower.includes('end')) return 'Termination';
    return 'Deadline';
  }, z.enum(['Effective', 'Deadline', 'Renewal', 'Termination'])).default('Deadline'),
  clauseRef: z.string().describe('Section reference'),
  isRecurring: z.boolean().default(false),
  description: z.string().describe('Explanation of what happens on this date')
});
export type ImportantDate = z.infer<typeof ImportantDateSchema>;

// Financial Commitment Schema
export const FinancialCommitmentSchema = z.object({
  id: z.string(),
  item: z.string().describe('Fee, payment, deposit, or financial item name'),
  amount: z.string().describe('Monetary figure or formula, e.g. "$10,000/mo" or "Not specified in document"'),
  schedule: z.string().describe('Payment cadence, e.g. "Net 30" or "Upon signing"'),
  clauseRef: z.string().describe('Section reference'),
  penaltyTerms: z.string().nullable().default(null).describe('Late fee, penalty, or interest if specified, or null'),
  importance: ImportanceLevelEnum.default('Moderate')
});
export type FinancialCommitment = z.infer<typeof FinancialCommitmentSchema>;

// Potential Concern Schema
export const PotentialConcernSchema = z.object({
  id: z.string(),
  title: z.string().describe('Short headline of the potential risk or ambiguity'),
  severity: ImportanceLevelEnum.default('Moderate'),
  clauseRef: z.string().describe('Section reference'),
  description: z.string().describe('Factual description of what the clause says that may be disadvantageous'),
  mitigationAdvice: z.string().describe('Neutral suggestion to discuss with counsel or negotiate')
});
export type PotentialConcern = z.infer<typeof PotentialConcernSchema>;

// Action Checklist Item Schema
export const ActionChecklistItemSchema = z.object({
  id: z.string(),
  task: z.string().describe('Concrete actionable task for the user to review before execution'),
  clauseRef: z.string().describe('Section reference'),
  priority: z.preprocess((val) => {
    if (typeof val !== 'string') return 'Standard';
    const v = toTitleCase(val.trim());
    if (['Critical', 'Recommended', 'Standard'].includes(v)) return v;
    const lower = val.toLowerCase();
    if (lower.includes('crit') || lower.includes('high')) return 'Critical';
    if (lower.includes('recom') || lower.includes('med')) return 'Recommended';
    return 'Standard';
  }, z.enum(['Critical', 'Recommended', 'Standard'])).default('Standard'),
  completed: z.boolean().default(false),
  notes: z.string().nullable().default(null).describe('Helpful contextual note or verification hint')
});
export type ActionChecklistItem = z.infer<typeof ActionChecklistItemSchema>;

// Lawyer Question Schema
export const LawyerQuestionSchema = z.object({
  id: z.string(),
  question: z.string().describe('Highly specific question grounded in document content'),
  context: z.string().describe('Relevant text/situation from the document that prompted the question'),
  clauseRef: z.string().describe('Section reference'),
  reason: z.string().describe('Strategic legal reasoning behind asking this specific question')
});
export type LawyerQuestion = z.infer<typeof LawyerQuestionSchema>;

// Full Legal Analysis Response Schema
export const FullLegalAnalysisSchema = z.object({
  documentOverview: DocumentOverviewSchema,
  clauses: z.array(ClauseSchema).default([]),
  keyObligations: z.array(KeyObligationSchema).default([]),
  importantDates: z.array(ImportantDateSchema).default([]),
  financialCommitments: z.array(FinancialCommitmentSchema).default([]),
  potentialConcerns: z.array(PotentialConcernSchema).default([]),
  actionChecklist: z.array(ActionChecklistItemSchema).default([]),
  lawyerQuestions: z.array(LawyerQuestionSchema).default([])
});
export type FullLegalAnalysis = z.infer<typeof FullLegalAnalysisSchema>;

// Input Section Schema for /api/analyze-document
export const InputSectionSchema = z.object({
  id: z.string(),
  sectionNumber: z.union([z.string(), z.number()]).transform(v => String(v)).default(''),
  title: z.string(),
  paragraphs: z.array(z.string()).default([]),
  pageNumber: z.number().optional(),
  page: z.number().optional(),
  text: z.string().optional(),
  sourceReference: z.string().optional()
});
export type InputSection = z.infer<typeof InputSectionSchema>;

// Request Schema for /api/analyze-document
export const AnalyzeDocumentRequestSchema = z.object({
  documentName: z.string().min(1, 'Document name is required'),
  fileType: z.enum(['PDF', 'DOCX']),
  totalPages: z.number().int().positive().default(1),
  rawText: z.string().min(1, 'Document rawText cannot be empty'),
  sections: z.array(InputSectionSchema).min(1, 'At least one document section is required')
});
export type AnalyzeDocumentRequest = z.infer<typeof AnalyzeDocumentRequestSchema>;

// Document Q&A Request & Response Schemas
export const DocumentQuestionRequestSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty'),
  documentName: z.string(),
  rawText: z.string().optional(),
  sections: z.array(InputSectionSchema).min(1, 'Document sections are required')
});
export type DocumentQuestionRequest = z.infer<typeof DocumentQuestionRequestSchema>;

export const CitationSchema = z.object({
  sectionNumber: z.string(),
  title: z.string(),
  clauseRef: z.string().optional(),
  pageNumber: z.number().nullable().optional(),
  sourceSnippet: z.string()
});
export type Citation = z.infer<typeof CitationSchema>;

export const DocumentQuestionResponseSchema = z.object({
  answer: z.string(),
  isFoundInDocument: z.boolean(),
  citations: z.array(CitationSchema).default([]),
  disclaimer: z.string().default('AI-generated informational assistance. This does not replace professional legal advice.')
});
export type DocumentQuestionResponse = z.infer<typeof DocumentQuestionResponseSchema>;
