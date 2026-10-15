/**
 * Privacy Assessments reference an existing Processing Activity by id.
 * Activity details are read from Data Mapping at display time and are not copied here.
 */

export const ASSESSMENT_REASONS = ['New', 'Change', 'Periodic Review', 'Other'] as const;
export type AssessmentReason = (typeof ASSESSMENT_REASONS)[number] | '';

export const ASSESSMENT_STATUSES = ['Not Started', 'In Progress', 'Under Review', 'Completed'] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const YES_NO_OPTIONS = ['Yes', 'No', 'Not sure'] as const;
export type YesNoAnswer = (typeof YES_NO_OPTIONS)[number] | '';

export const CONTROL_OPTIONS = ['Yes', 'Partial', 'No', 'Not sure'] as const;
export type ControlAnswer = (typeof CONTROL_OPTIONS)[number] | '';

export const SENSITIVE_DATA_CATEGORIES = [
  'Racial or ethnic origin',
  'Political opinions',
  'Religious or philosophical beliefs',
  'Trade union membership',
  'Genetic data',
  'Biometric data',
  'Health data',
  'Sex life or sexual orientation',
  'Criminal offence data',
  'Financial account or payment data',
  'Government identifiers',
  'Other',
] as const;

export interface AssessmentAnswers {
  purposeClearlyDefined: YesNoAnswer;
  allDataNecessary: YesNoAnswer;
  lessDataPossible: YesNoAnswer;
  usedForAnotherPurpose: YesNoAnswer;
  otherPurposeDescription: string;

  sensitiveData: YesNoAnswer;
  sensitiveCategories: string[];
  sensitiveOther: string;
  vulnerableIndividuals: YesNoAnswer;
  vulnerableDescription: string;
  largeScale: YesNoAnswer;
  systematicMonitoring: YesNoAnswer;
  monitoringDescription: string;
  automatedDecisionMaking: YesNoAnswer;
  automatedDecisionDescription: string;
  automatedDecisionImpact: string;
  humanReviewAvailable: YesNoAnswer;

  sharedWithThirdParties: YesNoAnswer;
  vendorContractsInPlace: YesNoAnswer;
  vendorProcessingDescription: string;
  additionalVendors: string;
  internationalTransfers: YesNoAnswer;
  additionalTransferDestinations: string;
  transferSafeguardsInPlace: YesNoAnswer;
  transferSafeguardNotes: string;
  contractualSafeguards: YesNoAnswer;

  accessControls: ControlAnswer;
  securityControls: ControlAnswer;
  retentionDefined: ControlAnswer;
  deletionCapability: ControlAnswer;
  dataSubjectRights: ControlAnswer;

  significantHarm: YesNoAnswer;
  additionalRisks: YesNoAnswer;
  identifiedRisks: string;
  remediationRequired: YesNoAnswer;
  remediationActions: string;
}

export interface PrivacyAssessment {
  id: string;
  name: string;
  businessOwner: string;
  processingActivityId: string;
  reason: AssessmentReason;
  reasonOther: string;
  status: AssessmentStatus;
  answers: AssessmentAnswers;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}

export const createEmptyAnswers = (): AssessmentAnswers => ({
  purposeClearlyDefined: '',
  allDataNecessary: '',
  lessDataPossible: '',
  usedForAnotherPurpose: '',
  otherPurposeDescription: '',
  sensitiveData: '',
  sensitiveCategories: [],
  sensitiveOther: '',
  vulnerableIndividuals: '',
  vulnerableDescription: '',
  largeScale: '',
  systematicMonitoring: '',
  monitoringDescription: '',
  automatedDecisionMaking: '',
  automatedDecisionDescription: '',
  automatedDecisionImpact: '',
  humanReviewAvailable: '',
  sharedWithThirdParties: '',
  vendorContractsInPlace: '',
  vendorProcessingDescription: '',
  additionalVendors: '',
  internationalTransfers: '',
  additionalTransferDestinations: '',
  transferSafeguardsInPlace: '',
  transferSafeguardNotes: '',
  contractualSafeguards: '',
  accessControls: '',
  securityControls: '',
  retentionDefined: '',
  deletionCapability: '',
  dataSubjectRights: '',
  significantHarm: '',
  additionalRisks: '',
  identifiedRisks: '',
  remediationRequired: '',
  remediationActions: '',
});
