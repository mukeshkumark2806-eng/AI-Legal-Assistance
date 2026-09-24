export interface FileValidationResult {
  isValid: boolean;
  fileType?: 'PDF' | 'DOCX';
  formattedSize: string;
  error?: string;
}

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function validateLegalFile(file: File): FileValidationResult {
  const formattedSize = formatFileSize(file.size);

  // 1. Check for empty file (0 bytes)
  if (file.size === 0) {
    return {
      isValid: false,
      formattedSize,
      error: 'The uploaded file is empty (0 bytes). Please select a valid agreement or legal document.'
    };
  }

  // 2. Check for maximum file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      formattedSize,
      error: `File size (${formattedSize}) exceeds the 25 MB limit. Please select a smaller document.`
    };
  }

  // 3. Check file extension and MIME type
  const fileName = file.name.toLowerCase();
  const fileTypeMime = file.type.toLowerCase();

  const isPdf = fileName.endsWith('.pdf') || fileTypeMime === 'application/pdf';
  const isDocx = fileName.endsWith('.docx') || 
    fileTypeMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (!isPdf && !isDocx) {
    // Special hint for legacy .doc
    if (fileName.endsWith('.doc') || fileTypeMime === 'application/msword') {
      return {
        isValid: false,
        formattedSize,
        error: 'Legacy Word (.doc) format is not supported. Please save the document as modern .docx or .pdf format.'
      };
    }

    return {
      isValid: false,
      formattedSize,
      error: `Unsupported file type (${fileName.split('.').pop()?.toUpperCase() || 'unknown'}). LegalLens AI currently supports PDF (.pdf) and Word (.docx) documents.`
    };
  }

  return {
    isValid: true,
    fileType: isPdf ? 'PDF' : 'DOCX',
    formattedSize
  };
}
