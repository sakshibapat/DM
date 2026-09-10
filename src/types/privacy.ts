/**
 * Core Data Mapping & Privacy Platform Types
 */

export type StatusType = 'Draft' | 'Under Review' | 'Approved' | 'Archived';

export type InventoryType = 'processingActivities' | 'tspReferences' | 'assets' | 'vendors' | 'entities';

export interface BaseRecord {
  id: string;
  name: string;
  description?: string;
  status: StatusType;
  createdBy: string;
  createdDate: string; // ISO date string
  lastModifiedBy: string;
  lastModifiedDate: string; // ISO date string
  tags?: string[];
}

// 1. Processing Activity Record
export type ProcessingRole =
  | 'Controller'
  | 'Processor (B2B sales only)'
  | 'Processor (but including B2C sales)'
  | 'Processor'
  | 'Joint Controller';

export const CONTROLLER_PURPOSES = [
  'Account Management - may include Entitlement/IAM',
  'AI and Machine Learning Model Development',
  'Background Checks or Candidate Vetting',
  'Billing, Invoicing, and Payment Processing',
  'CRM',
  'Customer Service and Support',
  'Customer Success',
  'Data Analytics or Business Intelligence (BI), including product experience telemetry',
  'Employee/Workforce Management (including time-tracking, absence, and coaching)',
  'ERP',
  'Financial or Tax Reporting',
  'Information and Network Security, or Cyber Security Monitoring',
  'Lead Generation or Acquisition, Contact Enrichment',
  'Legal Defence, Claims, and Litigation',
  'Marketing',
  'Payroll, Compensation, or Benefits Processing',
  'Physical Building Security, Access, and CCTV',
  'Recruitment and Talent Acquisition',
  'Sales Soliciting',
  'Statutory Obligations (AML, Health and Safety, Data Protection etc.)',
  'Whistleblowing and Internal Misconduct',
] as const;

export type PurposeOfProcessing = (typeof CONTROLLER_PURPOSES)[number];

export const PROCESSOR_CATEGORIES = [
  'Customer Service and Support',
  'Customer Success',
  'Cyber Security Services',
  'Licensing and Billing',
  'Product Analytics / Product Experience',
  'Product Hosting',
] as const;

export type CategoryOfProcessing = (typeof PROCESSOR_CATEGORIES)[number];

export const CONTROLLER_LEGAL_BASIS_OPTIONS = [
  'Consent of the data subject',
  'Contractual Obligation',
  'Legal Obligation',
  'Legitimate Interest of the Controller',
  'Public interest',
  'Vital Interest',
] as const;

export type ControllerLegalBasis = (typeof CONTROLLER_LEGAL_BASIS_OPTIONS)[number];

export type LegalBasis = ControllerLegalBasis | 'Consent' | 'Legitimate Interest' | 'Contractual Necessity' | 'Legal Obligation' | 'Vital Interests' | 'Public Task' | '';

export type RetentionPolicyType = 'Custom' | 'None';

export type InternationalTransferStatus = 'Yes' | 'No' | 'Unknown';
export type TransferSafeguardOption = 'Adequacy or equivalent' | 'SCCs' | 'Other' | '';

export interface DestinationCountryTransfer {
  id: string;
  country: string;
  region: 'APAC' | 'EMEA' | 'LATAM' | 'North America (US, Canada, Mexico)' | string;
  safeguard: TransferSafeguardOption;
  specifiedSafeguard?: string;
}

export type TSPStatusOption = 'Yes' | 'No' | 'Pending' | 'N/A';

export const TOMS_OPTIONS = [
  'Activity logging',
  'Anonymisation/Pseudonymisation',
  'Business Continuity Plans',
  'Backup and restore functionality',
  'Data masking/obfuscation',
  'Documented change management processes',
  'Employee Training',
  'Encryption at rest',
  'Encryption in transit',
  'Human-in-the-loop or other manual review process',
  'Multi-Factor Authentication',
  'Role Based Access Controls',
  'SSO',
  'Cyber Security Controls in TSP',
  'Vendor assessment',
  'Other',
] as const;

export type TOMOption = (typeof TOMS_OPTIONS)[number];

export interface ProcessingActivity extends BaseRecord {
  role: ProcessingRole;
  legalBasis: LegalBasis;
  liaFiled?: boolean;
  owner: string;
  retentionPolicyType?: RetentionPolicyType;
  retentionPeriod: string;
  hasRetentionPolicy: boolean;
  personalDataCategories: string[];
  involvesHighRiskData: boolean;
  transferSafeguards: string; // e.g., "EU Standard Contractual Clauses (SCCs)", "Data Privacy Framework (DPF)", "None"
  toms: string[]; // Technical & Organizational Measures
  tomsOther?: string;
  tspStatus?: TSPStatusOption;
  tspJustification?: string;
  dataSubjectCategories: string[];
  dataSubjectPersonalDataMap?: Record<string, string[]>; // Mappings of Data Subject Category -> Array of Personal Data Categories

  // Recipients
  recipientCategories?: string[];
  specifiedTrimbleProductTeam?: string;
  specifiedThirdParty?: string;

  // International Transfers
  hasInternationalTransfer?: InternationalTransferStatus;
  selectedTransferRegions?: string[];
  internationalTransferDetails?: DestinationCountryTransfer[];

  // Role Specific & Detailed Fields
  dataProtectionContact?: string;
  controllerContactDetails?: string;
  purpose?: PurposeOfProcessing | string;
  processorAndControllerDetails?: string;
  categoriesOfProcessing?: (CategoryOfProcessing | string)[];

  // Direct Relationships
  tspIds: string[];
  assetIds: string[];
  dataSourceAssetIds?: string[];
  dataDestinationAssetIds?: string[];
  vendorIds: string[];
  entityIds: string[];
}

// 2. TSP / Product Reference Record (Technical / Service Provider or Product Reference)
export interface TSPReference extends BaseRecord {
  category: string; // e.g. "SaaS Platform", "Infrastructure Provider", "Database Engine", "Analytics Service"
  versionOrPlan?: string;
  tspReference?: string; // Identifier reference string (e.g. TSP-REF-801, PROD-SALESFORCE-01)
  vendorIds: string[];
  assetIds: string[];
  entityIds: string[];
  processingActivityIds?: string[];
  toms?: string[];
  tomsOther?: string;
  tspStatus?: TSPStatusOption | string;
  tspJustification?: string;
}

// 3. Asset Record
export type AssetType = 'Database' | 'Server' | 'Application' | 'Cloud Storage' | 'API Endpoint' | 'Physical File System';
export type DataClassification = 'Confidential' | 'Restricted' | 'Internal' | 'Public';

export interface Asset extends BaseRecord {
  assetType: AssetType | string;
  dataClassification: DataClassification;
  managingOrganisation?: string;
  hostingType?: string;
  hostingProvider?: string;
  primaryHostingLocation?: string;
  additionalHostingLocations?: string[];
  hostingLocation?: string; // Legacy / computed fallback
  itOwner?: string;
  owner?: string;
  vendorIds: string[];
  tspIds: string[];
  processingActivityIds?: string[];
  toms?: string[];
  tomsOther?: string;
  tspStatus?: TSPStatusOption | string;
  tspJustification?: string;
}

// 4. Vendor Record
export type DpaStatus = 'Signed' | 'In Review' | 'Not Required' | 'Expired';

export interface Vendor extends BaseRecord {
  dpaStatus: DpaStatus;
  headquarters: string;
  contactEmail: string;
  securityCertifications: string[];
  assetIds: string[];
  processingActivityIds?: string[];
  tspIds?: string[];
  entityIds?: string[];
  website?: string;
  toms?: string[];
  tomsOther?: string;
  tspStatus?: TSPStatusOption | string;
  tspJustification?: string;
}

// 5. Entity Record
export interface Entity extends BaseRecord {
  jurisdiction: string; // e.g., "EU - Netherlands", "US - Delaware", "UK - England & Wales"
  registrationNumber: string;
  dpoContact: string;
  address?: string;
  processingActivityIds?: string[];
  assetIds?: string[];
  tspIds?: string[];
  vendorIds?: string[];
  toms?: string[];
  tomsOther?: string;
  tspStatus?: TSPStatusOption | string;
  tspJustification?: string;
}

// Unified Record Type
export type PrivacyRecord = ProcessingActivity | TSPReference | Asset | Vendor | Entity;

// Attention / Governance Audit Item
export interface AttentionItem {
  id: string;
  recordId: string;
  recordName: string;
  inventoryType: InventoryType;
  issueType: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

// Audit Trail Activity Entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Status Change' | 'Relationships Updated';
  recordId: string;
  recordName: string;
  inventoryType: InventoryType;
  details: string;
}

// Data Mapping Statistics Summary
export interface DataMappingMetrics {
  totalProcessingActivities: number;
  totalAssets: number;
  totalVendors: number;
  totalEntities: number;
  totalTSPs: number;
  controllerActivitiesCount: number;
  processorActivitiesCount: number;
  jointControllerActivitiesCount: number;
  recordsMissingRetention: number;
  recordsHighRisk: number;
  attentionItemsCount: number;
}
