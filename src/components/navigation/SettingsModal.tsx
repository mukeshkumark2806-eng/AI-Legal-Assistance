import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Key, 
  Server, 
  ShieldAlert, 
  ShieldCheck, 
  Sliders 
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'engine' | 'privacy'>('general');
  const [autoHighlight, setAutoHighlight] = useState(true);
  const [jurisdiction, setJurisdiction] = useState('Delaware');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Settings & Preferences"
      subtitle="View application preferences, active document analysis engine, and data handling policies."
      maxWidth="2xl"
    >
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar tabs */}
        <div 
          role="tablist"
          aria-label="Settings Categories"
          className="w-full sm:w-48 flex sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-3"
        >
          <button
            type="button"
            role="tab"
            id="tab-settings-general"
            aria-selected={activeTab === 'general'}
            aria-controls="panel-settings-general"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'general' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
            <span>General</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-settings-engine"
            aria-selected={activeTab === 'engine'}
            aria-controls="panel-settings-engine"
            onClick={() => setActiveTab('engine')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'engine' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
            <span>Document Engine</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-settings-privacy"
            aria-selected={activeTab === 'privacy'}
            aria-controls="panel-settings-privacy"
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'privacy' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
            <span>Data Handling</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 text-xs">
          {/* TAB 1: GENERAL PREFERENCES */}
          {activeTab === 'general' && (
            <div 
              role="tabpanel"
              id="panel-settings-general"
              aria-labelledby="tab-settings-general"
              className="space-y-4"
            >
              <div>
                <label htmlFor="jurisdiction-select" className="font-semibold text-slate-900 block mb-1">
                  Default Legal Reference Standard
                </label>
                <select 
                  id="jurisdiction-select"
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <option value="Delaware">United States (Delaware General Corporation Law)</option>
                  <option value="California">United States (California Commercial Code)</option>
                  <option value="New York">United States (New York Commercial Division)</option>
                  <option value="UK">United Kingdom (English Common Law)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Reference baseline applied to sample demo agreements. Uploaded documents are always evaluated according to their own governing law clause.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <label htmlFor="auto-highlight-checkbox" className="font-semibold text-slate-900 block cursor-pointer">
                    Automatic Clause Highlighting
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Visually mark categorized clauses directly within the document text.
                  </span>
                </div>
                <input
                  id="auto-highlight-checkbox"
                  type="checkbox"
                  checked={autoHighlight}
                  onChange={(e) => setAutoHighlight(e.target.checked)}
                  aria-label="Toggle automatic clause highlighting in document text"
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <label htmlFor="disclaimer-enforced-checkbox" className="font-semibold text-slate-900 block">
                    Attorney Disclaimer Notice
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Display informational notice banner on every active workspace session.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                  <span>Enforced Active</span>
                  <input
                    id="disclaimer-enforced-checkbox"
                    type="checkbox"
                    defaultChecked
                    disabled
                    aria-label="Attorney disclaimer notice is enforced active"
                    className="w-4 h-4 rounded text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-600">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Workspace Mode
                  </span>
                  <span className="text-[11px]">
                    Single-user document workspace with in-memory session state.
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  Guest Session
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENT ANALYSIS ENGINE */}
          {activeTab === 'engine' && (
            <div 
              role="tabpanel"
              id="panel-settings-engine"
              aria-labelledby="tab-settings-engine"
              className="space-y-3.5"
            >
              {/* Active Status Banner */}
              <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="font-semibold text-indigo-950 text-xs">Document Analysis Active</span>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  LegalLens uses server-side language-model inference to analyze uploaded documents, identify clauses and obligations, compare agreements, and answer questions grounded in the uploaded document.
                </p>
              </div>

              {/* Analysis Model (Non-selectable, configured by application) */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
                      Analysis Model
                    </span>
                    <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                      gpt-oss-120b
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium">
                    Configured by application
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Server-side language model configured for structured legal clause classification, risk identification, and grounded document Q&amp;A with automatic model fallback.
                </p>
              </div>

              {/* Actual Processing Information */}
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1">
                  <span className="font-semibold text-slate-900 text-xs block">Processing</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>Server-side document analysis:</strong> Extracts legal clauses, financial terms, and termination obligations directly from uploaded document text.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1">
                  <span className="font-semibold text-slate-900 text-xs block">API Security</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    API credentials remain server-side and are not included in the browser bundle. Client code communicates strictly with local backend endpoints (<code className="font-mono text-[10px] bg-slate-200/60 px-1 py-0.5 rounded">/api/*</code>).
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1">
                  <span className="font-semibold text-slate-900 text-xs block">Document Grounding</span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Answers are generated using the uploaded document as the source context. Responses cite authoritative sections and reject ungrounded inquiries.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DATA HANDLING & PRIVACY */}
          {activeTab === 'privacy' && (
            <div 
              role="tabpanel"
              id="panel-settings-privacy"
              aria-labelledby="tab-settings-privacy"
              className="space-y-3"
            >
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  <span>Document Data Handling &amp; Boundaries</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Factual overview of how uploaded documents and extracted text are handled across the LegalLens application stack.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <div className="flex items-center gap-2">
                  <Server className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                  <span className="font-semibold text-slate-900 text-xs">Browser-Side Ingestion</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  PDF and DOCX extraction executes locally in your browser using client-side parsers (PDF.js / Mammoth) to extract text, paragraphs, and sections before transmission.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                  <span className="font-semibold text-slate-900 text-xs">Server-Side Credential Isolation</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Document text is forwarded to the local Node/Express backend service for analysis. API keys remain server-side and are never exposed to browser bundles.
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                  <span className="font-semibold text-slate-900 text-xs">Sensitive Data Guidance</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  LegalLens does not maintain persistent tracking databases. Users should avoid uploading sensitive personal credentials, state secrets, or unredacted financial account details unless operating in a certified environment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-500 font-medium">
          LegalLens Document Intelligence
        </span>
        <Button variant="primary" size="sm" onClick={onClose} aria-label="Save and close settings">
          Done
        </Button>
      </div>
    </Modal>
  );
};
