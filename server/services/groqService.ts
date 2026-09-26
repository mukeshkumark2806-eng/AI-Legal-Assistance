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
  private defaultModel = 'llama-3.3-70b-versatile';
  private fallbackModel = 'llama-3.1-8b-instant';

  // Known valid Groq model IDs — prevents invalid GROQ_MODEL env vars from crashing the server
  private validModels = new Set([
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'llama-3.3-70b-specdec',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
    'deepseek-r1-distill-llama-70b',
    'qwen-2.5-coder-32b'
  ]);

  public getModel(): string {
    const envModel = process.env.GROQ_MODEL?.trim();
    if (envModel && this.validModels.has(envModel)) {
      return envModel;
    }
    if (envModel) {
      console.warn(`[GroqService] GROQ_MODEL env var "${envModel}" is invalid. Falling back to default: ${this.defaultModel}`);
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
        max_completion_tokens: params.maxTokens ?? 4000
      });

      const text = completion.choices[0]?.message?.content;
      if (!text) {
        throw new GroqServiceError('Groq returned an empty response.', 502, 'EMPTY_RESPONSE');
      }

      return { content: text, model: primaryModel };
    } catch (err: any) {
      // If primary model failed due to model_not_found, 404, rate limit (429), or json format error, immediately try fast fallback model
      if (
        primaryModel !== this.fallbackModel &&
        (err?.status === 404 || err?.status === 429 || err?.error?.code === 'model_not_found' || err?.error?.code === 'json_validate_failed')
      ) {
        console.warn(`Primary model ${primaryModel} failed (${err?.message || err?.status}). Immediately calling fast fallback ${this.fallbackModel}...`);

        try {
          const fallbackCompletion = await client.chat.completions.create({
            model: this.fallbackModel,
            messages: params.messages,
            response_format: { type: 'json_object' },
            temperature: params.temperature ?? 0.1,
            max_completion_tokens: params.maxTokens ?? 4000
          });

          const text = fallbackCompletion.choices[0]?.message?.content;
          if (text) {
            return { content: text, model: this.fallbackModel };
          }
        } catch (fallbackErr: any) {
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
