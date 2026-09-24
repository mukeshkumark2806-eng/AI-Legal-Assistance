import React from 'react';
import { Info, ShieldAlert, Sparkles } from 'lucide-react';

interface DisclaimerBannerProps {
  variant?: 'subtle' | 'inline' | 'floating';
  className?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  variant = 'subtle',
  className = ''
}) => {
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 text-xs text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60 ${className}`}>
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>LegalLens AI provides informational assistance and does not replace professional legal advice.</span>
      </div>
    );
  }

  return (
    <div className={`py-2 px-4 bg-slate-900 text-slate-200 text-xs text-center border-b border-slate-800 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          <strong>Legal Notice:</strong> LegalLens AI provides informational assistance and does not replace professional legal advice. Always consult a qualified attorney for binding counsel.
        </span>
      </div>
    </div>
  );
};

export const DemoBanner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-indigo-50/80 border border-indigo-100 px-3.5 py-2 rounded-lg flex items-center justify-between gap-3 text-xs text-indigo-900 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
        </span>
        <span className="font-semibold">Interactive Prototype Mode:</span>
        <span className="text-indigo-700">Displaying structured legal analysis on a verified Master Services Agreement (MSA). Live GenAI engine integration ready for Phase 2.</span>
      </div>
      <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded">
        <Sparkles className="w-3 h-3" /> Sample Dataset
      </span>
    </div>
  );
};
