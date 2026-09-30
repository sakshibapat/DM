import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, Save } from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { ProcessingActivity } from '../../types/privacy';
import {
  ASSESSMENT_REASONS,
  ASSESSMENT_STATUSES,
  AssessmentStatus,
  CONTROL_OPTIONS,
  PrivacyAssessment,
  SENSITIVE_DATA_CATEGORIES,
  YES_NO_OPTIONS,
  createEmptyAnswers,
} from '../../types/assessment';
import {
  activityHasInternationalTransfers,
  activityHasVendors,
  evaluateAssessment,
  indicatedSensitiveCategories,
  transfersAreInScope,
  vendorsAreInvolved,
} from '../../utils/assessmentReview';
import { Select } from '../common/Select';
import { TextField } from '../common/TextField';
import { AssessmentStatusBadge, ChoiceField, ReadOnlyChips, SectionCard } from './assessmentUi';
import { ProcessingActivitySummary } from './ProcessingActivitySummary';

interface AssessmentWizardProps {
  initial: PrivacyAssessment | null;
  onClose: () => void;
}

const STEPS = [
  { id: 'details', label: 'Assessment Details' },
  { id: 'necessity', label: 'Processing & Necessity' },
  { id: 'individuals', label: 'Individuals & Data Risk' },
  { id: 'sharing', label: 'Sharing & Transfers' },
  { id: 'controls', label: 'Privacy Controls' },
  { id: 'risk', label: 'Risk & Review' },
  { id: 'summary', label: 'Assessment Summary' },
] as const;

const requireAnswer = (value: string, label: string, errors: string[]) => {
  if (!value) errors.push(`${label} is required.`);
};

const newDraft = (): PrivacyAssessment => ({
  id: '',
  name: '',
  businessOwner: '',
  processingActivityId: '',
  reason: '',
  reasonOther: '',
  status: 'Not Started',
  answers: createEmptyAnswers(),
  createdBy: '',
  createdDate: '',
  lastModifiedBy: '',
  lastModifiedDate: '',
});

export const AssessmentWizard: React.FC<AssessmentWizardProps> = ({ initial, onClose }) => {
  const {
    processingActivities,
    addAssessment,
    updateAssessment,
    getRelatedRecords,
    setActiveNav,
    setSelectedRecord,
  } = usePrivacyData();

  const [draft, setDraft] = useState<PrivacyAssessment>(initial ? { ...initial, answers: { ...initial.answers } } : newDraft());
  const [stepIndex, setStepIndex] = useState(initial ? STEPS.length - 1 : 0);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedMessage, setSavedMessage] = useState('');
  const autoName = useRef(initial?.name || '');
  const autoOwner = useRef(initial?.businessOwner || '');
  const savedIdRef = useRef(initial?.id || '');

  const activity = processingActivities.find(item => item.id === draft.processingActivityId);
  const review = useMemo(() => evaluateAssessment(draft, activity), [draft, activity]);
  const answers = draft.answers;
  const knownSensitive = indicatedSensitiveCategories(activity);
  const showVendorFollowUps = vendorsAreInvolved(answers, activity);
  const showTransferFollowUps = transfersAreInScope(answers, activity);
  const related = activity ? getRelatedRecords(activity.id, 'processingActivities') : null;

  const setAnswer = <K extends keyof PrivacyAssessment['answers']>(key: K, value: PrivacyAssessment['answers'][K]) => {
    setDraft(prev => ({ ...prev, answers: { ...prev.answers, [key]: value } }));
    setSavedMessage('');
  };

  const selectableActivities = processingActivities.filter(
    item => item.status !== 'Archived' || item.id === draft.processingActivityId
  );

  const handleSelectActivity = (id: string) => {
    const selected = processingActivities.find(item => item.id === id);
    setDraft(prev => {
      const suggestedName = selected ? `${selected.name} privacy assessment` : '';
      const suggestedOwner = selected?.owner || '';
      const name = !prev.name.trim() || prev.name === autoName.current ? suggestedName : prev.name;
      const businessOwner =
        !prev.businessOwner.trim() || prev.businessOwner === autoOwner.current ? suggestedOwner : prev.businessOwner;
      if (name === suggestedName) autoName.current = suggestedName;
      if (businessOwner === suggestedOwner) autoOwner.current = suggestedOwner;
      return { ...prev, processingActivityId: id, name, businessOwner };
    });
    setSavedMessage('');
  };

  const validateStep = (index: number): string[] => {
    const nextErrors: string[] = [];
    if (index === 0) {
      if (!draft.processingActivityId) nextErrors.push('Select an existing Processing Activity before continuing.');
      if (!draft.name.trim()) nextErrors.push('Assessment name is required.');
      if (!draft.businessOwner.trim()) nextErrors.push('Business owner is required.');
      if (!draft.reason) nextErrors.push('Reason for assessment is required.');
      if (draft.reason === 'Other' && !draft.reasonOther.trim()) {
        nextErrors.push('Describe the other reason for this assessment.');
      }
    }

    if (index === 1) {
      requireAnswer(answers.purposeClearlyDefined, 'Whether the purpose is clearly defined', nextErrors);
      requireAnswer(answers.allDataNecessary, 'Whether all personal data is necessary', nextErrors);
      requireAnswer(answers.lessDataPossible, 'Whether the purpose could use less personal data', nextErrors);
      requireAnswer(answers.usedForAnotherPurpose, 'Whether data will be used for another purpose', nextErrors);
      if (answers.usedForAnotherPurpose === 'Yes' && !answers.otherPurposeDescription.trim()) {
        nextErrors.push('Describe the other purpose.');
      }
    }

    if (index === 2) {
      requireAnswer(answers.sensitiveData, 'Whether sensitive or special-category data is involved', nextErrors);
      requireAnswer(answers.vulnerableIndividuals, 'Whether children or vulnerable individuals are involved', nextErrors);
      requireAnswer(answers.largeScale, 'Whether processing is large scale', nextErrors);
      requireAnswer(answers.systematicMonitoring, 'Whether systematic monitoring or tracking occurs', nextErrors);
      requireAnswer(answers.automatedDecisionMaking, 'Whether profiling or automated decision-making is used', nextErrors);
      if (answers.sensitiveData === 'Yes') {
        const hasCategory = knownSensitive.length > 0 || answers.sensitiveCategories.length > 0 || answers.sensitiveOther.trim();
        if (!hasCategory) nextErrors.push('Select or describe the categories of sensitive data.');
        if (answers.sensitiveCategories.includes('Other') && !answers.sensitiveOther.trim()) {
          nextErrors.push('Describe the other sensitive data category.');
        }
      }
      if (answers.vulnerableIndividuals === 'Yes' && !answers.vulnerableDescription.trim()) {
        nextErrors.push('Describe the children or vulnerable individuals involved.');
      }
      if (answers.systematicMonitoring === 'Yes' && !answers.monitoringDescription.trim()) {
        nextErrors.push('Describe the monitoring or tracking.');
      }
      if (answers.automatedDecisionMaking === 'Yes') {
        if (!answers.automatedDecisionDescription.trim()) nextErrors.push('Describe the automated decision.');
        if (!answers.automatedDecisionImpact.trim()) nextErrors.push('Describe the impact of the automated decision.');
        requireAnswer(answers.humanReviewAvailable, 'Whether a person can review the automated decision', nextErrors);
      }
    }

    if (index === 3) {
      requireAnswer(answers.sharedWithThirdParties, 'Whether data is shared with third parties or vendors', nextErrors);
      requireAnswer(answers.internationalTransfers, 'Whether international transfers or access occur', nextErrors);
      requireAnswer(answers.contractualSafeguards, 'Whether contractual or privacy safeguards exist', nextErrors);
      if (showVendorFollowUps) {
        requireAnswer(answers.vendorContractsInPlace, 'Whether vendor data-processing terms are in place', nextErrors);
        const namedVendors = (related?.vendors.length || 0) > 0 || (activity?.recipientCategories || []).length > 0;
        if (!namedVendors && !answers.additionalVendors.trim()) {
          nextErrors.push('Name the third parties or vendors that receive this data.');
        }
      }
      if (showTransferFollowUps) {
        requireAnswer(answers.transferSafeguardsInPlace, 'Whether international transfer safeguards are in place', nextErrors);
        const knownDestinations =
          (activity?.internationalTransferDetails || []).length > 0 || (activity?.selectedTransferRegions || []).length > 0;
        if (!knownDestinations && !answers.additionalTransferDestinations.trim()) {
          nextErrors.push('Record the transfer destination or access location.');
        }
      }
    }

    if (index === 4) {
      requireAnswer(answers.accessControls, 'Access controls', nextErrors);
      requireAnswer(answers.securityControls, 'Security controls', nextErrors);
      requireAnswer(answers.retentionDefined, 'Retention periods', nextErrors);
      requireAnswer(answers.deletionCapability, 'Deletion or anonymisation capability', nextErrors);
      requireAnswer(answers.dataSubjectRights, 'Support for data-subject rights', nextErrors);
    }

    if (index === 5) {
      requireAnswer(answers.significantHarm, 'Whether misuse, loss, or disclosure could significantly harm individuals', nextErrors);
      requireAnswer(answers.additionalRisks, 'Whether additional privacy risks exist', nextErrors);
      requireAnswer(answers.remediationRequired, 'Whether remediation or actions are required', nextErrors);
      if ((answers.significantHarm === 'Yes' || answers.additionalRisks === 'Yes') && !answers.identifiedRisks.trim()) {
        nextErrors.push('Describe the identified privacy risks.');
      }
      if (answers.remediationRequired === 'Yes' && !answers.remediationActions.trim()) {
        nextErrors.push('Describe the remediation or actions required.');
      }
    }

    return nextErrors;
  };

  const persist = (status: AssessmentStatus = draft.status) => {
    if (!draft.processingActivityId) {
      setErrors(['Select an existing Processing Activity before saving.']);
      setStepIndex(0);
      return false;
    }
    let nextStatus = status;
    if (nextStatus === 'Not Started' && stepIndex > 0) nextStatus = 'In Progress';
    const payload = {
      name: draft.name.trim(),
      businessOwner: draft.businessOwner.trim(),
      processingActivityId: draft.processingActivityId,
      reason: draft.reason,
      reasonOther: draft.reasonOther.trim(),
      status: nextStatus,
      answers: draft.answers,
    };
    const existingId = savedIdRef.current;
    const savedId = existingId || addAssessment(payload);
    if (existingId) updateAssessment(existingId, payload);
    savedIdRef.current = savedId;
    setDraft(prev => ({ ...prev, ...payload, id: savedId }));
    setSavedMessage('Assessment saved.');
    return true;
  };

  const goNext = () => {
    const nextErrors = validateStep(stepIndex);
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;
    const nextStatus = stepIndex === 0 && draft.status === 'Not Started' ? 'In Progress' : draft.status;
    if (!persist(nextStatus)) return;
    setStepIndex(index => Math.min(index + 1, STEPS.length - 1));
    setErrors([]);
  };

  const goBack = () => {
    setErrors([]);
    setStepIndex(index => Math.max(index - 1, 0));
  };

  const completeAssessment = () => {
    const allErrors = STEPS.slice(0, 6).flatMap((_, index) => validateStep(index));
    if (allErrors.length > 0) {
      setErrors(allErrors);
      return;
    }
    setDraft(prev => ({ ...prev, status: 'Completed' }));
    if (persist('Completed')) {
      setSavedMessage('Assessment marked completed.');
    }
  };

  const openActivity = () => {
    if (!activity) return;
    setSelectedRecord({ id: activity.id, type: 'processingActivities' });
    setActiveNav('processingActivities');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            All assessments
          </button>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {draft.name.trim() || 'New privacy assessment'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Linked to an existing Processing Activity. Data Mapping details stay read-only.
          </p>
        </div>
        <AssessmentStatusBadge status={draft.status} />
      </div>

      <ol className="flex gap-2 overflow-x-auto pb-1">
        {STEPS.map((step, index) => {
          const active = index === stepIndex;
          const done = index < stepIndex;
          return (
            <li key={step.id} className="shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (index <= stepIndex) {
                    setStepIndex(index);
                    setErrors([]);
                  }
                }}
                className={`px-3 py-1.5 rounded-md border text-[11px] font-semibold whitespace-nowrap ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : done
                      ? 'bg-white text-slate-700 border-slate-300'
                      : 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
                }`}
              >
                {index + 1}. {step.label}
              </button>
            </li>
          );
        })}
      </ol>

      {errors.length > 0 && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 space-y-1">
          {errors.map(error => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      {stepIndex === 0 && (
        <DetailsStep
          draft={draft}
          activities={selectableActivities}
          activity={activity}
          onSelectActivity={handleSelectActivity}
          onChange={(patch) => {
            setDraft(prev => ({ ...prev, ...patch }));
            setSavedMessage('');
          }}
        />
      )}

      {activity && stepIndex > 0 && stepIndex < 6 && (
        <ProcessingActivitySummary activity={activity} compact />
      )}

      {stepIndex === 1 && (
        <SectionCard
          title="Processing & Necessity"
          description="Answer from what you know about this activity. The purpose recorded in Data Mapping is shown above."
        >
          <ChoiceField
            label="Is the purpose clearly defined?"
            value={answers.purposeClearlyDefined}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('purposeClearlyDefined', value as PrivacyAssessment['answers']['purposeClearlyDefined'])}
          />
          <ChoiceField
            label="Is all of the personal data necessary for that purpose?"
            value={answers.allDataNecessary}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('allDataNecessary', value as PrivacyAssessment['answers']['allDataNecessary'])}
          />
          <ChoiceField
            label="Could the purpose be achieved using less personal data?"
            value={answers.lessDataPossible}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('lessDataPossible', value as PrivacyAssessment['answers']['lessDataPossible'])}
          />
          <ChoiceField
            label="Will the data be used for another purpose?"
            value={answers.usedForAnotherPurpose}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('usedForAnotherPurpose', value as PrivacyAssessment['answers']['usedForAnotherPurpose'])}
          />
          {answers.usedForAnotherPurpose === 'Yes' && (
            <TextField
              label="Other purpose"
              multiline
              value={answers.otherPurposeDescription}
              onChange={event => setAnswer('otherPurposeDescription', event.target.value)}
              placeholder="Describe the additional purpose"
            />
          )}
        </SectionCard>
      )}

      {stepIndex === 2 && (
        <SectionCard
          title="Individuals & Data Risk"
          description="High-risk characteristics are highlighted on the summary. They do not produce a numerical score."
        >
          <ChoiceField
            label="Does this processing involve sensitive or special-category data?"
            value={answers.sensitiveData}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('sensitiveData', value as PrivacyAssessment['answers']['sensitiveData'])}
            helperText={
              activity?.involvesHighRiskData
                ? 'Data Mapping marks this activity as involving high-risk data.'
                : undefined
            }
          />
          {answers.sensitiveData === 'Yes' && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Categories already indicated by Data Mapping
                </p>
                <ReadOnlyChips items={knownSensitive} emptyLabel="None indicated on the Processing Activity" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 mb-2">Additional sensitive categories</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SENSITIVE_DATA_CATEGORIES.filter(category => !knownSensitive.includes(category)).map(category => {
                    const checked = answers.sensitiveCategories.includes(category);
                    return (
                      <label key={category} className="flex items-start gap-2 text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? answers.sensitiveCategories.filter(item => item !== category)
                              : [...answers.sensitiveCategories, category];
                            setAnswer('sensitiveCategories', next);
                          }}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{category}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {(answers.sensitiveCategories.includes('Other') || knownSensitive.length === 0) && (
                <TextField
                  label="Other sensitive data"
                  value={answers.sensitiveOther}
                  onChange={event => setAnswer('sensitiveOther', event.target.value)}
                  placeholder="Describe any sensitive data that is not listed"
                />
              )}
            </div>
          )}

          <ChoiceField
            label="Does this involve children or other vulnerable individuals?"
            value={answers.vulnerableIndividuals}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('vulnerableIndividuals', value as PrivacyAssessment['answers']['vulnerableIndividuals'])}
          />
          {answers.vulnerableIndividuals === 'Yes' && (
            <TextField
              label="Who is affected?"
              multiline
              value={answers.vulnerableDescription}
              onChange={event => setAnswer('vulnerableDescription', event.target.value)}
              placeholder="Describe the children or vulnerable individuals"
            />
          )}

          <ChoiceField
            label="Is this large-scale processing?"
            value={answers.largeScale}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('largeScale', value as PrivacyAssessment['answers']['largeScale'])}
          />
          <ChoiceField
            label="Does this involve systematic monitoring or tracking?"
            value={answers.systematicMonitoring}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('systematicMonitoring', value as PrivacyAssessment['answers']['systematicMonitoring'])}
          />
          {answers.systematicMonitoring === 'Yes' && (
            <TextField
              label="What is monitored or tracked?"
              multiline
              value={answers.monitoringDescription}
              onChange={event => setAnswer('monitoringDescription', event.target.value)}
              placeholder="Describe the monitoring or tracking"
            />
          )}

          <ChoiceField
            label="Does this involve profiling or automated decision-making?"
            value={answers.automatedDecisionMaking}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('automatedDecisionMaking', value as PrivacyAssessment['answers']['automatedDecisionMaking'])}
          />
          {answers.automatedDecisionMaking === 'Yes' && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
              <TextField
                label="What decision is made?"
                multiline
                value={answers.automatedDecisionDescription}
                onChange={event => setAnswer('automatedDecisionDescription', event.target.value)}
              />
              <TextField
                label="What impact can that decision have?"
                multiline
                value={answers.automatedDecisionImpact}
                onChange={event => setAnswer('automatedDecisionImpact', event.target.value)}
              />
              <ChoiceField
                label="Can a person review the decision?"
                value={answers.humanReviewAvailable}
                options={YES_NO_OPTIONS}
                onChange={value => setAnswer('humanReviewAvailable', value as PrivacyAssessment['answers']['humanReviewAvailable'])}
              />
            </div>
          )}
        </SectionCard>
      )}

      {stepIndex === 3 && (
        <SectionCard
          title="Sharing & Transfers"
          description="Vendor and transfer follow-up questions appear when sharing or cross-border access is in scope."
        >
          <ChoiceField
            label="Is personal data shared with third parties or vendors?"
            value={answers.sharedWithThirdParties}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('sharedWithThirdParties', value as PrivacyAssessment['answers']['sharedWithThirdParties'])}
            helperText={
              activityHasVendors(activity)
                ? 'Data Mapping already lists vendors or recipients for this activity.'
                : undefined
            }
          />
          {answers.sharedWithThirdParties === 'No' && activityHasVendors(activity) && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              The linked Processing Activity lists vendors or recipients. Confirm this answer if those parties receive personal data.
            </p>
          )}
          {showVendorFollowUps && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Vendors from Data Mapping
                </p>
                <div className="space-y-2">
                  {(related?.vendors || []).length === 0 && (
                    <p className="text-xs text-slate-400 italic">No vendor records are linked yet.</p>
                  )}
                  {(related?.vendors || []).map(vendor => (
                    <div key={vendor.id} className="bg-white border border-slate-200 rounded-md px-3 py-2">
                      <p className="text-xs font-semibold text-slate-800">{vendor.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {vendor.headquarters || 'Location not recorded'} · DPA {vendor.dpaStatus}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <TextField
                label="Additional third parties or vendors"
                helperText="Only add parties that are not already listed in Data Mapping."
                value={answers.additionalVendors}
                onChange={event => setAnswer('additionalVendors', event.target.value)}
              />
              <ChoiceField
                label="Are data-processing terms in place with these vendors?"
                value={answers.vendorContractsInPlace}
                options={YES_NO_OPTIONS}
                onChange={value => setAnswer('vendorContractsInPlace', value as PrivacyAssessment['answers']['vendorContractsInPlace'])}
              />
              <TextField
                label="What do these vendors do with the data?"
                multiline
                value={answers.vendorProcessingDescription}
                onChange={event => setAnswer('vendorProcessingDescription', event.target.value)}
              />
            </div>
          )}

          <ChoiceField
            label="Do international transfers or international access occur?"
            value={answers.internationalTransfers}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('internationalTransfers', value as PrivacyAssessment['answers']['internationalTransfers'])}
            helperText={
              activityHasInternationalTransfers(activity)
                ? 'Data Mapping records international transfers for this activity.'
                : undefined
            }
          />
          {answers.internationalTransfers === 'No' && activityHasInternationalTransfers(activity) && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              The linked Processing Activity records international transfers. Confirm this answer if those transfers still occur.
            </p>
          )}
          {showTransferFollowUps && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Destinations recorded in Data Mapping
                </p>
                <ReadOnlyChips
                  items={[
                    ...(activity?.internationalTransferDetails || []).map(detail =>
                      detail.safeguard ? `${detail.country} (${detail.safeguard})` : detail.country
                    ),
                    ...(activity?.selectedTransferRegions || []),
                  ]}
                  emptyLabel="No destination recorded on the Processing Activity"
                />
              </div>
              <TextField
                label="Additional destinations or access locations"
                helperText="Leave blank when the destinations above are complete."
                value={answers.additionalTransferDestinations}
                onChange={event => setAnswer('additionalTransferDestinations', event.target.value)}
              />
              <ChoiceField
                label="Are appropriate safeguards in place for these international transfers?"
                value={answers.transferSafeguardsInPlace}
                options={YES_NO_OPTIONS}
                onChange={value => setAnswer('transferSafeguardsInPlace', value as PrivacyAssessment['answers']['transferSafeguardsInPlace'])}
              />
              <TextField
                label="Safeguard notes"
                multiline
                value={answers.transferSafeguardNotes}
                onChange={event => setAnswer('transferSafeguardNotes', event.target.value)}
                placeholder="Optional notes about the safeguard, such as SCCs or an adequacy decision"
              />
            </div>
          )}

          <ChoiceField
            label="Are appropriate contractual or privacy safeguards in place?"
            value={answers.contractualSafeguards}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('contractualSafeguards', value as PrivacyAssessment['answers']['contractualSafeguards'])}
          />
        </SectionCard>
      )}

      {stepIndex === 4 && (
        <SectionCard
          title="Privacy Controls"
          description="Security measures already recorded on the Processing Activity are shown in the summary above."
        >
          <ChoiceField
            label="Are access controls in place?"
            value={answers.accessControls}
            options={CONTROL_OPTIONS}
            onChange={value => setAnswer('accessControls', value as PrivacyAssessment['answers']['accessControls'])}
          />
          <ChoiceField
            label="Are appropriate security controls in place?"
            value={answers.securityControls}
            options={CONTROL_OPTIONS}
            onChange={value => setAnswer('securityControls', value as PrivacyAssessment['answers']['securityControls'])}
          />
          <ChoiceField
            label="Is a retention period defined?"
            helperText={activity?.retentionPeriod ? `Data Mapping retention: ${activity.retentionPeriod}` : undefined}
            value={answers.retentionDefined}
            options={CONTROL_OPTIONS}
            onChange={value => setAnswer('retentionDefined', value as PrivacyAssessment['answers']['retentionDefined'])}
          />
          <ChoiceField
            label="Can the data be deleted or anonymised?"
            value={answers.deletionCapability}
            options={CONTROL_OPTIONS}
            onChange={value => setAnswer('deletionCapability', value as PrivacyAssessment['answers']['deletionCapability'])}
          />
          <ChoiceField
            label="Can applicable data-subject rights be supported?"
            value={answers.dataSubjectRights}
            options={CONTROL_OPTIONS}
            onChange={value => setAnswer('dataSubjectRights', value as PrivacyAssessment['answers']['dataSubjectRights'])}
          />
        </SectionCard>
      )}

      {stepIndex === 5 && (
        <SectionCard
          title="Risk & Review"
          description="Flags are rule-based. There is no numerical risk score."
        >
          <ChoiceField
            label="Could misuse, loss, or disclosure significantly harm individuals?"
            value={answers.significantHarm}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('significantHarm', value as PrivacyAssessment['answers']['significantHarm'])}
          />
          <ChoiceField
            label="Are there additional privacy risks?"
            value={answers.additionalRisks}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('additionalRisks', value as PrivacyAssessment['answers']['additionalRisks'])}
          />
          {(answers.significantHarm === 'Yes' || answers.additionalRisks === 'Yes') && (
            <TextField
              label="Describe the identified risks"
              multiline
              rows={4}
              value={answers.identifiedRisks}
              onChange={event => setAnswer('identifiedRisks', event.target.value)}
            />
          )}
          <ChoiceField
            label="Are remediation or other actions required?"
            value={answers.remediationRequired}
            options={YES_NO_OPTIONS}
            onChange={value => setAnswer('remediationRequired', value as PrivacyAssessment['answers']['remediationRequired'])}
          />
          {answers.remediationRequired === 'Yes' && (
            <TextField
              label="Remediation and actions"
              multiline
              rows={4}
              value={answers.remediationActions}
              onChange={event => setAnswer('remediationActions', event.target.value)}
            />
          )}
          <ReviewPanel reviewFlags={review.flags} dpiaRecommended={review.dpiaRecommended} />
        </SectionCard>
      )}

      {stepIndex === 6 && (
        <SummaryStep
          draft={draft}
          activity={activity}
          review={review}
          knownSensitive={knownSensitive}
          onStatusChange={status => {
            setDraft(prev => ({ ...prev, status }));
            setSavedMessage('');
          }}
          onOpenActivity={openActivity}
        />
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <div className="flex items-center gap-2">
          {savedMessage && <span className="text-xs text-emerald-700 font-medium">{savedMessage}</span>}
          <button
            type="button"
            onClick={() => {
              const nextErrors = stepIndex < 6 ? validateStep(stepIndex) : [];
              setErrors(nextErrors);
              if (nextErrors.length === 0) persist();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          {stepIndex < 6 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={completeAssessment}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mark completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ReviewPanel: React.FC<{
  reviewFlags: ReturnType<typeof evaluateAssessment>['flags'];
  dpiaRecommended: boolean;
}> = ({ reviewFlags, dpiaRecommended }) => (
  <div className="space-y-3">
    {dpiaRecommended && (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-rose-900">DPIA screening recommended</p>
          <p className="text-xs text-rose-800 mt-1 leading-relaxed">
            Multiple or significant privacy risk indicators were identified. This is a review flag, not a risk score.
          </p>
        </div>
      </div>
    )}
    {reviewFlags.length > 0 ? (
      <div className="space-y-2">
        {reviewFlags.map(flag => (
          <div key={flag.id} className="rounded-md border border-rose-200 bg-white px-3 py-2">
            <p className="text-xs font-bold text-rose-800">{flag.label}</p>
            <p className="text-xs text-slate-600 mt-0.5">{flag.detail}</p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-xs text-slate-500">No privacy review flags from the answers so far.</p>
    )}
  </div>
);

const DetailsStep: React.FC<{
  draft: PrivacyAssessment;
  activities: ProcessingActivity[];
  activity: ProcessingActivity | undefined;
  onSelectActivity: (id: string) => void;
  onChange: (patch: Partial<PrivacyAssessment>) => void;
}> = ({ draft, activities, activity, onSelectActivity, onChange }) => (
  <div className="space-y-4">
    <SectionCard
      title="Select a Processing Activity"
      description="An assessment must be linked to an existing Data Mapping record. You will not be asked to re-enter that record."
    >
      <Select
        label="Related Processing Activity"
        value={draft.processingActivityId}
        onChange={event => onSelectActivity(event.target.value)}
        placeholder="Select an existing Processing Activity..."
        options={activities.map(item => ({ value: item.id, label: `${item.id} — ${item.name}` }))}
      />
      {!draft.processingActivityId && (
        <p className="text-xs text-slate-500">Choose a Processing Activity to continue this assessment.</p>
      )}
    </SectionCard>

    {activity && <ProcessingActivitySummary activity={activity} />}

    {activity && (
      <SectionCard title="Assessment Details">
        <TextField
          label="Assessment name"
          value={draft.name}
          onChange={event => onChange({ name: event.target.value })}
        />
        <TextField
          label="Business owner"
          value={draft.businessOwner}
          onChange={event => onChange({ businessOwner: event.target.value })}
          helperText="Prefilled from the Processing Activity owner when one is recorded. You can change it."
        />
        <Select
          label="Reason for assessment"
          value={draft.reason}
          onChange={event => onChange({ reason: event.target.value as PrivacyAssessment['reason'] })}
          options={[...ASSESSMENT_REASONS]}
          placeholder="Select a reason..."
        />
        {draft.reason === 'Other' && (
          <TextField
            label="Describe the reason"
            value={draft.reasonOther}
            onChange={event => onChange({ reasonOther: event.target.value })}
          />
        )}
        <Select
          label="Status"
          value={draft.status}
          onChange={event => onChange({ status: event.target.value as AssessmentStatus })}
          options={[...ASSESSMENT_STATUSES]}
          placeholder=""
        />
      </SectionCard>
    )}
  </div>
);

const AnswerLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-3 py-2 border-b border-slate-100 last:border-0">
    <p className="text-xs font-semibold text-slate-500">{label}</p>
    <p className="text-xs text-slate-800 whitespace-pre-wrap">{value || '—'}</p>
  </div>
);

const SummaryStep: React.FC<{
  draft: PrivacyAssessment;
  activity: ProcessingActivity | undefined;
  review: ReturnType<typeof evaluateAssessment>;
  knownSensitive: string[];
  onStatusChange: (status: AssessmentStatus) => void;
  onOpenActivity: () => void;
}> = ({ draft, activity, review, knownSensitive, onStatusChange, onOpenActivity }) => {
  const answers = draft.answers;
  const sensitiveCategories = [...knownSensitive, ...answers.sensitiveCategories].filter(
    (value, index, all) => value && all.indexOf(value) === index
  );

  return (
    <div className="space-y-4">
      <ReviewPanel reviewFlags={review.flags} dpiaRecommended={review.dpiaRecommended} />

      <SectionCard title="Assessment status">
        <Select
          label="Status"
          value={draft.status}
          onChange={event => onStatusChange(event.target.value as AssessmentStatus)}
          options={[...ASSESSMENT_STATUSES]}
          placeholder=""
        />
      </SectionCard>

      <SectionCard title="Linked Processing Activity">
        {activity ? (
          <div className="space-y-3">
            <ProcessingActivitySummary activity={activity} />
            <button
              type="button"
              onClick={onOpenActivity}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Open this activity in Data Mapping
            </button>
          </div>
        ) : (
          <p className="text-xs text-rose-700">
            The linked Processing Activity ({draft.processingActivityId || 'none'}) is no longer in Data Mapping.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Assessment details">
        <AnswerLine label="Assessment name" value={draft.name} />
        <AnswerLine label="Business owner" value={draft.businessOwner} />
        <AnswerLine label="Reason" value={draft.reason === 'Other' ? `Other — ${draft.reasonOther}` : draft.reason} />
        <AnswerLine label="Status" value={draft.status} />
      </SectionCard>

      <SectionCard title="Processing & Necessity">
        <AnswerLine label="Purpose clearly defined" value={answers.purposeClearlyDefined} />
        <AnswerLine label="All personal data necessary" value={answers.allDataNecessary} />
        <AnswerLine label="Less personal data possible" value={answers.lessDataPossible} />
        <AnswerLine label="Used for another purpose" value={answers.usedForAnotherPurpose} />
        {answers.usedForAnotherPurpose === 'Yes' && <AnswerLine label="Other purpose" value={answers.otherPurposeDescription} />}
      </SectionCard>

      <SectionCard title="Individuals & Data Risk">
        <AnswerLine label="Sensitive or special-category data" value={answers.sensitiveData} />
        {answers.sensitiveData === 'Yes' && (
          <AnswerLine
            label="Sensitive categories"
            value={[...sensitiveCategories, answers.sensitiveOther].filter(Boolean).join(', ')}
          />
        )}
        <AnswerLine label="Children or vulnerable individuals" value={answers.vulnerableIndividuals} />
        {answers.vulnerableIndividuals === 'Yes' && <AnswerLine label="Who is affected" value={answers.vulnerableDescription} />}
        <AnswerLine label="Large-scale processing" value={answers.largeScale} />
        <AnswerLine label="Systematic monitoring" value={answers.systematicMonitoring} />
        {answers.systematicMonitoring === 'Yes' && <AnswerLine label="Monitoring detail" value={answers.monitoringDescription} />}
        <AnswerLine label="Profiling or automated decisions" value={answers.automatedDecisionMaking} />
        {answers.automatedDecisionMaking === 'Yes' && (
          <>
            <AnswerLine label="Decision" value={answers.automatedDecisionDescription} />
            <AnswerLine label="Impact" value={answers.automatedDecisionImpact} />
            <AnswerLine label="Human review" value={answers.humanReviewAvailable} />
          </>
        )}
      </SectionCard>

      <SectionCard title="Sharing & Transfers">
        <AnswerLine label="Shared with third parties or vendors" value={answers.sharedWithThirdParties} />
        {(answers.sharedWithThirdParties === 'Yes' || answers.vendorContractsInPlace) && (
          <>
            <AnswerLine label="Vendor terms in place" value={answers.vendorContractsInPlace} />
            <AnswerLine label="Additional vendors" value={answers.additionalVendors} />
            <AnswerLine label="Vendor processing" value={answers.vendorProcessingDescription} />
          </>
        )}
        <AnswerLine label="International transfers or access" value={answers.internationalTransfers} />
        {(answers.internationalTransfers === 'Yes' || answers.transferSafeguardsInPlace) && (
          <>
            <AnswerLine label="Additional destinations" value={answers.additionalTransferDestinations} />
            <AnswerLine label="Transfer safeguards in place" value={answers.transferSafeguardsInPlace} />
            <AnswerLine label="Safeguard notes" value={answers.transferSafeguardNotes} />
          </>
        )}
        <AnswerLine label="Contractual or privacy safeguards" value={answers.contractualSafeguards} />
      </SectionCard>

      <SectionCard title="Privacy Controls">
        <AnswerLine label="Access controls" value={answers.accessControls} />
        <AnswerLine label="Security controls" value={answers.securityControls} />
        <AnswerLine label="Retention period" value={answers.retentionDefined} />
        <AnswerLine label="Deletion or anonymisation" value={answers.deletionCapability} />
        <AnswerLine label="Data-subject rights" value={answers.dataSubjectRights} />
      </SectionCard>

      <SectionCard title="Identified privacy concerns">
        {review.concerns.length === 0 ? (
          <p className="text-xs text-slate-500">No privacy concerns recorded.</p>
        ) : (
          <ul className="space-y-2">
            {review.concerns.map(concern => (
              <li key={`${concern.id}-${concern.text}`} className="text-xs text-slate-700">
                <span className="font-semibold text-slate-500">{concern.section}. </span>
                {concern.text}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Remediation and actions">
        <AnswerLine label="Actions required" value={answers.remediationRequired} />
        <AnswerLine label="Identified risks" value={answers.identifiedRisks} />
        <AnswerLine label="Remediation" value={answers.remediationActions} />
      </SectionCard>
    </div>
  );
};
