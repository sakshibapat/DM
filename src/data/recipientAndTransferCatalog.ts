import { ProcessingActivity } from '../types/privacy';

export const RECIPIENT_CATEGORIES_INTERNAL = [
  'Other Trimble Product Team',
  'Trimble Analytics or BI Teams',
  'Trimble Cloud Platform',
  'Trimble Customer Success Teams',
  'Trimble Customer Support Teams',
  'Trimble Cyber Security',
  'Trimble Legal',
  'Trimble IS or other Technology Teams',
  'Trimble Marketing Teams',
  'Trimble Sales Outreach',
  'Trimble Finance Teams',
  'Trimble PX',
] as const;

export const RECIPIENT_CATEGORIES_EXTERNAL = [
  'Other Third Party',
  'Third Party Compliance Bodies',
  'Third Party Vendors',
] as const;

export const ALL_RECIPIENT_CATEGORIES = [
  ...RECIPIENT_CATEGORIES_INTERNAL,
  ...RECIPIENT_CATEGORIES_EXTERNAL,
];

export const TRANSFER_REGIONS = [
  'APAC',
  'EMEA',
  'LATAM',
  'North America (US, Canada, Mexico)',
] as const;

export type TransferRegion = (typeof TRANSFER_REGIONS)[number];

export const REGION_PRESET_COUNTRIES: Record<string, string[]> = {
  'APAC': [
    'Australia',
    'China',
    'India',
    'Japan',
    'Malaysia',
    'New Zealand',
    'Philippines',
    'Singapore',
    'South Korea',
    'Thailand',
    'Vietnam',
  ],
  'EMEA': [
    'France',
    'Germany',
    'Ireland',
    'Israel',
    'Netherlands',
    'South Africa',
    'Spain',
    'Sweden',
    'Switzerland',
    'United Arab Emirates',
    'United Kingdom',
  ],
  'LATAM': [
    'Argentina',
    'Brazil',
    'Chile',
    'Colombia',
    'Costa Rica',
    'Mexico',
    'Peru',
  ],
  'North America (US, Canada, Mexico)': [
    'United States',
    'Canada',
    'Mexico',
  ],
};

export const TRANSFER_SAFEGUARD_OPTIONS = [
  'Adequacy or equivalent',
  'SCCs',
  'Other',
] as const;

export interface TransferWarning {
  title: string;
  description: string;
  severity: 'warning' | 'error';
}

export function getInternationalTransferWarning(activity: Partial<ProcessingActivity>): TransferWarning | null {
  if (activity.hasInternationalTransfer === 'Unknown') {
    return {
      title: 'Transfer Status Warning',
      description: 'International transfer status requires review. Verify storage and sub-processor locations.',
      severity: 'warning',
    };
  }
  if (activity.hasInternationalTransfer === 'Yes') {
    const details = activity.internationalTransferDetails || [];
    if (details.length === 0) {
      return {
        title: 'Transfer Safeguard Warning',
        description: 'Transfer safeguard requires review. At least one destination country with a valid safeguard mechanism must be specified.',
        severity: 'error',
      };
    }
    const hasInvalidSafeguard = details.some(
      d => !d.safeguard || (d.safeguard === 'Other' && !d.specifiedSafeguard?.trim())
    );
    if (hasInvalidSafeguard) {
      return {
        title: 'Transfer Safeguard Warning',
        description: 'Transfer safeguard requires review. Please specify details for all custom safeguards marked as "Other".',
        severity: 'error',
      };
    }
  }
  return null;
}
