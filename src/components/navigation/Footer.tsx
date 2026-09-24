import React from 'react';
import { Lock, Scale, Shield, ShieldCheck } from 'lucide-react';
import type { NavTab } from './Header';

interface FooterProps {
  onNavigate: (tab: NavTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
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
                LegalLens AI
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
              Empowering individuals, operations teams, and enterprise counsel to understand, analyze, compare, and navigate complex contracts with generative intelligence.
            </p>
            <div className="flex items-center gap-3 pt-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> 256-Bit TLS
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Zero Model Retention
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
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Dashboard & Upload
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('workspace')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Document Intelligence
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('compare')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Compare Documents
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('my-documents')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
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
                <span className="hover:text-slate-900 transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-slate-900 transition-colors cursor-pointer">
                  Privacy Policy & GDPR
                </span>
              </li>
              <li>
                <span className="hover:text-slate-900 transition-colors cursor-pointer">
                  Informational Disclaimer
                </span>
              </li>
              <li>
                <span className="hover:text-slate-900 transition-colors cursor-pointer">
                  Security Whitepaper
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-slate-500 leading-relaxed text-center sm:text-left max-w-2xl">
            <strong>Important Legal Disclaimer:</strong> LegalLens AI provides informational assistance and does not replace professional legal advice. LegalLens AI is not a law firm, does not provide legal representation, and the outputs of this software should be reviewed by licensed legal counsel before executing binding contracts.
          </p>
          <span className="text-[11px] text-slate-400 shrink-0 font-mono">
            © {new Date().getFullYear()} LegalLens AI. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};
