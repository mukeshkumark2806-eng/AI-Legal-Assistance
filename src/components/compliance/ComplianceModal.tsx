import React from 'react';
import { 
  FileText, 
  Shield, 
  ShieldAlert, 
  Lock, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  ArrowRight,
  X,
  Scale,
  Server,
  Key
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export type ComplianceDocType = 'terms' | 'privacy' | 'disclaimer' | 'security';

interface ComplianceModalProps {
  type: ComplianceDocType | null;
  onClose: () => void;
  onSelectType: (type: ComplianceDocType) => void;
  onNavigateToWorkspace?: () => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  type,
  onClose,
  onSelectType,
  onNavigateToWorkspace
}) => {
  if (!type) return null;

  const tabs: { id: ComplianceDocType; label: string; icon: React.ReactNode }[] = [
    { id: 'terms', label: 'Terms of Service', icon: <FileText className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy Policy & GDPR', icon: <Shield className="w-4 h-4" /> },
    { id: 'disclaimer', label: 'Informational Disclaimer', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'security', label: 'Security Whitepaper', icon: <Server className="w-4 h-4" /> }
  ];

  return (
    <Modal
      isOpen={!!type}
      onClose={onClose}
      maxWidth="4xl"
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">LegalLens</h3>
                <span className="text-[10px] font-mono uppercase bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                  Compliance & Transparency
                </span>
              </div>
              <p className="text-xs text-slate-500">Document Intelligence Platform Information</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex flex-wrap gap-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectType(tab.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 -mb-[2px] ${
                type === tab.id
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="px-6 py-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* 1. TERMS OF SERVICE */}
          {type === 'terms' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Terms of Service</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Last updated: September 2026 • Usage terms governing the LegalLens Document Intelligence Platform.
                </p>
              </div>

              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                <span className="font-semibold text-indigo-900 block text-xs">Summary of Permitted Use</span>
                <p className="text-[11px] text-indigo-800">
                  LegalLens provides software tools for indexing, summarizing, comparing, and exploring uploaded legal agreements. By accessing this platform, you agree to these operational terms.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                    Informational Assistance Only
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    LegalLens is an artificial intelligence-assisted document comprehension tool. It provides automated text extraction, section identification, plain-language translation, and redline difference summaries. LegalLens is not a law firm, does not provide legal representation, and does not render binding legal advice.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                    User Responsibility & Independent Verification
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Contractual interpretation depends upon jurisdiction, case law, and specific commercial contexts. Users are solely responsible for reviewing the authoritative text of all uploaded contracts and consulting qualified legal counsel before making binding business, financial, or legal commitments.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
                    Document Ownership & Acceptable Uploads
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    You represent that you have the requisite authority and permissions to upload and process any document submitted to the system. You agree not to upload materials that violate applicable law, infringe intellectual property rights, or contain restricted government classifications.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">4</span>
                    Limitation of Liability & Warranty Disclaimer
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    The platform is provided &quot;as is&quot; without warranties of any kind, whether express or implied. In no event shall LegalLens or its contributors be liable for damages resulting from contract disputes, missed deadlines, or commercial decisions made in reliance upon automated summaries.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. PRIVACY POLICY & GDPR */}
          {type === 'privacy' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Privacy Policy & Data Processing Notice</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Factual overview of document processing, server-side data flow, and privacy boundaries.
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <span className="font-semibold text-amber-900 block text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  Sensitive Data Notice & Realistic Safeguards
                </span>
                <p className="text-[11px] text-amber-800">
                  LegalLens processes document text for the purpose of generating analysis and grounded answers. Users should refrain from uploading confidential health records, payment card numbers, or state secrets unless operating in a certified and verified environment.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">1</span>
                    Document Ingestion & Browser-Side Processing
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    When you drop a file into the upload zone, text extraction runs locally in your browser session using web-standard client libraries. The binary file itself is parsed on the client to extract raw text paragraphs, section headings, and page boundaries.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">2</span>
                    Server-Side Analysis & Inference Transmission
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    To perform structured legal analysis (clause classification, financial obligations, risk detection, and Q&amp;A retrieval), extracted document text is transmitted to our backend Express service. The backend coordinates inference with the Groq API using server-side credentials.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">3</span>
                    Data Retention Boundaries
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    In-memory session caches exist during active browser sessions to prevent redundant API calls. We do not operate persistent surveillance databases. However, we do not claim unsupported enterprise guarantees such as absolute zero-log third-party certifications without independent verification.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-mono font-bold">4</span>
                    Compliance & Regulatory Transparency
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    LegalLens strives to respect privacy principles. We do not make unsupported claims of formal GDPR or HIPAA certifications. Organizations subject to strict data sovereignty or statutory retention requirements should independently evaluate data transfer paths prior to production deployment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. INFORMATIONAL DISCLAIMER */}
          {type === 'disclaimer' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Informational Disclaimer</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Notice regarding the informational nature of AI legal assistance.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-950 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0" />
                  <span className="font-bold text-xs text-rose-900">
                    Mandatory Attorney Review Notice
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800">
                  LegalLens provides informational assistance based on the uploaded document and does not replace professional legal advice. The software does not provide legal representation, nor does it create a privileged attorney-client relationship.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900">Informational Scope</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    The summaries, categorized obligations, risk indicators, checklist questions, and redline comparisons generated by LegalLens are intended solely to assist users in reading and organizing contractual documents. They should be considered preliminary references rather than authoritative determinations of rights or duties.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900">No Definitive Determination of Rights</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Contractual enforceability is governed by applicable jurisdiction, implied covenants of good faith, public policy, and external factual circumstances that automated document analysis cannot fully account for.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900">Role Ambiguity & Consultation</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    When using natural-language inquiry (e.g., &quot;What are my obligations?&quot;), LegalLens does not assume whether you represent the Provider, Client, Landlord, or Tenant. Answers outline the terms as written for each party, and questions should be verified by a licensed attorney.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. SECURITY WHITEPAPER */}
          {type === 'security' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Security Whitepaper & Architecture</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Factual technical architecture, secret isolation, and backend inference pipeline.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] font-mono uppercase text-indigo-600 font-semibold flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5" /> Frontend Client
                  </span>
                  <span className="font-bold text-slate-900 block text-xs">React 19 &amp; TypeScript</span>
                  <p className="text-[11px] text-slate-500">In-browser file parsing via PDF.js and Mammoth.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] font-mono uppercase text-indigo-600 font-semibold flex items-center gap-1">
                    <Server className="w-3.5 h-3.5" /> Backend Service
                  </span>
                  <span className="font-bold text-slate-900 block text-xs">Node.js &amp; Express</span>
                  <p className="text-[11px] text-slate-500">Secure API routes with Zod schema validation.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-[10px] font-mono uppercase text-indigo-600 font-semibold flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> Secret Isolation
                  </span>
                  <span className="font-bold text-slate-900 block text-xs">Server-Side Credentials</span>
                  <p className="text-[11px] text-slate-500">API keys never exposed to browser bundles.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900">Current Technical Architecture</h4>
                  <ul className="list-disc list-inside space-y-1.5 text-[11px] text-slate-600">
                    <li><strong>Client Layer:</strong> Single-page application built on Vite, React 19, and Tailwind CSS. Document ingestion extracts text locally before triggering backend analysis.</li>
                    <li><strong>Backend Gateway:</strong> Express service hosting <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">/api/analyze-document</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">/api/chat-document</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">/api/compare-documents</code>.</li>
                    <li><strong>Inference Provider:</strong> Groq Cloud SDK executing on the server runtime, utilizing high-throughput models for structured schema completion.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900">API Key Isolation &amp; Environment Security</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    The <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">GROQ_API_KEY</code> is loaded strictly into the server process via environment variables. The client application never has access to the secret key, and no client-side API requests communicate directly with third-party AI endpoints.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200/90 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900">Truthful Security Claims &amp; Verification</h4>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    We intentionally do not advertise unverified security certifications such as SOC 2 Type II, ISO 27001, FedRAMP, or proprietary hardware encryption claims. We state only what our open technical architecture implements: server-side API credential isolation, schema-based request validation, deterministic section detection, and client-side extraction boundaries.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified Technical Disclosure
          </span>
          <div className="flex items-center gap-2">
            {onNavigateToWorkspace && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onNavigateToWorkspace();
                }}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                iconPosition="right"
              >
                Back to Workspace
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
