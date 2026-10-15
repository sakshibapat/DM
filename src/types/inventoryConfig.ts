import { InventoryType, CONTROLLER_LEGAL_BASIS_OPTIONS, CONTROLLER_PURPOSES, PROCESSOR_CATEGORIES, TOMS_OPTIONS } from './privacy';
import { DATA_SUBJECT_CATEGORIES, CONTROLLED_PERSONAL_DATA_ITEMS } from '../data/personalDataCatalog';
import {
  RECIPIENT_CATEGORIES_EXTERNAL,
  RECIPIENT_CATEGORIES_INTERNAL,
  TRANSFER_REGIONS,
  TRANSFER_SAFEGUARD_OPTIONS,
} from '../data/recipientAndTransferCatalog';
import {
  ASSET_TYPE_OPTIONS,
  COUNTRY_LOCATION_LOOKUP,
  HOSTING_PROVIDER_OPTIONS,
  HOSTING_TYPE_OPTIONS,
  MANAGING_ORGANISATION_OPTIONS,
} from '../data/assetLookupCatalog';

export const INVENTORY_CONFIG_VERSION = 1;

export interface InventoryOption {
  id: string;
  value: string;
  label: string;
  enabled: boolean;
}

export interface InventoryOptionGroup {
  key: string;
  label: string;
  description: string;
  options: InventoryOption[];
}

export interface InventoryConfiguration {
  displayName: string;
  optionGroups: Record<string, InventoryOptionGroup>;
}

export interface InventoryConfigDocument {
  version: number;
  inventories: Record<InventoryType, InventoryConfiguration>;
}

export interface ConfigurationAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  inventoryType: InventoryType;
  optionGroupKey: string;
  action: 'Updated' | 'Reset';
  details: string;
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

const group = (
  key: string,
  label: string,
  description: string,
  values: readonly string[]
): InventoryOptionGroup => ({
  key,
  label,
  description,
  options: values.map((value, index) => ({
    id: `${key}-${slug(value) || index}`,
    value,
    label: value,
    enabled: true,
  })),
});

const STATUSES = ['Approved', 'Under Review', 'Draft', 'Archived'];
const TSP_STATUSES = ['Yes', 'No', 'Pending', 'N/A'];

export const DEFAULT_INVENTORY_CONFIG: InventoryConfigDocument = {
  version: INVENTORY_CONFIG_VERSION,
  inventories: {
    processingActivities: {
      displayName: 'Processing Activities',
      optionGroups: {
        statuses: group('statuses', 'Approval Statuses', 'Record lifecycle statuses.', STATUSES),
        roles: group('roles', 'Processing Roles', 'Controller and processor classifications.', [
          'Controller',
          'Processor (B2B sales only)',
          'Processor (but including B2C sales)',
        ]),
        controllerPurposes: group('controllerPurposes', 'Controller Purposes', 'Purposes available for controller-like records.', CONTROLLER_PURPOSES),
        processorCategories: group('processorCategories', 'Processor Categories', 'Processing categories for B2B processor records.', PROCESSOR_CATEGORIES),
        legalBases: group('legalBases', 'Legal Bases', 'Article 6 legal bases.', CONTROLLER_LEGAL_BASIS_OPTIONS),
        dataSubjectCategories: group('dataSubjectCategories', 'Data Subject Categories', 'Groups of people whose data is processed.', DATA_SUBJECT_CATEGORIES),
        personalDataItems: group('personalDataItems', 'Personal Data Items', 'Controlled personal-data catalog choices.', CONTROLLED_PERSONAL_DATA_ITEMS),
        internalRecipients: group('internalRecipients', 'Internal Recipients', 'Internal recipient categories.', RECIPIENT_CATEGORIES_INTERNAL),
        externalRecipients: group('externalRecipients', 'External Recipients', 'External recipient categories.', RECIPIENT_CATEGORIES_EXTERNAL),
        transferRegions: group('transferRegions', 'Transfer Regions', 'International transfer regions.', TRANSFER_REGIONS),
        transferSafeguards: group('transferSafeguards', 'Transfer Safeguards', 'International transfer safeguards.', TRANSFER_SAFEGUARD_OPTIONS),
        retentionPolicyTypes: group('retentionPolicyTypes', 'Retention Policy Types', 'Available retention policy modes.', ['Custom', 'None']),
        toms: group('toms', 'Security Measures (TOMs)', 'Technical and organisational measures.', TOMS_OPTIONS),
        tspStatuses: group('tspStatuses', 'TSP Registration Statuses', 'TSP catalog registration statuses.', TSP_STATUSES),
      },
    },
    tspReferences: {
      displayName: 'TSP / Product References',
      optionGroups: {
        statuses: group('statuses', 'Approval Statuses', 'Record lifecycle statuses.', STATUSES),
        categories: group('categories', 'TSP Categories', 'Product and service categories.', [
          'SaaS Platform',
          'Infrastructure Provider',
          'Database Engine',
          'Analytics Service',
          'Security & Identity Provider',
          'Communication & Messaging',
          'Customer Support Tool',
          'AI / Machine Learning Model',
          'Other',
        ]),
        toms: group('toms', 'Security Measures (TOMs)', 'Technical and organisational measures.', TOMS_OPTIONS),
        tspStatuses: group('tspStatuses', 'TSP Registration Statuses', 'TSP catalog registration statuses.', TSP_STATUSES),
      },
    },
    assets: {
      displayName: 'Systems & Assets',
      optionGroups: {
        statuses: group('statuses', 'Approval Statuses', 'Record lifecycle statuses.', STATUSES),
        assetTypes: group('assetTypes', 'Asset Types', 'System and asset classifications.', [...ASSET_TYPE_OPTIONS, 'Other']),
        managingOrganisations: group('managingOrganisations', 'Managing Organisations', 'Teams responsible for assets.', [...MANAGING_ORGANISATION_OPTIONS, 'Other']),
        hostingTypes: group('hostingTypes', 'Hosting Types', 'Infrastructure hosting models.', [...HOSTING_TYPE_OPTIONS, 'Other']),
        hostingProviders: group('hostingProviders', 'Hosting Providers', 'Infrastructure providers.', [...HOSTING_PROVIDER_OPTIONS, 'Other']),
        locations: group('locations', 'Hosting Locations', 'Primary and additional hosting countries.', COUNTRY_LOCATION_LOOKUP),
        classifications: group('classifications', 'Data Classifications', 'Asset data sensitivity levels.', ['Restricted', 'Confidential', 'Internal', 'Public']),
        toms: group('toms', 'Security Measures (TOMs)', 'Technical and organisational measures.', TOMS_OPTIONS),
        tspStatuses: group('tspStatuses', 'TSP Registration Statuses', 'TSP catalog registration statuses.', TSP_STATUSES),
      },
    },
    vendors: {
      displayName: 'Vendors & Processors',
      optionGroups: {
        statuses: group('statuses', 'Approval Statuses', 'Record lifecycle statuses.', STATUSES),
        dpaStatuses: group('dpaStatuses', 'DPA Statuses', 'Data Processing Agreement statuses.', ['Signed', 'In Review', 'Not Required', 'Expired']),
        certifications: group('certifications', 'Certifications', 'Security and privacy certifications.', [
          'ISO 27001',
          'SOC 2 Type II',
          'SOC 1 Type II',
          'GDPR Compliant',
          'PCI-DSS',
          'ISO 27018',
          'HIPAA Compliant',
          'FedRAMP',
          'EU-US Data Privacy Framework',
        ]),
        toms: group('toms', 'Security Measures (TOMs)', 'Technical and organisational measures.', TOMS_OPTIONS),
        tspStatuses: group('tspStatuses', 'TSP Registration Statuses', 'TSP catalog registration statuses.', TSP_STATUSES),
      },
    },
    entities: {
      displayName: 'Legal Entities',
      optionGroups: {
        statuses: group('statuses', 'Approval Statuses', 'Record lifecycle statuses.', STATUSES),
        jurisdictions: group('jurisdictions', 'Jurisdictions', 'Primary legal jurisdictions and regions.', [
          'EU - Netherlands',
          'EU - Germany',
          'EU - France',
          'EU - Ireland',
          'UK - England & Wales',
          'US - Delaware',
          'US - California',
          'US - New York',
          'Singapore',
          'Australia',
          'Japan',
          'Canada',
          'Switzerland',
          'Other',
        ]),
        toms: group('toms', 'Security Measures (TOMs)', 'Technical and organisational measures.', TOMS_OPTIONS),
        tspStatuses: group('tspStatuses', 'TSP Registration Statuses', 'TSP catalog registration statuses.', TSP_STATUSES),
      },
    },
  },
};

export const cloneDefaultInventoryConfig = (): InventoryConfigDocument =>
  JSON.parse(JSON.stringify(DEFAULT_INVENTORY_CONFIG));

export const mergeInventoryConfig = (saved?: Partial<InventoryConfigDocument> | null): InventoryConfigDocument => {
  const merged = cloneDefaultInventoryConfig();
  if (!saved?.inventories) return merged;

  (Object.keys(merged.inventories) as InventoryType[]).forEach(inventoryType => {
    const savedInventory = saved.inventories?.[inventoryType];
    if (!savedInventory) return;
    merged.inventories[inventoryType].displayName =
      savedInventory.displayName || merged.inventories[inventoryType].displayName;
    Object.entries(savedInventory.optionGroups || {}).forEach(([key, savedGroup]) => {
      if (savedGroup?.options && Array.isArray(savedGroup.options)) {
        merged.inventories[inventoryType].optionGroups[key] = {
          ...merged.inventories[inventoryType].optionGroups[key],
          ...savedGroup,
          key,
          options: savedGroup.options,
        };
      }
    });
  });
  return merged;
};

export const getOptionValues = (
  config: InventoryConfigDocument,
  inventoryType: InventoryType,
  groupKey: string,
  legacyValues: string[] = []
): string[] => {
  const enabled = (config.inventories[inventoryType].optionGroups[groupKey]?.options || [])
    .filter(option => option.enabled)
    .map(option => option.value);
  return Array.from(new Set([...enabled, ...legacyValues.filter(Boolean)]));
};

export const validateInventoryOptions = (options: InventoryOption[]): string | null => {
  if (options.some(option => !option.value.trim())) return 'Options cannot be empty.';
  const seen = new Set<string>();
  for (const option of options) {
    const normalized = option.value.trim().toLowerCase();
    if (seen.has(normalized)) return 'Option values must be unique.';
    seen.add(normalized);
  }
  return null;
};

export const recordsContainOptionValue = (records: unknown[], value: string): boolean => {
  const contains = (input: unknown): boolean => {
    if (Array.isArray(input)) return input.some(contains);
    if (input && typeof input === 'object') return Object.values(input).some(contains);
    return input === value;
  };
  return records.some(contains);
};
