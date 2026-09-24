declare module 'mammoth' {
  export interface ConversionResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface MammothOptions {
    arrayBuffer: ArrayBuffer;
    styleMap?: string[];
    includeDefaultStyleMap?: boolean;
  }

  export function extractRawText(options: MammothOptions): Promise<ConversionResult>;
  export function convertToHtml(options: MammothOptions): Promise<ConversionResult>;
}
