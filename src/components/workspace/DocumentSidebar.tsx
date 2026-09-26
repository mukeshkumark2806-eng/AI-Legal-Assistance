import React, { useState } from 'react';
import type { LegalDocument, ClauseCategory } from '../../types/document';
import { 
  CheckCircle2, 
  FileCheck2, 
  Layers, 
  Scale, 
  ShieldAlert 
} from 'lucide-react';
import { CategoryBadge } from '../ui/StatusBadge';

interface DocumentSidebarProps {
  document: LegalDocument;
  selectedClauseId: string | null;
  onSelectClause: (clauseId: string) => void;
  onSelectSection: (sectionId: string) => void;
  onUploadNewClick: () => void;
}

export const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
  document: doc,
  selectedClauseId,
  onSelectClause,
  onSelectSection,
  onUploadNewClick
}) => {
  const [activeTab, setActiveTab] = useState<'toc' | 'clauses'>('toc');
  const [selectedCategory, setSelectedCategory] = useState<ClauseCategory | 'All'>('All');

  const handleSidebarTabKeyDown = (e: React.KeyboardEvent, tab: 'toc' | 'clauses') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextTab = tab === 'toc' ? 'clauses' : 'toc';
      setActiveTab(nextTab);
      document.getElementById(`sidebar-tab-${nextTab}`)?.focus();
    }
  };

  const categories: (ClauseCategory | 'All')[] = [
    'All',
    'Obligation',
    'Payment',
    'Termination',
    'Deadline',
    'Restriction',
    'Important'
  ];

  const filteredClauses = selectedCategory === 'All'
    ? doc.clauses
    : doc.clauses.filter((c) => c.category === selectedCategory);

  const isUploadedDoc = doc.isUploaded || doc.source === 'uploaded';

  return (
    <aside className="w-full lg:w-72 xl:w-80 flex flex-col bg-white border-r border-slate-200/90 h-full overflow-hidden shrink-0">
      {/* Top Document Meta Card */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active Document
            </span>
            {isUploadedDoc ? (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                Uploaded
              </span>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                Demo
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onUploadNewClick}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline cursor-pointer"
          >
            Upload
          </button>
        </div>

        <h3 className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2" title={doc.name}>
          {doc.name}
        </h3>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
          <div className="p-2 rounded-lg bg-white border border-slate-200/80">
            <span className="text-slate-400 block text-[10px]">
              {isUploadedDoc ? 'Ingestion Status' : 'Risk Assessment'}
            </span>
            <div className="flex items-center gap-1.5 font-semibold mt-0.5">
              {isUploadedDoc ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Structured</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-amber-700">{doc.overallRisk}</span>
                </>
              )}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white border border-slate-200/80">
            <span className="text-slate-400 block text-[10px]">
              {isUploadedDoc ? 'Sections Detected' : 'Clauses Extracted'}
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-0.5">
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {isUploadedDoc ? `${doc.sections.length} Sections` : `${doc.clauses.length} Items`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Table of Contents vs Clause Index */}
      <div role="tablist" aria-label="Document Outline and Clauses" className="flex border-b border-slate-200 bg-white">
        <button
          type="button"
          role="tab"
          id="sidebar-tab-toc"
          aria-selected={activeTab === 'toc'}
          aria-controls="sidebar-panel-toc"
          tabIndex={activeTab === 'toc' ? 0 : -1}
          onKeyDown={(e) => handleSidebarTabKeyDown(e, 'toc')}
          onClick={() => setActiveTab('toc')}
          className={`flex-1 py-2.5 px-3 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            activeTab === 'toc'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Outline ({doc.sections.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          id="sidebar-tab-clauses"
          aria-selected={activeTab === 'clauses'}
          aria-controls="sidebar-panel-clauses"
          tabIndex={activeTab === 'clauses' ? 0 : -1}
          onKeyDown={(e) => handleSidebarTabKeyDown(e, 'clauses')}
          onClick={() => setActiveTab('clauses')}
          className={`flex-1 py-2.5 px-3 text-xs font-medium border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            activeTab === 'clauses'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Clauses ({doc.clauses.length})</span>
        </button>
      </div>

      {/* Tab 1: Table of Contents (Outline) */}
      {activeTab === 'toc' && (
        <div id="sidebar-panel-toc" role="tabpanel" aria-labelledby="sidebar-tab-toc" tabIndex={0} className="flex-1 overflow-y-auto p-3 space-y-1 focus:outline-none">
          <div className="px-2 py-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Detected Sections</span>
            <span>Jump</span>
          </div>

          {doc.sections.map((section) => {
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelectSection(section.id)}
                className="w-full text-left p-2.5 rounded-lg text-xs hover:bg-slate-100/80 transition-colors flex items-start justify-between group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <div className="flex items-start gap-2 min-w-0 pr-2">
                  {section.sectionNumber && (
                    <span className="font-mono text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5">
                      {section.sectionNumber}
                    </span>
                  )}
                  <span className="font-medium text-slate-700 group-hover:text-slate-900 leading-snug truncate">
                    {section.title}
                  </span>
                </div>
                {section.pageNumber !== undefined && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                    p.{section.pageNumber}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab 2: Clause Filter Index */}
      {activeTab === 'clauses' && (
        <div id="sidebar-panel-clauses" role="tabpanel" aria-labelledby="sidebar-tab-clauses" tabIndex={0} className="flex-1 overflow-y-auto flex flex-col focus:outline-none">
          {doc.clauses.length === 0 ? (
            <div className="p-4 text-center space-y-3 m-auto">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Source Document Ingested</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Real document text has been extracted and structured into {doc.sections.length} sections.
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 text-left">
                <span className="font-semibold text-slate-800 block mb-0.5">Build 3 Integration:</span>
                Individual clause classification and risk extraction will be performed by the GenAI pipeline in the next build.
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('toc')}
                className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                View Document Outline ({doc.sections.length} Sections) →
              </button>
            </div>
          ) : (
            <>
              {/* Category Filter Chips */}
              <div role="toolbar" aria-label="Filter clauses by category" className="p-3 border-b border-slate-100 flex flex-wrap gap-1 bg-slate-50/50">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[11px] px-2 py-1 rounded-md font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Clauses List */}
              <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
                {filteredClauses.map((clause) => {
                  const isSelected = selectedClauseId === clause.id;
                  return (
                    <button
                      key={clause.id}
                      type="button"
                      onClick={() => onSelectClause(clause.id)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium shadow-xs'
                          : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-slate-400">
                          Sec {clause.sectionNumber}
                        </span>
                        <CategoryBadge category={clause.category} size="sm" />
                      </div>
                      <p className="font-medium text-slate-900 line-clamp-1">
                        {clause.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {clause.plainEnglishExplanation}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span className="truncate">
            {isUploadedDoc ? `Parser: ${doc.fileType}` : `Jurisdiction: ${doc.jurisdiction}`}
          </span>
          {doc.extractionStats && (
            <span className="font-mono text-[10px] text-emerald-600 shrink-0">
              {doc.extractionStats.processingTimeMs}ms
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
