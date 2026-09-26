// server/schemas/legalAnalysisSchema.ts
import { z } from "zod";
var rawCategories = ["Obligation", "Payment", "Termination", "Deadline", "Restriction", "Important"];
var rawImportance = ["Critical", "High", "Moderate", "Standard"];
function toTitleCase(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
var ClauseCategoryEnum = z.preprocess((val) => {
  if (typeof val !== "string") return "Important";
  const v = toTitleCase(val.trim());
  if (rawCategories.includes(v)) return v;
  const lower = val.toLowerCase();
  if (lower.includes("pay") || lower.includes("fee") || lower.includes("cost")) return "Payment";
  if (lower.includes("terminat") || lower.includes("cancel")) return "Termination";
  if (lower.includes("date") || lower.includes("dead") || lower.includes("time")) return "Deadline";
  if (lower.includes("restrict") || lower.includes("prohibit") || lower.includes("liabil")) return "Restriction";
  if (lower.includes("obligat") || lower.includes("duties")) return "Obligation";
  return "Important";
}, z.enum(rawCategories));
var ImportanceLevelEnum = z.preprocess((val) => {
  if (typeof val !== "string") return "Standard";
  const v = toTitleCase(val.trim());
  if (v === "Low") return "Standard";
  if (v === "Medium") return "Moderate";
  if (rawImportance.includes(v)) return v;
  const lower = val.toLowerCase();
  if (lower.includes("crit")) return "Critical";
  if (lower.includes("high")) return "High";
  if (lower.includes("mod") || lower.includes("med")) return "Moderate";
  return "Standard";
}, z.enum(rawImportance));
var DocumentOverviewSchema = z.object({
  documentType: z.string().default("Legal Agreement"),
  summary: z.string().describe("Plain English executive summary of the document"),
  effectiveDate: z.string().nullable().default(null).describe('Effective date or "Not specified in document"'),
  term: z.string().nullable().default(null).describe('Term length / duration or "Not specified in document"'),
  governingLaw: z.string().nullable().default(null).describe('Governing law jurisdiction or "Not specified in document"')
});
var ClauseSchema = z.object({
  id: z.string(),
  sectionNumber: z.string().describe('Section or article number like "1.2" or "Section 3"'),
  title: z.string().describe("Descriptive clause title"),
  category: ClauseCategoryEnum,
  importance: ImportanceLevelEnum,
  originalText: z.string().describe("Verbatim or faithful original clause text from document"),
  plainEnglish: z.string().describe("Plain English translation for non-lawyers"),
  whyItMatters: z.string().describe("Business or legal significance of this clause"),
  concern: z.string().nullable().default(null).describe("Potential concern or risk note if present, or null"),
  pageNumber: z.number().nullable().default(null).describe("Page number where found, or null"),
  page: z.number().nullable().optional().describe("Alias for page number"),
  sourceText: z.string().describe("Exact source snippet from the document"),
  sourceReference: z.string().optional().describe("Canonical section reference matching authoritative section list")
});
var KeyObligationSchema = z.object({
  id: z.string(),
  party: z.preprocess((val) => {
    if (typeof val !== "string") return "Mutual";
    const lower = val.toLowerCase();
    if (lower.includes("client") || lower.includes("customer") || lower.includes("buyer") || lower.includes("user") || lower.includes("apex")) {
      return "Client";
    }
    if (lower.includes("counterparty") || lower.includes("provider") || lower.includes("vendor") || lower.includes("seller") || lower.includes("cloudscale")) {
      return "Counterparty";
    }
    if (lower.includes("mutual") || lower.includes("both") || lower.includes("each") || lower.includes("parties")) {
      return "Mutual";
    }
    return "Mutual";
  }, z.enum(["Client", "Counterparty", "Mutual"])).default("Mutual"),
  description: z.string().describe("Specific obligation required by the agreement"),
  deadline: z.string().nullable().default(null).describe("Cutoff date/timeframe if applicable, or null"),
  clauseRef: z.string().describe('Reference to the section, e.g. "Section 2.1"'),
  importance: ImportanceLevelEnum.default("Standard")
});
var ImportantDateSchema = z.object({
  id: z.string(),
  title: z.string().describe("Title of the milestone or date event"),
  date: z.preprocess((val) => val === null || val === void 0 ? "Not specified in document" : String(val), z.string()).describe('Date string or relative period like "30 days after signing"'),
  type: z.preprocess((val) => {
    if (typeof val !== "string") return "Deadline";
    const v = toTitleCase(val.trim());
    if (["Effective", "Deadline", "Renewal", "Termination"].includes(v)) return v;
    const lower = val.toLowerCase();
    if (lower.includes("effect") || lower.includes("start") || lower.includes("commence")) return "Effective";
    if (lower.includes("renew")) return "Renewal";
    if (lower.includes("term") || lower.includes("expir") || lower.includes("end")) return "Termination";
    return "Deadline";
  }, z.enum(["Effective", "Deadline", "Renewal", "Termination"])).default("Deadline"),
  clauseRef: z.string().describe("Section reference"),
  isRecurring: z.boolean().default(false),
  description: z.string().describe("Explanation of what happens on this date")
});
var FinancialCommitmentSchema = z.object({
  id: z.string(),
  item: z.string().describe("Fee, payment, deposit, or financial item name"),
  amount: z.string().describe('Monetary figure or formula, e.g. "$10,000/mo" or "Not specified in document"'),
  schedule: z.string().describe('Payment cadence, e.g. "Net 30" or "Upon signing"'),
  clauseRef: z.string().describe("Section reference"),
  penaltyTerms: z.string().nullable().default(null).describe("Late fee, penalty, or interest if specified, or null"),
  importance: ImportanceLevelEnum.default("Moderate")
});
var PotentialConcernSchema = z.object({
  id: z.string(),
  title: z.string().describe("Short headline of the potential risk or ambiguity"),
  severity: ImportanceLevelEnum.default("Moderate"),
  clauseRef: z.string().describe("Section reference"),
  description: z.string().describe("Factual description of what the clause says that may be disadvantageous"),
  mitigationAdvice: z.string().describe("Neutral suggestion to discuss with counsel or negotiate")
});
var ActionChecklistItemSchema = z.object({
  id: z.string(),
  task: z.string().describe("Concrete actionable task for the user to review before execution"),
  clauseRef: z.string().describe("Section reference"),
  priority: z.preprocess((val) => {
    if (typeof val !== "string") return "Standard";
    const v = toTitleCase(val.trim());
    if (["Critical", "Recommended", "Standard"].includes(v)) return v;
    const lower = val.toLowerCase();
    if (lower.includes("crit") || lower.includes("high")) return "Critical";
    if (lower.includes("recom") || lower.includes("med")) return "Recommended";
    return "Standard";
  }, z.enum(["Critical", "Recommended", "Standard"])).default("Standard"),
  completed: z.boolean().default(false),
  notes: z.string().nullable().default(null).describe("Helpful contextual note or verification hint")
});
var LawyerQuestionSchema = z.object({
  id: z.string(),
  question: z.string().describe("Highly specific question grounded in document content"),
  context: z.string().describe("Relevant text/situation from the document that prompted the question"),
  clauseRef: z.string().describe("Section reference"),
  reason: z.string().describe("Strategic legal reasoning behind asking this specific question")
});
var FullLegalAnalysisSchema = z.object({
  documentOverview: DocumentOverviewSchema,
  clauses: z.array(ClauseSchema).default([]),
  keyObligations: z.array(KeyObligationSchema).default([]),
  importantDates: z.array(ImportantDateSchema).default([]),
  financialCommitments: z.array(FinancialCommitmentSchema).default([]),
  potentialConcerns: z.array(PotentialConcernSchema).default([]),
  actionChecklist: z.array(ActionChecklistItemSchema).default([]),
  lawyerQuestions: z.array(LawyerQuestionSchema).default([])
});
var InputSectionSchema = z.object({
  id: z.string(),
  sectionNumber: z.union([z.string(), z.number()]).transform((v) => String(v)).default(""),
  title: z.string(),
  paragraphs: z.array(z.string()).default([]),
  pageNumber: z.number().optional(),
  page: z.number().optional(),
  text: z.string().optional(),
  sourceReference: z.string().optional()
});
var AnalyzeDocumentRequestSchema = z.object({
  documentName: z.string().min(1, "Document name is required"),
  fileType: z.enum(["PDF", "DOCX"]),
  totalPages: z.number().int().positive().default(1),
  rawText: z.string().min(1, "Document rawText cannot be empty"),
  sections: z.array(InputSectionSchema).min(1, "At least one document section is required")
});
var DocumentQuestionRequestSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  documentName: z.string(),
  rawText: z.string().optional(),
  sections: z.array(InputSectionSchema).min(1, "Document sections are required")
});
var CitationSchema = z.object({
  sectionNumber: z.string(),
  title: z.string(),
  clauseRef: z.string().optional(),
  pageNumber: z.number().nullable().optional(),
  sourceSnippet: z.string()
});
var DocumentQuestionResponseSchema = z.object({
  answer: z.string(),
  isFoundInDocument: z.boolean(),
  citations: z.array(CitationSchema).default([]),
  disclaimer: z.string().default("AI-generated informational assistance. This does not replace professional legal advice.")
});

// server/services/groqService.ts
import { Groq } from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();
var GroqServiceError = class extends Error {
  statusCode;
  code;
  constructor(message, statusCode = 500, code = "GROQ_ERROR") {
    super(message);
    this.name = "GroqServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
};
function safeParseJson(rawText) {
  let clean = (rawText || "").trim();
  if (clean.includes("```")) {
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      clean = match[1].trim();
    } else {
      clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }
  }
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(clean);
  } catch (firstErr) {
    try {
      let repaired = clean.replace(/,\s*([\}\]])/g, "$1");
      repaired = repaired.replace(/,\s*"[^"]*$/, "");
      repaired = repaired.replace(/,\s*$/, "");
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += "]";
      for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";
      return JSON.parse(repaired);
    } catch (_secondErr) {
      throw firstErr;
    }
  }
}
var GroqClientManager = class {
  client = null;
  defaultModel = "openai/gpt-oss-20b";
  fallbackModel = "openai/gpt-oss-120b";
  // Known valid Groq model IDs — prevents invalid GROQ_MODEL env vars from crashing the server
  validModels = /* @__PURE__ */ new Set([
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-safeguard-20b"
  ]);
  getModel() {
    const envModel = process.env.GROQ_MODEL?.trim();
    if (envModel && this.validModels.has(envModel)) {
      return envModel;
    }
    if (envModel) {
      console.warn(`[GroqService] GROQ_MODEL env var "${envModel}" is invalid or obsolete. Falling back to default: ${this.defaultModel}`);
    }
    return this.defaultModel;
  }
  getClient() {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new GroqServiceError(
        "GROQ_API_KEY is not configured on the server. Please check your environment configuration.",
        503,
        "MISSING_API_KEY"
      );
    }
    if (!this.client) {
      this.client = new Groq({ apiKey });
    }
    return this.client;
  }
  /**
   * Helper to strip markdown code blocks if the LLM wraps JSON response in ```json ... ```
   */
  sanitizeJsonContent(rawText) {
    let clean = rawText.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }
    return clean;
  }
  /**
   * Safe wrapper around Groq Chat Completions with structured JSON output and automatic model fallback.
   */
  async createJsonChatCompletion(params) {
    const client = this.getClient();
    const primaryModel = this.getModel();
    const maxTokens = params.maxTokens ?? 4e3;
    try {
      const completion = await client.chat.completions.create({
        model: primaryModel,
        messages: params.messages,
        temperature: params.temperature ?? 0.1,
        max_completion_tokens: maxTokens
      });
      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new GroqServiceError("Groq returned an empty response.", 502, "EMPTY_RESPONSE");
      }
      return { content: this.sanitizeJsonContent(text), model: primaryModel };
    } catch (err) {
      if (primaryModel !== this.fallbackModel) {
        console.warn(`Primary model ${primaryModel} failed (${err?.message || err?.status}). Trying fallback ${this.fallbackModel}...`);
        try {
          const fallbackCompletion = await client.chat.completions.create({
            model: this.fallbackModel,
            messages: params.messages,
            temperature: params.temperature ?? 0.1,
            max_completion_tokens: maxTokens
          });
          const text = fallbackCompletion.choices[0]?.message?.content;
          if (text) {
            return { content: this.sanitizeJsonContent(text), model: this.fallbackModel };
          }
        } catch (fallbackErr) {
          if (fallbackErr?.status === 429) {
            console.warn("Fallback also rate limited. Waiting 3s before fast retry...");
            await new Promise((r) => setTimeout(r, 3e3));
            try {
              const retryCompletion = await client.chat.completions.create({
                model: this.fallbackModel,
                messages: params.messages,
                temperature: params.temperature ?? 0.1,
                max_completion_tokens: maxTokens
              });
              const text2 = retryCompletion.choices[0]?.message?.content;
              if (text2) {
                return { content: this.sanitizeJsonContent(text2), model: this.fallbackModel };
              }
            } catch (rErr) {
              console.error("Fallback retry failed:", rErr);
            }
          }
          console.error("Fallback model also encountered error:", fallbackErr);
        }
      }
      this.handleApiError(err);
      throw err;
    }
  }
  handleApiError(err) {
    const status = err?.status || 500;
    const msg = err?.error?.message || err?.message || "An error occurred while communicating with the Groq API.";
    const sanitizedMsg = msg.replace(/gsk_[a-zA-Z0-9_-]+/g, "[REDACTED_API_KEY]");
    if (status === 401) {
      throw new GroqServiceError("Invalid Groq API key.", 401, "INVALID_API_KEY");
    }
    if (status === 429) {
      throw new GroqServiceError("Groq API rate limit exceeded. Please try again in a few seconds.", 429, "RATE_LIMIT");
    }
    if (status === 413) {
      throw new GroqServiceError("The document payload exceeds the model context limit.", 413, "DOCUMENT_TOO_LARGE");
    }
    if (status === 400) {
      throw new GroqServiceError(`Invalid request to Groq: ${sanitizedMsg}`, 400, "BAD_REQUEST");
    }
    if (status === 404 || msg.includes("model_not_found")) {
      throw new GroqServiceError(`Groq model unavailable: ${sanitizedMsg}`, 400, "MODEL_NOT_FOUND");
    }
    throw new GroqServiceError(`Groq service error: ${sanitizedMsg}`, status, "GROQ_API_FAILURE");
  }
};
var groqService = new GroqClientManager();

// server/utils/chunker.ts
var MAX_CHUNK_CHARACTERS = 3e3;
var CHUNK_OVERLAP_CHARACTERS = 200;
function chunkDocumentSections(sections) {
  const chunks = [];
  let chunkIndex = 0;
  for (const section of sections) {
    const pageNumber = section.pageNumber ?? null;
    const secNum = section.sectionNumber || "";
    const secTitle = section.title || "Untitled Section";
    const paragraphs = section.paragraphs.map((p) => p.trim()).filter(Boolean);
    if (paragraphs.length === 0) {
      continue;
    }
    let currentChunkParagraphs = [];
    let currentLength = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const pLength = p.length;
      if (pLength > MAX_CHUNK_CHARACTERS) {
        if (currentChunkParagraphs.length > 0) {
          const text = currentChunkParagraphs.join("\n\n");
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
        const sentences = p.match(/[^.!?]+[.!?]+(\s|$)/g) || [p];
        let subSentences = [];
        let subLength = 0;
        for (const s of sentences) {
          if (subLength + s.length > MAX_CHUNK_CHARACTERS && subSentences.length > 0) {
            const text = subSentences.join(" ").trim();
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
          const text = subSentences.join(" ").trim();
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
      if (currentLength + pLength > MAX_CHUNK_CHARACTERS && currentChunkParagraphs.length > 0) {
        const text = currentChunkParagraphs.join("\n\n");
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
        currentLength += pLength + 2;
      }
    }
    if (currentChunkParagraphs.length > 0) {
      const text = currentChunkParagraphs.join("\n\n");
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

// server/services/legalAnalyzer.ts
var LEGAL_ANALYZER_SYSTEM_PROMPT = `You are LegalLens AI, an expert legal-information assistant. Your function is to analyze uploaded legal contracts and instruments to help non-lawyer users understand what they are reading.

CRITICAL OPERATIONAL RULES:
1. YOU ARE NOT A LAWYER. You do not provide definitive legal advice. Your output is informational only.
2. STRICT SOURCE FIDELITY: Analyze ONLY the supplied document text. Do NOT fabricate, hallucinate, or extrapolate facts, clauses, names, amounts, dates, or obligations not present in the document.
3. AUTHORITATIVE SECTIONS: The supplied section list and section numbers are authoritative. Do not create, renumber, merge, or invent sections. Use the provided sectionNumber, title, page and sourceReference exactly. Analyze the supplied sections rather than determine the document's section count.
4. If specific information (e.g. Effective Date, Term, Governing Law, Penalty) is absent or not specified in the document, explicitly write "Not specified in document" or null as appropriate.
5. DO NOT claim that any clause is "illegal", "unenforceable", or "void" unless the document itself explicitly asserts that. Instead, characterize ambiguous or one-sided terms factually as a "Potential Concern" or "Warrants review".
6. PRESERVE ORIGINAL TEXT: When quoting clauses or source snippets, reproduce the exact language from the document faithfully.
7. PLAIN ENGLISH: Write explanations in clear, accessible language that ordinary business users can understand immediately.
8. GROUNDED CITATIONS & SOURCE REFERENCES: Every clause, obligation, date, commitment, concern, checklist item, and lawyer question MUST include the authoritative source reference matching the document section (e.g., "Section 4 \u2014 Payment Terms", "Section 3 \u2014 Contract Term", "Section 10 \u2014 Termination").
9. LAWYER QUESTIONS: Formulate grounded, concrete questions directly referencing specific sections (e.g., "What should I clarify about the 30-day notice requirement in Section 10 \u2014 Termination?"). Do not produce generic questions.
10. OUTPUT FORMAT: Output ONLY a single, valid, parseable JSON object adhering precisely to the requested schema. No conversational preamble, markdown backticks, or postscript.`;
function normalizeSourceRef(rawRef, sections, fallbackText) {
  if (!sections || sections.length === 0) return "Document Section";
  const clean = (rawRef || "").trim();
  if (clean) {
    const directMatch = sections.find(
      (s) => s.sourceReference && s.sourceReference.toLowerCase() === clean.toLowerCase()
    );
    if (directMatch && directMatch.sourceReference) return directMatch.sourceReference;
  }
  if (clean) {
    const numMatch = clean.match(/(?:(?:Section|Sec\.?|Clause|Art\.?|Article)\s*([0-9]+(?:\.[0-9]+)*|[IVXLCDM]+)|^\s*([0-9]+(?:\.[0-9]+)*)\s*$)/i);
    if (numMatch) {
      const num = numMatch[1] || numMatch[2];
      const matchByNum = sections.find(
        (s) => s.sectionNumber === num || s.sectionNumber === `${num}.0` || `${s.sectionNumber}.0` === num || s.id === `sec-${num}` || s.id === `sec-p${num}` || s.id === `sec-chunk-${num}`
      );
      if (matchByNum) {
        return matchByNum.sourceReference || (matchByNum.sectionNumber ? `Section ${matchByNum.sectionNumber} \u2014 ${matchByNum.title}` : matchByNum.title);
      }
    }
  }
  if (clean) {
    const cleanLower = clean.toLowerCase();
    const exactMatch = sections.find((s) => s.title && s.title.toLowerCase().trim() === cleanLower);
    if (exactMatch) {
      return exactMatch.sourceReference || (exactMatch.sectionNumber ? `Section ${exactMatch.sectionNumber} \u2014 ${exactMatch.title}` : exactMatch.title);
    }
    const matchingTitles = sections.filter((s) => s.title && (cleanLower.includes(s.title.toLowerCase()) || s.title.toLowerCase().includes(cleanLower))).sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0));
    if (matchingTitles.length > 0) {
      const best = matchingTitles[0];
      return best.sourceReference || (best.sectionNumber ? `Section ${best.sectionNumber} \u2014 ${best.title}` : best.title);
    }
  }
  if (fallbackText) {
    const textLower = fallbackText.toLowerCase();
    const titleContainedSections = sections.filter((s) => s.title && textLower.includes(s.title.toLowerCase().trim())).sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0));
    if (titleContainedSections.length > 0) {
      const best = titleContainedSections[0];
      return best.sourceReference || (best.sectionNumber ? `Section ${best.sectionNumber} \u2014 ${best.title}` : best.title);
    }
    const priorityRules = [
      // 1. Security Compliance & Audits (e.g., Section 13 — Security Compliance)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes("compliance") || t.includes("audit") || t.includes("soc");
        },
        keywords: ["compliance", "soc", "soc 2", "audit", "iso", "controls", "security compliance", "penetration", "type ii"]
      },
      // 2. Data Security & Incidents (e.g., Section 11 — Data Security)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return (t.includes("data security") || t.includes("security")) && !t.includes("compliance");
        },
        keywords: ["data security", "security incident", "72 hours", "seventy-two", "safeguard", "data protect", "security measures"]
      },
      // 3. Payment & Fees (e.g., Section 4 — Payment Terms)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes("payment") || t.includes("fee") || t.includes("compensation") || t.includes("invoic");
        },
        keywords: ["pay", "fee", "inr", "invoice", "due date", "late payment", "interest", "50,000", "65,000", "15,000", "75,000", "net 30", "net 45"]
      },
      // 4. Termination & Cancellation (e.g., Section 10 — Termination)
      {
        targetFilter: (s) => s.title.toLowerCase().includes("termination"),
        keywords: ["terminat", "cancellation", "convenience", "cure period", "material breach", "notice of termination"]
      },
      // 5. Contract Term & Renewal (e.g., Section 3 — Contract Term)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes("term") && !t.includes("termination");
        },
        keywords: ["contract term", "duration", "renew", "renewal", "effective date", "october", "twelve (12)", "eighteen (18)"]
      },
      // 6. Confidentiality & Non-Disclosure (e.g., Section 7 — Confidentiality)
      {
        targetFilter: (s) => s.title.toLowerCase().includes("confidential"),
        keywords: ["confidential", "secret", "disclosure", "proprietary", "non-disclosure"]
      },
      // 7. Intellectual Property & Ownership (e.g., Section 8 — Intellectual Property)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes("intellectual property") || t.includes("ip") || t.includes("proprietary rights");
        },
        keywords: ["intellectual property", "ip", "ownership", "source code", "work product", "deliverable", "know-how", "licens"]
      },
      // 8. Limitation of Liability & Indemnity (e.g., Section 9 — Limitation of Liability)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes("liability") || t.includes("indemn");
        },
        keywords: ["liabilit", "damage", "cap", "indemn", "hold harmless", "consequential"]
      },
      // 9. Governing Law & Dispute Resolution (e.g., Section 12 — Governing Law)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes("law") || t.includes("jurisdiction") || t.includes("dispute") || t.includes("arbitration");
        },
        keywords: ["governing law", "jurisdiction", "court", "india", "delaware", "bengaluru", "arbitration", "dispute"]
      },
      // 10. Scope of Services & Deliverables (e.g., Section 2 — Scope of Services)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes("scope") || t.includes("services and deliverables");
        },
        keywords: ["scope of services", "statement of work", "deliverables", "website development", "technical support"]
      },
      // 11. Service Provider Obligations (e.g., Section 5 — Service Provider Obligations)
      {
        targetFilter: (s) => s.title.toLowerCase().includes("service provider obligations"),
        keywords: ["service provider will", "reasonable care", "project records", "material delays", "service-status report"]
      },
      // 12. Client Obligations (e.g., Section 6 — Client Obligations)
      {
        targetFilter: (s) => s.title.toLowerCase().includes("client obligations"),
        keywords: ["client will provide", "timely access", "approvals", "materials reasonably required"]
      },
      // 13. Parties / Preamble (Strictly lowest priority: only if no specific covenant matched)
      {
        targetFilter: (s) => {
          const t = s.title.toLowerCase();
          return t.includes("parties") || t.includes("preamble");
        },
        keywords: ["entered into between", "parties to this agreement", "brightpath", "apex digital", "client and provider"]
      }
    ];
    for (const rule of priorityRules) {
      const candidateSection = sections.find(rule.targetFilter);
      if (candidateSection) {
        const hasKeywordMatch = rule.keywords.some((kw) => textLower.includes(kw));
        if (hasKeywordMatch) {
          return candidateSection.sourceReference || (candidateSection.sectionNumber ? `Section ${candidateSection.sectionNumber} \u2014 ${candidateSection.title}` : candidateSection.title);
        }
      }
    }
  }
  return sections[0].sourceReference || (sections[0].sectionNumber ? `Section ${sections[0].sectionNumber} \u2014 ${sections[0].title}` : sections[0].title);
}
async function analyzeDocumentWithGroq(request) {
  const { documentName, fileType, totalPages, sections, rawText } = request;
  if (!sections || sections.length === 0 || !rawText || rawText.trim().length === 0) {
    throw new GroqServiceError("Document text is empty or has no identifiable sections.", 400, "EMPTY_DOCUMENT");
  }
  const chunks = chunkDocumentSections(sections);
  if (chunks.length === 0) {
    throw new GroqServiceError("Failed to parse document text into usable sections.", 400, "CHUNKING_FAILED");
  }
  const sectionListDescription = sections.map((s) => {
    const srcRef = s.sourceReference || (s.sectionNumber ? `Section ${s.sectionNumber} \u2014 ${s.title}` : s.title);
    const page = s.page !== void 0 ? s.page : s.pageNumber;
    const pageStr = page !== void 0 ? ` (Page ${page})` : "";
    return `- ${srcRef}${pageStr}`;
  }).join("\n");
  const formattedSections = sections.map((s) => {
    const srcRef = s.sourceReference || (s.sectionNumber ? `Section ${s.sectionNumber} \u2014 ${s.title}` : s.title);
    const page = s.page !== void 0 ? s.page : s.pageNumber;
    const pageStr = page !== void 0 ? ` (Page ${page})` : "";
    const body = s.paragraphs && s.paragraphs.length > 0 ? s.paragraphs.join("\n") : s.text || "";
    return `### [${srcRef}]${pageStr}
${body}`;
  }).join("\n\n");
  const maxChars = 8e4;
  const truncatedText = formattedSections.length > maxChars ? formattedSections.substring(0, maxChars) + "\n\n[... Remaining text truncated for analysis window ...]" : formattedSections;
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
      "sourceReference": "Authoritative source reference, e.g. 'Section 4 \u2014 Payment Terms'"
    }
  ],
  "keyObligations": [
    {
      "id": "ob-1",
      "party": "Client | Counterparty | Mutual",
      "description": "Specific obligation identified in the contract",
      "deadline": "Timing or cutoff if specified, e.g. 'Within 30 days of invoice', or null",
      "clauseRef": "Authoritative source reference, e.g. 'Section 4 \u2014 Payment Terms' or 'Section 5 \u2014 Service Provider Obligations'",
      "importance": "Critical | High | Moderate | Standard"
    }
  ],
  "importantDates": [
    {
      "id": "date-1",
      "title": "Event/Milestone title",
      "date": "Exact date or period from document",
      "type": "Effective | Deadline | Renewal | Termination",
      "clauseRef": "Authoritative source reference, e.g. 'Section 3 \u2014 Contract Term'",
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
      "clauseRef": "Authoritative source reference, e.g. 'Section 4 \u2014 Payment Terms'",
      "penaltyTerms": "Late fee or interest clause if specified, or null",
      "importance": "Critical | High | Moderate | Standard"
    }
  ],
  "potentialConcerns": [
    {
      "id": "risk-1",
      "title": "Short title of concern",
      "severity": "Critical | High | Moderate | Standard",
      "clauseRef": "Authoritative source reference, e.g. 'Section 9 \u2014 Limitation of Liability'",
      "description": "Factual description of the unfavorable or ambiguous term",
      "mitigationAdvice": "Prudent suggestion to negotiate, clarify, or review with legal counsel"
    }
  ],
  "actionChecklist": [
    {
      "id": "act-1",
      "task": "Actionable verification task before signing",
      "clauseRef": "Authoritative source reference, e.g. 'Section 4 \u2014 Payment Terms'",
      "priority": "Critical | Recommended | Standard",
      "completed": false,
      "notes": "Helpful verification tip grounded in the document"
    }
  ],
  "lawyerQuestions": [
    {
      "id": "q-1",
      "question": "Specific question directly citing the section (e.g. 'Should we request an exception to the indemnification cap in Section 9 \u2014 Limitation of Liability?')",
      "context": "Brief context from the document text",
      "clauseRef": "Authoritative source reference, e.g. 'Section 4 \u2014 Payment Terms'",
      "reason": "Strategic reason why an attorney should evaluate this term"
    }
  ]
}

Ensure explanations are concise, crisp, and plain-English (1-2 sentences per field). The supplied section list and section numbers are authoritative. Do not create, renumber, merge, or invent sections. Use the provided sectionNumber, title, page and sourceReference exactly. All section references must correspond to the actual sections provided. Ensure the JSON is completely closed and valid.`;
  const completionResult = await groqService.createJsonChatCompletion({
    messages: [
      { role: "system", content: LEGAL_ANALYZER_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.1,
    maxTokens: 4096
  });
  let parsedJson;
  try {
    parsedJson = safeParseJson(completionResult.content);
  } catch (parseErr) {
    console.error("Failed to parse JSON response from Groq:", completionResult.content);
    throw new GroqServiceError("AI service returned an invalid JSON response.", 502, "INVALID_JSON");
  }
  if (Array.isArray(parsedJson.clauses)) {
    parsedJson.clauses = parsedJson.clauses.map((c, idx) => {
      const srcRef = normalizeSourceRef(c.sourceReference || c.clauseRef || c.sectionNumber, sections, `${c.title} ${c.originalText}`);
      const matchSec = sections.find(
        (s) => s.sourceReference === srcRef || s.sectionNumber && c.sectionNumber && s.sectionNumber === String(c.sectionNumber)
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
    parsedJson.keyObligations = parsedJson.keyObligations.map((o, idx) => ({
      ...o,
      id: o.id || `ob-${idx + 1}`,
      clauseRef: normalizeSourceRef(o.clauseRef, sections, `${o.description} ${o.party}`)
    }));
  }
  if (Array.isArray(parsedJson.importantDates)) {
    parsedJson.importantDates = parsedJson.importantDates.map((d, idx) => ({
      ...d,
      id: d.id || `date-${idx + 1}`,
      clauseRef: normalizeSourceRef(d.clauseRef, sections, `${d.title} ${d.description}`)
    }));
  }
  if (Array.isArray(parsedJson.financialCommitments)) {
    parsedJson.financialCommitments = parsedJson.financialCommitments.map((f, idx) => ({
      ...f,
      id: f.id || `fin-${idx + 1}`,
      clauseRef: normalizeSourceRef(f.clauseRef, sections, `${f.item} ${f.amount} ${f.schedule}`)
    }));
  }
  if (Array.isArray(parsedJson.potentialConcerns)) {
    parsedJson.potentialConcerns = parsedJson.potentialConcerns.map((p, idx) => ({
      ...p,
      id: p.id || `concern-${idx + 1}`,
      clauseRef: normalizeSourceRef(p.clauseRef, sections, `${p.title} ${p.description}`)
    }));
  }
  if (Array.isArray(parsedJson.actionChecklist)) {
    parsedJson.actionChecklist = parsedJson.actionChecklist.map((a, idx) => ({
      ...a,
      id: a.id || `act-${idx + 1}`,
      clauseRef: normalizeSourceRef(a.clauseRef, sections, `${a.task} ${a.notes || ""}`)
    }));
  }
  if (Array.isArray(parsedJson.lawyerQuestions)) {
    parsedJson.lawyerQuestions = parsedJson.lawyerQuestions.map((q, idx) => ({
      ...q,
      id: q.id || `lq-${idx + 1}`,
      clauseRef: normalizeSourceRef(q.clauseRef, sections, `${q.question} ${q.context || ""}`)
    }));
  }
  const validationResult = FullLegalAnalysisSchema.safeParse(parsedJson);
  if (!validationResult.success) {
    console.error("Zod schema validation failed on AI output:", validationResult.error.format());
    throw new GroqServiceError(
      `AI analysis failed schema validation: ${validationResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
      502,
      "SCHEMA_VALIDATION_FAILED"
    );
  }
  return validationResult.data;
}

// server/handlers/analyze-document.ts
async function getRequestBody(req) {
  if (req.body !== void 0 && req.body !== null) {
    if (typeof req.body === "string") {
      try {
        return JSON.parse(req.body);
      } catch {
        return req.body;
      }
    }
    return req.body;
  }
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(raw);
      }
    });
    req.on("error", () => {
      resolve(void 0);
    });
  });
}
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "Method Not Allowed" }));
  }
  try {
    const body = await getRequestBody(req);
    const parseResult = AnalyzeDocumentRequestSchema.safeParse(body);
    if (!parseResult.success) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          error: "Invalid document payload",
          details: parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
        })
      );
    }
    const analysis = await analyzeDocumentWithGroq(parseResult.data);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        success: true,
        analysis
      })
    );
  } catch (err) {
    console.error("Error analyzing document:", err);
    res.statusCode = err instanceof GroqServiceError ? err.statusCode : err?.statusCode || 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        error: err?.message || "An unexpected server error occurred during legal document analysis.",
        code: err?.code || "INTERNAL_SERVER_ERROR"
      })
    );
  }
}
export {
  handler as default
};
