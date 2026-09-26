import React, { useState } from 'react';
import type { LegalDocument, ActionChecklistItem } from '../../types/document';
import { 
  AlertCircle, 
  ArrowRight, 
  Check, 
  CheckSquare, 
  Copy, 
  HelpCircle, 
  UserCheck 
} from 'lucide-react';

interface ActionCenterProps {
  document: LegalDocument;
  onJumpToClause: (clauseRef: string) => void;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({
  document: doc,
  onJumpToClause
}) => {
  const [checklist, setChecklist] = useState<ActionChecklistItem[]>(doc.checklist);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  const handleCopyQuestion = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: YOUR ACTION CHECKLIST */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <CheckSquare className="w-4 h-4" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Your Action Checklist</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verify these critical business and compliance prerequisites prior to signing.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
            <span className="text-xs font-semibold text-slate-700">
              {completedCount} of {checklist.length} Completed ({progressPercent}%)
            </span>
            <div 
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Checklist progress: ${progressPercent}% completed`}
              className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden mt-1.5 ml-3 sm:ml-0"
            >
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist items */}
        <div role="group" aria-label="Action items to verify" className="mt-4 space-y-2.5">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                item.completed
                  ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs text-slate-800'
              }`}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={item.completed}
                aria-label={`Mark task completed: ${item.task}`}
                onClick={() => toggleCheck(item.id)}
                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  item.completed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 bg-white hover:border-indigo-500'
                }`}
              >
                {item.completed && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                  <span
                    className={`text-xs font-semibold leading-snug cursor-pointer ${
                      item.completed ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}
                    onClick={() => toggleCheck(item.id)}
                  >
                    {item.task}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        item.priority === 'Critical'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : item.priority === 'Recommended'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-[11px] text-slate-600 mt-0.5">{item.notes}</p>
                )}

                <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100/80">
                  <span className="font-mono text-slate-500">{item.clauseRef}</span>
                  <button
                    type="button"
                    onClick={() => onJumpToClause(item.clauseRef)}
                    aria-label={`Jump to section for clause ${item.clauseRef}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-0.5"
                  >
                    <span>View Section</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: QUESTIONS FOR A LEGAL PROFESSIONAL */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <UserCheck className="w-4 h-4" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Questions for a Legal Professional
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Curated list of critical ambiguities and risk exposures to bring directly to your legal counsel.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          {doc.lawyerQuestions.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-slate-900 text-sm leading-snug flex items-start gap-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{q.question}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => handleCopyQuestion(q.question, q.id)}
                  aria-label={copiedId === q.id ? 'Question copied to clipboard' : `Copy question: ${q.question}`}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-2xs hover:bg-slate-50 cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  title="Copy question for email to attorney"
                >
                  {copiedId === q.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      <span className="text-emerald-700 font-medium">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Context */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 text-slate-700 text-[11px] leading-relaxed">
                <strong className="text-slate-800 block mb-0.5">Agreement Context:</strong>
                {q.context}
              </div>

              {/* Why it matters */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-purple-900 font-medium">
                  <strong>Strategic Reason:</strong> {q.reason}
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToClause(q.clauseRef)}
                  aria-label={`Jump to section ${q.clauseRef}`}
                  className="font-mono text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer shrink-0 ml-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded p-0.5"
                >
                  {q.clauseRef}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pro Tip */}
        <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-950 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          <span>
            Tip: Export or copy these inquiries into an email thread with your attorney to expedite legal review.
          </span>
        </div>
      </div>
    </div>
  );
};
