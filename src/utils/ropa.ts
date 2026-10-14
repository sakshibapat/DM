import { PrivacyAssessment } from '../types/assessment';
import {
  Asset,
  Entity,
  ProcessingActivity,
  ProcessingRole,
  Vendor,
} from '../types/privacy';

export type RopaKind = 'controller' | 'processor';

export interface RopaLink {
  id: string;
  name: string;
  detail?: string;
}

export interface RopaField {
  id: string;
  label: string;
  article: string;
  value: string;
  missing: boolean;
}

export interface RopaRecord {
  activityId: string;
  name: string;
  kind: RopaKind;
  article: '30(1)' | '30(2)';
  role: ProcessingRole;
  status: ProcessingActivity['status'];
  owner: string;
  completeness: number;
  missingLabels: string[];
  fields: RopaField[];
  assets: RopaLink[];
  vendors: RopaLink[];
  entities: RopaLink[];
  assessments: RopaLink[];
}

const unique = (values: Array<string | undefined | null>): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach(value => {
    const text = (value || '').trim();
    if (!text || text.toLowerCase() === 'none') return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(text);
  });
  return result;
};

const join = (values: Array<string | undefined | null>): string => unique(values).join('; ');

export const isProcessorRole = (role?: ProcessingRole): boolean =>
  role === 'Processor' || role === 'Processor (B2B sales only)' || role === 'Processor (but including B2C sales)';

const field = (id: string, label: string, article: string, value: string, missing: boolean): RopaField => ({
  id,
  label,
  article,
  value: missing ? '' : value,
  missing,
});

const identityValue = (activity: ProcessingActivity, entities: Entity[]): string =>
  join([
    ...entities.map(entity =>
      [entity.name, entity.jurisdiction, entity.dpoContact ? `DPO: ${entity.dpoContact}` : ''].filter(Boolean).join(' — ')
    ),
    activity.owner ? `Business owner: ${activity.owner}` : '',
    activity.dataProtectionContact ? `Privacy contact: ${activity.dataProtectionContact}` : '',
    activity.controllerContactDetails ? `Controller contact: ${activity.controllerContactDetails}` : '',
    activity.processorAndControllerDetails,
  ]);

const purposeValue = (activity: ProcessingActivity): string =>
  join([activity.purpose, ...(activity.categoriesOfProcessing || [])]);

const transferValue = (activity: ProcessingActivity): { text: string; missing: boolean } => {
  const status = activity.hasInternationalTransfer;
  const destinations = unique([
    ...(activity.internationalTransferDetails || []).map(detail =>
      [detail.country, detail.safeguard ? `(${detail.specifiedSafeguard || detail.safeguard})` : ''].filter(Boolean).join(' ')
    ),
    ...(activity.selectedTransferRegions || []),
  ]);
  const safeguards = join([activity.transferSafeguards]);
  if (!status) return { text: '', missing: true };
  if (status === 'No') return { text: 'No international transfer', missing: false };
  if (status === 'Unknown') return { text: 'Transfer status unknown', missing: true };
  const text = join([
    destinations.length ? `Destinations: ${destinations.join(', ')}` : '',
    safeguards ? `Safeguards: ${safeguards}` : '',
  ]);
  return { text, missing: destinations.length === 0 || !safeguards };
};

const retentionValue = (activity: ProcessingActivity): { text: string; missing: boolean } => {
  const text = (activity.retentionPeriod || '').trim();
  const missing = !activity.hasRetentionPolicy || !text || text === 'None';
  return { text: missing ? '' : text, missing };
};

const securityValue = (activity: ProcessingActivity): { text: string; missing: boolean } => {
  const text = join([...(activity.toms || []), activity.tomsOther]);
  return { text, missing: !text };
};

export const buildRopaRecord = (
  activity: ProcessingActivity,
  related: { assets: Asset[]; vendors: Vendor[]; entities: Entity[] },
  assessments: PrivacyAssessment[]
): RopaRecord => {
  const processor = isProcessorRole(activity.role);
  const identity = identityValue(activity, related.entities);
  const purposes = purposeValue(activity);
  const subjects = join(activity.dataSubjectCategories || []);
  const personalData = join(activity.personalDataCategories || []);
  const recipients = join([
    ...(activity.recipientCategories || []),
    ...related.vendors.map(vendor => vendor.name),
    activity.specifiedThirdParty,
    activity.specifiedTrimbleProductTeam,
  ]);
  const transfers = transferValue(activity);
  const retention = retentionValue(activity);
  const security = securityValue(activity);
  const controllerOnBehalf = join([activity.processorAndControllerDetails, ...related.entities.map(entity => entity.name)]);

  const fields: RopaField[] = processor
    ? [
        field(
          'identity',
          'Processor and controller contact details',
          'Art. 30(2)(a)',
          identity,
          !identity || !controllerOnBehalf
        ),
        field('processing', 'Categories of processing', 'Art. 30(2)(b)', purposes, !purposes),
        field('transfers', 'International transfers and safeguards', 'Art. 30(2)(c)', transfers.text, transfers.missing),
        field('security', 'Security measures', 'Art. 30(2)(d)', security.text, security.missing),
      ]
    : [
        field('identity', 'Controller contact details', 'Art. 30(1)(a)', identity, !identity),
        field('purposes', 'Purposes of processing', 'Art. 30(1)(b)', purposes, !purposes),
        field('subjects', 'Categories of data subjects', 'Art. 30(1)(c)', subjects, !subjects),
        field('personalData', 'Categories of personal data', 'Art. 30(1)(c)', personalData, !personalData),
        field('recipients', 'Recipients', 'Art. 30(1)(d)', recipients, !recipients),
        field('transfers', 'International transfers and safeguards', 'Art. 30(1)(e)', transfers.text, transfers.missing),
        field('retention', 'Retention periods', 'Art. 30(1)(f)', retention.text, retention.missing),
        field('security', 'Security measures', 'Art. 30(1)(g)', security.text, security.missing),
      ];

  const contextFields: RopaField[] = processor
    ? [
        field('subjects', 'Data subjects recorded in Data Mapping', 'Source activity', subjects, !subjects),
        field('personalData', 'Personal data categories recorded in Data Mapping', 'Source activity', personalData, !personalData),
        field('recipients', 'Recipients recorded in Data Mapping', 'Source activity', recipients, !recipients),
        field('retention', 'Retention recorded in Data Mapping', 'Source activity', retention.text, retention.missing),
      ].filter(item => !item.missing)
    : [];

  const applicable = fields;
  const missingLabels = applicable.filter(item => item.missing).map(item => item.label);
  const completeness = applicable.length === 0 ? 0 : Math.round(((applicable.length - missingLabels.length) / applicable.length) * 100);

  return {
    activityId: activity.id,
    name: activity.name,
    kind: processor ? 'processor' : 'controller',
    article: processor ? '30(2)' : '30(1)',
    role: activity.role,
    status: activity.status,
    owner: activity.owner || '',
    completeness,
    missingLabels,
    fields: [...applicable, ...contextFields],
    assets: related.assets.map(asset => ({ id: asset.id, name: asset.name, detail: asset.assetType })),
    vendors: related.vendors.map(vendor => ({ id: vendor.id, name: vendor.name, detail: vendor.dpaStatus })),
    entities: related.entities.map(entity => ({ id: entity.id, name: entity.name, detail: entity.jurisdiction })),
    assessments: assessments
      .filter(assessment => assessment.processingActivityId === activity.id)
      .map(assessment => ({ id: assessment.id, name: assessment.name, detail: assessment.status })),
  };
};

export const ropaExportRows = (records: RopaRecord[]): Record<string, string>[] =>
  records.map(record => {
    const valueOf = (id: string) => record.fields.find(item => item.id === id)?.value || '';
    return {
      'Processing Activity ID': record.activityId,
      Name: record.name,
      'RoPA article': record.article,
      Role: record.role,
      Status: record.status,
      Owner: record.owner,
      'Completeness %': String(record.completeness),
      'Missing information': record.missingLabels.join('; '),
      'Contact details': valueOf('identity'),
      'Purposes or categories of processing': valueOf('purposes') || valueOf('processing'),
      'Data subjects': valueOf('subjects'),
      'Personal data categories': valueOf('personalData'),
      Recipients: valueOf('recipients'),
      'International transfers': valueOf('transfers'),
      Retention: valueOf('retention'),
      'Security measures': valueOf('security'),
      Assets: record.assets.map(item => item.name).join('; '),
      Vendors: record.vendors.map(item => item.name).join('; '),
      'Privacy assessments': record.assessments.map(item => `${item.id} ${item.name}`).join('; '),
    };
  });
