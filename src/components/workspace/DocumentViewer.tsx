import React, { useState } from 'react';
import type { LegalDocument } from '../../types/document';
import { 
  Eye, 
  FileText, 
  Maximize2, 
  Minimize2, 
  Printer, 
  Search, 
  ZoomIn, 
  ZoomOut 
} from 'lucide-react';
import { CategoryBadge } from '../ui/StatusBadge';

interface DocumentViewerProps {
  document: LegalDocument;
  selectedClauseId: string | null;
  onSelectClause: (clauseId: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document: doc,
  selectedClauseId,
  onSelectClause
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightAllClauses, setHighlightAllClauses] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 70), 150));
  };

  // Helper to render text with search highlight
  const renderHighlightedText = (text: string) => {
    if (!searchTerm.trim()) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark key={i} className="bg-amber-200 text-slate-900 rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const isUploadedDoc = doc.isUploaded || doc.source === 'uploaded';

  return (
    <div className={`flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs transition-all ${isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : 'relative'}`}>
      {/* Top Toolbar */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                {doc.name}
              </h2>
              {isUploadedDoc ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Real Uploaded Text
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  Demo Sample
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                {doc.fileType}
              </span>
              <span>•</span>
              <span>{doc.totalPages} {doc.totalPages === 1 ? 'Page' : 'Pages'}</span>
              <span>•</span>
              <span>{doc.fileSize}</span>
              {doc.extractionStats && (
                <>
                  <span>•</span>
                  <span>{doc.extractionStats.totalWords.toLocaleString()} words</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search in doc */}
          <div className="relative hidden sm:block">
            <label htmlFor="doc-viewer-search" className="sr-only">Search in extracted document text</label>
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="doc-viewer-search"
              type="text"
              placeholder="Search in extracted text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white w-36 lg:w-48 transition-all"
            />
          </div>

          {/* Clause highlight toggle (only relevant when clauses exist) */}
          {doc.clauses.length > 0 && (
            <button
              type="button"
              onClick={() => setHighlightAllClauses(!highlightAllClauses)}
              aria-pressed={highlightAllClauses}
              aria-label="Toggle visual clause highlighting"
              className={`hidden md:inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                highlightAllClauses
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Toggle visual clause highlighting"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Highlights</span>
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5" role="group" aria-label="Document zoom controls">
            <button
              type="button"
              onClick={() => handleZoom(-10)}
              className="p-1 text-slate-600 hover:bg-white hover:text-slate-900 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Zoom out"
              aria-label="Zoom out document"
            >
              <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-600 select-none" aria-live="polite">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(10)}
              className="p-1 text-slate-600 hover:bg-white hover:text-slate-900 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Zoom in"
              aria-label="Zoom in document"
            >
              <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Expand / Collapse */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title={isExpanded ? 'Exit full screen' : 'Expand viewer'}
            aria-label={isExpanded ? 'Exit full screen' : 'Expand document viewer'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />}
          </button>

          {/* Export / Print */}
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden lg:flex p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            title="Print or export document"
            aria-label="Print or export document"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Document Canvas / Paper */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center bg-slate-200/60">
        <div
          className="bg-white shadow-md rounded-lg border border-slate-200 max-w-3xl w-full p-8 sm:p-12 text-slate-800 transition-transform origin-top"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {/* Legal Header / Title Block */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8 text-center">
            <span className="text-[11px] uppercase tracking-widest font-mono text-slate-500 font-medium">
              {isUploadedDoc ? 'Extracted Legal Instrument' : 'Confidential Legal Instrument • ' + doc.jurisdiction}
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mt-2 break-words">
              {doc.name.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-600 mt-2 font-serif italic">
              Ingested: {doc.uploadDate} • Format: {doc.fileType} • {doc.sections.length} Detected Sections
            </p>
          </div>

          {/* Parties Preamble (for demo document only) */}
          {!isUploadedDoc && (
            <div className="mb-8 p-4 bg-slate-50/80 rounded-lg border border-slate-200/80 text-xs leading-relaxed text-slate-700">
              <p className="font-semibold text-slate-900 mb-1">PARTIES TO THIS AGREEMENT:</p>
              <p>
                This Master Services Agreement (&quot;Agreement&quot;) is entered into by and between{' '}
                <strong>{doc.parties.client}</strong>, and <strong>{doc.parties.counterparty}</strong>.
              </p>
            </div>
          )}

          {/* Document Sections */}
          <div className="space-y-8">
            {doc.sections.map((section) => {
              return (
                <div key={section.id} id={`section-${section.id}`} className="scroll-mt-6">
                  {/* Section Header with optional page indicator */}
                  <div className="border-b border-slate-200 pb-1.5 mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      {section.sectionNumber && section.sectionNumber !== 'Preamble' ? (
                        <span>SECTION {section.sectionNumber}: {section.title}</span>
                      ) : (
                        <span>{section.title}</span>
                      )}
                    </h3>

                    {section.pageNumber !== undefined && (
                      <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Page {section.pageNumber}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      // Filter clauses that authoritatively belong to this section
                      const sectionClauses = doc.clauses.filter((c) => {
                        if (section.clauseIds?.includes(c.id)) return true;
                        if (c.sourceReference && section.sourceReference && c.sourceReference.trim().toLowerCase() === section.sourceReference.trim().toLowerCase()) return true;
                        if (c.sectionNumber && section.sectionNumber && String(c.sectionNumber).trim() === String(section.sectionNumber).trim()) return true;
                        return false;
                      });

                      // Associate each paragraph with its best matched clause
                      const paragraphMatches = section.paragraphs.map((paragraph, pIdx) => {
                        let matchedClauses = sectionClauses.filter((c) => {
                          const snippet = (c.originalText || c.sourceText || '').trim();
                          if (snippet.length > 15) {
                            const normSnippet = snippet.toLowerCase().replace(/\s+/g, ' ');
                            const normPara = paragraph.toLowerCase().replace(/\s+/g, ' ');
                            if (normPara.includes(normSnippet.slice(0, 40)) || normSnippet.includes(normPara.slice(0, 40))) {
                              return true;
                            }
                          }
                          return false;
                        });

                        if (matchedClauses.length === 0 && sectionClauses.length > 0) {
                          if (sectionClauses.length === 1) {
                            matchedClauses = sectionClauses;
                          } else if (pIdx < sectionClauses.length) {
                            matchedClauses = [sectionClauses[pIdx]];
                          } else {
                            matchedClauses = [sectionClauses[0]];
                          }
                        }

                        const selectedClause = matchedClauses.find((c) => c.id === selectedClauseId);
                        const primaryClause = selectedClause || matchedClauses[0];

                        return { paragraph, pIdx, primaryClause };
                      });

                      // Group consecutive paragraphs belonging to the same authoritative clause block
                      interface ClauseBlockGroup {
                        key: string;
                        primaryClause?: (typeof sectionClauses)[0];
                        paragraphs: { text: string; pIdx: number }[];
                      }

                      const groups: ClauseBlockGroup[] = [];
                      for (const pm of paragraphMatches) {
                        const last = groups[groups.length - 1];
                        const sameClause = last && (
                          (last.primaryClause && pm.primaryClause && last.primaryClause.id === pm.primaryClause.id) ||
                          (!last.primaryClause && !pm.primaryClause)
                        );

                        if (sameClause) {
                          last.paragraphs.push({ text: pm.paragraph, pIdx: pm.pIdx });
                        } else {
                          groups.push({
                            key: pm.primaryClause ? pm.primaryClause.id : `p-${pm.pIdx}`,
                            primaryClause: pm.primaryClause,
                            paragraphs: [{ text: pm.paragraph, pIdx: pm.pIdx }]
                          });
                        }
                      }

                      return groups.map((grp, gIdx) => {
                        const primaryClause = grp.primaryClause;
                        const isSelected = Boolean(primaryClause && primaryClause.id === selectedClauseId);

                        return (
                          <div
                            key={gIdx}
                            id={primaryClause ? `clause-${primaryClause.id}` : undefined}
                            role={primaryClause ? 'button' : undefined}
                            tabIndex={primaryClause ? 0 : undefined}
                            aria-label={primaryClause ? `Inspect clause: ${primaryClause.title}` : undefined}
                            onClick={() => {
                              if (primaryClause) onSelectClause(primaryClause.id);
                            }}
                            onKeyDown={primaryClause ? (e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onSelectClause(primaryClause.id);
                              }
                            } : undefined}
                            className={`relative text-xs sm:text-sm leading-relaxed p-4 rounded-xl transition-all duration-200 font-serif ${
                              isSelected
                                ? 'bg-amber-50/90 border-2 border-amber-400 shadow-xs ring-2 ring-amber-400/20'
                                : highlightAllClauses && primaryClause
                                ? 'bg-indigo-50/20 hover:bg-indigo-50/50 border border-indigo-200/50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
                                : 'hover:bg-slate-50/60 border border-transparent'
                            }`}
                          >
                            {/* Single unified clause badge for the grouped block */}
                            {highlightAllClauses && primaryClause && (
                              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-indigo-100/70 not-italic font-sans">
                                <div className="flex items-center gap-1.5">
                                  <CategoryBadge category={primaryClause.category} size="sm" />
                                  <span className="text-[11px] font-semibold text-slate-800">
                                    {primaryClause.title}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded font-medium">
                                  {primaryClause.sourceReference || (primaryClause.sectionNumber ? `Section ${primaryClause.sectionNumber} — ${primaryClause.title}` : primaryClause.title)}
                                </span>
                              </div>
                            )}

                            {/* Render all paragraphs in this grouped block */}
                            <div className="space-y-3">
                              {grp.paragraphs.map((p) => (
                                <p key={p.pIdx} className="text-slate-800 text-justify whitespace-pre-line">
                                  {renderHighlightedText(p.text)}
                                </p>
                              ))}
                            </div>

                            {isSelected && primaryClause && (
                              <div className="mt-3 pt-2 border-t border-amber-200/80 text-xs font-sans text-amber-900 bg-amber-100/40 p-2 rounded flex items-center justify-between">
                                <span className="font-semibold">
                                  Highlighted via Clause Intelligence Inspector
                                </span>
                                <span className="text-[11px] text-amber-700 font-mono">
                                  {primaryClause.sourceReference || (primaryClause.sectionNumber ? `Section ${primaryClause.sectionNumber} — ${primaryClause.title}` : primaryClause.title)}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Document Signatures Block (for demo agreement only) */}
          {!isUploadedDoc && (
            <div className="mt-12 pt-8 border-t-2 border-slate-900">
              <p className="text-xs font-serif font-bold text-slate-900 uppercase tracking-wider mb-6">
                IN WITNESS WHEREOF, the parties hereto have executed this Agreement:
              </p>
              <div className="grid grid-cols-2 gap-8 text-xs font-serif">
                <div>
                  <p className="font-bold">{doc.parties.client}</p>
                  <div className="mt-8 border-b border-slate-400 pb-1 text-slate-500 italic">
                    Authorized Signature
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">Date: _______________</p>
                </div>
                <div>
                  <p className="font-bold">{doc.parties.counterparty}</p>
                  <div className="mt-8 border-b border-slate-400 pb-1 text-slate-500 italic">
                    Authorized Signature
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">Date: _______________</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Ribbon */}
      <div className="bg-white px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>
            {isUploadedDoc 
              ? 'Local In-Browser Extracted Document' 
              : 'Simulated Document View (Interactive Sandbox)'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>{doc.sections.length} Sections Indexed</span>
          <span>•</span>
          <span>{doc.totalPages} {doc.totalPages === 1 ? 'Page' : 'Pages'}</span>
          {doc.extractionStats && (
            <>
              <span>•</span>
              <span className="text-indigo-600 font-mono">
                {doc.extractionStats.totalWords.toLocaleString()} words
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
