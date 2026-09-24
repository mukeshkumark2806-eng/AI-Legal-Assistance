import React from 'react';
import type { LegalDocument } from '../../types/document';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  FileCheck2, 
  FileText, 
  FolderOpen, 
  Plus, 
  Scale, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  Trash2 
} from 'lucide-react';
import { Button } from '../ui/Button';

interface MyDocumentsProps {
  onOpenDocument: (docName: string) => void;
  onOpenUploadedDoc?: (doc: LegalDocument) => void;
  uploadedDocs?: LegalDocument[];
  onUploadClick: () => void;
}

export const MyDocuments: React.FC<MyDocumentsProps> = ({
  onOpenDocument,
  onOpenUploadedDoc,
  uploadedDocs = [],
  onUploadClick
}) => {
  const sampleDocuments = [
    {
      id: 'doc-sample-1',
      name: 'Master Services Agreement (CloudScale & Apex)',
      type: 'PDF',
      size: '1.4 MB',
      date: 'March 14, 2025',
      clausesCount: 16,
      riskLevel: 'Moderate',
      status: 'Demo Sample',
      counterparty: 'CloudScale Technologies Inc.'
    },
    {
      id: 'doc-sample-2',
      name: 'Commercial Office Lease Agreement - Metro Suite 400',
      type: 'PDF',
      size: '2.8 MB',
      date: 'February 28, 2025',
      clausesCount: 12,
      riskLevel: 'Low',
      status: 'Demo Sample',
      counterparty: 'Metro Commercial Properties'
    },
    {
      id: 'doc-sample-3',
      name: 'Bilateral Non-Disclosure Agreement (NDA)',
      type: 'DOCX',
      size: '420 KB',
      date: 'January 19, 2025',
      clausesCount: 8,
      riskLevel: 'Low',
      status: 'Demo Sample',
      counterparty: 'Vanguard Ventures LLC'
    },
    {
      id: 'doc-sample-4',
      name: 'SaaS Software License & Maintenance SOW',
      type: 'PDF',
      size: '1.9 MB',
      date: 'December 12, 2024',
      clausesCount: 14,
      riskLevel: 'High',
      status: 'Demo Sample',
      counterparty: 'Nexus Cloud Infrastructure'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <FolderOpen className="w-4 h-4" />
            <span>Document Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            My Documents
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Access and review previously analyzed legal instruments, redlines, and local extractions.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={onUploadClick}
        >
          Upload New Document
        </Button>
      </div>

      {/* Documents Table / Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents by name or party..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              {uploadedDocs.length} Uploaded • {sampleDocuments.length} Demo Samples
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* Real Uploaded Documents */}
          {uploadedDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 sm:p-5 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {doc.name}
                    </h3>
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      Real Upload
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {doc.fileType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Extracted: {doc.uploadDate} • {doc.sections.length} Detected Sections
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                    <span>{doc.fileSize}</span>
                    <span>•</span>
                    <span>{doc.totalPages} Pages</span>
                    {doc.extractionStats && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          {doc.extractionStats.totalWords.toLocaleString()} Words
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Structured</span>
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => {
                    if (onOpenUploadedDoc) onOpenUploadedDoc(doc);
                    else onOpenDocument(doc.name);
                  }}
                >
                  Inspect Text
                </Button>
              </div>
            </div>
          ))}

          {/* Sample Documents */}
          {sampleDocuments.map((doc) => (
            <div
              key={doc.id}
              className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {doc.name}
                    </h3>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                      Demo Sample
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {doc.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    Counterparty: {doc.counterparty}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {doc.date}
                    </span>
                    <span>•</span>
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span className="text-indigo-600 font-medium">
                      {doc.clausesCount} Clauses Extracted
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${
                  doc.riskLevel === 'High'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : doc.riskLevel === 'Moderate'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {doc.riskLevel} Risk
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                  onClick={() => onOpenDocument(doc.name)}
                >
                  Inspect Analysis
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
