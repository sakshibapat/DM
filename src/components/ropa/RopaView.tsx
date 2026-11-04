import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  Download,
  FileSpreadsheet,
  Search,
  ShieldCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { StatusType } from '../../types/privacy';
import { RopaKind, RopaRecord, buildRopaRecord, ropaExportRows } from '../../utils/ropa';
import { StatusBadge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

export const RopaView: React.FC = () => {
  const {
    processingActivities,
    privacyAssessments,
    getRelatedRecords,
    setActiveNav,
    setSelectedRecord,
    setAssessmentToOpen,
  } = usePrivacyData();
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<RopaKind | 'all'>('all');
  const [completenessFilter, setCompletenessFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusType | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const records = useMemo(
    () =>
      processingActivities.map(activity =>
        buildRopaRecord(activity, getRelatedRecords(activity.id, 'processingActivities'), privacyAssessments)
      ),
    [processingActivities, privacyAssessments, getRelatedRecords]
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return records.filter(record => {
      const matchesKind = kindFilter === 'all' || record.kind === kindFilter;
      const matchesCompleteness =
        completenessFilter === 'all' ||
        (completenessFilter === 'complete' ? record.completeness === 100 : record.completeness < 100);
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const haystack = [
        record.name,
        record.activityId,
        record.owner,
        record.role,
        ...record.fields.map(item => item.value),
        ...record.assets.map(item => item.name),
        ...record.vendors.map(item => item.name),
        ...record.assessments.map(item => item.name),
      ]
        .join(' ')
        .toLowerCase();
      return matchesKind && matchesCompleteness && matchesStatus && (!query || haystack.includes(query));
    });
  }, [records, searchQuery, kindFilter, completenessFilter, statusFilter]);

  const selected = records.find(record => record.activityId === selectedId) || null;
  const controllerCount = records.filter(record => record.kind === 'controller').length;
  const processorCount = records.filter(record => record.kind === 'processor').length;
  const incompleteCount = records.filter(record => record.completeness < 100).length;

  const exportRecords = (format: 'csv' | 'xlsx') => {
    const sheet = XLSX.utils.json_to_sheet(ropaExportRows(filtered));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'RoPA');
    XLSX.writeFile(book, `privamap-ropa.${format}`, { bookType: format === 'csv' ? 'csv' : 'xlsx' });
  };

  const openActivity = (id: string) => {
    setSelectedRecord({ id, type: 'processingActivities' });
    setActiveNav('processingActivities');
  };

  if (selected) {
    return (
      <RopaDetail
        record={selected}
        onBack={() => setSelectedId(null)}
        onOpenActivity={() => openActivity(selected.activityId)}
        onOpenLinked={(id, type) => setSelectedRecord({ id, type })}
        onOpenAssessment={id => {
          setAssessmentToOpen(id);
          setActiveNav('privacyAssessments');
        }}
      />
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shadow-2xs">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Record of Processing Activities</h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              GDPR Article 30 register generated from Data Mapping. Controller records follow Article 30(1). Processor records follow Article 30(2).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportRecords('csv')}
            className="px-3 py-2 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => exportRecords('xlsx')}
            className="px-3 py-2 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="RoPA records" value={records.length} />
        <SummaryCard label="Controller Art. 30(1)" value={controllerCount} />
        <SummaryCard label="Processor Art. 30(2)" value={processorCount} />
        <SummaryCard label="Incomplete" value={incompleteCount} tone={incompleteCount > 0 ? 'warn' : 'ok'} />
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search activities, owners, purposes, subjects, or vendors..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>
        <FilterGroup
          value={kindFilter}
          options={[
            ['all', 'All roles'],
            ['controller', 'Controller'],
            ['processor', 'Processor'],
          ]}
          onChange={value => setKindFilter(value as RopaKind | 'all')}
        />
        <FilterGroup
          value={completenessFilter}
          options={[
            ['all', 'All completeness'],
            ['complete', 'Complete'],
            ['incomplete', 'Incomplete'],
          ]}
          onChange={value => setCompletenessFilter(value as 'all' | 'complete' | 'incomplete')}
        />
        <FilterGroup
          value={statusFilter}
          options={[
            ['all', 'All status'],
            ['Approved', 'Approved'],
            ['Under Review', 'Under Review'],
            ['Draft', 'Draft'],
            ['Archived', 'Archived'],
          ]}
          onChange={value => setStatusFilter(value as StatusType | 'all')}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No RoPA records match"
          description="RoPA records come from Processing Activities. Adjust the filters or add an activity in Data Mapping."
          icon={<ClipboardList className="w-6 h-6 stroke-1.5" />}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-3.5">Processing activity</th>
                  <th className="p-3.5">Article</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Completeness</th>
                  <th className="p-3.5">Missing</th>
                  <th className="p-3.5">Links</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => (
                  <tr key={record.activityId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                    <td className="p-3.5">
                      <button type="button" onClick={() => setSelectedId(record.activityId)} className="text-left">
                        <p className="font-semibold text-slate-900 hover:text-indigo-700">{record.name}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">{record.activityId}</p>
                      </button>
                    </td>
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-800">Art. {record.article}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{record.role}</p>
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="p-3.5 min-w-[140px]">
                      <Completeness value={record.completeness} />
                    </td>
                    <td className="p-3.5 max-w-[240px] text-[11px] text-slate-600">
                      {record.missingLabels.length === 0 ? 'None' : record.missingLabels.join(', ')}
                    </td>
                    <td className="p-3.5 text-[11px] text-slate-600 whitespace-nowrap">
                      {record.assets.length} assets · {record.vendors.length} vendors · {record.assessments.length} assessments
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const RopaDetail: React.FC<{
  record: RopaRecord;
  onBack: () => void;
  onOpenActivity: () => void;
  onOpenLinked: (id: string, type: 'assets' | 'vendors' | 'entities') => void;
  onOpenAssessment: (id: string) => void;
}> = ({ record, onBack, onOpenActivity, onOpenLinked, onOpenAssessment }) => (
  <div className="p-8 max-w-5xl mx-auto space-y-5 animate-in fade-in duration-200">
    <div>
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2">
        <ArrowLeft className="w-3.5 h-3.5" />
        All RoPA records
      </button>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{record.name}</h1>
          <p className="text-xs text-slate-500 mt-1">
            Article {record.article} · {record.role} · {record.activityId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={record.status} />
          <Completeness value={record.completeness} />
        </div>
      </div>
    </div>

    {record.missingLabels.length > 0 && (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        <p className="font-bold">Missing Article {record.article} information</p>
        <p className="mt-1">{record.missingLabels.join(', ')}</p>
      </div>
    )}

    <section className="bg-white rounded-lg border border-slate-200 shadow-2xs divide-y divide-slate-100">
      {record.fields.map(item => (
        <div key={`${item.article}-${item.id}`} className="p-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-2">
          <div>
            <p className="text-xs font-semibold text-slate-800">{item.label}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">{item.article}</p>
          </div>
          {item.missing ? (
            <p className="text-xs font-semibold text-rose-700">Not recorded in the linked Processing Activity</p>
          ) : (
            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{item.value}</p>
          )}
        </div>
      ))}
    </section>

    <section className="bg-white rounded-lg border border-slate-200 shadow-2xs p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-900">Linked records</h2>
        <button type="button" onClick={onOpenActivity} className="text-xs font-semibold text-indigo-700 hover:text-indigo-900">
          Open processing activity
        </button>
      </div>
      <LinkGroup title="Assets" items={record.assets} onOpen={id => onOpenLinked(id, 'assets')} />
      <LinkGroup title="Vendors" items={record.vendors} onOpen={id => onOpenLinked(id, 'vendors')} />
      <LinkGroup title="Legal entities" items={record.entities} onOpen={id => onOpenLinked(id, 'entities')} />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Privacy assessments</p>
        {record.assessments.length === 0 ? (
          <p className="text-xs text-slate-400">No assessment is linked to this activity.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {record.assessments.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenAssessment(item.id)}
                className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 hover:border-indigo-300 hover:text-indigo-800"
              >
                {item.name}
                <span className="text-slate-400"> · {item.detail}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  </div>
);

const LinkGroup: React.FC<{ title: string; items: RopaRecord['assets']; onOpen: (id: string) => void }> = ({
  title,
  items,
  onOpen,
}) => (
  <div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{title}</p>
    {items.length === 0 ? (
      <p className="text-xs text-slate-400">None linked</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onOpen(item.id)}
            className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 hover:border-indigo-300 hover:text-indigo-800"
          >
            {item.name}
          </button>
        ))}
      </div>
    )}
  </div>
);

const Completeness: React.FC<{ value: number }> = ({ value }) => {
  const color = value === 100 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  const text = value === 100 ? 'text-emerald-700' : value >= 50 ? 'text-amber-800' : 'text-rose-700';
  return (
    <div className="min-w-[120px]">
      <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
        <span className={`inline-flex items-center gap-1 ${text}`}>
          <ShieldCheck className="w-3 h-3" />
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: number; tone?: 'ok' | 'warn' }> = ({ label, value, tone }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <p className={`text-xl font-bold ${tone === 'warn' ? 'text-amber-700' : tone === 'ok' ? 'text-emerald-700' : 'text-slate-900'}`}>
      {value}
    </p>
  </div>
);

const FilterGroup: React.FC<{ value: string; options: string[][]; onChange: (value: string) => void }> = ({
  value,
  options,
  onChange,
}) => (
  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs flex-wrap">
    {options.map(([optionValue, label]) => (
      <button
        key={optionValue}
        type="button"
        onClick={() => onChange(optionValue)}
        className={`px-2.5 py-1 rounded font-medium transition ${
          value === optionValue ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
);
