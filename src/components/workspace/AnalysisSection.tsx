import React, { useState } from 'react';
import type { LegalDocument } from '../../types/document';
import { 
  AlertOctagon, 
  AlertTriangle, 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Cpu, 
  CreditCard, 
  FileCheck2, 
  HelpCircle, 
  Layers, 
  Scale, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { ImportanceBadge } from '../ui/StatusBadge';

interface AnalysisSectionProps {
  document: LegalDocument;
  onJumpToClause: (clauseRef: string) => void;
  onTriggerAiAnalysis?: () => void;
  isAnalyzing?: boolean;
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  document: doc,
  onJumpToClause,
  onTriggerAiAnalysis,
  isAnalyzing = false
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    obligations: true,
    dates: true,
    financials: true,
    concerns: true,
    questions: true
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isUploadedDoc = doc.isUploaded || doc.source === 'uploaded';
  const analysis = doc.analysis;

  // IF REAL UPLOADED DOCUMENT AND NOT YET ANALYZED WITH AI: Show extraction status with trigger button
  if (isUploadedDoc && !doc.isAiAnalyzed) {
    return (
      <div className="space-y-4 text-slate-800">
        {/* Real Document Ingestion Banner */}
        <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Document Text Extraction Complete</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Real document stream from <strong className="text-slate-900">{doc.name}</strong> was extracted and structured into {doc.sections.length} legal sections.
          </p>
          <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap gap-2 text-[11px] font-mono text-emerald-800">
            <span>Pages: {doc.totalPages}</span>
            <span>•</span>
            <span>Sections: {doc.sections.length}</span>
            <span>•</span>
            <span>Words: {doc.extractionStats?.totalWords.toLocaleString()}</span>
            <span>•</span>
            <span>Method: {doc.fileType === 'PDF' ? 'PDF.js Stream' : 'Mammoth OpenXML'}</span>
          </div>
        </div>

        {/* Action: Run Document Analysis */}
        <div className="p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl text-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Generate Document Analysis</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Run structured legal analysis on the {doc.sections.length} extracted sections to classify clauses, identify obligations, flag concerns, and generate review questions.
          </p>
          {onTriggerAiAnalysis && (
            <button
              type="button"
              onClick={onTriggerAiAnalysis}
              disabled={isAnalyzing}
              aria-label={isAnalyzing ? 'Analyzing Document with LegalLens...' : 'Analyze Document with LegalLens'}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Cpu className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isAnalyzing ? 'Analyzing Document...' : 'Analyze Document with LegalLens'}</span>
            </button>
          )}
        </div>

        {/* Extracted Section Breakdown */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              <span>Extracted Section Hierarchy ({doc.sections.length})</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-500">Click to inspect</span>
          </div>

          <div role="list" aria-label="Extracted sections" className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {doc.sections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => onJumpToClause(sec.sourceReference || (sec.sectionNumber ? `Section ${sec.sectionNumber} — ${sec.title}` : sec.title))}
                aria-label={`Jump to section ${sec.sectionNumber ? sec.sectionNumber + ': ' : ''}${sec.title}`}
                className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/60 hover:border-indigo-200 transition-colors flex items-center justify-between text-xs cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {sec.sectionNumber && (
                    <span className="font-mono text-[10px] font-semibold text-slate-400 group-hover:text-indigo-600 shrink-0">
                      {sec.sectionNumber}
                    </span>
                  )}
                  <span className="font-medium text-slate-800 truncate">{sec.title}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                  <span>{sec.paragraphs.length} ¶</span>
                  {sec.pageNumber !== undefined && (
                    <span className="font-mono bg-white border border-slate-200 px-1 py-0.2 rounded">
                      p.{sec.pageNumber}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // IF REAL UPLOADED DOCUMENT WITH AI ANALYSIS: Render AI banner + structured analysis
  // IF SAMPLE DEMO DOCUMENT: Render Demo Notice + mock analysis
  return (
    <div className="space-y-4 text-slate-800">
      {/* Top Banner */}
      {isUploadedDoc && doc.isAiAnalyzed ? (
        <div className="p-4 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-slate-50 border border-indigo-200/90 rounded-2xl text-xs space-y-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Document Analysis</span>
            </div>
            <span className="font-mono text-[10px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-semibold shrink-0">
              Analysis Active
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Structured legal analysis synthesized strictly from the {doc.sections.length} extracted sections of <strong className="text-slate-900">{doc.name}</strong>.
          </p>
          <div className="pt-2 border-t border-indigo-100/90 flex items-center gap-1.5 text-[10px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>LegalLens provides informational assistance based on the uploaded document and does not replace professional legal advice.</span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Demo Document • Pre-rendered Sample Analysis</span>
            <span className="text-amber-800 text-[11px]">
              Displaying sample analysis for demo exploration. Upload your own PDF or DOCX file for live document analysis.
            </span>
          </div>
        </div>
      )}

      {/* 1. DOCUMENT OVERVIEW */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          id="accordion-btn-overview"
          aria-expanded={openSections.overview}
          aria-controls="accordion-section-overview"
          onClick={() => toggleSection('overview')}
          className="w-full px-4 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Document Overview</h3>
          </div>
          {openSections.overview ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
        </button>

        {openSections.overview && (
          <div id="accordion-section-overview" role="region" aria-labelledby="accordion-btn-overview" className="p-4 space-y-3.5">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Executive Summary
              </span>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {analysis.overview.executiveSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-500 text-[10px] block">Agreement Type</span>
                <span className="font-semibold text-slate-800">{analysis.overview.documentType}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-500 text-[10px] block">Effective Date</span>
                <span className="font-semibold text-slate-800">{analysis.overview.effectiveDate}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-500 text-[10px] block">Term Commitment</span>
                <span className="font-semibold text-slate-800">{analysis.overview.termLength}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-100 bg-white">
                <span className="text-slate-500 text-[10px] block">Governing Law</span>
                <span className="font-semibold text-slate-800">{analysis.overview.governingLaw}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. KEY OBLIGATIONS */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          id="accordion-btn-obligations"
          aria-expanded={openSections.obligations}
          aria-controls="accordion-section-obligations"
          onClick={() => toggleSection('obligations')}
          className="w-full px-4 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Key Obligations</h3>
              <span className="text-xs font-mono font-medium px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                {analysis.keyObligations.length}
              </span>
            </div>
          </div>
          {openSections.obligations ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
        </button>

        {openSections.obligations && (
          <div id="accordion-section-obligations" role="region" aria-labelledby="accordion-btn-obligations" className="p-4 space-y-2.5">
            {analysis.keyObligations.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-slate-200/80 hover:border-slate-300 transition-colors bg-white text-xs"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                    item.party === 'Client' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.party} Obligation
                  </span>
                  <ImportanceBadge level={item.importance} size="sm" />
                </div>
                <p className="text-slate-700 leading-relaxed">{item.description}</p>
                {item.deadline && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded">
                    <Clock className="w-3 h-3 text-amber-600" aria-hidden="true" />
                    <span>Cutoff: {item.deadline}</span>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">{item.clauseRef}</span>
                  <button
                    type="button"
                    onClick={() => onJumpToClause(item.clauseRef)}
                    aria-label={`Inspect ${item.party} obligation in ${item.clauseRef}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-0.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-0.5"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. IMPORTANT DATES */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          id="accordion-btn-dates"
          aria-expanded={openSections.dates}
          aria-controls="accordion-section-dates"
          onClick={() => toggleSection('dates')}
          className="w-full px-4 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Important Dates</h3>
              <span className="text-xs font-mono font-medium px-1.5 py-0.2 rounded bg-amber-50 text-amber-700">
                {analysis.importantDates.length}
              </span>
            </div>
          </div>
          {openSections.dates ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
        </button>

        {openSections.dates && (
          <div id="accordion-section-dates" role="region" aria-labelledby="accordion-btn-dates" className="p-4 space-y-2.5">
            {analysis.importantDates.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-lg border border-slate-200/80 bg-white text-xs flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{d.title}</span>
                  <span className="font-mono text-[10px] text-slate-500">{d.clauseRef}</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-700 font-semibold mt-0.5">
                  <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{d.date}</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed mt-1">{d.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. FINANCIAL COMMITMENTS */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          id="accordion-btn-financials"
          aria-expanded={openSections.financials}
          aria-controls="accordion-section-financials"
          onClick={() => toggleSection('financials')}
          className="w-full px-4 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Financial Commitments</h3>
              <span className="text-xs font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700">
                {analysis.financialCommitments.length}
              </span>
            </div>
          </div>
          {openSections.financials ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
        </button>

        {openSections.financials && (
          <div id="accordion-section-financials" role="region" aria-labelledby="accordion-btn-financials" className="p-4 space-y-2.5">
            {analysis.financialCommitments.map((fin) => (
              <div
                key={fin.id}
                className="p-3 rounded-lg border border-slate-200/80 bg-white text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">{fin.item}</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">{fin.schedule}</p>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    {fin.amount}
                  </span>
                </div>
                {fin.penaltyTerms && (
                  <div className="mt-2 text-[11px] text-rose-700 bg-rose-50/60 p-2 rounded border border-rose-100">
                    <strong>Penalty:</strong> {fin.penaltyTerms}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <span className="text-slate-500 font-mono">{fin.clauseRef}</span>
                  <button
                    type="button"
                    onClick={() => onJumpToClause(fin.clauseRef)}
                    aria-label={`View clause for ${fin.item} (${fin.clauseRef})`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-0.5"
                  >
                    View Clause
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. POTENTIAL CONCERNS */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          id="accordion-btn-concerns"
          aria-expanded={openSections.concerns}
          aria-controls="accordion-section-concerns"
          onClick={() => toggleSection('concerns')}
          className="w-full px-4 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Potential Concerns</h3>
              <span className="text-xs font-mono font-medium px-1.5 py-0.2 rounded bg-rose-50 text-rose-700">
                {analysis.potentialConcerns.length}
              </span>
            </div>
          </div>
          {openSections.concerns ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
        </button>

        {openSections.concerns && (
          <div id="accordion-section-concerns" role="region" aria-labelledby="accordion-btn-concerns" className="p-4 space-y-3">
            {analysis.potentialConcerns.map((concern) => (
              <div
                key={concern.id}
                className="p-3.5 rounded-lg border border-rose-200/80 bg-rose-50/30 text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-rose-950 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
                    <span>{concern.title}</span>
                  </h4>
                  <ImportanceBadge level={concern.severity} size="sm" />
                </div>
                <p className="text-slate-700 leading-relaxed">{concern.description}</p>
                <div className="bg-white p-2.5 rounded-md border border-rose-100 text-[11px] text-slate-600">
                  <span className="font-semibold text-rose-800 block mb-0.5">Mitigation Suggestion:</span>
                  {concern.mitigationAdvice}
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-500 font-mono">{concern.clauseRef}</span>
                  <button
                    type="button"
                    onClick={() => onJumpToClause(concern.clauseRef)}
                    aria-label={`Inspect concern ${concern.title} in document (${concern.clauseRef})`}
                    className="text-rose-700 hover:text-rose-900 font-semibold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded p-0.5"
                  >
                    Inspect in Document
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. QUESTIONS TO CONSIDER */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
        <button
          type="button"
          id="accordion-btn-questions"
          aria-expanded={openSections.questions}
          aria-controls="accordion-section-questions"
          onClick={() => toggleSection('questions')}
          className="w-full px-4 py-3.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center">
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Questions to Consider</h3>
              <span className="text-xs font-mono font-medium px-1.5 py-0.2 rounded bg-purple-50 text-purple-700">
                {analysis.questionsToConsider.length}
              </span>
            </div>
          </div>
          {openSections.questions ? <ChevronUp className="w-4 h-4 text-slate-500" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-slate-500" aria-hidden="true" />}
        </button>

        {openSections.questions && (
          <div id="accordion-section-questions" role="region" aria-labelledby="accordion-btn-questions" className="p-4 space-y-2.5">
            {analysis.questionsToConsider.map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-lg border border-slate-200/80 bg-white text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                    {q.category}
                  </span>
                  {q.clauseRef && <span className="font-mono text-[10px] text-slate-500">{q.clauseRef}</span>}
                </div>
                <h4 className="font-semibold text-slate-900 leading-snug">{q.question}</h4>
                <p className="text-[11px] text-slate-600">{q.rationale}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
