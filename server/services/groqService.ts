import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

export class GroqServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'GROQ_ERROR') {
    super(message);
    this.name = 'GroqServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Robust JSON parser with automatic markdown fence stripping and syntax repair for LLM responses.
 */
export function safeParseJson<T = any>(rawText: string): T {
  let clean = (rawText || '').trim();
  if (clean.includes('```')) {
    const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      clean = match[1].trim();
    } else {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }
  }

  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(clean);
  } catch (firstErr) {
    try {
      let repaired = clean.replace(/,\s*([\}\]])/g, '$1');
      repaired = repaired.replace(/,\s*"[^"]*$/, '');
      repaired = repaired.replace(/,\s*$/, '');

      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;

      for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
      for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

      return JSON.parse(repaired);
    } catch (_secondErr) {
      throw firstErr;
    }
  }
}

class GroqClientManager {
  private client: Groq | null = null;
  private defaultModel = 'openai/gpt-oss-20b';
  private fallbackModel = 'openai/gpt-oss-120b';

  // Known valid Groq model IDs — prevents invalid GROQ_MODEL env vars from crashing the server
  private validModels = new Set([
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-safeguard-20b'
  ]);

  public getModel(): string {
    const envModel = process.env.GROQ_MODEL?.trim();
    if (envModel && this.validModels.has(envModel)) {
      return envModel;
    }
    if (envModel) {
      console.warn(`[GroqService] GROQ_MODEL env var "${envModel}" is invalid or obsolete. Falling back to default: ${this.defaultModel}`);
    }
    return this.defaultModel;
  }

  public getClient(): Groq {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new GroqServiceError(
        'GROQ_API_KEY is not configured on the server. Please check your environment configuration.',
        503,
        'MISSING_API_KEY'
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
  private sanitizeJsonContent(rawText: string): string {
    let clean = rawText.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }
    return clean;
  }

  /**
   * Safe wrapper around Groq Chat Completions with structured JSON output and automatic model fallback.
   */
  public async createJsonChatCompletion(params: {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string; model: string }> {
    const client = this.getClient();
    const primaryModel = this.getModel();
    const maxTokens = params.maxTokens ?? 4000;

    try {
      const completion = await client.chat.completions.create({
        model: primaryModel,
        messages: params.messages,
        temperature: params.temperature ?? 0.1,
        max_completion_tokens: maxTokens
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new GroqServiceError('Groq returned an empty response.', 502, 'EMPTY_RESPONSE');
      }

      return { content: this.sanitizeJsonContent(text), model: primaryModel };
    } catch (err: any) {
      // If primary model hit 429 (rate limit), wait 3s and retry primary once before falling back
      if (err?.status === 429) {
        console.warn(`Primary model ${primaryModel} rate limited. Waiting 3s before retry...`);
        await new Promise((r) => setTimeout(r, 3000));
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
        } catch (retryErr: any) {
          console.warn(`Primary model retry failed (${retryErr?.message || retryErr?.status}). Proceeding to fallback...`);
        }
      }

      // If primary model failed due to 404, 429, 400, or network error, immediately try fallback model
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
        } catch (fallbackErr: any) {
          if (fallbackErr?.status === 429) {
            console.warn('Fallback also rate limited. Waiting 3s before fast retry...');
            await new Promise((r) => setTimeout(r, 3000));
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
              console.error('Fallback retry failed:', rErr);
            }
          }
          console.error('Fallback model also encountered error:', fallbackErr);
        }
      }

      this.handleApiError(err);
      throw err;
    }
  }

  private handleApiError(err: any): never {
    const status = err?.status || 500;
    const msg = err?.error?.message || err?.message || 'An error occurred while communicating with the Groq API.';

    // Sanitize message: never leak API key
    const sanitizedMsg = msg.replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED_API_KEY]');

    if (status === 401) {
      throw new GroqServiceError('Invalid Groq API key.', 401, 'INVALID_API_KEY');
    }
    if (status === 429) {
      throw new GroqServiceError('Groq API rate limit exceeded. Please try again in a few seconds.', 429, 'RATE_LIMIT');
    }
    if (status === 413) {
      throw new GroqServiceError('The document payload exceeds the model context limit.', 413, 'DOCUMENT_TOO_LARGE');
    }
    if (status === 400) {
      throw new GroqServiceError(`Invalid request to Groq: ${sanitizedMsg}`, 400, 'BAD_REQUEST');
    }
    if (status === 404 || msg.includes('model_not_found')) {
      throw new GroqServiceError(`Groq model unavailable: ${sanitizedMsg}`, 400, 'MODEL_NOT_FOUND');
    }

    throw new GroqServiceError(`Groq service error: ${sanitizedMsg}`, status, 'GROQ_API_FAILURE');
  }
}

export const groqService = new GroqClientManager();
