// server/schemas/documentComparisonSchema.ts
import { z as z2 } from "zod";

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

// server/schemas/documentComparisonSchema.ts
var ComparisonChangeTypeEnum = z2.preprocess((val) => {
  if (typeof val !== "string") return "MODIFIED";
  const u = val.trim().toUpperCase();
  if (["ADDED", "REMOVED", "MODIFIED", "UNCHANGED"].includes(u)) return u;
  if (u.includes("ADD") || u.includes("INSERT")) return "ADDED";
  if (u.includes("REM") || u.includes("DEL")) return "REMOVED";
  if (u.includes("MOD") || u.includes("CHG") || u.includes("EDIT")) return "MODIFIED";
  if (u.includes("SAME") || u.includes("UNCH")) return "UNCHANGED";
  return "MODIFIED";
}, z2.enum(["ADDED", "REMOVED", "MODIFIED", "UNCHANGED"]));
var ComparisonCategoryEnum = z2.preprocess((val) => {
  if (typeof val !== "string") return "GENERAL";
  const u = val.trim().toUpperCase();
  const valid = [
    "PAYMENT",
    "TERMINATION",
    "LIABILITY",
    "CONFIDENTIALITY",
    "OBLIGATION",
    "DEADLINE",
    "RESTRICTION",
    "GOVERNING_LAW",
    "RENEWAL",
    "GENERAL"
  ];
  if (valid.includes(u)) return u;
  if (u.includes("PAY") || u.includes("FEE") || u.includes("COMP")) return "PAYMENT";
  if (u.includes("TERM") || u.includes("CANCEL")) return "TERMINATION";
  if (u.includes("LIAB") || u.includes("INDEMN") || u.includes("DAMAG")) return "LIABILITY";
  if (u.includes("CONFID") || u.includes("SECRET") || u.includes("NDA")) return "CONFIDENTIALITY";
  if (u.includes("DEAD") || u.includes("DATE") || u.includes("TIME")) return "DEADLINE";
  if (u.includes("REST") || u.includes("PROHIB")) return "RESTRICTION";
  if (u.includes("LAW") || u.includes("JURIS") || u.includes("DISP")) return "GOVERNING_LAW";
  if (u.includes("RENEW")) return "RENEWAL";
  if (u.includes("OBLIG") || u.includes("DUTY") || u.includes("RESP")) return "OBLIGATION";
  return "GENERAL";
}, z2.enum([
  "PAYMENT",
  "TERMINATION",
  "LIABILITY",
  "CONFIDENTIALITY",
  "OBLIGATION",
  "DEADLINE",
  "RESTRICTION",
  "GOVERNING_LAW",
  "RENEWAL",
  "GENERAL"
]));
var ComparisonSeverityEnum = z2.preprocess((val) => {
  if (typeof val !== "string") return "MODERATE";
  const u = val.trim().toUpperCase();
  const valid = ["CRITICAL", "HIGH", "MODERATE", "LOW", "INFORMATIONAL"];
  if (valid.includes(u)) return u;
  if (u.includes("CRIT")) return "CRITICAL";
  if (u.includes("HIGH")) return "HIGH";
  if (u.includes("MOD") || u.includes("MED")) return "MODERATE";
  if (u.includes("LOW")) return "LOW";
  if (u.includes("INFO") || u.includes("NOTE") || u.includes("STAN")) return "INFORMATIONAL";
  return "MODERATE";
}, z2.enum(["CRITICAL", "HIGH", "MODERATE", "LOW", "INFORMATIONAL"]));
var ComparisonClauseChangeSchema = z2.object({
  id: z2.string(),
  changeType: ComparisonChangeTypeEnum,
  category: ComparisonCategoryEnum,
  severity: ComparisonSeverityEnum,
  sectionNumber: z2.string().describe('Section number like "3.1" or "Section 4"'),
  sectionTitle: z2.string().describe("Section or clause title"),
  oldText: z2.string().nullable().default(null).describe("Original text in Document A, or null if added"),
  newText: z2.string().nullable().default(null).describe("Revised text in Document B, or null if removed"),
  explanation: z2.string().describe("Plain English explanation of what specifically changed"),
  whyItMatters: z2.string().describe("Practical business and operational implications"),
  legalImpact: z2.string().describe("Legal and commercial exposure evaluation"),
  actionRequired: z2.string().nullable().default(null).describe("Informational recommendation or verification action"),
  pageNumberA: z2.number().nullable().default(null),
  pageNumberB: z2.number().nullable().default(null),
  sourceA: z2.string().nullable().default(null).describe("Exact snippet citation from Document A"),
  sourceB: z2.string().nullable().default(null).describe("Exact snippet citation from Document B")
});
var ComparisonSummarySchema = z2.object({
  totalChanges: z2.number().int().nonnegative().default(0),
  addedCount: z2.number().int().nonnegative().default(0),
  removedCount: z2.number().int().nonnegative().default(0),
  modifiedCount: z2.number().int().nonnegative().default(0),
  unchangedCount: z2.number().int().nonnegative().default(0),
  executiveSummary: z2.string().describe("High-level executive overview of the differences between the two contract versions")
});
var KeyChangeSchema = z2.object({
  id: z2.string(),
  title: z2.string(),
  description: z2.string(),
  category: ComparisonCategoryEnum,
  severity: ComparisonSeverityEnum,
  clauseRef: z2.string()
});
var RiskChangeSchema = z2.object({
  id: z2.string(),
  title: z2.string(),
  description: z2.string(),
  severity: ComparisonSeverityEnum,
  clauseRef: z2.string(),
  mitigation: z2.string().describe("Actionable suggestion to negotiate or clarify")
});
var ComparisonPartyEnum = z2.preprocess((val) => {
  if (typeof val !== "string") return "Mutual";
  const u = val.trim().toLowerCase();
  if (u.includes("client") || u.includes("customer") || u.includes("buyer") || u.includes("licensee") || u.includes("tenant")) {
    return "Client";
  }
  if (u.includes("provider") || u.includes("vendor") || u.includes("counterparty") || u.includes("seller") || u.includes("licensor") || u.includes("landlord")) {
    return "Counterparty";
  }
  return "Mutual";
}, z2.enum(["Client", "Counterparty", "Mutual"]));
var ComparisonPriorityEnum = z2.preprocess((val) => {
  if (typeof val !== "string") return "Standard";
  const u = val.trim().toLowerCase();
  if (u.includes("crit")) return "Critical";
  if (u.includes("rec") || u.includes("high") || u.includes("med") || u.includes("mod")) return "Recommended";
  return "Standard";
}, z2.enum(["Critical", "Recommended", "Standard"]));
var ChangedObligationSchema = z2.object({
  party: ComparisonPartyEnum.default("Mutual"),
  oldObligation: z2.string().nullable().default(null),
  newObligation: z2.string().nullable().default(null),
  impact: z2.string(),
  clauseRef: z2.string()
});
var ChangedDeadlineSchema = z2.object({
  title: z2.string(),
  oldDeadline: z2.string().nullable().default(null),
  newDeadline: z2.string().nullable().default(null),
  impact: z2.string(),
  clauseRef: z2.string()
});
var ChangedFinancialTermSchema = z2.object({
  item: z2.string(),
  oldValue: z2.string().nullable().default(null),
  newValue: z2.string().nullable().default(null),
  impact: z2.string(),
  clauseRef: z2.string()
});
var FullComparisonResultSchema = z2.object({
  documentA: z2.object({
    fileName: z2.string(),
    documentType: z2.string().default("Original Legal Document"),
    fileSize: z2.string().optional(),
    totalPages: z2.number().optional()
  }),
  documentB: z2.object({
    fileName: z2.string(),
    documentType: z2.string().default("Revised Legal Document"),
    fileSize: z2.string().optional(),
    totalPages: z2.number().optional()
  }),
  summary: ComparisonSummarySchema,
  changes: z2.array(ComparisonClauseChangeSchema).default([]),
  keyChanges: z2.array(KeyChangeSchema).default([]),
  riskChanges: z2.array(RiskChangeSchema).default([]),
  changedObligations: z2.array(ChangedObligationSchema).default([]),
  changedDeadlines: z2.array(ChangedDeadlineSchema).default([]),
  changedFinancialTerms: z2.array(ChangedFinancialTermSchema).default([]),
  actionChecklist: z2.array(z2.object({
    id: z2.string(),
    task: z2.string(),
    clauseRef: z2.string(),
    priority: ComparisonPriorityEnum.default("Standard"),
    completed: z2.boolean().default(false),
    notes: z2.string().nullable().optional()
  })).default([]),
  lawyerQuestions: z2.array(z2.object({
    id: z2.string(),
    question: z2.string(),
    context: z2.string(),
    clauseRef: z2.string(),
    reason: z2.string()
  })).default([]),
  disclaimer: z2.string().default("LegalLens AI provides informational assistance based on the comparison of the two uploaded documents and does not replace professional legal advice.")
});
var DocumentInputSchema = z2.object({
  name: z2.string().min(1, "Document name is required"),
  fileType: z2.enum(["PDF", "DOCX"]),
  fileSize: z2.string().optional(),
  totalPages: z2.number().int().positive().default(1),
  rawText: z2.string().min(1, "Document text cannot be empty"),
  sections: z2.array(InputSectionSchema).min(1, "At least one section is required")
});
var CompareDocumentsRequestSchema = z2.object({
  documentA: DocumentInputSchema,
  documentB: DocumentInputSchema
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
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-safeguard-20b",
    "qwen/qwen3.8-27b",
    "allam-2-7b",
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-70b-8192",
    "llama3-8b-8192",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
    "deepseek-r1-distill-llama-70b"
  ]);
  getModel() {
    const envModel = process.env.GROQ_MODEL?.trim();
    if (envModel && this.validModels.has(envModel)) {
      return envModel;
    }
    if (envModel) {
      console.warn(`[GroqService] GROQ_MODEL env var "${envModel}" is invalid. Falling back to default: ${this.defaultModel}`);
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

// server/services/comparisonService.ts
function normalizeSectionNumber(numStr) {
  if (!numStr) return "";
  return numStr.toLowerCase().replace(/^section\s+/i, "").replace(/^article\s+/i, "").replace(/[:.]/g, "").trim();
}
function normalizeTitle(title) {
  if (!title) return "";
  return title.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}
function computeTitleSimilarity(titleA, titleB) {
  const wordsA = new Set(normalizeTitle(titleA).split(" ").filter((w) => w.length > 2));
  const wordsB = new Set(normalizeTitle(titleB).split(" ").filter((w) => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection++;
  }
  const union = (/* @__PURE__ */ new Set([...wordsA, ...wordsB])).size;
  return union === 0 ? 0 : intersection / union;
}
function alignDocumentSections(sectionsA, sectionsB) {
  const pairs = [];
  const matchedBIndices = /* @__PURE__ */ new Set();
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
        score = 1;
      } else if (titleSim >= 0.4) {
        score = 0.5 + titleSim * 0.4;
        if (normNumA && normNumB && normNumA === normNumB) {
          score += 0.1;
        }
      } else if (normNumA && normNumB && normNumA === normNumB) {
        if (!normTitleA || !normTitleB) {
          score = 0.6;
        } else if (titleSim > 0.1) {
          score = 0.4 + titleSim * 0.3;
        } else {
          score = 0;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatchIdx = j;
      }
    }
    if (bestMatchIdx !== -1 && bestScore >= 0.4) {
      matchedBIndices.add(bestMatchIdx);
      const secB = sectionsB[bestMatchIdx];
      pairs.push({
        status: "MATCHED",
        sectionA: secA,
        sectionB: secB,
        sectionNumber: secB.sectionNumber || secA.sectionNumber || "",
        title: secB.title || secA.title,
        similarityScore: bestScore
      });
    } else {
      pairs.push({
        status: "REMOVED_FROM_A",
        sectionA: secA,
        sectionNumber: secA.sectionNumber || "",
        title: secA.title,
        similarityScore: 0
      });
    }
  }
  for (let j = 0; j < sectionsB.length; j++) {
    if (!matchedBIndices.has(j)) {
      const secB = sectionsB[j];
      pairs.push({
        status: "ADDED_IN_B",
        sectionB: secB,
        sectionNumber: secB.sectionNumber || "",
        title: secB.title,
        similarityScore: 0
      });
    }
  }
  return pairs;
}
var COMPARISON_SYSTEM_PROMPT = `You are LegalLens AI Redline & Contract Comparison Specialist. Your objective is to perform a strict, factual legal comparison between Document A (Baseline) and Document B (Revised).

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
async function compareDocumentsWithGroq(request) {
  const { documentA, documentB } = request;
  if (!documentA.rawText || documentA.rawText.trim().length === 0) {
    throw new GroqServiceError("Document A contains no extractable text.", 400, "EMPTY_DOCUMENT_A");
  }
  if (!documentB.rawText || documentB.rawText.trim().length === 0) {
    throw new GroqServiceError("Document B contains no extractable text.", 400, "EMPTY_DOCUMENT_B");
  }
  const alignedPairs = alignDocumentSections(documentA.sections, documentB.sections);
  const formattedPairsText = alignedPairs.map((pair, idx) => {
    if (pair.status === "MATCHED") {
      const textA = pair.sectionA?.paragraphs.join("\n") || "";
      const textB = pair.sectionB?.paragraphs.join("\n") || "";
      return `[PAIR ${idx + 1}] ALIGNED SECTION: ${pair.sectionNumber ? `Section ${pair.sectionNumber} - ` : ""}${pair.title}
--- DOCUMENT A (BASELINE - Page ${pair.sectionA?.pageNumber || 1}) ---
${textA}
--- DOCUMENT B (REVISED - Page ${pair.sectionB?.pageNumber || 1}) ---
${textB}
--- END PAIR ---`;
    } else if (pair.status === "ADDED_IN_B") {
      const textB = pair.sectionB?.paragraphs.join("\n") || "";
      return `[PAIR ${idx + 1}] NEW SECTION INSERTED IN DOCUMENT B: ${pair.sectionNumber ? `Section ${pair.sectionNumber} - ` : ""}${pair.title} (Page ${pair.sectionB?.pageNumber || 1})
--- DOCUMENT B CONTENT ---
${textB}
--- END PAIR ---`;
    } else {
      const textA = pair.sectionA?.paragraphs.join("\n") || "";
      return `[PAIR ${idx + 1}] SECTION REMOVED FROM DOCUMENT A: ${pair.sectionNumber ? `Section ${pair.sectionNumber} - ` : ""}${pair.title} (Page ${pair.sectionA?.pageNumber || 1})
--- DOCUMENT A CONTENT (DELETED) ---
${textA}
--- END PAIR ---`;
    }
  }).join("\n\n");
  const maxChars = 75e3;
  const truncatedPairs = formattedPairsText.length > maxChars ? formattedPairsText.substring(0, maxChars) + "\n\n[... Remaining aligned sections truncated for token budget ...]" : formattedPairsText;
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
    "fileSize": "${documentA.fileSize || "Unknown"}",
    "totalPages": ${documentA.totalPages || 1}
  },
  "documentB": {
    "fileName": "${documentB.name}",
    "documentType": "${documentB.fileType} Contract (Revised Redline)",
    "fileSize": "${documentB.fileSize || "Unknown"}",
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
  const completion = await groqService.createJsonChatCompletion({
    messages: [
      { role: "system", content: COMPARISON_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.1,
    maxTokens: 4096
  });
  let parsedJson;
  try {
    parsedJson = safeParseJson(completion.content);
  } catch (err) {
    console.error("Failed to parse Groq comparison JSON:", completion.content);
    throw new GroqServiceError("AI service returned an unparseable response for document comparison.", 502, "INVALID_JSON");
  }
  if (Array.isArray(parsedJson.changes)) {
    parsedJson.changes = parsedJson.changes.map((c, i) => ({
      ...c,
      id: c.id || `chg-${i + 1}`
    }));
  }
  if (Array.isArray(parsedJson.keyChanges)) {
    parsedJson.keyChanges = parsedJson.keyChanges.map((k, i) => ({
      ...k,
      id: k.id || `kc-${i + 1}`
    }));
  }
  if (Array.isArray(parsedJson.riskChanges)) {
    parsedJson.riskChanges = parsedJson.riskChanges.map((r, i) => ({
      ...r,
      id: r.id || `rc-${i + 1}`
    }));
  }
  if (Array.isArray(parsedJson.actionChecklist)) {
    parsedJson.actionChecklist = parsedJson.actionChecklist.map((a, i) => ({
      ...a,
      id: a.id || `act-comp-${i + 1}`
    }));
  }
  if (Array.isArray(parsedJson.lawyerQuestions)) {
    parsedJson.lawyerQuestions = parsedJson.lawyerQuestions.map((q, i) => ({
      ...q,
      id: q.id || `lq-comp-${i + 1}`
    }));
  }
  if (parsedJson.summary && Array.isArray(parsedJson.changes)) {
    const changes = parsedJson.changes;
    const added = changes.filter((c) => String(c.changeType).toUpperCase() === "ADDED").length;
    const removed = changes.filter((c) => String(c.changeType).toUpperCase() === "REMOVED").length;
    const modified = changes.filter((c) => String(c.changeType).toUpperCase() === "MODIFIED").length;
    const unchanged = changes.filter((c) => String(c.changeType).toUpperCase() === "UNCHANGED").length;
    parsedJson.summary.addedCount = added;
    parsedJson.summary.removedCount = removed;
    parsedJson.summary.modifiedCount = modified;
    parsedJson.summary.unchangedCount = unchanged;
    parsedJson.summary.totalChanges = added + removed + modified;
  }
  const validated = FullComparisonResultSchema.safeParse(parsedJson);
  if (!validated.success) {
    console.error("Comparison schema validation failed:", validated.error.format());
    throw new GroqServiceError(
      `Comparison output failed validation: ${validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
      502,
      "SCHEMA_VALIDATION_FAILED"
    );
  }
  return validated.data;
}

// server/api/compare-documents.ts
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
    const parseResult = CompareDocumentsRequestSchema.safeParse(body);
    if (!parseResult.success) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          error: "Invalid document comparison request payload",
          details: parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
        })
      );
    }
    const comparison = await compareDocumentsWithGroq(parseResult.data);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        success: true,
        comparison
      })
    );
  } catch (err) {
    console.error("Error comparing documents:", err);
    res.statusCode = err instanceof GroqServiceError ? err.statusCode : err?.statusCode || 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        error: err?.message || "An unexpected server error occurred during document comparison.",
        code: err?.code || "INTERNAL_SERVER_ERROR"
      })
    );
  }
}
export {
  handler as default
};
