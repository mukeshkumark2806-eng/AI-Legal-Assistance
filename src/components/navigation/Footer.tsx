import React, { useState } from 'react';
import { Lock, Scale, ShieldCheck } from 'lucide-react';
import type { NavTab } from './Header';
import { ComplianceModal } from '../compliance/ComplianceModal';
import type { ComplianceDocType } from '../compliance/ComplianceModal';

interface FooterProps {
  onNavigate: (tab: NavTab) => void;
  onOpenCompliance?: (type: ComplianceDocType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenCompliance }) => {
  const [localComplianceType, setLocalComplianceType] = useState<ComplianceDocType | null>(null);

  const handleOpenCompliance = (type: ComplianceDocType) => {
    if (onOpenCompliance) {
      onOpenCompliance(type);
    } else {
      setLocalComplianceType(type);
    }
  };

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Scale className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="font-serif font-bold text-slate-900 text-sm">
                LegalLens
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
              Empowering individuals, operations teams, and counsel to understand, analyze, compare, and navigate complex contracts with structured document intelligence.
            </p>
            <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-indigo-600" /> Server-side API processing
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-600" /> API keys kept server-side
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
              Platform
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 -mx-1"
                >
                  Dashboard & Upload
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 -mx-1"
                >
                  Document Intelligence
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('compare')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 -mx-1"
                >
                  Compare Documents
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('my-documents')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 -mx-1"
                >
                  My Documents Repository
                </button>
              </li>
            </ul>
          </div>

          {/* Legal / Trust Links */}
          <div>
            <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] mb-3">
              Compliance & Ethics
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenCompliance('terms')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 -mx-1"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenCompliance('privacy')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 -mx-1"
                >
                  Privacy Policy & GDPR
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenCompliance('disclaimer')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 -mx-1"
                >
                  Informational Disclaimer
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenCompliance('security')}
                  className="hover:text-slate-900 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1 -mx-1"
                >
                  Security Whitepaper
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 leading-relaxed text-center sm:text-left max-w-2xl">
            <strong>Important Legal Disclaimer:</strong> LegalLens provides informational assistance based on the uploaded document and does not replace professional legal advice. LegalLens is not a law firm, does not provide legal representation, and the outputs of this software should be reviewed by licensed legal counsel before executing binding contracts.
          </p>
          <span className="text-[11px] text-slate-400 shrink-0 font-mono">
            © {new Date().getFullYear()} LegalLens. All rights reserved.
          </span>
        </div>
      </div>

      {/* Local Fallback Compliance Modal */}
      {localComplianceType && !onOpenCompliance && (
        <ComplianceModal
          type={localComplianceType}
          onClose={() => setLocalComplianceType(null)}
          onSelectType={(t) => setLocalComplianceType(t)}
          onNavigateToWorkspace={() => {
            setLocalComplianceType(null);
            onNavigate('workspace');
          }}
        />
      )}
    </footer>
  );
};
