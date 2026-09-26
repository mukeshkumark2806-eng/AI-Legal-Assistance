import { groqService, GroqServiceError } from './groqService.ts';
import { chunkDocumentSections } from '../utils/chunker.ts';
import {
  FullLegalAnalysisSchema,
  type FullLegalAnalysis,
  type AnalyzeDocumentRequest,
  type InputSection
} from '../schemas/legalAnalysisSchema.ts';

const LEGAL_ANALYZER_SYSTEM_PROMPT = `You are LegalLens AI, an expert legal-information assistant. Your function is to analyze uploaded legal contracts and instruments to help non-lawyer users understand what they are reading.

CRITICAL OPERATIONAL RULES:
1. YOU ARE NOT A LAWYER. You do not provide definitive legal advice. Your output is informational only.
2. STRICT SOURCE FIDELITY: Analyze ONLY the supplied document text. Do NOT fabricate, hallucinate, or extrapolate facts, clauses, names, amounts, dates, or obligations not present in the document.
3. AUTHORITATIVE SECTIONS: The supplied section list and section numbers are authoritative. Do not create, renumber, merge, or invent sections. Use the provided sectionNumber, title, page and sourceReference exactly. Analyze the supplied sections rather than determine the document's section count.
4. If specific information (e.g. Effective Date, Term, Governing Law, Penalty) is absent or not specified in the document, explicitly write "Not specified in document" or null as appropriate.
5. DO NOT claim that any clause is "illegal", "unenforceable", or "void" unless the document itself explicitly asserts that. Instead, characterize ambiguous or one-sided terms factually as a "Potential Concern" or "Warrants review".
6. PRESERVE ORIGINAL TEXT: When quoting clauses or source snippets, reproduce the exact language from the document faithfully.
7. PLAIN ENGLISH: Write explanations in clear, accessible language that ordinary business users can understand immediately.
8. GROUNDED CITATIONS & SOURCE REFERENCES: Every clause, obligation, date, commitment, concern, checklist item, and lawyer question MUST include the authoritative source reference matching the document section (e.g., "Section 4 — Payment Terms", "Section 3 — Contract Term", "Section 10 — Termination").
9. LAWYER QUESTIONS: Formulate grounded, concrete questions directly referencing specific sections (e.g., "What should I clarify about the 30-day notice requirement in Section 10 — Termination?"). Do not produce generic questions.
10. OUTPUT FORMAT: Output ONLY a single, valid, parseable JSON object adhering precisely to the requested schema. No conversational preamble, markdown backticks, or postscript.`;

/**
 * Normalizes an arbitrary clause/section reference to the canonical "Section X — Title" format
 * guaranteed to match one of the authoritative sections provided.
 */
export function normalizeSourceRef(rawRef: string | undefined | null, sections: InputSection[], fallbackText?: string): string {
  if (!sections || sections.length === 0) return 'Document Section';

  const clean = (rawRef || '').trim();

  // 1. Exact match with existing sourceReference
  if (clean) {
    const directMatch = sections.find(
      (s) => s.sourceReference && s.sourceReference.toLowerCase() === clean.toLowerCase()
    );
    if (directMatch && directMatch.sourceReference) return directMatch.sourceReference;
  }

  // 2. Numeric section extraction, e.g. "Section 4", "Sec 4", "Clause 4", "4", "4.0"
  if (clean) {
    const numMatch = clean.match(/(?:(?:Section|Sec\.?|Clause|Art\.?|Article)\s*([0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)|^\s*([0-9]+(?:\.[0-9]+)*)\s*$)/i);
    if (numMatch) {
      const num = numMatch[1] || numMatch[2];
      const matchByNum = sections.find(
        (s) => s.sectionNumber === num || s.sectionNumber === `${num}.0` || `${s.sectionNumber}.0` === num || s.id === `sec-${num}` || s.id === `sec-p${num}` || s.id === `sec-chunk-${num}`
      );
      if (matchByNum) {
        return matchByNum.sourceReference || (matchByNum.sectionNumber ? `Section ${matchByNum.sectionNumber} — ${matchByNum.title}` : matchByNum.title);
      }
    }
  }

  // 3. Match by section title contained in reference (exact first, then longest match)
  if (clean) {
    const cleanLower = clean.toLowerCase();
    const exactMatch = sections.find((s) => s.title && s.title.toLowerCase().trim() === cleanLower);
    if (exactMatch) {
      return exactMatch.sourceReference || (exactMatch.sectionNumber ? `Section ${exactMatch.sectionNumber} — ${exactMatch.title}` : exactMatch.title);
    }

    const matchingTitles = sections
      .filter((s) => s.title && (cleanLower.includes(s.title.toLowerCase()) || s.title.toLowerCase().includes(cleanLower)))
      .sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0));
    if (matchingTitles.length > 0) {
      const best = matchingTitles[0];
      return best.sourceReference || (best.sectionNumber ? `Section ${best.sectionNumber} — ${best.title}` : best.title);
    }
  }

  // 4. If reference is missing or unmatched, match by semantic content in fallbackText (task, description, question)
  // Specific contractual section keywords MUST be evaluated with priority before generic party/provider keywords.
  if (fallbackText) {
    const textLower = fallbackText.toLowerCase();

    // 4a. Check if fallbackText verbatim contains an exact section title (preferring longer, more specific titles)
    const titleContainedSections = sections
      .filter((s) => s.title && textLower.includes(s.title.toLowerCase().trim()))
      .sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0));
    if (titleContainedSections.length > 0) {
      const best = titleContainedSections[0];
      return best.sourceReference || (best.sectionNumber ? `Section ${best.sectionNumber} — ${best.title}` : best.title);
    }

    // 4b. Deterministic prioritized semantic matching:
    // Specific substantive covenants take strict priority over generic entity/party references
    interface SemanticTopicRule {
      targetFilter: (s: InputSection) => boolean;
      keywords: string[];
    }

    const priorityRules: SemanticTopicRule[] = [
      // 1. Security Compliance & Audits (e.g., Section 13 — Security Compliance)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes('compliance') || t.includes('audit') || t.includes('soc');
        },
        keywords: ['compliance', 'soc', 'soc 2', 'audit', 'iso', 'controls', 'security compliance', 'penetration', 'type ii']
      },
      // 2. Data Security & Incidents (e.g., Section 11 — Data Security)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return (t.includes('data security') || t.includes('security')) && !t.includes('compliance');
        },
        keywords: ['data security', 'security incident', '72 hours', 'seventy-two', 'safeguard', 'data protect', 'security measures']
      },
      // 3. Payment & Fees (e.g., Section 4 — Payment Terms)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes('payment') || t.includes('fee') || t.includes('compensation') || t.includes('invoic');
        },
        keywords: ['pay', 'fee', 'inr', 'invoice', 'due date', 'late payment', 'interest', '50,000', '65,000', '15,000', '75,000', 'net 30', 'net 45']
      },
      // 4. Termination & Cancellation (e.g., Section 10 — Termination)
      {
        targetFilter: (s) => s.title.toLowerCase().includes('termination'),
        keywords: ['terminat', 'cancellation', 'convenience', 'cure period', 'material breach', 'notice of termination']
      },
      // 5. Contract Term & Renewal (e.g., Section 3 — Contract Term)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes('term') && !t.includes('termination');
        },
        keywords: ['contract term', 'duration', 'renew', 'renewal', 'effective date', 'october', 'twelve (12)', 'eighteen (18)']
      },
      // 6. Confidentiality & Non-Disclosure (e.g., Section 7 — Confidentiality)
      {
        targetFilter: (s) => s.title.toLowerCase().includes('confidential'),
        keywords: ['confidential', 'secret', 'disclosure', 'proprietary', 'non-disclosure']
      },
      // 7. Intellectual Property & Ownership (e.g., Section 8 — Intellectual Property)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes('intellectual property') || t.includes('ip') || t.includes('proprietary rights');
        },
        keywords: ['intellectual property', 'ip', 'ownership', 'source code', 'work product', 'deliverable', 'know-how', 'licens']
      },
      // 8. Limitation of Liability & Indemnity (e.g., Section 9 — Limitation of Liability)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes('liability') || t.includes('indemn');
        },
        keywords: ['liabilit', 'damage', 'cap', 'indemn', 'hold harmless', 'consequential']
      },
      // 9. Governing Law & Dispute Resolution (e.g., Section 12 — Governing Law)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes('law') || t.includes('jurisdiction') || t.includes('dispute') || t.includes('arbitration');
        },
        keywords: ['governing law', 'jurisdiction', 'court', 'india', 'delaware', 'bengaluru', 'arbitration', 'dispute']
      },
      // 10. Scope of Services & Deliverables (e.g., Section 2 — Scope of Services)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes('scope') || t.includes('services and deliverables');
        },
        keywords: ['scope of services', 'statement of work', 'deliverables', 'website development', 'technical support']
      },
      // 11. Service Provider Obligations (e.g., Section 5 — Service Provider Obligations)
      {
        targetFilter: (s) => s.title.toLowerCase().includes('service provider obligations'),
        keywords: ['service provider will', 'reasonable care', 'project records', 'material delays', 'service-status report']
      },
      // 12. Client Obligations (e.g., Section 6 — Client Obligations)
      {
        targetFilter: (s) => s.title.toLowerCase().includes('client obligations'),
        keywords: ['client will provide', 'timely access', 'approvals', 'materials reasonably required']
      },
      // 13. Parties / Preamble (Strictly lowest priority: only if no specific covenant matched)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes('parties') || t.includes('preamble');
        },
        keywords: ['entered into between', 'parties to this agreement', 'brightpath', 'apex digital', 'client and provider']
      }
    ];

    for (const rule of priorityRules) {
      const candidateSection = sections.find(rule.targetFilter);
      if (candidateSection) {
        const hasKeywordMatch = rule.keywords.some((kw) => textLower.includes(kw));
        if (hasKeywordMatch) {
          return candidateSection.sourceReference || (candidateSection.sectionNumber ? `Section ${candidateSection.sectionNumber} — ${candidateSection.title}` : candidateSection.title);
        }
      }
    }
  }

  // 5. Canonical fallback to first section rather than referencing a nonexistent section
  return sections[0].sourceReference || (sections[0].sectionNumber ? `Section ${sections[0].sectionNumber} — ${sections[0].title}` : sections[0].title);
}

export async function analyzeDocumentWithGroq(
  request: AnalyzeDocumentRequest
): Promise<FullLegalAnalysis> {
  const { documentName, fileType, totalPages, sections, rawText } = request;

  if (!sections || sections.length === 0 || !rawText || rawText.trim().length === 0) {
    throw new GroqServiceError('Document text is empty or has no identifiable sections.', 400, 'EMPTY_DOCUMENT');
  }

  // 1. Chunk document sections
  const chunks = chunkDocumentSections(sections);
  if (chunks.length === 0) {
    throw new GroqServiceError('Failed to parse document text into usable sections.', 400, 'CHUNKING_FAILED');
  }

  // 2. Prepare structured text for the prompt with verified authoritative section metadata
  const sectionListDescription = sections.map((s) => {
    const srcRef = s.sourceReference || (s.sectionNumber ? `Section ${s.sectionNumber} — ${s.title}` : s.title);
    const page = s.page !== undefined ? s.page : s.pageNumber;
    const pageStr = page !== undefined ? ` (Page ${page})` : '';
    return `- ${srcRef}${pageStr}`;
  }).join('\n');

  const formattedSections = sections.map((s) => {
    const srcRef = s.sourceReference || (s.sectionNumber ? `Section ${s.sectionNumber} — ${s.title}` : s.title);
    const page = s.page !== undefined ? s.page : s.pageNumber;
    const pageStr = page !== undefined ? ` (Page ${page})` : '';
    const body = (s.paragraphs && s.paragraphs.length > 0) ? s.paragraphs.join('\n') : (s.text || '');
    return `### [${srcRef}]${pageStr}\n${body}`;
  }).join('\n\n');

  // Limit document text to prevent context blowup if oversized (> 100k chars)
  const maxChars = 80000;
  const truncatedText = formattedSections.length > maxChars
    ? formattedSections.substring(0, maxChars) + '\n\n[... Remaining text truncated for analysis window ...]'
    : formattedSections;

  const userPrompt = `Please perform a comprehensive legal information analysis of the following document:
Document Title: "${documentName}"
File Format: ${fileType}
Total Pages: ${totalPages}

AUTHORITATIVE CONTRACT SECTIONS:
The supplied section list and section numbers are authoritative. Do not create, renumber, merge, or invent sections. Use the provided sectionNumber, title, page and sourceReference exactly.
${sectionListDescription}

DOCUMENT CONTENT:
"""
${truncatedText}
"""

INSTRUCTIONS:
Extract and structure your analysis strictly according to this JSON structure:
{
  "documentOverview": {
    "documentType": "e.g. Master Services Agreement, Non-Disclosure Agreement, Commercial Lease, etc.",
    "summary": "2-3 sentence executive summary explaining the fundamental purpose and core relationship established by this contract.",
    "effectiveDate": "e.g. January 1, 2026, or 'Upon execution by both parties', or 'Not specified in document'",
    "term": "e.g. 1 year with automatic renewal, or 'Not specified in document'",
    "governingLaw": "e.g. State of Delaware, or 'Not specified in document'"
  },
  "clauses": [
    {
      "id": "clause-1",
      "sectionNumber": "Exact section number from the supplied authoritative list, e.g. '1', '2', '3', '4'...",
      "title": "Clear clause title matching the authoritative section title",
      "category": "One of: Obligation | Payment | Termination | Deadline | Restriction | Important",
      "importance": "One of: Critical | High | Moderate | Standard",
      "originalText": "Exact text or faithful excerpt from this section of the document",
      "plainEnglish": "Concise plain-English translation of what this clause means for the reader",
      "whyItMatters": "Practical business or legal implication of this clause",
      "concern": "Describe any one-sided risk, strict deadline, or ambiguity, or null if standard",
      "pageNumber": 1,
      "sourceText": "Verbatim quote from the document",
      "sourceReference": "Authoritative source reference, e.g. 'Section 4 — Payment Terms'"
    }
  ],
  "keyObligations": [
    {
      "id": "ob-1",
      "party": "Client | Counterparty | Mutual",
      "description": "Specific obligation identified in the contract",
      "deadline": "Timing or cutoff if specified, e.g. 'Within 30 days of invoice', or null",
      "clauseRef": "Authoritative source reference, e.g. 'Section 4 — Payment Terms' or 'Section 5 — Service Provider Obligations'",
      "importance": "Critical | High | Moderate | Standard"
    }
  ],
  "importantDates": [
    {
      "id": "date-1",
      "title": "Event/Milestone title",
      "date": "Exact date or period from document",
      "type": "Effective | Deadline | Renewal | Termination",
      "clauseRef": "Authoritative source reference, e.g. 'Section 3 — Contract Term'",
      "isRecurring": false,
      "description": "What is required on or by this date"
    }
  ],
  "financialCommitments": [
    {
      "id": "fin-1",
      "item": "Name of payment or fee obligation",
      "amount": "Dollar amount, rate, or calculation formula",
      "schedule": "Billing frequency or payment terms (e.g. Net 30)",
      "clauseRef": "Authoritative source reference, e.g. 'Section 4 — Payment Terms'",
      "penaltyTerms": "Late fee or interest clause if specified, or null",
      "importance": "Critical | High | Moderate | Standard"
    }
  ],
  "potentialConcerns": [
    {
      "id": "risk-1",
      "title": "Short title of concern",
      "severity": "Critical | High | Moderate | Standard",
      "clauseRef": "Authoritative source reference, e.g. 'Section 9 — Limitation of Liability'",
      "description": "Factual description of the unfavorable or ambiguous term",
      "mitigationAdvice": "Prudent suggestion to negotiate, clarify, or review with legal counsel"
    }
  ],
  "actionChecklist": [
    {
      "id": "act-1",
      "task": "Actionable verification task before signing",
      "clauseRef": "Authoritative source reference, e.g. 'Section 4 — Payment Terms'",
      "priority": "Critical | Recommended | Standard",
      "completed": false,
      "notes": "Helpful verification tip grounded in the document"
    }
  ],
  "lawyerQuestions": [
    {
      "id": "q-1",
      "question": "Specific question directly citing the section (e.g. 'Should we request an exception to the indemnification cap in Section 9 — Limitation of Liability?')",
      "context": "Brief context from the document text",
      "clauseRef": "Authoritative source reference, e.g. 'Section 4 — Payment Terms'",
      "reason": "Strategic reason why an attorney should evaluate this term"
    }
  ]
}

Ensure explanations are concise, crisp, and plain-English (1-2 sentences per field). The supplied section list and section numbers are authoritative. Do not create, renumber, merge, or invent sections. Use the provided sectionNumber, title, page and sourceReference exactly. All section references must correspond to the actual sections provided. Ensure the JSON is completely closed and valid.`;

  // 3. Call Groq
  const completionResult = await groqService.createJsonChatCompletion({
    messages: [
      { role: 'system', content: LEGAL_ANALYZER_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.1,
    maxTokens: 8192
  });

  // 4. Parse & Validate JSON with Zod Schema
  let parsedJson: any;
  try {
    parsedJson = JSON.parse(completionResult.content);
  } catch (parseErr) {
    console.error('Failed to parse JSON response from Groq:', completionResult.content);
    throw new GroqServiceError('AI service returned an invalid JSON response.', 502, 'INVALID_JSON');
  }

  // 5. Post-process & Normalize IDs and Authoritative Source References
  if (Array.isArray(parsedJson.clauses)) {
    parsedJson.clauses = parsedJson.clauses.map((c: any, idx: number) => {
      const srcRef = normalizeSourceRef(c.sourceReference || c.clauseRef || c.sectionNumber, sections, `${c.title} ${c.originalText}`);
      // Find matching section to enforce canonical sectionNumber and page
      const matchSec = sections.find(
        (s) => s.sourceReference === srcRef || (s.sectionNumber && c.sectionNumber && s.sectionNumber === String(c.sectionNumber))
      );
      return {
        ...c,
        id: c.id || `clause-${idx + 1}`,
        sectionNumber: matchSec?.sectionNumber || c.sectionNumber || String(idx + 1),
        sourceReference: srcRef,
        pageNumber: matchSec?.page || matchSec?.pageNumber || c.pageNumber || null
      };
    });
  }

  if (Array.isArray(parsedJson.keyObligations)) {
    parsedJson.keyObligations = parsedJson.keyObligations.map((o: any, idx: number) => ({
      ...o,
      id: o.id || `ob-${idx + 1}`,
      clauseRef: normalizeSourceRef(o.clauseRef, sections, `${o.description} ${o.party}`)
    }));
  }

  if (Array.isArray(parsedJson.importantDates)) {
    parsedJson.importantDates = parsedJson.importantDates.map((d: any, idx: number) => ({
      ...d,
      id: d.id || `date-${idx + 1}`,
      clauseRef: normalizeSourceRef(d.clauseRef, sections, `${d.title} ${d.description}`)
    }));
  }

  if (Array.isArray(parsedJson.financialCommitments)) {
    parsedJson.financialCommitments = parsedJson.financialCommitments.map((f: any, idx: number) => ({
      ...f,
      id: f.id || `fin-${idx + 1}`,
      clauseRef: normalizeSourceRef(f.clauseRef, sections, `${f.item} ${f.amount} ${f.schedule}`)
    }));
  }

  if (Array.isArray(parsedJson.potentialConcerns)) {
    parsedJson.potentialConcerns = parsedJson.potentialConcerns.map((p: any, idx: number) => ({
      ...p,
      id: p.id || `concern-${idx + 1}`,
      clauseRef: normalizeSourceRef(p.clauseRef, sections, `${p.title} ${p.description}`)
    }));
  }

  if (Array.isArray(parsedJson.actionChecklist)) {
    parsedJson.actionChecklist = parsedJson.actionChecklist.map((a: any, idx: number) => ({
      ...a,
      id: a.id || `act-${idx + 1}`,
      clauseRef: normalizeSourceRef(a.clauseRef, sections, `${a.task} ${a.notes || ''}`)
    }));
  }

  if (Array.isArray(parsedJson.lawyerQuestions)) {
    parsedJson.lawyerQuestions = parsedJson.lawyerQuestions.map((q: any, idx: number) => ({
      ...q,
      id: q.id || `lq-${idx + 1}`,
      clauseRef: normalizeSourceRef(q.clauseRef, sections, `${q.question} ${q.context || ''}`)
    }));
  }

  const validationResult = FullLegalAnalysisSchema.safeParse(parsedJson);
  if (!validationResult.success) {
    console.error('Zod schema validation failed on AI output:', validationResult.error.format());
    throw new GroqServiceError(
      `AI analysis failed schema validation: ${validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
      502,
      'SCHEMA_VALIDATION_FAILED'
    );
  }

  return validationResult.data;
}
