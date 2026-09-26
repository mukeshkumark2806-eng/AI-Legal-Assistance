import React, { useState } from 'react';
import type { LegalDocument, ClauseCategory } from '../../types/document';
import { DocumentSidebar } from './DocumentSidebar';
import { DocumentViewer } from './DocumentViewer';
import { AnalysisSection } from './AnalysisSection';
import { ClauseCard } from './ClauseCard';
import { ChatPanel } from './ChatPanel';
import { ActionCenter } from './ActionCenter';
import { 
  Bot, 
  CheckCircle2, 
  CheckSquare, 
  FileCheck2, 
  Layers, 
  Scale 
} from 'lucide-react';
import { DemoBanner } from '../ui/DisclaimerBanner';
import { analyzeDocumentWithAi } from '../../services/api/legalAnalysisApi';

interface WorkspaceProps {
  document: LegalDocument;
  onUploadNewClick: () => void;
  onUpdateDocument?: (doc: LegalDocument) => void;
}

type RightPanelTab = 'analysis' | 'clauses' | 'chat' | 'actions';

export const Workspace: React.FC<WorkspaceProps> = ({
  document: doc,
  onUploadNewClick,
  onUpdateDocument
}) => {
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(
    doc.clauses.length > 0 ? doc.clauses[0]?.id : null
  );
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('analysis');
  const [clauseCategoryFilter, setClauseCategoryFilter] = useState<ClauseCategory | 'All'>('All');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);

  const handleTriggerAiAnalysis = async () => {
    if (isAnalyzingAi) return;
    setIsAnalyzingAi(true);
    try {
      const analyzedDoc = await analyzeDocumentWithAi(doc);
      if (onUpdateDocument) {
        onUpdateDocument(analyzedDoc);
      }
    } catch (err) {
      console.error('Failed to trigger AI analysis:', err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };
  
  // Mobile active pane
  const [mobileActiveView, setMobileActiveView] = useState<'document' | 'sidebar' | 'panel'>('document');

  // Reset selectedClauseId when document changes without cascading effect
  const [prevDocId, setPrevDocId] = useState(doc.id);
  if (doc.id !== prevDocId) {
    setPrevDocId(doc.id);
    setSelectedClauseId(doc.clauses.length > 0 ? doc.clauses[0].id : null);
  }

  const handleSelectClause = (clauseId: string) => {
    setSelectedClauseId(clauseId);
    // Smooth scroll to clause in document viewer
    const el = window.document.getElementById(`clause-${clauseId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    // Fallback: match by canonical clause ID, sourceReference, sectionNumber, or exact title
    const targetClause = doc.clauses.find((c) => c.id === clauseId);
    if (targetClause) {
      const matchedSection = doc.sections.find(
        (s) =>
          s.clauseIds.includes(clauseId) ||
          (s.sourceReference && targetClause.sourceReference && s.sourceReference.trim().toLowerCase() === targetClause.sourceReference.trim().toLowerCase()) ||
          (s.sectionNumber && targetClause.sectionNumber && String(s.sectionNumber).trim() === String(targetClause.sectionNumber).trim()) ||
          (s.title && targetClause.title && s.title.trim().toLowerCase() === targetClause.title.trim().toLowerCase())
      );
      if (matchedSection) {
        handleSelectSection(matchedSection.id);
      }
    }
  };

  const handleSelectSection = (sectionId: string) => {
    const el = window.document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleJumpToClauseRef = (clauseRef: string) => {
    if (!clauseRef) return;
    const cleanRef = clauseRef.trim();

    // Extract numerical section if present, e.g. "Section 10", "Sec 13", "10", "13.0"
    const numMatch = cleanRef.match(/(?:Section|Sec\.?|Clause|Art\.?|Article)?\s*(\d+(?:\.\d+)*)/i);
    const targetNum = numMatch ? numMatch[1] : null;

    // 1. Match clause by exact sourceReference, exact sectionNumber, or exact title
    const match = doc.clauses.find((c) => {
      if (c.sourceReference && c.sourceReference.toLowerCase().trim() === cleanRef.toLowerCase()) return true;
      if (c.sectionNumber && String(c.sectionNumber).trim() === cleanRef) return true;
      if (targetNum && c.sectionNumber && (String(c.sectionNumber).trim() === targetNum || String(c.sectionNumber).trim() === `${targetNum}.0` || `${String(c.sectionNumber).trim()}.0` === targetNum)) return true;
      if (c.title && c.title.toLowerCase().trim() === cleanRef.toLowerCase()) return true;
      return false;
    });
    if (match) {
      handleSelectClause(match.id);
      return;
    }
    
    // 2. Attempt to match section by exact sourceReference, sectionNumber, or exact title
    const matchedSection = doc.sections.find((s) => {
      if (s.sourceReference && s.sourceReference.toLowerCase().trim() === cleanRef.toLowerCase()) return true;
      if (s.sectionNumber && String(s.sectionNumber).trim() === cleanRef) return true;
      if (targetNum && s.sectionNumber && (String(s.sectionNumber).trim() === targetNum || String(s.sectionNumber).trim() === `${targetNum}.0` || `${String(s.sectionNumber).trim()}.0` === targetNum)) return true;
      if (targetNum && (s.id === `sec-${targetNum}` || s.id === `sec-p${targetNum}` || s.id === `sec-chunk-${targetNum}`)) return true;
      if (s.title && s.title.toLowerCase().trim() === cleanRef.toLowerCase()) return true;
      return false;
    });
    if (matchedSection) {
      handleSelectSection(matchedSection.id);
      return;
    }

    // 3. Substring match fallback for full titles (longest matching section title)
    const matchingSections = doc.sections
      .filter((s) => s.title && (cleanRef.toLowerCase().includes(s.title.toLowerCase()) || s.title.toLowerCase().includes(cleanRef.toLowerCase())))
      .sort((a, b) => (b.title?.length || 0) - (a.title?.length || 0));
    if (matchingSections.length > 0) {
      handleSelectSection(matchingSections[0].id);
      return;
    }

    // Fallback: search for text in viewer
    const el = window.document.querySelector(`[id*="${cleanRef.replace(/\s+/g, '')}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const filteredClauses = clauseCategoryFilter === 'All'
    ? doc.clauses
    : doc.clauses.filter((c) => c.category === clauseCategoryFilter);

  const categories: (ClauseCategory | 'All')[] = [
    'All',
    'Obligation',
    'Payment',
    'Termination',
    'Deadline',
    'Restriction',
    'Important'
  ];

  const isUploadedDoc = doc.isUploaded || doc.source === 'uploaded';

  // Arrow key navigation between right panel tabs
  const tabList: RightPanelTab[] = ['analysis', 'clauses', 'chat', 'actions'];
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: RightPanelTab) => {
    const currentIndex = tabList.indexOf(currentTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextTab = tabList[(currentIndex + 1) % tabList.length];
      setRightPanelTab(nextTab);
      const nextEl = document.getElementById(`workspace-tab-${nextTab}`);
      nextEl?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevTab = tabList[(currentIndex - 1 + tabList.length) % tabList.length];
      setRightPanelTab(prevTab);
      const prevEl = document.getElementById(`workspace-tab-${prevTab}`);
      prevEl?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      {/* Top Banner: Distinguish Real Uploaded Document vs Demo Sample */}
      <div className="px-4 py-2 bg-white border-b border-slate-200">
        {isUploadedDoc ? (
          <div 
            role="status"
            aria-live="polite"
            className="bg-emerald-50/90 border border-emerald-200 px-3.5 py-2 rounded-lg flex items-center justify-between gap-3 text-xs text-emerald-950"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-2 w-2 relative shrink-0" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="font-bold shrink-0">
                {doc.isAiAnalyzed ? 'Document Analysis Active:' : 'Document Text Extracted:'}
              </span>
              <span className="text-emerald-800 truncate">
                {doc.isAiAnalyzed ? (
                  <>Live document analysis completed for <strong className="text-emerald-950">{doc.name}</strong> ({doc.clauses.length} structured clauses, {doc.sections.length} sections, {doc.totalPages} {doc.totalPages === 1 ? 'page' : 'pages'}).</>
                ) : (
                  <>Displaying actual extracted text from <strong className="text-emerald-950">{doc.name}</strong> ({doc.totalPages} {doc.totalPages === 1 ? 'page' : 'pages'}, {doc.sections.length} sections, {doc.extractionStats?.totalWords.toLocaleString()} words).</>
                )}
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" aria-hidden="true" /> {doc.isAiAnalyzed ? 'Analysis Active' : 'Extracted Locally'}
            </span>
          </div>
        ) : (
          <DemoBanner />
        )}
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div 
        role="navigation"
        aria-label="Workspace views"
        className="lg:hidden flex items-center justify-around border-b border-slate-200 bg-white px-2 py-1.5 text-xs"
      >
        <button
          type="button"
          onClick={() => setMobileActiveView('sidebar')}
          className={`px-3 py-1.5 rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            mobileActiveView === 'sidebar' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
          }`}
        >
          Outline ({doc.sections.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView('document')}
          className={`px-3 py-1.5 rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            mobileActiveView === 'document' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
          }`}
        >
          Document Text
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveView('panel')}
          className={`px-3 py-1.5 rounded-md font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            mobileActiveView === 'panel' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
          }`}
        >
          AI Intelligence Panel
        </button>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Document Outline & Navigation Sidebar */}
        <div className={`h-full ${mobileActiveView === 'sidebar' ? 'w-full block' : 'hidden lg:block'}`}>
          <DocumentSidebar
            document={doc}
            selectedClauseId={selectedClauseId}
            onSelectClause={(id) => {
              handleSelectClause(id);
              setMobileActiveView('document');
            }}
            onSelectSection={(id) => {
              handleSelectSection(id);
              setMobileActiveView('document');
            }}
            onUploadNewClick={onUploadNewClick}
          />
        </div>

        {/* CENTER COLUMN: Document Viewer */}
        <div className={`flex-1 p-3 sm:p-4 overflow-hidden h-full ${mobileActiveView === 'document' ? 'block' : 'hidden lg:block'}`}>
          <DocumentViewer
            document={doc}
            selectedClauseId={selectedClauseId}
            onSelectClause={handleSelectClause}
          />
        </div>

        {/* RIGHT COLUMN: AI Analysis & Intelligence Panel */}
        <div className={`w-full lg:w-96 xl:w-[460px] h-full flex flex-col bg-white border-l border-slate-200/90 shrink-0 ${
          mobileActiveView === 'panel' ? 'block' : 'hidden lg:flex'
        }`}>
          {/* Right Panel Navigation Tabs */}
          <div 
            role="tablist"
            aria-label="Intelligence Panel Sections"
            className="flex border-b border-slate-200 bg-slate-50/50 p-1.5 gap-1 shrink-0"
          >
            <button
              type="button"
              role="tab"
              id="workspace-tab-analysis"
              aria-selected={rightPanelTab === 'analysis'}
              aria-controls="workspace-panel-analysis"
              tabIndex={rightPanelTab === 'analysis' ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 'analysis')}
              onClick={() => setRightPanelTab('analysis')}
              className={`flex-1 py-2 px-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                rightPanelTab === 'analysis'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
              <span>Analysis</span>
            </button>

            <button
              type="button"
              role="tab"
              id="workspace-tab-clauses"
              aria-selected={rightPanelTab === 'clauses'}
              aria-controls="workspace-panel-clauses"
              tabIndex={rightPanelTab === 'clauses' ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 'clauses')}
              onClick={() => setRightPanelTab('clauses')}
              className={`flex-1 py-2 px-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                rightPanelTab === 'clauses'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <span>Clauses</span>
            </button>

            <button
              type="button"
              role="tab"
              id="workspace-tab-chat"
              aria-selected={rightPanelTab === 'chat'}
              aria-controls="workspace-panel-chat"
              tabIndex={rightPanelTab === 'chat' ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 'chat')}
              onClick={() => setRightPanelTab('chat')}
              className={`flex-1 py-2 px-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                rightPanelTab === 'chat'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
              <span>Ask Document</span>
            </button>

            <button
              type="button"
              role="tab"
              id="workspace-tab-actions"
              aria-selected={rightPanelTab === 'actions'}
              aria-controls="workspace-panel-actions"
              tabIndex={rightPanelTab === 'actions' ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 'actions')}
              onClick={() => setRightPanelTab('actions')}
              className={`flex-1 py-2 px-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                rightPanelTab === 'actions'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
              <span>Actions</span>
            </button>
          </div>

          {/* Right Panel Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {rightPanelTab === 'analysis' && (
              <div 
                role="tabpanel"
                id="workspace-panel-analysis"
                aria-labelledby="workspace-tab-analysis"
                tabIndex={0}
                className="focus:outline-none"
              >
                <AnalysisSection
                  document={doc}
                  onJumpToClause={handleJumpToClauseRef}
                  onTriggerAiAnalysis={handleTriggerAiAnalysis}
                  isAnalyzing={isAnalyzingAi}
                />
              </div>
            )}

            {rightPanelTab === 'clauses' && (
              <div 
                role="tabpanel"
                id="workspace-panel-clauses"
                aria-labelledby="workspace-tab-clauses"
                tabIndex={0}
                className="space-y-3 focus:outline-none"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    Clause Intelligence Cards
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    {filteredClauses.length} of {doc.clauses.length}
                  </span>
                </div>

                {doc.clauses.length === 0 ? (
                  <div className="p-6 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto" aria-hidden="true">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {doc.sections.length} Structural Sections Extracted
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Raw document text has been structured into {doc.sections.length} sections. Document analysis classifies individual clauses and risk tags.
                    </p>
                    <button
                      type="button"
                      onClick={() => setRightPanelTab('analysis')}
                      className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-1"
                    >
                      View Extracted Section Hierarchy →
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Filter chips */}
                    <div role="group" aria-label="Filter clauses by category" className="flex flex-wrap gap-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          aria-pressed={clauseCategoryFilter === cat}
                          onClick={() => setClauseCategoryFilter(cat)}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                            clauseCategoryFilter === cat
                              ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* List of reusable Clause Cards */}
                    <div className="space-y-3 pt-2">
                      {filteredClauses.map((clause) => (
                        <ClauseCard
                          key={clause.id}
                          clause={clause}
                          isSelected={selectedClauseId === clause.id}
                          onViewClause={(id) => {
                            handleSelectClause(id);
                            setMobileActiveView('document');
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {rightPanelTab === 'chat' && (
              <div 
                role="tabpanel"
                id="workspace-panel-chat"
                aria-labelledby="workspace-tab-chat"
                tabIndex={0}
                className="h-full focus:outline-none"
              >
                <ChatPanel key={doc.id} document={doc} onJumpToClause={handleJumpToClauseRef} />
              </div>
            )}

            {rightPanelTab === 'actions' && (
              <div 
                role="tabpanel"
                id="workspace-panel-actions"
                aria-labelledby="workspace-tab-actions"
                tabIndex={0}
                className="focus:outline-none"
              >
                <ActionCenter
                  document={doc}
                  onJumpToClause={handleJumpToClauseRef}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
