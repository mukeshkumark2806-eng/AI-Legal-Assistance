import React from 'react';
import type { ClauseCategory } from '../../types/document';
import { 
  AlertCircle, 
  Calendar, 
  CreditCard, 
  FileText, 
  MinusCircle, 
  PlusCircle, 
  RefreshCw, 
  ShieldAlert, 
  XCircle 
} from 'lucide-react';

interface CategoryBadgeProps {
  category: ClauseCategory | string;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5';
  const catKey = (category || '').toUpperCase();

  let label = category;
  let className = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
  let icon: React.ReactNode = <AlertCircle className="w-3 h-3" />;

  if (catKey.includes('PAY') || catKey.includes('FEE')) {
    label = 'Payment';
    className = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    icon = <CreditCard className="w-3 h-3" />;
  } else if (catKey.includes('TERM')) {
    label = 'Termination';
    className = 'bg-rose-50 text-rose-700 border-rose-200/80';
    icon = <XCircle className="w-3 h-3" />;
  } else if (catKey.includes('DEAD') || catKey.includes('DATE') || catKey.includes('TIME')) {
    label = 'Deadline';
    className = 'bg-amber-50 text-amber-700 border-amber-200/80';
    icon = <Calendar className="w-3 h-3" />;
  } else if (catKey.includes('LIAB') || catKey.includes('INDEMN') || catKey.includes('REST')) {
    label = 'Liability & Risk';
    className = 'bg-purple-50 text-purple-700 border-purple-200/80';
    icon = <ShieldAlert className="w-3 h-3" />;
  } else if (catKey.includes('CONFID')) {
    label = 'Confidentiality';
    className = 'bg-teal-50 text-teal-700 border-teal-200/80';
    icon = <ShieldAlert className="w-3 h-3" />;
  } else if (catKey.includes('OBLIG')) {
    label = 'Obligation';
    className = 'bg-blue-50 text-blue-700 border-blue-200/80';
    icon = <FileText className="w-3 h-3" />;
  } else if (catKey.includes('LAW') || catKey.includes('JURIS')) {
    label = 'Governing Law';
    className = 'bg-slate-100 text-slate-700 border-slate-300';
    icon = <FileText className="w-3 h-3" />;
  } else if (catKey.includes('RENEW')) {
    label = 'Renewal';
    className = 'bg-cyan-50 text-cyan-700 border-cyan-200';
    icon = <RefreshCw className="w-3 h-3" />;
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-md border ${className} ${sizeClasses}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};

export const ImportanceBadge: React.FC<{ level: string; size?: 'sm' | 'md' }> = ({ level, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  const u = (level || '').toUpperCase();

  let label = 'Standard';
  let className = 'bg-slate-50 text-slate-600 border-slate-200/60';
  let dotColor = 'bg-slate-300';

  if (u.includes('CRIT')) {
    label = 'Critical';
    className = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
  } else if (u.includes('HIGH')) {
    label = 'High Priority';
    className = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (u.includes('MOD') || u.includes('MED')) {
    label = 'Moderate';
    className = 'bg-slate-100 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-400';
  } else if (u.includes('LOW') || u.includes('INFO')) {
    label = 'Standard';
    className = 'bg-slate-50 text-slate-600 border-slate-200/60';
    dotColor = 'bg-slate-300';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded border ${className} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};

interface ComparisonBadgeProps {
  type: string;
}

export const ComparisonBadge: React.FC<ComparisonBadgeProps> = ({ type }) => {
  const norm = (type || '').toLowerCase();

  let label = 'Modified Clause';
  let className = 'bg-amber-50 text-amber-700 border-amber-200';
  let icon: React.ReactNode = <RefreshCw className="w-3.5 h-3.5" />;

  if (norm.includes('add') || norm.includes('insert')) {
    label = 'Added Clause';
    className = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <PlusCircle className="w-3.5 h-3.5" />;
  } else if (norm.includes('rem') || norm.includes('del')) {
    label = 'Removed Clause';
    className = 'bg-rose-50 text-rose-700 border-rose-200';
    icon = <MinusCircle className="w-3.5 h-3.5" />;
  } else if (norm.includes('unch') || norm.includes('same')) {
    label = 'Unchanged';
    className = 'bg-slate-50 text-slate-600 border-slate-200';
    icon = <FileText className="w-3.5 h-3.5" />;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border ${className}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};
