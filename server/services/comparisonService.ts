import { groqService, GroqServiceError, safeParseJson } from './groqService.ts';
import type { InputSection } from '../schemas/legalAnalysisSchema.ts';
import {
  FullComparisonResultSchema,
  type FullComparisonResult,
  type CompareDocumentsRequest
} from '../schemas/documentComparisonSchema.ts';

export interface AlignedSectionPair {
  status: 'MATCHED' | 'ADDED_IN_B' | 'REMOVED_FROM_A';
  sectionA?: InputSection;
  sectionB?: InputSection;
  sectionNumber: string;
  title: string;
  similarityScore: number;
}

/**
 * Normalizes section numbers for robust matching (e.g., "SECTION 3.0" -> "3", "Article IV" -> "iv")
 */
function normalizeSectionNumber(numStr: string): string {
  if (!numStr) return '';
  return numStr
    .toLowerCase()
    .replace(/^section\s+/i, '')
    .replace(/^article\s+/i, '')
    .replace(/[:.]/g, '')
    .trim();
}

/**
 * Normalizes title for string matching
 */
function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Jaccard word-token similarity between two titles
 */
function computeTitleSimilarity(titleA: string, titleB: string): number {
  const wordsA = new Set(normalizeTitle(titleA).split(' ').filter(w => w.length > 2));
  const wordsB = new Set(normalizeTitle(titleB).split(' ').filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Aligns sections between Document A and Document B using:
 * 1. Exact section numbers
 * 2. Title similarity
 * 3. Semantic keyword intent
 * 4. Identifying newly inserted or deleted sections
 */
export function alignDocumentSections(
  sectionsA: InputSection[],
  sectionsB: InputSection[]
): AlignedSectionPair[] {
  const pairs: AlignedSectionPair[] = [];
  const matchedBIndices = new Set<number>();

  // For each section in A, find best matching section in B
  for (const secA of sectionsA) {
    const normNumA = normalizeSectionNumber(secA.sectionNumber);
    const normTitleA = normalizeTitle(secA.title);

    let bestMatchIdx = -1;
    let bestScore = 0;

    for (let j = 0; j < sectionsB.length; j++) {
      if (matchedBIndices.has(j)) continue;
      const secB = sectionsB[j];
      const normNumB = normalizeSectionNumber(secB.sectionNumber);
      const normTitleB = normalizeTitle(secB.title);

      let score = 0;
      const titleSim = computeTitleSimilarity(secA.title, secB.title);
      const exactTitleMatch = Boolean(normTitleA && normTitleB && normTitleA === normTitleB);

      if (exactTitleMatch) {
        // Conclusive semantic match
        score = 1.0;
      } else if (titleSim >= 0.4) {
        // Strong semantic title similarity
        score = 0.5 + titleSim * 0.4;
        if (normNumA && normNumB && normNumA === normNumB) {
          score += 0.1;
        }
      } else if (normNumA && normNumB && normNumA === normNumB) {
        // Only allow section number match if titles are not completely divergent or title is absent
        if (!normTitleA || !normTitleB) {
          score = 0.6;
        } else if (titleSim > 0.1) {
          score = 0.4 + titleSim * 0.3;
        } else {
          // Both have titles but similarity is 0 -> DO NOT match based on section number alone!
          score = 0;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatchIdx = j;
      }
    }

    // Threshold for considering it a match
    if (bestMatchIdx !== -1 && bestScore >= 0.4) {
      matchedBIndices.add(bestMatchIdx);
      const secB = sectionsB[bestMatchIdx];
      pairs.push({
        status: 'MATCHED',
        sectionA: secA,
        sectionB: secB,
        sectionNumber: secB.sectionNumber || secA.sectionNumber || '',
        title: secB.title || secA.title,
        similarityScore: bestScore
      });
    } else {
      // Exists only in Document A -> Removed
      pairs.push({
        status: 'REMOVED_FROM_A',
        sectionA: secA,
        sectionNumber: secA.sectionNumber || '',
        title: secA.title,
        similarityScore: 0
      });
    }
  }

  // Any remaining sections in B not matched to A -> Added
  for (let j = 0; j < sectionsB.length; j++) {
    if (!matchedBIndices.has(j)) {
      const secB = sectionsB[j];
      pairs.push({
        status: 'ADDED_IN_B',
        sectionB: secB,
        sectionNumber: secB.sectionNumber || '',
        title: secB.title,
        similarityScore: 0
      });
    }
  }

  return pairs;
}

const COMPARISON_SYSTEM_PROMPT = `You are LegalLens AI Redline & Contract Comparison Specialist. Your objective is to perform a strict, factual legal comparison between Document A (Baseline) and Document B (Revised).

CRITICAL COMPARISON DIRECTIVES:
1. STRICT SOURCE FIDELITY: Compare ONLY the supplied text of Document A and Document B. Never invent changes, dates, amounts, parties, or clauses.
2. PRESERVE ORIGINAL WORDING: In "oldText", quote the exact excerpt from Document A. In "newText", quote the exact excerpt from Document B.
3. CLEAR DELTA CLASSIFICATION:
   - "ADDED": A clause or term present in Document B that did not exist in Document A.
   - "REMOVED": A clause or term present in Document A that was deleted in Document B.
   - "MODIFIED": A clause that exists in both versions where language, numbers, deadlines, or scope altered.
   - "UNCHANGED": A clause identical or materially equivalent in legal effect.
4. MATERIALITY FOCUS: Highlight substantive commercial and legal changes with high scrutiny:
   - Payment figures, rates, invoicing schedules, penalties, late interest
   - Termination notice periods, termination for convenience vs cause, cure periods
   - Liability caps, exclusions of consequential damages, unilateral indemnification
   - Confidentiality terms and survival duration
   - Exclusivity, restrictive covenants, non-solicitation
   - Governing law and arbitration venues
5. CAUTIOUS & NEUTRAL TONE: You are not a lawyer and do not provide definitive legal advice. State factually what changed (e.g. "The notice period in Section 3 was reduced from 60 days to 30 days") rather than declaring a draft "illegal" or "disastrous".
6. OUTPUT STRICT JSON: Return a single parseable JSON object strictly matching the required schema. No conversational preamble or trailing commentary.`;

export async function compareDocumentsWithGroq(
  request: CompareDocumentsRequest
): Promise<FullComparisonResult> {
  const { documentA, documentB } = request;

  if (!documentA.rawText || documentA.rawText.trim().length === 0) {
    throw new GroqServiceError('Document A contains no extractable text.', 400, 'EMPTY_DOCUMENT_A');
  }
  if (!documentB.rawText || documentB.rawText.trim().length === 0) {
    throw new GroqServiceError('Document B contains no extractable text.', 400, 'EMPTY_DOCUMENT_B');
  }

  // 1. Align legal sections
  const alignedPairs = alignDocumentSections(documentA.sections, documentB.sections);

  // 2. Prepare structured comparison payload
  const formattedPairsText = alignedPairs.map((pair, idx) => {
    if (pair.status === 'MATCHED') {
      const textA = pair.sectionA?.paragraphs.join('\n') || '';
      const textB = pair.sectionB?.paragraphs.join('\n') || '';
      return `[PAIR ${idx + 1}] ALIGNED SECTION: ${pair.sectionNumber ? `Section ${pair.sectionNumber} - ` : ''}${pair.title}
--- DOCUMENT A (BASELINE - Page ${pair.sectionA?.pageNumber || 1}) ---
${textA}
--- DOCUMENT B (REVISED - Page ${pair.sectionB?.pageNumber || 1}) ---
${textB}
--- END PAIR ---`;
    } else if (pair.status === 'ADDED_IN_B') {
      const textB = pair.sectionB?.paragraphs.join('\n') || '';
      return `[PAIR ${idx + 1}] NEW SECTION INSERTED IN DOCUMENT B: ${pair.sectionNumber ? `Section ${pair.sectionNumber} - ` : ''}${pair.title} (Page ${pair.sectionB?.pageNumber || 1})
--- DOCUMENT B CONTENT ---
${textB}
--- END PAIR ---`;
    } else {
      const textA = pair.sectionA?.paragraphs.join('\n') || '';
      return `[PAIR ${idx + 1}] SECTION REMOVED FROM DOCUMENT A: ${pair.sectionNumber ? `Section ${pair.sectionNumber} - ` : ''}${pair.title} (Page ${pair.sectionA?.pageNumber || 1})
--- DOCUMENT A CONTENT (DELETED) ---
${textA}
--- END PAIR ---`;
    }
  }).join('\n\n');

  // Cap to safe context limit
  const maxChars = 75000;
  const truncatedPairs = formattedPairsText.length > maxChars
    ? formattedPairsText.substring(0, maxChars) + '\n\n[... Remaining aligned sections truncated for token budget ...]'
    : formattedPairsText;

  const userPrompt = `Perform a comprehensive redline and legal risk comparison between:
Document A (Baseline): "${documentA.name}" (${documentA.fileType})
Document B (Revised): "${documentB.name}" (${documentB.fileType})

ALIGNED SECTIONS FOR COMPARISON:
"""
${truncatedPairs}
"""

OUTPUT FORMAT:
Generate a structured JSON response matching this schema:
{
  "documentA": {
    "fileName": "${documentA.name}",
    "documentType": "${documentA.fileType} Contract (Baseline)",
    "fileSize": "${documentA.fileSize || 'Unknown'}",
    "totalPages": ${documentA.totalPages || 1}
  },
  "documentB": {
    "fileName": "${documentB.name}",
    "documentType": "${documentB.fileType} Contract (Revised Redline)",
    "fileSize": "${documentB.fileSize || 'Unknown'}",
    "totalPages": ${documentB.totalPages || 1}
  },
  "summary": {
    "totalChanges": <number of changed clauses: added + removed + modified>,
    "addedCount": <number of newly added clauses/sections>,
    "removedCount": <number of deleted clauses/sections>,
    "modifiedCount": <number of altered clauses>,
    "unchangedCount": <number of unchanged provisions>,
    "executiveSummary": "Concise 2-3 sentence executive summary of the overall redline, noting key strategic shifts in legal/commercial exposure."
  },
  "changes": [
    {
      "id": "chg-1",
      "changeType": "ADDED | REMOVED | MODIFIED | UNCHANGED",
      "category": "PAYMENT | TERMINATION | LIABILITY | CONFIDENTIALITY | OBLIGATION | DEADLINE | RESTRICTION | GOVERNING_LAW | RENEWAL | GENERAL",
      "severity": "CRITICAL | HIGH | MODERATE | LOW | INFORMATIONAL",
      "sectionNumber": "Section number e.g. '3.0' or 'Section 2'",
      "sectionTitle": "Title of section",
      "oldText": "Exact text from Document A, or null if ADDED",
      "newText": "Exact text from Document B, or null if REMOVED",
      "explanation": "Clear plain English description of what changed between the two versions",
      "whyItMatters": "Practical business or operational impact of this specific delta",
      "legalImpact": "Commercial exposure or contractual risk assessment",
      "actionRequired": "Practical next step (e.g. 'Confirm whether 15 days is sufficient for accounting approval') or null",
      "pageNumberA": 1,
      "pageNumberB": 1,
      "sourceA": "Snippet from Document A",
      "sourceB": "Snippet from Document B"
    }
  ],
  "keyChanges": [
    {
      "id": "kc-1",
      "title": "Short descriptive title of material change",
      "description": "Factual description of the delta",
      "category": "PAYMENT | TERMINATION | LIABILITY | CONFIDENTIALITY | OBLIGATION | DEADLINE | RESTRICTION | GOVERNING_LAW | RENEWAL | GENERAL",
      "severity": "CRITICAL | HIGH | MODERATE | LOW | INFORMATIONAL",
      "clauseRef": "Section X.X"
    }
  ],
  "riskChanges": [
    {
      "id": "rc-1",
      "title": "Risk shift headline",
      "description": "How contractual risk or exposure increased or changed",
      "severity": "CRITICAL | HIGH | MODERATE | LOW",
      "clauseRef": "Section X.X",
      "mitigation": "Recommended negotiation counter-proposal or clarification"
    }
  ],
  "changedObligations": [
    {
      "party": "Client | Counterparty | Mutual",
      "oldObligation": "Obligation in Document A, or null if newly inserted",
      "newObligation": "Revised obligation in Document B, or null if deleted",
      "impact": "Explanation of change in duty or performance standard",
      "clauseRef": "Section X.X"
    }
  ],
  "changedDeadlines": [
    {
      "title": "Milestone / Notice Title",
      "oldDeadline": "Original timeframe (e.g. 60 days)",
      "newDeadline": "Revised timeframe (e.g. 30 days)",
      "impact": "Operational impact of the deadline change",
      "clauseRef": "Section X.X"
    }
  ],
  "changedFinancialTerms": [
    {
      "item": "Fee or compensation item",
      "oldValue": "Amount/schedule in Document A",
      "newValue": "Amount/schedule in Document B",
      "impact": "Budgetary and financial impact",
      "clauseRef": "Section X.X"
    }
  ],
  "actionChecklist": [
    {
      "id": "act-comp-1",
      "task": "Concrete verification task based on comparison",
      "clauseRef": "Section X.X",
      "priority": "Critical | Recommended | Standard",
      "completed": false,
      "notes": "Helpful verification hint"
    }
  ],
  "lawyerQuestions": [
    {
      "id": "lq-comp-1",
      "question": "Specific question grounded in the redline (e.g. 'Should we accept the reduction of the termination notice period from 60 to 30 days?')",
      "context": "Context from the redline comparison",
      "clauseRef": "Section X.X",
      "reason": "Strategic reason why legal counsel should review this change"
    }
  ],
  "disclaimer": "LegalLens AI provides informational assistance based on the comparison of the two uploaded documents and does not replace professional legal advice."
}

Ensure all changed provisions have exact citations and accurate classifications. Be concise in descriptions (1-2 sentences per field). Return valid JSON.`;

  // 3. Call Groq
  const completion = await groqService.createJsonChatCompletion({
    messages: [
      { role: 'system', content: COMPARISON_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.1,
    maxTokens: 4096
  });

  // 4. Parse & Validate
  let parsedJson: any;
  try {
    parsedJson = safeParseJson(completion.content);
  } catch (err) {
    console.error('Failed to parse Groq comparison JSON:', completion.content);
    throw new GroqServiceError('AI service returned an unparseable response for document comparison.', 502, 'INVALID_JSON');
  }

  // Auto-fill IDs if omitted
  if (Array.isArray(parsedJson.changes)) {
    parsedJson.changes = parsedJson.changes.map((c: any, i: number) => ({
      ...c,
      id: c.id || `chg-${i + 1}`
    }));
  }
  if (Array.isArray(parsedJson.keyChanges)) {
    parsedJson.keyChanges = parsedJson.keyChanges.map((k: any, i: number) => ({
      ...k,
      id: k.id || `kc-${i + 1}`
    }));
  }
  if (Array.isArray(parsedJson.riskChanges)) {
    parsedJson.riskChanges = parsedJson.riskChanges.map((r: any, i: number) => ({
      ...r,
      id: r.id || `rc-${i + 1}`
    }));
  }
  if (Array.isArray(parsedJson.actionChecklist)) {
    parsedJson.actionChecklist = parsedJson.actionChecklist.map((a: any, i: number) => ({
      ...a,
      id: a.id || `act-comp-${i + 1}`
    }));
  }
  if (Array.isArray(parsedJson.lawyerQuestions)) {
    parsedJson.lawyerQuestions = parsedJson.lawyerQuestions.map((q: any, i: number) => ({
      ...q,
      id: q.id || `lq-comp-${i + 1}`
    }));
  }

  // Ensure summary counts match actual changes if model hallucinated counts
  if (parsedJson.summary && Array.isArray(parsedJson.changes)) {
    const changes = parsedJson.changes;
    const added = changes.filter((c: any) => String(c.changeType).toUpperCase() === 'ADDED').length;
    const removed = changes.filter((c: any) => String(c.changeType).toUpperCase() === 'REMOVED').length;
    const modified = changes.filter((c: any) => String(c.changeType).toUpperCase() === 'MODIFIED').length;
    const unchanged = changes.filter((c: any) => String(c.changeType).toUpperCase() === 'UNCHANGED').length;

    parsedJson.summary.addedCount = added;
    parsedJson.summary.removedCount = removed;
    parsedJson.summary.modifiedCount = modified;
    parsedJson.summary.unchangedCount = unchanged;
    parsedJson.summary.totalChanges = added + removed + modified;
  }

  const validated = FullComparisonResultSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error('Comparison schema validation failed:', validated.error.format());
    throw new GroqServiceError(
      `Comparison output failed validation: ${validated.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
      502,
      'SCHEMA_VALIDATION_FAILED'
    );
  }

  return validated.data;
}
