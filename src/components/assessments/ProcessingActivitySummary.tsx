import React from 'react';
import { Lock, FileText } from 'lucide-react';
import { ProcessingActivity } from '../../types/privacy';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { StatusBadge } from '../common/Badge';
import { ReadOnlyChips } from './assessmentUi';

interface ProcessingActivitySummaryProps {
  activity: ProcessingActivity;
  compact?: boolean;
}

const SummaryField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <div className="text-xs text-slate-800 leading-relaxed">{children}</div>
  </div>
);

const textOrEmpty = (value: string | undefined, emptyLabel: string) => {
  if (!value || value.trim() === '') {
    return <span className="text-slate-400 italic">{emptyLabel}</span>;
  }
  return value;
};

export const ProcessingActivitySummary: React.FC<ProcessingActivitySummaryProps> = ({ activity, compact = false }) => {
  const { getRelatedRecords } = usePrivacyData();
  const related = getRelatedRecords(activity.id, 'processingActivities');

  const purposeParts = [activity.purpose, ...(activity.categoriesOfProcessing || [])].filter(
    (value): value is string => Boolean(value && value.trim())
  );
  const securityMeasures = [...(activity.toms || [])];
  if (activity.tomsOther && activity.tomsOther.trim()) {
    securityMeasures.push(activity.tomsOther.trim());
  }

  const recipients = [
    ...related.vendors.map(vendor => vendor.name),
    ...(activity.recipientCategories || []),
    activity.specifiedThirdParty || '',
    activity.specifiedTrimbleProductTeam || '',
  ].filter((value, index, all) => value && all.indexOf(value) === index);

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-indigo-100 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
            <Lock className="w-3 h-3" />
            Processing Activity Summary
          </div>
          <div className="mt-1 flex items-center gap-2 min-w-0">
            <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <p className="text-sm font-bold text-slate-900 truncate">{activity.name}</p>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{activity.id}</p>
        </div>
        <StatusBadge status={activity.status} />
      </div>

      <div className={`p-4 grid grid-cols-1 md:grid-cols-2 gap-4 ${compact ? '' : ''}`}>
        <SummaryField label="Purpose">
          {purposeParts.length > 0 ? (
            <span>{purposeParts.join(' · ')}</span>
          ) : (
            textOrEmpty(activity.description, 'Not recorded in Data Mapping')
          )}
          {purposeParts.length > 0 && activity.description && !compact && (
            <p className="text-slate-500 mt-1">{activity.description}</p>
          )}
        </SummaryField>
        <SummaryField label="Controller / processor role">{textOrEmpty(activity.role, 'Not recorded in Data Mapping')}</SummaryField>
        <SummaryField label="Data subjects">
          <ReadOnlyChips items={activity.dataSubjectCategories || []} emptyLabel="Not recorded in Data Mapping" />
        </SummaryField>
        <SummaryField label="Personal-data categories">
          <ReadOnlyChips items={activity.personalDataCategories || []} emptyLabel="Not recorded in Data Mapping" />
        </SummaryField>
        <SummaryField label="Legal basis">{textOrEmpty(activity.legalBasis, 'Not recorded in Data Mapping')}</SummaryField>
        <SummaryField label="Assets">
          <ReadOnlyChips
            items={related.assets.map(asset => asset.name)}
            emptyLabel="Not recorded in Data Mapping"
          />
        </SummaryField>
        <SummaryField label="Vendors / recipients">
          <ReadOnlyChips items={recipients} emptyLabel="Not recorded in Data Mapping" />
        </SummaryField>
        <SummaryField label="Security measures">
          <ReadOnlyChips items={securityMeasures} emptyLabel="Not recorded in Data Mapping" />
        </SummaryField>
      </div>
      <p className="px-4 pb-3 text-[11px] text-slate-500">
        Taken from the linked Data Mapping record. These fields are read-only in the assessment.
      </p>
    </div>
  );
};
