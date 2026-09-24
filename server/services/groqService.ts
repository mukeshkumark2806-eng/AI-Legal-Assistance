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

class GroqClientManager {
  private client: Groq | null = null;
  private defaultModel = 'openai/gpt-oss-120b';
  private fallbackModel = 'openai/gpt-oss-20b';

  public getModel(): string {
    return process.env.GROQ_MODEL?.trim() || this.defaultModel;
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
   * Safe wrapper around Groq Chat Completions with structured JSON output and automatic model fallback.
   */
  public async createJsonChatCompletion(params: {
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ content: string; model: string }> {
    const client = this.getClient();
    const primaryModel = this.getModel();

    try {
      const completion = await client.chat.completions.create({
        model: primaryModel,
        messages: params.messages,
        response_format: { type: 'json_object' },
        temperature: params.temperature ?? 0.1,
        max_completion_tokens: params.maxTokens ?? 8192
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new GroqServiceError('Groq returned an empty response.', 502, 'EMPTY_RESPONSE');
      }

      return { content: text, model: primaryModel };
    } catch (err: any) {
      // If primary model failed due to model_not_found or temporary rate limit, try fallback model if different
      if (
        primaryModel !== this.fallbackModel &&
        (err?.status === 404 || err?.error?.code === 'model_not_found' || err?.status === 429)
      ) {
        console.warn(`Primary model ${primaryModel} encountered issue (${err?.message}). Trying fallback ${this.fallbackModel}...`);
        try {
          const fallbackCompletion = await client.chat.completions.create({
            model: this.fallbackModel,
            messages: params.messages,
            response_format: { type: 'json_object' },
            temperature: params.temperature ?? 0.1,
            max_completion_tokens: params.maxTokens ?? 8192
          });

          const text = fallbackCompletion.choices[0]?.message?.content;
          if (text) {
            return { content: text, model: this.fallbackModel };
          }
        } catch (fallbackErr) {
          console.error('Fallback model also failed:', fallbackErr);
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
      throw new GroqServiceError('Groq API rate limit exceeded. Please wait a moment before trying again.', 429, 'RATE_LIMIT');
    }
    if (status === 413) {
      throw new GroqServiceError('The document payload exceeds the model context limit.', 413, 'DOCUMENT_TOO_LARGE');
    }
    if (status === 400) {
      throw new GroqServiceError(`Invalid request to Groq: ${sanitizedMsg}`, 400, 'BAD_REQUEST');
    }

    throw new GroqServiceError(`Groq service unavailable: ${sanitizedMsg}`, status, 'GROQ_API_FAILURE');
  }
}

export const groqService = new GroqClientManager();
