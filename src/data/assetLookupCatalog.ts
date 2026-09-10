// Configurable Lookup Lists and Centrally Managed Location Catalogs for Asset Inventory

export const MANAGING_ORGANISATION_OPTIONS = [
  'Trimble Digital Transformation & Cloud Services',
  'Trimble Enterprise IT & Infrastructure',
  'Trimble Infrastructure Division',
  'Trimble Field Systems',
  'Trimble Connected Operations',
  'Trimble Software Solutions',
  'Global Customer Support & Success',
  'Global Corporate & Shared Services',
] as const;

export const ASSET_TYPE_OPTIONS = [
  'Database',
  'Server',
  'Application',
  'Cloud Storage',
  'API Endpoint',
  'Physical File System',
  'Data Warehouse / Analytics Engine',
  'Message Queue / Event Bus',
] as const;

export const HOSTING_TYPE_OPTIONS = [
  'Public Cloud (SaaS/PaaS/IaaS)',
  'Private Cloud',
  'Hybrid Cloud',
  'On-Premises Data Center',
  'Co-located Data Center',
  'Third-Party Managed Hosting',
] as const;

export const HOSTING_PROVIDER_OPTIONS = [
  'Amazon Web Services (AWS)',
  'Google Cloud Platform (GCP)',
  'Microsoft Azure',
  'Salesforce Cloud Infrastructure',
  'Snowflake Cloud Data Platform',
  'Zendesk Cloud Platform',
  'Equinix Data Centers',
  'Internal Corporate Data Center',
] as const;

export const COUNTRY_LOCATION_LOOKUP = [
  'United States',
  'Germany',
  'Ireland',
  'Netherlands',
  'United Kingdom',
  'Singapore',
  'Japan',
  'Australia',
  'Canada',
  'Brazil',
  'France',
  'India',
  'Switzerland',
  'Sweden',
  'Belgium',
  'Israel',
  'South Korea',
] as const;

export type CountryLocation = (typeof COUNTRY_LOCATION_LOOKUP)[number];
