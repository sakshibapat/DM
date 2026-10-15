import React, { useMemo, useState } from 'react';
import { FileCheck, Plus, Search, Trash2 } from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { ASSESSMENT_STATUSES, AssessmentStatus } from '../../types/assessment';
import { evaluateAssessment } from '../../utils/assessmentReview';
import { EmptyState } from '../common/EmptyState';
import { AssessmentStatusBadge } from './assessmentUi';
import { AssessmentWizard } from './AssessmentWizard';

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const AssessmentsView: React.FC = () => {
  const { privacyAssessments, processingActivities, deleteAssessment } = usePrivacyData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssessmentStatus | 'all'>('all');
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return privacyAssessments.filter(assessment => {
      const activity = processingActivities.find(item => item.id === assessment.processingActivityId);
      const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;
      const matchesQuery =
        !query ||
        assessment.name.toLowerCase().includes(query) ||
        assessment.id.toLowerCase().includes(query) ||
        assessment.businessOwner.toLowerCase().includes(query) ||
        assessment.processingActivityId.toLowerCase().includes(query) ||
        (activity?.name.toLowerCase().includes(query) ?? false);
      return matchesStatus && matchesQuery;
    });
  }, [privacyAssessments, processingActivities, searchQuery, statusFilter]);

  if (editingId === 'new') {
    return <AssessmentWizard initial={null} onClose={() => setEditingId(null)} />;
  }

  if (editingId) {
    const existing = privacyAssessments.find(item => item.id === editingId);
    if (!existing) {
      return <AssessmentWizard initial={null} onClose={() => setEditingId(null)} />;
    }
    return <AssessmentWizard initial={existing} onClose={() => setEditingId(null)} />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shadow-2xs">
            <FileCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Privacy Assessments</h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Screen a Processing Activity for privacy risk. Answers stay linked to the Data Mapping record.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEditingId('new')}
          className="px-4 py-2 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New assessment
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search assessments, owners, or processing activities..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs flex-wrap">
          <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} label="All Status" />
          {ASSESSMENT_STATUSES.map(status => (
            <FilterButton
              key={status}
              active={statusFilter === status}
              onClick={() => setStatusFilter(status)}
              label={status}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No privacy assessments found"
          description="Create an assessment from an existing Processing Activity. Data Mapping records are not changed."
          actionLabel="New assessment"
          onAction={() => setEditingId('new')}
          icon={<FileCheck className="w-6 h-6 stroke-1.5" />}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-3.5">Assessment</th>
                  <th className="p-3.5">Processing Activity</th>
                  <th className="p-3.5">Owner</th>
                  <th className="p-3.5">Reason</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Review</th>
                  <th className="p-3.5">Updated</th>
                  <th className="p-3.5 w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(assessment => {
                  const activity = processingActivities.find(item => item.id === assessment.processingActivityId);
                  const review = evaluateAssessment(assessment, activity);
                  return (
                    <tr key={assessment.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => setEditingId(assessment.id)}
                          className="text-left"
                        >
                          <p className="font-semibold text-slate-900 hover:text-indigo-700">{assessment.name}</p>
                          <p className="font-mono text-[10px] text-slate-400 mt-0.5">{assessment.id}</p>
                        </button>
                      </td>
                      <td className="p-3.5">
                        <p className="font-medium text-slate-800">{activity?.name || 'Activity unavailable'}</p>
                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">{assessment.processingActivityId}</p>
                      </td>
                      <td className="p-3.5 text-slate-600">{assessment.businessOwner || '—'}</td>
                      <td className="p-3.5 text-slate-600">{assessment.reason || '—'}</td>
                      <td className="p-3.5">
                        <AssessmentStatusBadge status={assessment.status} />
                      </td>
                      <td className="p-3.5">
                        {review.dpiaRecommended ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border border-rose-200 bg-rose-50 text-rose-700">
                            DPIA screening recommended
                          </span>
                        ) : review.flags.length > 0 ? (
                          <span className="text-[11px] font-medium text-amber-800">
                            {review.flags.length} review flag{review.flags.length === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">No flags</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500">{formatDate(assessment.lastModifiedDate)}</td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          title="Delete assessment"
                          onClick={() => setPendingDelete({ id: assessment.id, name: assessment.name })}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Delete this assessment?</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {pendingDelete.name} will be removed. The linked Processing Activity in Data Mapping will stay as it is.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAssessment(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="px-3 py-1.5 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Delete assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-2.5 py-1 rounded font-medium transition ${
      active ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
    }`}
  >
    {label}
  </button>
);
