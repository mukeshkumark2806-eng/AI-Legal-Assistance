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
var _FullLegalAnalysisSchema = z.object({
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
var _AnalyzeDocumentRequestSchema = z.object({
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
      let repaired = clean.replace(/,\s*([}\]])/g, "$1");
      repaired = repaired.replace(/,\s*"[^"]*$/, "");
      repaired = repaired.replace(/,\s*$/, "");
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += "]";
      for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";
      return JSON.parse(repaired);
    } catch {
      throw firstErr;
    }
  }
}
var GroqClientManager = class {
  client = null;
  defaultModel = "qwen/qwen3.8-27b";
  fallbackModel = "openai/gpt-oss-120b";
  // Known valid Groq model IDs — prevents invalid GROQ_MODEL env vars from crashing the server
  validModels = /* @__PURE__ */ new Set([
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
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
      if (err?.status === 429) {
        console.warn(`Primary model ${primaryModel} rate limited. Waiting 3s before retry...`);
        await new Promise((r) => setTimeout(r, 3e3));
        try {
          const retryCompletion = await client.chat.completions.create({
            model: primaryModel,
            messages: params.messages,
            temperature: params.temperature ?? 0.1,
            max_completion_tokens: maxTokens
          });
          const text = retryCompletion.choices[0]?.message?.content;
          if (text) {
            return { content: this.sanitizeJsonContent(text), model: primaryModel };
          }
        } catch (retryErr) {
          console.warn(`Primary model retry failed (${retryErr?.message || retryErr?.status}). Proceeding to fallback...`);
        }
      }
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

// server/services/qaService.ts
var QA_SYSTEM_PROMPT = `You are LegalLens Document Assistant. Your job is to answer user questions strictly and solely based on the provided document excerpts.

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
function retrieveRelevantSections(question, sections, topK = 4) {
  const normalizedQuestion = question.toLowerCase();
  const qTokens = normalizedQuestion.replace(/[^\w\s]/g, "").split(/\s+/).filter((t) => t.length > 2);
  const intentKeywords = {
    termination: ["terminate", "cancellation", "convenience", "cure", "breach", "exit", "expire", "end"],
    payment: ["pay", "fee", "invoice", "due", "amount", "compensation", "billing", "cost", "charge", "price"],
    confidentiality: ["confidential", "secret", "disclosure", "proprietary", "non-disclosure"],
    liability: ["liability", "indemnif", "hold harmless", "damages", "consequential", "loss", "remedy"],
    term: ["term", "duration", "effective", "period", "renewal", "auto-renew", "year", "month"],
    dispute: ["law", "jurisdiction", "arbitration", "court", "venue", "governing", "delaware", "new york", "california"],
    obligations: ["obligation", "duties", "responsibilities", "deliver", "provide", "require", "shall"],
    rights: ["rights", "license", "ownership", "intellectual property", "ip"],
    security: ["security", "soc", "compliance", "safeguard", "incident", "data"]
  };
  const expandedTokens = new Set(qTokens);
  for (const [_, terms] of Object.entries(intentKeywords)) {
    if (terms.some((t) => normalizedQuestion.includes(t))) {
      terms.forEach((t) => expandedTokens.add(t));
    }
  }
  const scoredSections = sections.map((section) => {
    let score = 0;
    const titleLower = (section.title || "").toLowerCase();
    const secNumLower = (section.sectionNumber || "").toLowerCase();
    const paragraphs = section.paragraphs && section.paragraphs.length > 0 ? section.paragraphs : section.text ? [section.text] : [];
    const bodyLower = paragraphs.join(" ").toLowerCase();
    if (secNumLower && normalizedQuestion.includes(secNumLower)) {
      score += 50;
    }
    expandedTokens.forEach((token) => {
      if (titleLower.includes(token)) {
        score += 15;
      }
      if (bodyLower.includes(token)) {
        const count = (bodyLower.match(new RegExp(token, "g")) || []).length;
        score += Math.min(count, 5) * 2;
      }
    });
    return { section, score };
  });
  if (sections.length <= topK) {
    return sections;
  }
  scoredSections.sort((a, b) => b.score - a.score);
  const topSections = scoredSections.filter((s) => s.score > 0).slice(0, topK).map((s) => s.section);
  if (topSections.length === 0) {
    return sections.slice(0, topK);
  }
  return topSections;
}
async function answerDocumentQuestion(request) {
  const { question, documentName, sections } = request;
  if (!question || question.trim().length === 0) {
    throw new GroqServiceError("Question cannot be empty.", 400, "EMPTY_QUESTION");
  }
  if (!sections || sections.length === 0) {
    throw new GroqServiceError("No document sections provided for Q&A.", 400, "NO_SECTIONS");
  }
  const relevantSections = retrieveRelevantSections(question, sections, 4);
  const contextSnippet = relevantSections.map((s) => {
    const page = s.page !== void 0 ? s.page : s.pageNumber;
    const pageStr = page !== void 0 ? ` (Page ${page})` : "";
    const srcRef = s.sourceReference || (s.sectionNumber ? `Section ${s.sectionNumber} \u2014 ${s.title}` : s.title);
    const body = s.paragraphs && s.paragraphs.length > 0 ? s.paragraphs.join("\n") : s.text || "";
    return `--- BEGIN SECTION: [${srcRef}]${pageStr} ---
${body}
--- END SECTION ---`;
  }).join("\n\n");
  const userPrompt = `Document: "${documentName}"

EXCERPTED SECTIONS FROM DOCUMENT:
${contextSnippet}

USER INQUIRY:
"${question}"

Analyze only the provided excerpts above. The supplied section numbers and titles are authoritative. Answer the user question accurately. If the document excerpts do not mention or answer this question, state: "I couldn't find this information in the uploaded document." and set "isFoundInDocument": false. Return JSON.`;
  const completion = await groqService.createJsonChatCompletion({
    messages: [
      { role: "system", content: QA_SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.05,
    maxTokens: 1500
  });
  let parsed;
  try {
    parsed = safeParseJson(completion.content);
  } catch {
    throw new GroqServiceError("Failed to parse AI response for document Q&A.", 502, "INVALID_JSON");
  }
  if (Array.isArray(parsed?.citations)) {
    parsed.citations = parsed.citations.map((c) => {
      const cSecStr = c.sectionNumber ? String(c.sectionNumber).trim() : "";
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
      const secNum = matchSec?.sectionNumber ? `Section ${matchSec.sectionNumber}` : c.sectionNumber || "Section";
      const title = matchSec?.title || c.title || "Document Section";
      const clauseRef = matchSec?.sourceReference || (matchSec?.sectionNumber ? `Section ${matchSec.sectionNumber} \u2014 ${matchSec.title}` : title);
      return {
        ...c,
        sectionNumber: secNum,
        title,
        clauseRef,
        pageNumber: matchSec?.page || matchSec?.pageNumber || c.pageNumber || null
      };
    });
  }
  const validated = DocumentQuestionResponseSchema.safeParse(parsed);
  if (!validated.success) {
    return {
      answer: parsed?.answer || "I couldn't find this information in the uploaded document.",
      isFoundInDocument: Boolean(parsed?.isFoundInDocument),
      citations: Array.isArray(parsed?.citations) ? parsed.citations : [],
      disclaimer: "AI-generated informational assistance. This does not replace professional legal advice."
    };
  }
  return validated.data;
}

// server/handlers/document-question.ts
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
    const parseResult = DocumentQuestionRequestSchema.safeParse(body);
    if (!parseResult.success) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          error: "Invalid question payload",
          details: parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
        })
      );
    }
    const answerResponse = await answerDocumentQuestion(parseResult.data);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        success: true,
        ...answerResponse
      })
    );
  } catch (err) {
    console.error("Error answering document question:", err);
    res.statusCode = err instanceof GroqServiceError ? err.statusCode : err?.statusCode || 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        error: err?.message || "An unexpected server error occurred while answering document question.",
        code: err?.code || "INTERNAL_SERVER_ERROR"
      })
    );
  }
}
export {
  handler as default
};
