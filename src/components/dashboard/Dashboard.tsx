import React from 'react';
import type { LegalDocument } from '../../types/document';
import { 
  ArrowRight, 
  FileCheck2, 
  FileDiff, 
  FileSearch, 
  GitCompare, 
  Shield, 
  ShieldCheck 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { UploadZone } from '../upload/UploadZone';

interface DashboardProps {
  onAnalyzeClick: () => void;
  onCompareClick: () => void;
  onDocumentParsed: (doc: LegalDocument) => void;
  onSelectSampleDocument: (docName: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onAnalyzeClick,
  onCompareClick,
  onDocumentParsed,
  onSelectSampleDocument
}) => {
  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-14 bg-gradient-to-b from-slate-100/70 via-slate-50 to-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Subtle Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200/90 text-xs text-slate-700 shadow-2xs mb-6">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600" />
              <span className="font-semibold text-slate-900">LegalLens</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">Document Intelligence Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-slate-950 tracking-tight leading-[1.1]">
              Understand what you&apos;re signing.
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Intelligent assistance for understanding, analyzing and navigating legal documents.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                icon={<FileSearch className="w-5 h-5" />}
                onClick={onAnalyzeClick}
                className="w-full sm:w-auto"
              >
                Analyze a Document
              </Button>
              <Button
                variant="outline"
                size="lg"
                icon={<FileDiff className="w-5 h-5" />}
                onClick={onCompareClick}
                className="w-full sm:w-auto"
              >
                Compare Documents
              </Button>
            </div>

            {/* Subtle Legal Disclaimer */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500 max-w-xl mx-auto">
              <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                LegalLens provides informational assistance based on the uploaded document and does not replace professional legal advice.
              </span>
            </div>
          </div>

          {/* Integrated Upload Experience in Hero */}
          <div className="mt-12 max-w-3xl mx-auto">
            <UploadZone
              onDocumentParsed={onDocumentParsed}
              onSampleSelect={onSelectSampleDocument}
            />
          </div>
        </div>
      </section>

      {/* CORE WORKFLOW CAPABILITIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            Engineered For Clarity
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Transform complex legal text into actionable insight
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Every feature is designed to give you clarity on obligations, financial exposures, and critical deadlines before executing an agreement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Clause Intelligence */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Clause Intelligence & Translation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Converts convoluted legal jargon into straightforward, plain-English summaries. Categorizes terms into Obligations, Payments, Terminations, and Restrictions.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-medium">
              <span>Automatic categorization</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Risk & Action Checklist */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Risk Center & Attorney Checklist
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Flags evergreen auto-renewals, unilateral indemnification, and steep termination penalties. Compiles specific questions to bring directly to your legal counsel.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-medium">
              <span>Interactive checklist</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Version Comparison */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Redline Version Comparison
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-2">
                Compare baseline and revised agreements side by side. Instantly inspect added clauses, deleted remedies, and altered payment schedules.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-purple-600 font-medium">
              <span>Side-by-side diffing</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </section>

      {/* SAMPLE DOCUMENT SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-xs font-mono font-semibold text-indigo-400 uppercase tracking-wider">
              Ready-to-Explore Agreements
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif mt-2 text-white">
              Try the Analysis Workspace right now.
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Explore how LegalLens extracts key obligations, important deadlines, and risk factors from a verified commercial Master Services Agreement.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="md"
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
                onClick={() => onSelectSampleDocument('Master Services Agreement (CloudScale & Apex)')}
              >
                Launch Master Services Agreement Demo
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={onCompareClick}
                className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800"
              >
                Explore Version Comparison
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
