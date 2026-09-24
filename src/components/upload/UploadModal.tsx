import React from 'react';
import type { LegalDocument } from '../../types/document';
import { Modal } from '../ui/Modal';
import { UploadZone } from './UploadZone';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentParsed?: (doc: LegalDocument) => void;
  onSampleSelect?: (sampleName: string) => void;
  onDocumentSelect?: (docName: string) => void; // backwards compat
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDocumentParsed,
  onSampleSelect,
  onDocumentSelect
}) => {
  const handleParsed = (doc: LegalDocument) => {
    if (onDocumentParsed) {
      onDocumentParsed(doc);
    } else if (onDocumentSelect) {
      onDocumentSelect(doc.name);
    }
    onClose();
  };

  const handleSample = (name: string) => {
    if (onSampleSelect) {
      onSampleSelect(name);
    } else if (onDocumentSelect) {
      onDocumentSelect(name);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Analyze a Legal Document"
      subtitle="Select or drop a real PDF or DOCX contract for instant text extraction and structure analysis."
      maxWidth="2xl"
    >
      <UploadZone
        onDocumentParsed={handleParsed}
        onSampleSelect={handleSample}
        isCompact={false}
      />
    </Modal>
  );
};
