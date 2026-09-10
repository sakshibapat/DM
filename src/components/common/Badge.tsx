import React from 'react';
import { StatusType, AssetType, DataClassification, DpaStatus } from '../../types/privacy';

export interface BadgeProps {
  variant?: 'status' | 'classification' | 'role' | 'severity' | 'dpa' | 'tag' | 'count';
  value: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<{ status: StatusType; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (status === 'Approved') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
    dotColor = 'bg-emerald-500';
  } else if (status === 'Under Review') {
    style = 'bg-amber-50 text-amber-800 border-amber-200/80';
    dotColor = 'bg-amber-500';
  } else if (status === 'Draft') {
    style = 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
    dotColor = 'bg-indigo-500';
  } else if (status === 'Archived') {
    style = 'bg-zinc-100 text-zinc-600 border-zinc-200';
    dotColor = 'bg-zinc-400';
  }

  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${px} font-medium ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};

export const ClassificationBadge: React.FC<{ classification: DataClassification }> = ({ classification }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  if (classification === 'Restricted') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (classification === 'Confidential') {
    style = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (classification === 'Internal') {
    style = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (classification === 'Public') {
    style = 'bg-slate-50 text-slate-600 border-slate-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {classification}
    </span>
  );
};

export const DpaStatusBadge: React.FC<{ dpaStatus: DpaStatus }> = ({ dpaStatus }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  if (dpaStatus === 'Signed') {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (dpaStatus === 'In Review') {
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (dpaStatus === 'Expired') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {dpaStatus}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: 'high' | 'medium' | 'low' }> = ({ severity }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = 'Low Risk';

  if (severity === 'high') {
    style = 'bg-rose-50 text-rose-700 border-rose-200';
    label = 'High Risk';
  } else if (severity === 'medium') {
    style = 'bg-amber-50 text-amber-800 border-amber-200';
    label = 'Medium Risk';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
};

export const TagChip: React.FC<{ label: string; onRemove?: () => void }> = ({ label, onRemove }) => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60 text-xs font-medium">
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          &times;
        </button>
      )}
    </span>
  );
};
