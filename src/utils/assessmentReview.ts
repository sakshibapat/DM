import { ProcessingActivity } from '../types/privacy';
import {
  AssessmentAnswers,
  PrivacyAssessment,
  SENSITIVE_DATA_CATEGORIES,
} from '../types/assessment';

export interface ReviewFlag {
  id: string;
  label: string;
  detail: string;
  significant: boolean;
}

export interface PrivacyConcern {
  id: string;
  section: string;
  text: string;
}

export interface AssessmentReview {
  flags: ReviewFlag[];
  concerns: PrivacyConcern[];
  dpiaRecommended: boolean;
}

const isBlank = (value: string | undefined | null) => !value || value.trim() === '';

export const activityHasVendors = (activity: ProcessingActivity | undefined): boolean => {
  if (!activity) return false;
  if ((activity.vendorIds || []).length > 0) return true;
  return (activity.recipientCategories || []).some(category => /third|vendor|processor/i.test(category));
};

export const activityHasInternationalTransfers = (activity: ProcessingActivity | undefined): boolean => {
  if (!activity) return false;
  if (activity.hasInternationalTransfer === 'Yes') return true;
  return (activity.internationalTransferDetails || []).length > 0;
};

export const indicatedSensitiveCategories = (activity: ProcessingActivity | undefined): string[] => {
  if (!activity) return [];
  const text = (activity.personalDataCategories || []).join(' | ').toLowerCase();
  const found: string[] = [];
  const add = (category: string) => {
    if (!found.includes(category)) found.push(category);
  };

  if (/racial|ethnic/.test(text)) add('Racial or ethnic origin');
  if (/political/.test(text)) add('Political opinions');
  if (/religio|philosoph/.test(text)) add('Religious or philosophical beliefs');
  if (/trade union/.test(text)) add('Trade union membership');
  if (/genetic/.test(text)) add('Genetic data');
  if (/biometric/.test(text)) add('Biometric data');
  if (/health|medical/.test(text)) add('Health data');
  if (/sex life|sexual orientation/.test(text)) add('Sex life or sexual orientation');
  if (/criminal|offence|offense/.test(text)) add('Criminal offence data');
  if (/financial|bank|salary|compensation|credit|debit|payment|iban|tax id/.test(text)) {
    add('Financial account or payment data');
  }
  if (/ssn|passport|driver|government-issued|government identifier|national id/.test(text)) {
    add('Government identifiers');
  }

  return found.filter(category => (SENSITIVE_DATA_CATEGORIES as readonly string[]).includes(category));
};

export const vendorsAreInvolved = (
  answers: AssessmentAnswers,
  activity: ProcessingActivity | undefined
): boolean => {
  if (answers.sharedWithThirdParties === 'Yes') return true;
  if (answers.sharedWithThirdParties === 'No') return false;
  return activityHasVendors(activity);
};

export const transfersAreInScope = (
  answers: AssessmentAnswers,
  activity: ProcessingActivity | undefined
): boolean => {
  if (answers.internationalTransfers === 'Yes') return true;
  if (answers.internationalTransfers === 'No') return false;
  return activityHasInternationalTransfers(activity);
};

export const evaluateAssessment = (
  assessment: Pick<PrivacyAssessment, 'answers'>,
  activity: ProcessingActivity | undefined
): AssessmentReview => {
  const answers = assessment.answers;
  const flags: ReviewFlag[] = [];
  const concerns: PrivacyConcern[] = [];

  const addConcern = (id: string, section: string, text: string) => {
    concerns.push({ id, section, text });
  };

  if (answers.sensitiveData === 'Yes') {
    const categories = [
      ...indicatedSensitiveCategories(activity),
      ...answers.sensitiveCategories,
    ].filter((value, index, all) => value && all.indexOf(value) === index);
    flags.push({
      id: 'sensitive-data',
      label: 'Sensitive or special-category data',
      detail: categories.length > 0 ? categories.join(', ') : 'Sensitive data was identified.',
      significant: true,
    });
  }

  if (answers.vulnerableIndividuals === 'Yes') {
    flags.push({
      id: 'vulnerable-individuals',
      label: 'Children or vulnerable individuals',
      detail: answers.vulnerableDescription || 'The processing involves children or vulnerable individuals.',
      significant: true,
    });
  }

  if (answers.largeScale === 'Yes') {
    flags.push({
      id: 'large-scale',
      label: 'Large-scale processing',
      detail: 'Personal data is processed at large scale.',
      significant: false,
    });
  }

  if (answers.systematicMonitoring === 'Yes') {
    flags.push({
      id: 'systematic-monitoring',
      label: 'Systematic monitoring or tracking',
      detail: answers.monitoringDescription || 'The activity systematically monitors or tracks individuals.',
      significant: true,
    });
  }

  if (answers.automatedDecisionMaking === 'Yes') {
    flags.push({
      id: 'automated-decision-making',
      label: 'Profiling or automated decision-making',
      detail: answers.automatedDecisionDescription || 'Automated decisions or profiling are used.',
      significant: true,
    });
  }

  const transfersIdentified =
    answers.internationalTransfers === 'Yes' ||
    (answers.internationalTransfers === 'Not sure' && activityHasInternationalTransfers(activity));
  const safeguardsConfirmed =
    answers.transferSafeguardsInPlace === 'Yes' || answers.contractualSafeguards === 'Yes';
  const safeguardsUnresolved = transfersIdentified && !safeguardsConfirmed;

  if (safeguardsUnresolved) {
    flags.push({
      id: 'unresolved-transfers',
      label: 'International transfers without confirmed safeguards',
      detail: 'Cross-border transfer or access was identified, and safeguards are not confirmed.',
      significant: true,
    });
  }

  const riskIdentified = answers.significantHarm === 'Yes' || answers.additionalRisks === 'Yes';
  const remediationAddressed =
    answers.remediationRequired === 'Yes' && !isBlank(answers.remediationActions);
  if (riskIdentified && !remediationAddressed) {
    flags.push({
      id: 'unresolved-privacy-risk',
      label: 'Unresolved privacy risk',
      detail: answers.identifiedRisks || 'A privacy harm or additional risk was identified without recorded remediation.',
      significant: true,
    });
  }

  if (answers.purposeClearlyDefined === 'No' || answers.purposeClearlyDefined === 'Not sure') {
    addConcern('purpose', 'Processing & Necessity', 'The purpose is not clearly defined.');
  }
  if (answers.allDataNecessary === 'No' || answers.allDataNecessary === 'Not sure') {
    addConcern('necessity', 'Processing & Necessity', 'It is not confirmed that all personal data is necessary.');
  }
  if (answers.lessDataPossible === 'Yes') {
    addConcern('minimisation', 'Processing & Necessity', 'The purpose could be achieved with less personal data.');
  }
  if (answers.usedForAnotherPurpose === 'Yes') {
    addConcern(
      'other-purpose',
      'Processing & Necessity',
      answers.otherPurposeDescription
        ? `Data may be used for another purpose: ${answers.otherPurposeDescription}`
        : 'Data may be used for another purpose.'
    );
  }

  flags.forEach(flag => addConcern(flag.id, 'Privacy review', flag.label));

  const controlConcerns: Array<[keyof AssessmentAnswers, string]> = [
    ['accessControls', 'Access controls are not fully in place.'],
    ['securityControls', 'Security controls are not confirmed as appropriate.'],
    ['retentionDefined', 'A retention period is not fully defined.'],
    ['deletionCapability', 'Deletion or anonymisation is not fully supported.'],
    ['dataSubjectRights', 'Support for data-subject rights is incomplete.'],
  ];
  controlConcerns.forEach(([key, text]) => {
    const value = answers[key];
    if (value === 'No' || value === 'Partial' || value === 'Not sure') {
      addConcern(String(key), 'Privacy Controls', text);
    }
  });

  if (answers.significantHarm === 'Yes') {
    addConcern('harm', 'Risk & Review', 'Misuse, loss, or disclosure could significantly harm individuals.');
  }
  if (answers.additionalRisks === 'Yes') {
    addConcern(
      'additional-risks',
      'Risk & Review',
      answers.identifiedRisks ? answers.identifiedRisks : 'Additional privacy risks were identified.'
    );
  }

  const significantCount = flags.filter(flag => flag.significant).length;
  const dpiaRecommended = significantCount > 0 || flags.length >= 2;

  return {
    flags,
    concerns,
    dpiaRecommended,
  };
};
