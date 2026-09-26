import { z } from 'zod';
import { InputSectionSchema } from './legalAnalysisSchema.ts';

// Enums with case-tolerant preprocessing
export const ComparisonChangeTypeEnum = z.preprocess((val) => {
  if (typeof val !== 'string') return 'MODIFIED';
  const u = val.trim().toUpperCase();
  if (['ADDED', 'REMOVED', 'MODIFIED', 'UNCHANGED'].includes(u)) return u;
  if (u.includes('ADD') || u.includes('INSERT')) return 'ADDED';
  if (u.includes('REM') || u.includes('DEL')) return 'REMOVED';
  if (u.includes('MOD') || u.includes('CHG') || u.includes('EDIT')) return 'MODIFIED';
  if (u.includes('SAME') || u.includes('UNCH')) return 'UNCHANGED';
  return 'MODIFIED';
}, z.enum(['ADDED', 'REMOVED', 'MODIFIED', 'UNCHANGED']));
export type ComparisonChangeType = z.infer<typeof ComparisonChangeTypeEnum>;

export const ComparisonCategoryEnum = z.preprocess((val) => {
  if (typeof val !== 'string') return 'GENERAL';
  const u = val.trim().toUpperCase();
  const valid = [
    'PAYMENT',
    'TERMINATION',
    'LIABILITY',
    'CONFIDENTIALITY',
    'OBLIGATION',
    'DEADLINE',
    'RESTRICTION',
    'GOVERNING_LAW',
    'RENEWAL',
    'GENERAL'
  ];
  if (valid.includes(u)) return u;
  if (u.includes('PAY') || u.includes('FEE') || u.includes('COMP')) return 'PAYMENT';
  if (u.includes('TERM') || u.includes('CANCEL')) return 'TERMINATION';
  if (u.includes('LIAB') || u.includes('INDEMN') || u.includes('DAMAG')) return 'LIABILITY';
  if (u.includes('CONFID') || u.includes('SECRET') || u.includes('NDA')) return 'CONFIDENTIALITY';
  if (u.includes('DEAD') || u.includes('DATE') || u.includes('TIME')) return 'DEADLINE';
  if (u.includes('REST') || u.includes('PROHIB')) return 'RESTRICTION';
  if (u.includes('LAW') || u.includes('JURIS') || u.includes('DISP')) return 'GOVERNING_LAW';
  if (u.includes('RENEW')) return 'RENEWAL';
  if (u.includes('OBLIG') || u.includes('DUTY') || u.includes('RESP')) return 'OBLIGATION';
  return 'GENERAL';
}, z.enum([
  'PAYMENT',
  'TERMINATION',
  'LIABILITY',
  'CONFIDENTIALITY',
  'OBLIGATION',
  'DEADLINE',
  'RESTRICTION',
  'GOVERNING_LAW',
  'RENEWAL',
  'GENERAL'
]));
export type ComparisonCategory = z.infer<typeof ComparisonCategoryEnum>;

export const ComparisonSeverityEnum = z.preprocess((val) => {
  if (typeof val !== 'string') return 'MODERATE';
  const u = val.trim().toUpperCase();
  const valid = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'INFORMATIONAL'];
  if (valid.includes(u)) return u;
  if (u.includes('CRIT')) return 'CRITICAL';
  if (u.includes('HIGH')) return 'HIGH';
  if (u.includes('MOD') || u.includes('MED')) return 'MODERATE';
  if (u.includes('LOW')) return 'LOW';
  if (u.includes('INFO') || u.includes('NOTE') || u.includes('STAN')) return 'INFORMATIONAL';
  return 'MODERATE';
}, z.enum(['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'INFORMATIONAL']));
export type ComparisonSeverity = z.infer<typeof ComparisonSeverityEnum>;

// Individual Clause Difference / Redline Item
export const ComparisonClauseChangeSchema = z.object({
  id: z.string(),
  changeType: ComparisonChangeTypeEnum,
  category: ComparisonCategoryEnum,
  severity: ComparisonSeverityEnum,

  sectionNumber: z.string().describe('Section number like "3.1" or "Section 4"'),
  sectionTitle: z.string().describe('Section or clause title'),

  oldText: z.string().nullable().default(null).describe('Original text in Document A, or null if added'),
  newText: z.string().nullable().default(null).describe('Revised text in Document B, or null if removed'),

  explanation: z.string().describe('Plain English explanation of what specifically changed'),
  whyItMatters: z.string().describe('Practical business and operational implications'),
  legalImpact: z.string().describe('Legal and commercial exposure evaluation'),
  actionRequired: z.string().nullable().default(null).describe('Informational recommendation or verification action'),

  pageNumberA: z.number().nullable().default(null),
  pageNumberB: z.number().nullable().default(null),

  sourceA: z.string().nullable().default(null).describe('Exact snippet citation from Document A'),
  sourceB: z.string().nullable().default(null).describe('Exact snippet citation from Document B')
});
export type ComparisonClauseChange = z.infer<typeof ComparisonClauseChangeSchema>;

// Summary Section
export const ComparisonSummarySchema = z.object({
  totalChanges: z.number().int().nonnegative().default(0),
  addedCount: z.number().int().nonnegative().default(0),
  removedCount: z.number().int().nonnegative().default(0),
  modifiedCount: z.number().int().nonnegative().default(0),
  unchangedCount: z.number().int().nonnegative().default(0),
  executiveSummary: z.string().describe('High-level executive overview of the differences between the two contract versions')
});
export type ComparisonSummary = z.infer<typeof ComparisonSummarySchema>;

// Material / Key Changes
export const KeyChangeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: ComparisonCategoryEnum,
  severity: ComparisonSeverityEnum,
  clauseRef: z.string()
});
export type KeyChange = z.infer<typeof KeyChangeSchema>;

// Risk Changes
export const RiskChangeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: ComparisonSeverityEnum,
  clauseRef: z.string(),
  mitigation: z.string().describe('Actionable suggestion to negotiate or clarify')
});
export type RiskChange = z.infer<typeof RiskChangeSchema>;

// Party enum with tolerant preprocessing
export const ComparisonPartyEnum = z.preprocess((val) => {
  if (typeof val !== 'string') return 'Mutual';
  const u = val.trim().toLowerCase();
  if (u.includes('client') || u.includes('customer') || u.includes('buyer') || u.includes('licensee') || u.includes('tenant')) {
    return 'Client';
  }
  if (u.includes('provider') || u.includes('vendor') || u.includes('counterparty') || u.includes('seller') || u.includes('licensor') || u.includes('landlord')) {
    return 'Counterparty';
  }
  return 'Mutual';
}, z.enum(['Client', 'Counterparty', 'Mutual']));
export type ComparisonParty = z.infer<typeof ComparisonPartyEnum>;

// Priority enum with tolerant preprocessing
export const ComparisonPriorityEnum = z.preprocess((val) => {
  if (typeof val !== 'string') return 'Standard';
  const u = val.trim().toLowerCase();
  if (u.includes('crit')) return 'Critical';
  if (u.includes('rec') || u.includes('high') || u.includes('med') || u.includes('mod')) return 'Recommended';
  return 'Standard';
}, z.enum(['Critical', 'Recommended', 'Standard']));
export type ComparisonPriority = z.infer<typeof ComparisonPriorityEnum>;

// Changed Obligations
export const ChangedObligationSchema = z.object({
  party: ComparisonPartyEnum.default('Mutual'),
  oldObligation: z.string().nullable().default(null),
  newObligation: z.string().nullable().default(null),
  impact: z.string(),
  clauseRef: z.string()
});
export type ChangedObligation = z.infer<typeof ChangedObligationSchema>;

// Changed Deadlines
export const ChangedDeadlineSchema = z.object({
  title: z.string(),
  oldDeadline: z.string().nullable().default(null),
  newDeadline: z.string().nullable().default(null),
  impact: z.string(),
  clauseRef: z.string()
});
export type ChangedDeadline = z.infer<typeof ChangedDeadlineSchema>;

// Changed Financial Terms
export const ChangedFinancialTermSchema = z.object({
  item: z.string(),
  oldValue: z.string().nullable().default(null),
  newValue: z.string().nullable().default(null),
  impact: z.string(),
  clauseRef: z.string()
});
export type ChangedFinancialTerm = z.infer<typeof ChangedFinancialTermSchema>;

// Full Structured Comparison Response Schema
export const FullComparisonResultSchema = z.object({
  documentA: z.object({
    fileName: z.string(),
    documentType: z.string().default('Original Legal Document'),
    fileSize: z.string().optional(),
    totalPages: z.number().optional()
  }),
  documentB: z.object({
    fileName: z.string(),
    documentType: z.string().default('Revised Legal Document'),
    fileSize: z.string().optional(),
    totalPages: z.number().optional()
  }),
  summary: ComparisonSummarySchema,
  changes: z.array(ComparisonClauseChangeSchema).default([]),
  keyChanges: z.array(KeyChangeSchema).default([]),
  riskChanges: z.array(RiskChangeSchema).default([]),
  changedObligations: z.array(ChangedObligationSchema).default([]),
  changedDeadlines: z.array(ChangedDeadlineSchema).default([]),
  changedFinancialTerms: z.array(ChangedFinancialTermSchema).default([]),
  actionChecklist: z.array(z.object({
    id: z.string(),
    task: z.string(),
    clauseRef: z.string(),
    priority: ComparisonPriorityEnum.default('Standard'),
    completed: z.boolean().default(false),
    notes: z.string().nullable().optional()
  })).default([]),
  lawyerQuestions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    context: z.string(),
    clauseRef: z.string(),
    reason: z.string()
  })).default([]),
  disclaimer: z.string().default('LegalLens AI provides informational assistance based on the comparison of the two uploaded documents and does not replace professional legal advice.')
});
export type FullComparisonResult = z.infer<typeof FullComparisonResultSchema>;

// Input Document for POST /api/compare-documents
export const DocumentInputSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  fileType: z.preprocess((v) => (typeof v === 'string' ? v.toUpperCase() : v), z.enum(['PDF', 'DOCX'])),
  fileSize: z.string().optional(),
  totalPages: z.number().int().positive().default(1),
  rawText: z.string().min(1, 'Document text cannot be empty').max(2000000, 'Document rawText exceeds maximum limit of 2,000,000 characters'),
  sections: z.array(InputSectionSchema).min(1, 'At least one section is required')
});
export type DocumentInput = z.infer<typeof DocumentInputSchema>;

// Request Payload Schema for POST /api/compare-documents
export const CompareDocumentsRequestSchema = z.object({
  documentA: DocumentInputSchema,
  documentB: DocumentInputSchema
});
export type CompareDocumentsRequest = z.infer<typeof CompareDocumentsRequestSchema>;
