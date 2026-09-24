import { groqService, GroqServiceError } from './groqService';
import {
  DocumentQuestionResponseSchema,
  type DocumentQuestionRequest,
  type DocumentQuestionResponse,
  type InputSection,
  type Citation
} from '../schemas/legalAnalysisSchema';

const QA_SYSTEM_PROMPT = `You are LegalLens Document Assistant. Your job is to answer user questions strictly and solely based on the provided document excerpts.

STRICT GROUNDING & ANTI-HALLUCINATION RULES:
1. YOU ARE RESTRICTED TO THE PROVIDED DOCUMENT CONTEXT. Do not use external legal knowledge, assumptions, or general practices to answer questions about this agreement.
2. If the answer to the user's question is NOT explicitly stated in or directly deducible from the provided excerpts, you MUST state:
   "I couldn't find this information in the uploaded document."
   Do NOT attempt to invent terms, standard commercial defaults, or hypothetical scenarios.
3. CITATIONS REQUIRED: When answering from the document, you MUST include exact citations:
   - Section Number (e.g. "Section 8" or "8.2")
   - Section Title
   - Page Number (if available in context, or null)
   - Source snippet (an exact verbatim quote from the text supporting your statement)
4. TONE & CAUTION: Maintain a neutral, factual, and informative tone. Do NOT provide legal advice. Frame answers around what the text specifies (e.g., "According to Section 4.2...", "The agreement specifies...").
5. AMBIGUOUS PRONOUNS & PARTY ROLES:
   - When users ask questions with first-person pronouns (e.g., "my obligations", "my rights", "what do I have to pay", "can I terminate"), do NOT assume the user's contractual role (such as whether they are the Client or the Service Provider) unless explicitly established.
   - If the document assigns duties or rights to distinct parties (e.g., Client vs. Service Provider), provide a clarification-aware response outlining both perspectives factually with exact section citations.
     Example: "If you are the Client, Section 6 requires you to provide timely access, information, approvals, and other materials reasonably required for the services. The Service Provider's obligations are listed in Section 5."
   - For termination questions like "Can I terminate this agreement early?", provide objective factual terms from the document:
     Example: "The agreement states that either party may terminate for convenience with thirty (30) days' prior written notice. It also provides for termination for material breach if the breach is not cured within fifteen (15) days after written notice."
   - Do NOT turn answers into legal advice or recommend a course of action.
6. RESPONSE FORMAT: You MUST return a single valid JSON object adhering to this schema:
{
  "answer": "Clear, grounded answer to the user's question, or 'I couldn't find this information in the uploaded document.'",
  "isFoundInDocument": true or false,
  "citations": [
    {
      "sectionNumber": "Section X.X",
      "title": "Section Title",
      "pageNumber": 1 or null,
      "sourceSnippet": "Exact verbatim text quote supporting the answer"
    }
  ],
  "disclaimer": "Informational assistance based on the uploaded document. This does not replace professional legal advice."
}`;

/**
 * Keyword and intent scoring to retrieve the most relevant sections for a user question.
 */
function retrieveRelevantSections(question: string, sections: InputSection[], topK: number = 4): InputSection[] {
  const normalizedQuestion = question.toLowerCase();
  const qTokens = normalizedQuestion
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 2);

  // Legal synonyms/intents
  const intentKeywords: Record<string, string[]> = {
    termination: ['terminate', 'cancellation', 'convenience', 'cure', 'breach', 'exit', 'expire', 'end'],
    payment: ['pay', 'fee', 'invoice', 'due', 'amount', 'compensation', 'billing', 'cost', 'charge', 'price'],
    confidentiality: ['confidential', 'secret', 'disclosure', 'proprietary', 'non-disclosure'],
    liability: ['liability', 'indemnif', 'hold harmless', 'damages', 'consequential', 'loss', 'remedy'],
    term: ['term', 'duration', 'effective', 'period', 'renewal', 'auto-renew', 'year', 'month'],
    dispute: ['law', 'jurisdiction', 'arbitration', 'court', 'venue', 'governing', 'delaware', 'new york', 'california'],
    obligations: ['obligation', 'duties', 'responsibilities', 'deliver', 'provide', 'require', 'shall'],
    rights: ['rights', 'license', 'ownership', 'intellectual property', 'ip'],
    security: ['security', 'soc', 'compliance', 'safeguard', 'incident', 'data']
  };

  // Expand question tokens with matched intent terms
  const expandedTokens = new Set<string>(qTokens);
  for (const [_, terms] of Object.entries(intentKeywords)) {
    if (terms.some(t => normalizedQuestion.includes(t))) {
      terms.forEach(t => expandedTokens.add(t));
    }
  }

  const scoredSections = sections.map((section) => {
    let score = 0;
    const titleLower = section.title.toLowerCase();
    const secNumLower = (section.sectionNumber || '').toLowerCase();
    const bodyLower = section.paragraphs.join(' ').toLowerCase();

    // High boost if section number is mentioned directly (e.g. "Section 4" or "4.1")
    if (secNumLower && normalizedQuestion.includes(secNumLower)) {
      score += 50;
    }

    // High boost if section title matches tokens
    expandedTokens.forEach((token) => {
      if (titleLower.includes(token)) {
        score += 15;
      }
      if (bodyLower.includes(token)) {
        // Count occurrences up to a cap
        const count = (bodyLower.match(new RegExp(token, 'g')) || []).length;
        score += Math.min(count, 5) * 2;
      }
    });

    return { section, score };
  });

  scoredSections.sort((a, b) => b.score - a.score);

  // Take topK sections, or fallback to first sections if all scores are 0
  const topSections = scoredSections
    .filter(s => s.score > 0)
    .slice(0, topK)
    .map(s => s.section);

  if (topSections.length === 0) {
    return sections.slice(0, topK);
  }

  return topSections;
}

export async function answerDocumentQuestion(
  request: DocumentQuestionRequest
): Promise<DocumentQuestionResponse> {
  const { question, documentName, sections } = request;

  if (!question || question.trim().length === 0) {
    throw new GroqServiceError('Question cannot be empty.', 400, 'EMPTY_QUESTION');
  }

  if (!sections || sections.length === 0) {
    throw new GroqServiceError('No document sections provided for Q&A.', 400, 'NO_SECTIONS');
  }

  // 1. Retrieve most relevant sections based on question
  const relevantSections = retrieveRelevantSections(question, sections, 4);

  // 2. Format context with authoritative source references and page boundaries
  const contextSnippet = relevantSections.map(s => {
    const page = s.page !== undefined ? s.page : s.pageNumber;
    const pageStr = page !== undefined ? ` (Page ${page})` : '';
    const srcRef = s.sourceReference || (s.sectionNumber ? `Section ${s.sectionNumber} — ${s.title}` : s.title);
    const body = (s.paragraphs && s.paragraphs.length > 0) ? s.paragraphs.join('\n') : ((s as any).text || '');
    return `--- BEGIN SECTION: [${srcRef}]${pageStr} ---\n${body}\n--- END SECTION ---`;
  }).join('\n\n');

  const userPrompt = `Document: "${documentName}"

EXCERPTED SECTIONS FROM DOCUMENT:
${contextSnippet}

USER INQUIRY:
"${question}"

Analyze only the provided excerpts above. The supplied section numbers and titles are authoritative. Answer the user question accurately. If the document excerpts do not mention or answer this question, state: "I couldn't find this information in the uploaded document." and set "isFoundInDocument": false. Return JSON.`;

  // 3. Call Groq
  const completion = await groqService.createJsonChatCompletion({
    messages: [
      { role: 'system', content: QA_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.05,
    maxTokens: 1500
  });

  // 4. Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(completion.content);
  } catch (err) {
    throw new GroqServiceError('Failed to parse AI response for document Q&A.', 502, 'INVALID_JSON');
  }

  // 5. Normalize citations against authoritative sections
  if (Array.isArray(parsed?.citations)) {
    parsed.citations = parsed.citations.map((c: any) => {
      const cSecStr = c.sectionNumber ? String(c.sectionNumber).trim() : '';
      const numMatch = cSecStr.match(/(?:Section|Sec\.?|Clause|Art\.?|Article)?\s*(\d+(?:\.\d+)*)/i);
      const cNum = numMatch ? numMatch[1] : cSecStr;

      const matchSec = sections.find((s) => {
        if (s.sectionNumber && cNum && (String(s.sectionNumber).trim() === cNum || String(s.sectionNumber).trim() === `${cNum}.0` || `${String(s.sectionNumber).trim()}.0` === cNum)) return true;
        if (s.sourceReference && cSecStr && s.sourceReference.toLowerCase().trim() === cSecStr.toLowerCase()) return true;
        if (s.title && c.title && s.title.toLowerCase().trim() === String(c.title).toLowerCase().trim()) return true;
        return false;
      }) || sections.find((s) => {
        if (s.title && c.title && (s.title.toLowerCase().includes(String(c.title).toLowerCase()) || String(c.title).toLowerCase().includes(s.title.toLowerCase()))) return true;
        return false;
      });

      const secNum = matchSec?.sectionNumber ? `Section ${matchSec.sectionNumber}` : (c.sectionNumber || 'Section');
      const title = matchSec?.title || c.title || 'Document Section';
      const clauseRef = matchSec?.sourceReference || (matchSec?.sectionNumber ? `Section ${matchSec.sectionNumber} — ${matchSec.title}` : title);

      return {
        ...c,
        sectionNumber: secNum,
        title: title,
        clauseRef: clauseRef,
        pageNumber: matchSec?.page || matchSec?.pageNumber || c.pageNumber || null
      };
    });
  }

  const validated = DocumentQuestionResponseSchema.safeParse(parsed);
  if (!validated.success) {
    // Fallback if formatting was slightly off
    return {
      answer: parsed?.answer || "I couldn't find this information in the uploaded document.",
      isFoundInDocument: Boolean(parsed?.isFoundInDocument),
      citations: Array.isArray(parsed?.citations) ? parsed.citations : [],
      disclaimer: 'AI-generated informational assistance. This does not replace professional legal advice.'
    };
  }

  return validated.data;
}
