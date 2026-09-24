import React from 'react';
import type { Clause } from '../../types/document';
import { CategoryBadge, ImportanceBadge } from '../ui/StatusBadge';
import { Eye, ChevronRight, AlertTriangle } from 'lucide-react';

interface ClauseCardProps {
  clause: Clause;
  isSelected?: boolean;
  onViewClause: (clauseId: string) => void;
  className?: string;
}

export const ClauseCard: React.FC<ClauseCardProps> = ({
  clause,
  isSelected = false,
  onViewClause,
  className = ''
}) => {
  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 bg-white p-4 shadow-xs ${
        isSelected
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm bg-indigo-50/10'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
      } ${className}`}
    >
      {/* Card Header: Category & Importance Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <CategoryBadge category={clause.category} size="sm" />
        <div className="flex items-center gap-1.5">
          <ImportanceBadge level={clause.importance} size="sm" />
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            p.{clause.pageNumber}
          </span>
        </div>
      </div>

      {/* Title with Section Number */}
      <div className="mb-1.5">
        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-900 transition-colors flex items-center gap-1.5">
          <span className="font-mono text-slate-400 text-xs">{clause.sectionNumber}</span>
          <span className="line-clamp-1">{clause.title}</span>
        </h4>
      </div>

      {/* Plain English Explanation */}
      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3">
        {clause.plainEnglishExplanation}
      </p>

      {/* Optional Risk Note Callout */}
      {clause.riskNote && (
        <div className="mb-3 flex items-start gap-1.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{clause.riskNote}</span>
        </div>
      )}

      {/* Card Footer: Action */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono">
          Ref: Sec {clause.sectionNumber}
        </span>
        <button
          type="button"
          onClick={() => onViewClause(clause.id)}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors py-1 px-2 rounded-md hover:bg-indigo-50 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View Clause</span>
          <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
