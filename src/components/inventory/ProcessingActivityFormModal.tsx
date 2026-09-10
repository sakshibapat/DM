import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  ShieldAlert,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Info,
  Sparkles,
  Building,
  Cpu,
  FileText,
  User,
  Shield,
  Clock,
  Database,
  Globe,
  Layers,
  Lock,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Users,
  Briefcase,
  Plus,
  Trash2,
  Tag,
  UserCheck,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { SecurityMeasuresSection } from '../common/SecurityMeasuresSection';
import {
  ProcessingActivity,
  ProcessingRole,
  CONTROLLER_PURPOSES,
  PROCESSOR_CATEGORIES,
  LegalBasis,
  StatusType,
  CONTROLLER_LEGAL_BASIS_OPTIONS,
  DestinationCountryTransfer,
} from '../../types/privacy';
import { TextField } from '../common/TextField';
import { Select } from '../common/Select';
import { MultiSelect } from '../common/MultiSelect';
import { SearchableRelationshipSelector } from '../common/SearchableRelationshipSelector';
import { DataSubjectPersonalDataCard } from './DataSubjectPersonalDataCard';
import { RiskWarningBanner } from '../common/RiskWarningBanner';
import {
  DATA_SUBJECT_CATEGORIES,
  CONTROLLED_PERSONAL_DATA_ITEMS,
  PERSONAL_DATA_CATALOG,
  getPersonalDataMetadata,
} from '../../data/personalDataCatalog';
import {
  RECIPIENT_CATEGORIES_INTERNAL,
  RECIPIENT_CATEGORIES_EXTERNAL,
  TRANSFER_REGIONS,
  REGION_PRESET_COUNTRIES,
  TRANSFER_SAFEGUARD_OPTIONS,
  getInternationalTransferWarning,
} from '../../data/recipientAndTransferCatalog';

export interface ValidationIssue {
  id: string;
  type: 'ERROR' | 'WARNING' | 'INFO';
  step: number;
  stepName: string;
  field?: string;
  message: string;
  description?: string;
}

interface ProcessingActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordIdToEdit?: string | null;
}

export const FORM_STEPS = [
  { id: 1, name: 'Overview', icon: FileText, desc: 'Basic record metadata & ownership' },
  { id: 2, name: 'Role', icon: Shield, desc: 'Controller or Processor classification' },
  { id: 3, name: 'Data Subjects & Data', icon: User, desc: 'Personal data categories & high risk' },
  { id: 4, name: 'Recipients', icon: Building, desc: 'Internal & external disclosures' },
  { id: 5, name: 'International Transfers', icon: Globe, desc: 'Cross-border safeguards' },
  { id: 6, name: 'Retention & Legal Basis', icon: Clock, desc: 'Art 6 legal basis & schedule' },
  { id: 7, name: 'Security Measures', icon: Lock, desc: 'TOMs & encryption controls' },
  { id: 8, name: 'Related Inventories', icon: Layers, desc: 'Assets, Vendors, & Entities' },
  { id: 9, name: 'Review', icon: CheckCircle2, desc: 'Validation & final submission' },
];

export const ProcessingActivityFormModal: React.FC<ProcessingActivityFormModalProps> = ({
  isOpen,
  onClose,
  recordIdToEdit,
}) => {
  const {
    processingActivities,
    tspReferences,
    assets,
    vendors,
    entities,
    addRecord,
    updateRecord,
  } = usePrivacyData();

  const isEdit = Boolean(recordIdToEdit);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState<Partial<ProcessingActivity>>({
    name: '',
    description: '',
    status: 'Draft' as StatusType,
    owner: '',
    role: 'Controller' as ProcessingRole,
    dataProtectionContact: '',
    controllerContactDetails: '',
    purpose: '',
    processorAndControllerDetails: '',
    categoriesOfProcessing: [],
    legalBasis: 'Legitimate Interest' as LegalBasis,
    retentionPeriod: '3 Years',
    hasRetentionPolicy: true,
    personalDataCategories: ['Contact Info'],
    involvesHighRiskData: false,
    transferSafeguards: 'EU Standard Contractual Clauses (SCCs)',
    toms: ['AES-256 Encryption at Rest', 'TLS 1.3 in Transit'],
    dataSubjectCategories: ['Customers'],
    tspIds: [],
    assetIds: [],
    dataSourceAssetIds: [],
    dataDestinationAssetIds: [],
    vendorIds: [],
    entityIds: [],
    tags: [],
  });

  // Role switch warning modal state
  const [pendingRoleSwitch, setPendingRoleSwitch] = useState<ProcessingRole | null>(null);

  // Data subject category removal warning modal state
  const [pendingDataSubjectRemoval, setPendingDataSubjectRemoval] = useState<{
    category: string;
    itemCount: number;
  } | null>(null);

  const [customDataSubjectInput, setCustomDataSubjectInput] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (isEdit && recordIdToEdit) {
      const existing = processingActivities.find(x => x.id === recordIdToEdit);
      if (existing) {
        let dsCategories = existing.dataSubjectCategories || [];
        dsCategories = dsCategories.map(c => {
          if (c === 'Customers' || c === 'Customers or Prospects') return 'Customers or Prospects';
          if (c === 'Employees' || c === 'Contractors' || c === 'Employees, Candidates, and/or Contractors')
            return 'Employees, Candidates, and/or Contractors';
          return c;
        });
        dsCategories = Array.from(new Set(dsCategories));
        if (dsCategories.length === 0) {
          dsCategories = ['Customers or Prospects'];
        }

        let map: Record<string, string[]> = existing.dataSubjectPersonalDataMap
          ? { ...existing.dataSubjectPersonalDataMap }
          : {};

        if (Object.keys(map).length === 0) {
          const defaultItems = existing.personalDataCategories?.length
            ? existing.personalDataCategories
            : ['Name (First, Last, or both)', 'Email address'];
          dsCategories.forEach(cat => {
            map[cat] = defaultItems;
          });
        }

        const allPersonalData = Array.from(new Set((Object.values(map) as string[][]).flat()));
        const hasHighRisk = allPersonalData.some(item => getPersonalDataMetadata(item).isHighRisk);

        const recipients = existing.recipientCategories || ['Trimble Cloud Platform', 'Third Party Vendors'];
        const transferStatus = existing.hasInternationalTransfer || (existing.transferSafeguards ? 'Yes' : 'No');
        const transferRegions = existing.selectedTransferRegions || (transferStatus === 'Yes' ? ['North America (US, Canada, Mexico)', 'EMEA'] : []);
        let transferDetails = existing.internationalTransferDetails || [];

        if (transferStatus === 'Yes' && transferDetails.length === 0) {
          transferDetails = [
            {
              id: 'dt-1',
              country: 'United States',
              region: 'North America (US, Canada, Mexico)',
              safeguard: (existing.transferSafeguards?.includes('SCC') ? 'SCCs' : 'Adequacy or equivalent') as any,
            },
            {
              id: 'dt-2',
              country: 'Germany',
              region: 'EMEA',
              safeguard: 'Adequacy or equivalent',
            },
          ];
        }

        setFormData({
          ...existing,
          categoriesOfProcessing: existing.categoriesOfProcessing || [],
          dataProtectionContact: existing.dataProtectionContact || '',
          controllerContactDetails: existing.controllerContactDetails || '',
          processorAndControllerDetails: existing.processorAndControllerDetails || '',
          purpose: existing.purpose || '',
          dataSubjectCategories: dsCategories,
          dataSubjectPersonalDataMap: map,
          personalDataCategories: allPersonalData,
          involvesHighRiskData: hasHighRisk || Boolean(existing.involvesHighRiskData),
          recipientCategories: recipients,
          specifiedTrimbleProductTeam: existing.specifiedTrimbleProductTeam || '',
          specifiedThirdParty: existing.specifiedThirdParty || '',
          hasInternationalTransfer: transferStatus,
          selectedTransferRegions: transferRegions,
          internationalTransferDetails: transferDetails,
          dataSourceAssetIds: existing.dataSourceAssetIds || [],
          dataDestinationAssetIds: existing.dataDestinationAssetIds || [],
        });
      }
    } else {
      const defaultCategories = ['Customers or Prospects'];
      const defaultMap: Record<string, string[]> = {
        'Customers or Prospects': [
          'Name (First, Last, or both)',
          'Email address',
          'Device information (such as IP Address, MAC address)',
        ],
      };
      const allPersonalData = Array.from(new Set((Object.values(defaultMap) as string[][]).flat()));
      const hasHighRisk = allPersonalData.some(item => getPersonalDataMetadata(item).isHighRisk);

      // Reset defaults for new record
      setFormData({
        name: '',
        description: '',
        status: 'Draft',
        owner: '',
        role: 'Controller',
        dataProtectionContact: '',
        controllerContactDetails: '',
        purpose: '',
        processorAndControllerDetails: '',
        categoriesOfProcessing: [],
        legalBasis: 'Legitimate Interest',
        retentionPeriod: '3 Years',
        hasRetentionPolicy: true,
        personalDataCategories: allPersonalData,
        involvesHighRiskData: hasHighRisk,
        transferSafeguards: 'EU Standard Contractual Clauses (SCCs)',
        toms: ['Activity logging', 'Encryption at rest', 'Encryption in transit', 'Role Based Access Controls'],
        tomsOther: '',
        tspStatus: 'Yes',
        tspJustification: '',
        dataSubjectCategories: defaultCategories,
        dataSubjectPersonalDataMap: defaultMap,
        recipientCategories: ['Trimble Cloud Platform', 'Third Party Vendors'],
        specifiedTrimbleProductTeam: '',
        specifiedThirdParty: '',
        hasInternationalTransfer: 'No',
        selectedTransferRegions: [],
        internationalTransferDetails: [],
        tspIds: [],
        assetIds: [],
        dataSourceAssetIds: [],
        dataDestinationAssetIds: [],
        vendorIds: [],
        entityIds: [],
        tags: [],
      });
    }
    setCurrentStep(1);
    setPendingRoleSwitch(null);
    setPendingDataSubjectRemoval(null);
  }, [isEdit, recordIdToEdit, isOpen]);

  // Derived high-risk data & unique personal data categories
  const allSelectedPersonalDataCategories = useMemo(() => {
    const values = Object.values(formData.dataSubjectPersonalDataMap || {}) as string[][];
    return Array.from(new Set(values.flat()));
  }, [formData.dataSubjectPersonalDataMap]);

  const highRiskSelectedItems = useMemo(() => {
    return allSelectedPersonalDataCategories.map(getPersonalDataMetadata).filter(m => m.isHighRisk);
  }, [allSelectedPersonalDataCategories]);

  // Data subject toggle & removal handler
  const handleToggleDataSubjectCategory = (categoryName: string) => {
    const isSelected = (formData.dataSubjectCategories || []).includes(categoryName);
    if (isSelected) {
      const assignedCount = (formData.dataSubjectPersonalDataMap?.[categoryName] || []).length;
      if (assignedCount > 0) {
        setPendingDataSubjectRemoval({ category: categoryName, itemCount: assignedCount });
      } else {
        executeRemoveDataSubjectCategory(categoryName);
      }
    } else {
      executeAddDataSubjectCategory(categoryName);
    }
  };

  const executeAddDataSubjectCategory = (categoryName: string) => {
    const newCategories = Array.from(new Set([...(formData.dataSubjectCategories || []), categoryName]));
    const newMap = {
      ...(formData.dataSubjectPersonalDataMap || {}),
      [categoryName]: formData.dataSubjectPersonalDataMap?.[categoryName] || [],
    };
    const values = Object.values(newMap) as string[][];
    const allSelected = Array.from(new Set(values.flat()));
    const hasHighRisk = allSelected.some(item => getPersonalDataMetadata(item).isHighRisk);

    setFormData(prev => ({
      ...prev,
      dataSubjectCategories: newCategories,
      dataSubjectPersonalDataMap: newMap,
      personalDataCategories: allSelected,
      involvesHighRiskData: hasHighRisk,
    }));
  };

  const executeRemoveDataSubjectCategory = (categoryName: string) => {
    const newCategories = (formData.dataSubjectCategories || []).filter(c => c !== categoryName);
    const newMap = { ...(formData.dataSubjectPersonalDataMap || {}) };
    delete newMap[categoryName];

    const values = Object.values(newMap) as string[][];
    const allSelected = Array.from(new Set(values.flat()));
    const hasHighRisk = allSelected.some(item => getPersonalDataMetadata(item).isHighRisk);

    setFormData(prev => ({
      ...prev,
      dataSubjectCategories: newCategories,
      dataSubjectPersonalDataMap: newMap,
      personalDataCategories: allSelected,
      involvesHighRiskData: hasHighRisk,
    }));
    setPendingDataSubjectRemoval(null);
  };

  const handleUpdateItemsForSubjectCategory = (categoryName: string, items: string[]) => {
    const newMap = {
      ...(formData.dataSubjectPersonalDataMap || {}),
      [categoryName]: items,
    };
    const values = Object.values(newMap) as string[][];
    const allSelected = Array.from(new Set(values.flat()));
    const hasHighRisk = allSelected.some(item => getPersonalDataMetadata(item).isHighRisk);

    setFormData(prev => ({
      ...prev,
      dataSubjectPersonalDataMap: newMap,
      personalDataCategories: allSelected,
      involvesHighRiskData: hasHighRisk,
    }));
  };

  const handleAddCustomDataSubject = () => {
    if (!customDataSubjectInput.trim()) return;
    executeAddDataSubjectCategory(customDataSubjectInput.trim());
    setCustomDataSubjectInput('');
  };

  // Recipient Category Toggle Handler
  const handleToggleRecipientCategory = (categoryName: string) => {
    const current = formData.recipientCategories || [];
    let updated: string[];
    if (current.includes(categoryName)) {
      updated = current.filter(c => c !== categoryName);
    } else {
      updated = [...current, categoryName];
    }
    setFormData(prev => ({
      ...prev,
      recipientCategories: updated,
    }));
  };

  // International Transfer Handlers
  const handleToggleTransferRegion = (regionName: string) => {
    const current = formData.selectedTransferRegions || [];
    let updated: string[];
    if (current.includes(regionName)) {
      updated = current.filter(r => r !== regionName);
    } else {
      updated = [...current, regionName];
    }
    setFormData(prev => ({
      ...prev,
      selectedTransferRegions: updated,
    }));
  };

  const handleAddDestinationCountry = (region: string, countryName: string) => {
    if (!countryName.trim()) return;
    const currentDetails = formData.internationalTransferDetails || [];
    if (currentDetails.some(d => d.country.toLowerCase() === countryName.trim().toLowerCase())) {
      return; // Already added
    }

    const newItem: DestinationCountryTransfer = {
      id: 'dt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      country: countryName.trim(),
      region: region,
      safeguard: 'SCCs',
    };

    const newDetails = [...currentDetails, newItem];
    const newSafeguardSummary = Array.from(new Set(newDetails.map(d => d.safeguard).filter(Boolean))).join(', ');

    setFormData(prev => ({
      ...prev,
      internationalTransferDetails: newDetails,
      transferSafeguards: newSafeguardSummary || prev.transferSafeguards || 'EU Standard Contractual Clauses (SCCs)',
    }));
  };

  const handleRemoveDestinationCountry = (id: string) => {
    const currentDetails = formData.internationalTransferDetails || [];
    const newDetails = currentDetails.filter(d => d.id !== id);
    const newSafeguardSummary = Array.from(new Set(newDetails.map(d => d.safeguard).filter(Boolean))).join(', ');

    setFormData(prev => ({
      ...prev,
      internationalTransferDetails: newDetails,
      transferSafeguards: newSafeguardSummary || prev.transferSafeguards || 'None',
    }));
  };

  const handleUpdateCountrySafeguard = (id: string, safeguard: any, specifiedSafeguard?: string) => {
    const currentDetails = formData.internationalTransferDetails || [];
    const newDetails = currentDetails.map(item => {
      if (item.id === id) {
        return {
          ...item,
          safeguard,
          specifiedSafeguard: safeguard === 'Other' ? specifiedSafeguard || '' : undefined,
        };
      }
      return item;
    });

    const newSafeguardSummary = Array.from(new Set(newDetails.map(d => d.safeguard).filter(Boolean))).join(', ');

    setFormData(prev => ({
      ...prev,
      internationalTransferDetails: newDetails,
      transferSafeguards: newSafeguardSummary || prev.transferSafeguards || 'None',
    }));
  };

  // Warning helper for International Transfers
  const transferWarning = useMemo(() => {
    return getInternationalTransferWarning(formData);
  }, [formData]);

  // Is Processor helper
  const isProcessorRole = (r?: ProcessingRole) =>
    r === 'Processor (B2B sales only)' ||
    r === 'Processor (but including B2C sales)' ||
    r === 'Processor';

  const isControllerRole = (r?: ProcessingRole) => r === 'Controller' || r === 'Joint Controller';

  // Role switch handler with warning confirmation
  const handleRoleChangeAttempt = (newRole: ProcessingRole) => {
    const currentRole = formData.role;
    if (currentRole === newRole) return;

    const switchingFromControllerToProcessor = isControllerRole(currentRole) && isProcessorRole(newRole);
    const switchingFromProcessorToController = isProcessorRole(currentRole) && isControllerRole(newRole);

    const hasControllerSpecificData = Boolean(formData.purpose || formData.controllerContactDetails);
    const hasProcessorSpecificData = Boolean(
      (formData.categoriesOfProcessing && formData.categoriesOfProcessing.length > 0) ||
        formData.processorAndControllerDetails
    );

    if (
      (switchingFromControllerToProcessor && hasControllerSpecificData) ||
      (switchingFromProcessorToController && hasProcessorSpecificData)
    ) {
      // Trigger confirmation modal
      setPendingRoleSwitch(newRole);
    } else {
      // Direct update
      applyRoleChange(newRole);
    }
  };

  const applyRoleChange = (newRole: ProcessingRole) => {
    setFormData(prev => {
      const updated = { ...prev, role: newRole };

      if (isProcessorRole(newRole)) {
        // Switching to processor: clear controller specific fields
        updated.purpose = '';
        updated.controllerContactDetails = '';
      } else {
        // Switching to controller: clear processor specific fields
        updated.categoriesOfProcessing = [];
        updated.processorAndControllerDetails = '';
      }
      return updated;
    });
    setPendingRoleSwitch(null);
  };

  // Detailed taxonomy validation report (ERROR, WARNING, INFO)
  const validationReport = useMemo(() => {
    const errors: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    const infos: ValidationIssue[] = [];

    // Step 1: Overview
    if (!formData.name || !formData.name.trim()) {
      errors.push({
        id: 'err-name',
        type: 'ERROR',
        step: 1,
        stepName: 'Overview',
        field: 'Record Name',
        message: 'Record Name is required',
        description: 'Specify a clear title for this processing activity.',
      });
    }
    if (!formData.description || !formData.description.trim()) {
      errors.push({
        id: 'err-desc',
        type: 'ERROR',
        step: 1,
        stepName: 'Overview',
        field: 'Description',
        message: 'Description & Business Context is required',
        description: 'Provide an operational summary of data processing context.',
      });
    }
    if (!formData.owner || !formData.owner.trim()) {
      errors.push({
        id: 'err-owner',
        type: 'ERROR',
        step: 1,
        stepName: 'Overview',
        field: 'Business Process Owner',
        message: 'Business Process Owner is missing',
        description: 'Assign a business lead or data steward as the record owner.',
      });
    }

    // Step 2: Role
    if (isControllerRole(formData.role)) {
      if (!formData.purpose || !formData.purpose.trim()) {
        errors.push({
          id: 'err-purpose',
          type: 'ERROR',
          step: 2,
          stepName: 'Role',
          field: 'Purposes of Processing',
          message: 'Purposes of Processing is required for Controller role',
          description: 'Select at least one primary processing purpose under Controller responsibility.',
        });
      }
    } else if (isProcessorRole(formData.role)) {
      if (!formData.categoriesOfProcessing || formData.categoriesOfProcessing.length === 0) {
        errors.push({
          id: 'err-cat-proc',
          type: 'ERROR',
          step: 2,
          stepName: 'Role',
          field: 'Categories of Processing',
          message: 'Categories of Processing required for Processor role',
          description: 'Select applicable categories of processing performed on behalf of controllers.',
        });
      }
    }

    // Step 3: Data Subjects & Data
    if (!formData.dataSubjectCategories || formData.dataSubjectCategories.length === 0) {
      warnings.push({
        id: 'warn-ds-cats',
        type: 'WARNING',
        step: 3,
        stepName: 'Data Subjects & Data',
        field: 'Data Subject Categories',
        message: 'No Data Subject categories selected',
        description: 'Assign data subject categories (e.g. Customers, Employees) to map personal data.',
      });
    }
    if (formData.involvesHighRiskData) {
      warnings.push({
        id: 'warn-high-risk',
        type: 'WARNING',
        step: 3,
        stepName: 'Data Subjects & Data',
        field: 'High-Risk Data',
        message: 'High-risk personal data categories involved',
        description: 'Requires a formal Data Protection Impact Assessment (DPIA) under GDPR Art. 35.',
      });
    }

    // Step 4: Recipients
    if (formData.recipientCategories?.includes('Other Trimble Product Team') && !formData.specifiedTrimbleProductTeam?.trim()) {
      errors.push({
        id: 'err-spec-team',
        type: 'ERROR',
        step: 4,
        stepName: 'Recipients',
        field: 'Trimble Product Team Details',
        message: 'Trimble Product Team details required for internal recipient',
        description: 'Specify the specific internal Trimble Product Team entity.',
      });
    }
    if (formData.recipientCategories?.includes('Other Third Party') && !formData.specifiedThirdParty?.trim()) {
      errors.push({
        id: 'err-spec-tp',
        type: 'ERROR',
        step: 4,
        stepName: 'Recipients',
        field: 'Third Party Details',
        message: 'Third Party details required for external recipient',
        description: 'Specify the external third-party recipient organization.',
      });
    }

    // Step 5: International Transfers
    if (formData.hasInternationalTransfer === 'Unknown') {
      warnings.push({
        id: 'warn-transfer-unknown',
        type: 'WARNING',
        step: 5,
        stepName: 'International Transfers',
        field: 'Transfer Status',
        message: 'International transfer status requires review',
        description: 'Investigate cross-border data flows and vendor hosting locations.',
      });
    } else if (formData.hasInternationalTransfer === 'Yes') {
      const transferWarn = getInternationalTransferWarning(formData);
      if (transferWarn) {
        warnings.push({
          id: 'warn-transfer-safeguard',
          type: 'WARNING',
          step: 5,
          stepName: 'International Transfers',
          field: 'Transfer Safeguards',
          message: `${transferWarn.title}: ${transferWarn.description}`,
          description: 'Ensure destination countries have valid transfer safeguard mechanisms.',
        });
      }
      infos.push({
        id: 'info-transfer-scc',
        type: 'INFO',
        step: 5,
        stepName: 'International Transfers',
        field: 'Cross-Border Governance',
        message: 'Verify Standard Contractual Clauses (SCCs) are attached to sub-processor DPAs.',
      });
    }

    // Step 6: Retention & Legal Basis
    const retentionType = formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None');
    if (retentionType === 'None' || !formData.hasRetentionPolicy || formData.retentionPeriod === 'None' || !formData.retentionPeriod) {
      warnings.push({
        id: 'warn-retention-none',
        type: 'WARNING',
        step: 6,
        stepName: 'Retention & Legal Basis',
        field: 'Retention Policy',
        message: 'No defined data retention policy.',
        description: 'Operating without a defined retention policy poses compliance risk (GDPR Art. 5(1)(e)).',
      });
    } else if (retentionType === 'Custom') {
      if (!formData.retentionPeriod || !formData.retentionPeriod.trim() || formData.retentionPeriod === 'None') {
        errors.push({
          id: 'err-retention-desc',
          type: 'ERROR',
          step: 6,
          stepName: 'Retention & Legal Basis',
          field: 'Retention Policy Description',
          message: 'Retention policy description is required when Custom is selected',
          description: 'Specify retention duration or deletion trigger criteria.',
        });
      }
    }

    if (isControllerRole(formData.role)) {
      if (!formData.legalBasis || !formData.legalBasis.trim()) {
        errors.push({
          id: 'err-legal-basis',
          type: 'ERROR',
          step: 6,
          stepName: 'Retention & Legal Basis',
          field: 'Art. 6 Legal Basis',
          message: 'Art. 6 Legal Basis selection is required for Controller role',
          description: 'Select the primary lawful basis under GDPR Art. 6(1).',
        });
      } else if (formData.legalBasis === 'Legitimate Interest of the Controller' || formData.legalBasis === 'Legitimate Interest') {
        if (!formData.liaFiled) {
          warnings.push({
            id: 'warn-lia-unconfirmed',
            type: 'WARNING',
            step: 6,
            stepName: 'Retention & Legal Basis',
            field: 'LIA Confirmation',
            message: 'Legitimate Interest selected but LIA has not been confirmed.',
            description: 'A Legitimate Interest Assessment (LIA) document should be conducted and recorded.',
          });
        }
      }
    } else {
      infos.push({
        id: 'info-processor-legal-basis',
        type: 'INFO',
        step: 6,
        stepName: 'Retention & Legal Basis',
        field: 'Processor Legal Basis',
        message: 'Controller legal basis requirements (GDPR Art. 6) are established by the Controller entity.',
        description: 'As a Processor, processing is executed under controller instructions per the DPA.',
      });
    }

    // Step 7: Security Measures (TOMs & TSP Registration)
    if (formData.tspStatus === 'N/A' && !formData.tspJustification?.trim()) {
      errors.push({
        id: 'err-tsp-justification',
        type: 'ERROR',
        step: 7,
        stepName: 'Security Measures',
        field: 'TSP Registration Justification',
        message: 'Justification required when N/A is selected for TSP registration',
        description: 'Provide justification why TSP registration is not applicable.',
      });
    }

    if (formData.tspStatus === 'Pending') {
      warnings.push({
        id: 'warn-tsp-pending',
        type: 'WARNING',
        step: 7,
        stepName: 'Security Measures',
        field: 'TSP Registration Status',
        message: 'TSP Registration is pending confirmation',
        description: 'Follow up with technical teams to confirm TSP catalog registration.',
      });
    }

    if (!formData.toms || formData.toms.length === 0) {
      warnings.push({
        id: 'warn-toms',
        type: 'WARNING',
        step: 7,
        stepName: 'Security Measures',
        field: 'TOMs',
        message: 'No Technical & Organisational Security Measures (TOMs) documented',
        description: 'Record encryption, access controls, and vulnerability safeguards.',
      });
    } else if (formData.toms.includes('Other') && !formData.tomsOther?.trim()) {
      errors.push({
        id: 'err-toms-other',
        type: 'ERROR',
        step: 7,
        stepName: 'Security Measures',
        field: 'Other Security Control Description',
        message: 'Description required when "Other" security measure is selected',
        description: 'Describe the specific custom or additional security control.',
      });
    }

    // Step 8: Related Inventories
    if (!formData.vendorIds?.length && !formData.assetIds?.length && !formData.tspIds?.length) {
      warnings.push({
        id: 'warn-inventories',
        type: 'WARNING',
        step: 8,
        stepName: 'Related Inventories',
        field: 'Linked Inventories',
        message: 'No linked Assets, Vendors, or TSPs',
        description: 'Link technical assets and sub-processor vendor records to establish full data lineage.',
      });
    }

    return { errors, warnings, infos };
  }, [formData]);

  const percentage = useMemo(() => {
    let score = 0;
    if (formData.name?.trim()) score += 15;
    if (formData.description?.trim()) score += 15;
    if (formData.owner?.trim()) score += 10;
    if (formData.role) score += 10;
    if (isControllerRole(formData.role) ? formData.purpose : formData.categoriesOfProcessing?.length) score += 10;
    if (formData.dataSubjectCategories?.length) score += 15;
    if (formData.retentionPolicyType === 'Custom' && formData.retentionPeriod?.trim() && formData.retentionPeriod !== 'None') score += 15;
    if (isControllerRole(formData.role) ? formData.legalBasis : true) score += 10;
    return Math.min(100, score);
  }, [formData]);

  const warnings = useMemo(() => {
    return [...validationReport.errors, ...validationReport.warnings].map(i => `${i.message} (${i.stepName})`);
  }, [validationReport]);

  // Form Submission
  const handleSaveDraft = () => {
    const payload = {
      ...formData,
      status: 'Draft' as StatusType,
      name: formData.name || 'Untitled Processing Activity (Draft)',
    };

    if (isEdit && recordIdToEdit) {
      updateRecord('processingActivities', recordIdToEdit, payload);
    } else {
      addRecord('processingActivities', payload as any);
    }
    onClose();
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.name.trim()) {
      setCurrentStep(1);
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      setCurrentStep(1);
      return;
    }

    const payload = {
      ...formData,
      status: formData.status || 'Under Review',
    };

    if (isEdit && recordIdToEdit) {
      updateRecord('processingActivities', recordIdToEdit, payload);
    } else {
      addRecord('processingActivities', payload as any);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* TOP STATUS BAR: Name, Status, Completion %, Validation Warnings */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-indigo-600/30 border border-indigo-400/30 text-indigo-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300">
                  {isEdit ? `Editing ${recordIdToEdit}` : 'New Record Wizard'}
                </span>
                <span className="text-slate-500">•</span>
                <select
                  value={formData.status || 'Draft'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as StatusType })}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <h2 className="text-base font-bold text-white truncate mt-0.5">
                {formData.name || '(Untitled Processing Activity)'}
              </h2>
            </div>
          </div>

          {/* Completion Score & Action buttons */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Completion Percentage Bar */}
            <div className="flex items-center gap-2.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Completion</div>
                <div className="text-xs font-mono font-bold text-indigo-400">{percentage}%</div>
              </div>
              <div className="w-16 bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Wizard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* VALIDATION WARNINGS BANNER */}
        {warnings.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold shrink-0">Validation Gaps ({warnings.length}):</span>
              <span className="text-amber-800 truncate">{warnings.join(' • ')}</span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-[11px] font-bold text-amber-900 hover:underline shrink-0 ml-3"
            >
              Fix Missing Fields
            </button>
          </div>
        )}

        {/* STEP-BASED NAVIGATION HEADER */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
          {FORM_STEPS.map(step => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = step.id < currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                    : isCompleted
                    ? 'bg-white text-slate-700 hover:bg-slate-200/60 border border-slate-200'
                    : 'text-slate-500 hover:bg-slate-200/50'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive
                      ? 'bg-white text-indigo-700'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : step.id}
                </div>
                <span>{step.name}</span>
              </button>
            );
          })}
        </div>

        {/* STEP CONTENT WORKSPACE */}
        <form onSubmit={handleFinalSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: OVERVIEW */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Step 1: Record Overview & Basic Identification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define the primary activity name, operational purpose summary, process owner, and initial software reference.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <TextField
                    label="Processing Activity Name *"
                    placeholder="e.g., Global Customer Payroll & Compensation Processing"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    error={!formData.name?.trim() ? 'Record name is required' : undefined}
                  />
                </div>

                <div>
                  <TextField
                    label="Business Process Owner / Lead"
                    placeholder="e.g., Sarah Jenkins (VP HR)"
                    value={formData.owner || ''}
                    onChange={e => setFormData({ ...formData, owner: e.target.value })}
                  />
                </div>
              </div>

              <TextField
                label="Description & Business Context *"
                multiline
                rows={3}
                placeholder="Describe the operational background, business objective, and overall data processing lifecycle..."
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                error={!formData.description?.trim() ? 'Description is required' : undefined}
              />
            </div>
          )}

          {/* STEP 2: ROLE (CONTROLLER / PROCESSOR CONDITIONAL LOGIC) */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Step 2: Processing Role & Requirements
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your legal role (Controller or Processor). This configures role-specific regulatory compliance fields.
                </p>
              </div>

              {/* ROLE SELECTION QUESTION */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Question: Are you acting as a Controller or Processor for this activity? *
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      roleVal: 'Controller' as ProcessingRole,
                      title: 'Controller',
                      subtitle: 'Determines the purposes and means of processing personal data.',
                    },
                    {
                      roleVal: 'Processor (B2B sales only)' as ProcessingRole,
                      title: 'Processor (B2B Sales Only)',
                      subtitle: 'Processes data on behalf of business customers under contract.',
                    },
                    {
                      roleVal: 'Processor (but including B2C sales)' as ProcessingRole,
                      title: 'Processor (including B2C)',
                      subtitle: 'Processes consumer or mixed business data on behalf of clients.',
                    },
                  ].map(opt => {
                    const isSelected = formData.role === opt.roleVal;
                    return (
                      <button
                        key={opt.roleVal}
                        type="button"
                        onClick={() => handleRoleChangeAttempt(opt.roleVal)}
                        className={`p-4 rounded-lg border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20'
                            : 'bg-white border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-slate-900">{opt.title}</span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{opt.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CONTROLLER SPECIFIC REQUIREMENTS */}
              {isControllerRole(formData.role) && (
                <div className="bg-indigo-50/40 p-5 rounded-xl border border-indigo-200/70 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 border-b border-indigo-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                      Controller-Specific Requirements
                    </span>
                    <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      Art. 30(1) GDPR
                    </span>
                  </div>

                  {/* Purposes of Processing (Single Select) */}
                  <div>
                    <Select
                      label="Purposes of Processing *"
                      options={CONTROLLER_PURPOSES as any}
                      value={formData.purpose || ''}
                      onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="-- Select Primary Purpose of Processing --"
                      error={!formData.purpose ? 'Purpose selection is required for Controller' : undefined}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Select the primary business purpose defining why personal data is collected and processed.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Data Protection Contact"
                      placeholder="e.g., dpo@company.com or Legal/Privacy Office"
                      value={formData.dataProtectionContact || ''}
                      onChange={e => setFormData({ ...formData, dataProtectionContact: e.target.value })}
                    />

                    <TextField
                      label="Controller Contact Details"
                      multiline
                      rows={2}
                      placeholder="Official entity name, address, and legal contact details..."
                      value={formData.controllerContactDetails || ''}
                      onChange={e => setFormData({ ...formData, controllerContactDetails: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* PROCESSOR SPECIFIC REQUIREMENTS */}
              {isProcessorRole(formData.role) && (
                <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-200/70 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 border-b border-emerald-100 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      Processor-Specific Requirements
                    </span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Art. 30(2) GDPR
                    </span>
                  </div>

                  {/* Categories of Processing (Multi Select) */}
                  <div>
                    <MultiSelect
                      label="Categories of Processing *"
                      selectedValues={(formData.categoriesOfProcessing as string[]) || []}
                      onChange={vals => setFormData({ ...formData, categoriesOfProcessing: vals })}
                      presetOptions={PROCESSOR_CATEGORIES as any}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Select all categories of processing operations performed on behalf of your controllers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      label="Data Protection Contact"
                      placeholder="e.g., privacy-processor@company.com"
                      value={formData.dataProtectionContact || ''}
                      onChange={e => setFormData({ ...formData, dataProtectionContact: e.target.value })}
                    />

                    <TextField
                      label="Processor and Controller Details"
                      multiline
                      rows={2}
                      placeholder="List customer controllers, DPA reference numbers, or processing instructions..."
                      value={formData.processorAndControllerDetails || ''}
                      onChange={e => setFormData({ ...formData, processorAndControllerDetails: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEPS 3 TO 9: DETAILED SECTIONS PLACEHOLDERS & SUMMARY CARDS */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Step Header */}
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Step 3: Data Subjects & Data
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select target Data Subject categories and map individual personal data items from the centrally managed catalog to each group.
                </p>
              </div>

              {/* Data Subjects Category Selector */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Categories of Data Subjects *
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {(formData.dataSubjectCategories || []).length} Categories Selected
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DATA_SUBJECT_CATEGORIES.map(cat => {
                    const isSelected = (formData.dataSubjectCategories || []).includes(cat);
                    const itemCount = (formData.dataSubjectPersonalDataMap?.[cat] || []).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleDataSubjectCategory(cat)}
                        className={`p-4 rounded-xl border text-left transition flex items-start gap-3 ${
                          isSelected
                            ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-600/20 shadow-2xs'
                            : 'bg-white border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900">{cat}</span>
                            {isSelected && (
                              <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                {itemCount} Items
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {cat.includes('Customer')
                              ? 'End-user consumer accounts, prospects, leads, and clients'
                              : 'Internal workforce, staff candidates, contractors, and HR applicants'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Category Input Option */}
                <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={customDataSubjectInput}
                    onChange={e => setCustomDataSubjectInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomDataSubject();
                      }
                    }}
                    placeholder="Add custom Data Subject category (e.g., Job Applicants, Minors)..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDataSubject}
                    disabled={!customDataSubjectInput.trim()}
                    className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-xs font-semibold disabled:opacity-40 transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Group
                  </button>
                </div>
              </div>

              {/* High-Risk Personal Data Warning Badge */}
              {highRiskSelectedItems.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-950 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between gap-2 border-b border-rose-200/80 pb-2">
                    <div className="flex items-center gap-2 text-rose-700 font-extrabold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>High-risk personal data involved</span>
                    </div>
                    <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {highRiskSelectedItems.length} High-Risk {highRiskSelectedItems.length === 1 ? 'Category' : 'Categories'} Flagged
                    </span>
                  </div>

                  <p className="text-xs text-rose-800 leading-relaxed">
                    This processing activity involves high-risk or special category personal data under GDPR Art. 9, CCPA Sensitive Data, or PCI-DSS:
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {highRiskSelectedItems.map(item => (
                      <span
                        key={item.name}
                        className="inline-flex items-center gap-1 bg-rose-100 text-rose-950 border border-rose-300 text-[11px] font-bold px-2.5 py-1 rounded-md"
                      >
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        {item.name} ({item.classification})
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] text-rose-600 font-medium italic pt-1">
                    Note: High-risk detection flags compulsory regulatory review workflows, but does not block saving this processing activity.
                  </p>
                </div>
              )}

              {/* Dynamic Cards per Data Subject Category */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Data Subject Mappings ({formData.dataSubjectCategories?.length || 0})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {allSelectedPersonalDataCategories.length} total unique personal data categories selected
                  </span>
                </div>

                {(!formData.dataSubjectCategories || formData.dataSubjectCategories.length === 0) ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                    <User className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No Data Subject Category Selected</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Please select at least one Data Subject category above (e.g., Customers or Prospects) to map personal data categories.
                    </p>
                  </div>
                ) : (
                  formData.dataSubjectCategories.map(cat => (
                    <DataSubjectPersonalDataCard
                      key={cat}
                      subjectCategory={cat}
                      assignedDataItems={formData.dataSubjectPersonalDataMap?.[cat] || []}
                      onChangeDataItems={newItems => handleUpdateItemsForSubjectCategory(cat, newItems)}
                      onRemoveSubjectCategory={() => handleToggleDataSubjectCategory(cat)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  Step 4: Categories of Recipients & Data Disclosures
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select internal teams, external recipient categories, and link relevant third-party vendors.
                </p>
              </div>

              {/* Group 1: Trimble Internal */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Trimble Internal Recipients
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {
                      RECIPIENT_CATEGORIES_INTERNAL.filter(c =>
                        formData.recipientCategories?.includes(c)
                      ).length
                    } selected
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {RECIPIENT_CATEGORIES_INTERNAL.map(cat => {
                    const isChecked = formData.recipientCategories?.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(isChecked)}
                          onChange={() => handleToggleRecipientCategory(cat)}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="leading-tight">{cat}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Conditional Field for "Other Trimble Product Team" */}
                {formData.recipientCategories?.includes('Other Trimble Product Team') && (
                  <div className="pt-2 animate-in fade-in duration-150">
                    <TextField
                      label="Please specify the Trimble Product Team"
                      placeholder="e.g., Trimble Connect, Trimble Tekla, Trimble Quadri"
                      value={formData.specifiedTrimbleProductTeam || ''}
                      onChange={e =>
                        setFormData({ ...formData, specifiedTrimbleProductTeam: e.target.value })
                      }
                      required
                    />
                  </div>
                )}
              </div>

              {/* Group 2: External */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    External Recipients
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {
                      RECIPIENT_CATEGORIES_EXTERNAL.filter(c =>
                        formData.recipientCategories?.includes(c)
                      ).length
                    } selected
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {RECIPIENT_CATEGORIES_EXTERNAL.map(cat => {
                    const isChecked = formData.recipientCategories?.includes(cat);
                    return (
                      <label
                        key={cat}
                        className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(isChecked)}
                          onChange={() => handleToggleRecipientCategory(cat)}
                          className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="leading-tight">{cat}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Conditional Field for "Other Third Party" */}
                {formData.recipientCategories?.includes('Other Third Party') && (
                  <div className="pt-2 animate-in fade-in duration-150">
                    <TextField
                      label="Please specify the Third Party"
                      placeholder="e.g., External Legal Counsel, Statutory Tax Authorities"
                      value={formData.specifiedThirdParty || ''}
                      onChange={e =>
                        setFormData({ ...formData, specifiedThirdParty: e.target.value })
                      }
                      required
                    />
                  </div>
                )}

                {/* Conditional Vendor Inventory Linker for "Third Party Vendors" */}
                {formData.recipientCategories?.includes('Third Party Vendors') && (
                  <div className="pt-2 border-t border-slate-200 mt-3 animate-in fade-in duration-150 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Link Third Party Vendors (Inventory Selection)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Select from existing registered Vendor inventory records
                      </span>
                    </div>
                    <SearchableRelationshipSelector
                      label="Linked Vendors / Sub-Processors"
                      targetInventoryType="vendors"
                      availableItems={vendors}
                      selectedIds={formData.vendorIds || []}
                      onChange={ids => setFormData({ ...formData, vendorIds: ids })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  Step 5: International Transfers & Safeguards
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Document cross-border data transfer status, regions, destination countries, and transfer safeguards (Art. 44-49 GDPR).
                </p>
              </div>

              {/* Primary Question */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-900">
                  Are personal data transferred to third countries outside the origin jurisdiction?
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { value: 'No', label: 'No (Local/Domestic Only)' },
                    { value: 'Yes', label: 'Yes (International Transfers Apply)' },
                    { value: 'Unknown', label: 'Unknown (Under Assessment)' },
                  ].map(option => (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                        formData.hasInternationalTransfer === option.value
                          ? option.value === 'Yes'
                            ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-2xs'
                            : option.value === 'Unknown'
                            ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="hasInternationalTransfer"
                        value={option.value}
                        checked={formData.hasInternationalTransfer === option.value}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            hasInternationalTransfer: e.target.value as 'Yes' | 'No' | 'Unknown',
                          })
                        }
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Warning for "Unknown" status */}
              {formData.hasInternationalTransfer === 'Unknown' && (
                <RiskWarningBanner
                  title="Transfer Status Warning"
                  description="International transfer status requires review. Please investigate cross-border storage and sub-processor hosting locations before finalizing this record."
                  severity="warning"
                />
              )}

              {/* Configuration when "Yes" */}
              {formData.hasInternationalTransfer === 'Yes' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Regions Selection */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        1. Select Destination Regions
                      </h4>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {formData.selectedTransferRegions?.length || 0} regions selected
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {TRANSFER_REGIONS.map(region => {
                        const isChecked = formData.selectedTransferRegions?.includes(region);
                        return (
                          <label
                            key={region}
                            className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-medium'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(isChecked)}
                              onChange={() => handleToggleTransferRegion(region)}
                              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="leading-tight">{region}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Destination Country → Region → Safeguard Matrix */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          2. Destination Countries & Transfer Safeguards
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Specify each destination country and assign the applicable transfer mechanism (Adequacy, SCCs, or Other).
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                        {formData.internationalTransferDetails?.length || 0} country records
                      </span>
                    </div>

                    {/* Presets per selected region */}
                    {(formData.selectedTransferRegions?.length || 0) > 0 && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 block">
                          Quick Add Common Destination Countries by Selected Region:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {formData.selectedTransferRegions?.map(region => {
                            const presetCountries = REGION_PRESET_COUNTRIES[region] || [];
                            return presetCountries.map(country => {
                              const alreadyAdded = formData.internationalTransferDetails?.some(
                                d => d.country.toLowerCase() === country.toLowerCase()
                              );
                              return (
                                <button
                                  key={country}
                                  type="button"
                                  disabled={alreadyAdded}
                                  onClick={() => handleAddDestinationCountry(region, country)}
                                  className={`px-2.5 py-1 rounded text-xs transition flex items-center gap-1 ${
                                    alreadyAdded
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-900 shadow-2xs'
                                  }`}
                                >
                                  <span>+ {country}</span>
                                  <span className="text-[9px] text-slate-400 font-mono">({region.split(' ')[0]})</span>
                                </button>
                              );
                            });
                          })}
                        </div>
                      </div>
                    )}

                    {/* Destination Countries List */}
                    {(!formData.internationalTransferDetails || formData.internationalTransferDetails.length === 0) ? (
                      <div className="p-4 bg-amber-50/60 rounded-lg border border-dashed border-amber-300 text-center space-y-1">
                        <p className="text-xs font-bold text-amber-900">No Destination Countries Added Yet</p>
                        <p className="text-[11px] text-amber-700">
                          Select regions above to quick-add destination countries and assign transfer safeguards.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formData.internationalTransferDetails.map(item => (
                          <div
                            key={item.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{item.country}</span>
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded-md">
                                  {item.region}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <span>Hierarchy:</span>
                                <span className="font-semibold text-slate-700">{item.country}</span>
                                <span>→</span>
                                <span className="font-semibold text-indigo-700">{item.region}</span>
                                <span>→</span>
                                <span className="font-semibold text-emerald-700">{item.safeguard}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 grow max-w-md justify-end">
                              <select
                                value={item.safeguard}
                                onChange={e => handleUpdateCountrySafeguard(item.id, e.target.value as any, item.specifiedSafeguard)}
                                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {TRANSFER_SAFEGUARD_OPTIONS.map(opt => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>

                              {item.safeguard === 'Other' && (
                                <input
                                  type="text"
                                  placeholder="Specify safeguard..."
                                  value={item.specifiedSafeguard || ''}
                                  onChange={e => handleUpdateCountrySafeguard(item.id, 'Other', e.target.value)}
                                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 grow"
                                />
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveDestinationCountry(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                title="Remove country"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Transfer Safeguard Warning Banner */}
                    {transferWarning && (
                      <RiskWarningBanner
                        title={transferWarning.title}
                        description={transferWarning.description}
                        severity={transferWarning.severity}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: RETENTION & LEGAL BASIS */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Step 6: Data Retention Policy & Legal Basis for Processing
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define statutory data retention limits, policy descriptions, and GDPR Art. 6 legal basis for processing activities.
                </p>
              </div>

              {/* DATA RETENTION POLICY SECTION */}
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Data Retention Policy
                      <span className="text-rose-600 font-bold">*</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Select whether this processing activity operates under a custom retention schedule or has no defined retention policy.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Retention Policy Type <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          retentionPolicyType: 'Custom',
                          hasRetentionPolicy: true,
                          retentionPeriod: prev.retentionPeriod === 'None' ? '' : prev.retentionPeriod,
                        }))
                      }
                      className={`p-3.5 rounded-lg border text-left transition flex items-start gap-3 ${
                        (formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None')) === 'Custom'
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                          (formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None')) === 'Custom'
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {(formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None')) === 'Custom' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">Custom Retention Schedule</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Specific retention timeframe or deletion criteria documented.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          retentionPolicyType: 'None',
                          hasRetentionPolicy: false,
                          retentionPeriod: 'None',
                        }))
                      }
                      className={`p-3.5 rounded-lg border text-left transition flex items-start gap-3 ${
                        (formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None')) === 'None'
                          ? 'border-rose-400 bg-rose-50/70 ring-2 ring-rose-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center ${
                          (formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None')) === 'None'
                            ? 'border-rose-600 bg-rose-600'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {(formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None')) === 'None' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">None (No Defined Policy)</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          No retention schedule established; generates compliance risk warning.
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Custom Option: Required Text Field */}
                  {(formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None')) === 'Custom' && (
                    <div className="space-y-1.5 pt-2 animate-in fade-in duration-150">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Describe the retention period or retention policy <span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.retentionPeriod || ''}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            retentionPeriod: e.target.value,
                            hasRetentionPolicy: Boolean(e.target.value.trim()),
                          }))
                        }
                        placeholder="e.g., 7 years after termination of contract, Account lifetime + 30 days, or 12 months after collection"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      />
                      <p className="text-[11px] text-slate-500">
                        Supports entries such as "7 years after termination of contract", "Account lifetime + 30 days", or "12 months after collection".
                      </p>
                    </div>
                  )}

                  {/* None Option: Red Risk Indicator */}
                  {(formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None')) === 'None' && (
                    <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3 animate-in fade-in duration-150">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-xs block text-rose-950">
                          No defined data retention policy.
                        </span>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          This processing activity record can be saved as a draft, but operating without a retention policy violates data minimization rules (GDPR Art. 5(1)(e)). This warning will be highlighted in Review and Records Requiring Attention.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* LEGAL BASIS FOR PROCESSING SECTION */}
              <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      Legal Basis for Processing
                    </h4>
                    <p className="text-xs text-slate-500">
                      Identify the Article 6 GDPR legal basis governing this processing activity.
                    </p>
                  </div>
                </div>

                {isControllerRole(formData.role) ? (
                  <div className="space-y-4">
                    <Select
                      label="Art. 6 Legal Basis for Controller Processing"
                      options={CONTROLLER_LEGAL_BASIS_OPTIONS}
                      value={formData.legalBasis || ''}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          legalBasis: e.target.value as LegalBasis,
                        }))
                      }
                      required
                    />

                    {/* Conditional LIA Checkbox when Legitimate Interest is selected */}
                    {(formData.legalBasis === 'Legitimate Interest of the Controller' || formData.legalBasis === 'Legitimate Interest') && (
                      <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-300 space-y-3 animate-in fade-in duration-150">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(formData.liaFiled)}
                            onChange={e =>
                              setFormData(prev => ({
                                ...prev,
                                liaFiled: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500 mt-0.5"
                          />
                          <div>
                            <span className="font-bold text-xs text-amber-950 block">
                              A LIA has been filed for this processing activity.
                            </span>
                            <span className="text-[11px] text-amber-800 block mt-0.5">
                              Check this box if a Legitimate Interest Assessment (LIA) balancing test has been documented and approved by Privacy & Legal.
                            </span>
                          </div>
                        </label>

                        {!formData.liaFiled && (
                          <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-100/70 p-2.5 rounded border border-amber-300 font-medium">
                            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <span>
                              <strong>Warning:</strong> Legitimate Interest selected but LIA has not been confirmed. Draft saves are allowed, but LIA confirmation is required for final privacy approval.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Processor-only Informative Banner */
                  <div className="p-4 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-blue-950 block">
                        Controller Legal Basis Requirements Not Applicable to Processor Role
                      </span>
                      <p className="text-blue-800 text-[11px]">
                        As a Processor, legal basis for processing (GDPR Art. 6) is established and documented by the Controller entity. Processing activities performed by Trimble as a Processor are governed by the underlying Data Processing Agreement (DPA) and Controller instructions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-600" />
                  Step 7: Technical & Organisational Security Measures (TOMs)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify TSP registration status and select Art. 32 Technical & Organisational Security Measures (TOMs).
                </p>
              </div>

              <SecurityMeasuresSection
                tspStatus={formData.tspStatus || ''}
                tspJustification={formData.tspJustification || ''}
                toms={formData.toms || []}
                tomsOther={formData.tomsOther || ''}
                onTspStatusChange={status => setFormData(prev => ({ ...prev, tspStatus: status }))}
                onTspJustificationChange={justification => setFormData(prev => ({ ...prev, tspJustification: justification }))}
                onTomsChange={toms => setFormData(prev => ({ ...prev, toms }))}
                onTomsOtherChange={other => setFormData(prev => ({ ...prev, tomsOther: other }))}
              />
            </div>
          )}

          {currentStep === 8 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Step 8: Related Inventory Lineage Mapping
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link this Processing Activity to TSPs, Systems & Assets, Vendors, and Legal Entities.
                </p>
              </div>

              <div className="space-y-4">
                <SearchableRelationshipSelector
                  label="Linked TSP / Product References"
                  targetInventoryType="tspReferences"
                  availableItems={tspReferences}
                  selectedIds={formData.tspIds || []}
                  onChange={ids => setFormData({ ...formData, tspIds: ids })}
                />

                <SearchableRelationshipSelector
                  label="Data Sources (Originating Systems & Assets)"
                  targetInventoryType="assets"
                  availableItems={assets}
                  selectedIds={formData.dataSourceAssetIds || []}
                  onChange={ids => setFormData({ ...formData, dataSourceAssetIds: ids })}
                />

                <SearchableRelationshipSelector
                  label="Data Destinations (Receiving/Storage Systems & Assets)"
                  targetInventoryType="assets"
                  availableItems={assets}
                  selectedIds={formData.dataDestinationAssetIds || []}
                  onChange={ids => setFormData({ ...formData, dataDestinationAssetIds: ids })}
                />

                <SearchableRelationshipSelector
                  label="General Linked Systems & Assets"
                  targetInventoryType="assets"
                  availableItems={assets}
                  selectedIds={formData.assetIds || []}
                  onChange={ids => setFormData({ ...formData, assetIds: ids })}
                />

                <SearchableRelationshipSelector
                  label="Linked Vendors & Processors"
                  targetInventoryType="vendors"
                  availableItems={vendors}
                  selectedIds={formData.vendorIds || []}
                  onChange={ids => setFormData({ ...formData, vendorIds: ids })}
                />

                <SearchableRelationshipSelector
                  label="Linked Legal Entities"
                  targetInventoryType="entities"
                  availableItems={entities}
                  selectedIds={formData.entityIds || []}
                  onChange={ids => setFormData({ ...formData, entityIds: ids })}
                />
              </div>
            </div>
          )}

          {/* STEP 10: REVIEW */}
          {currentStep === 9 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Step 9: Record Audit & Submission Review
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review record validation status, address missing compliance parameters, and verify RoPA completeness.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Completeness</span>
                  <span className="text-base font-mono font-bold text-indigo-600">{percentage}%</span>
                </div>
              </div>

              {/* AUDIT SUMMARY STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    validationReport.errors.length > 0
                      ? 'bg-rose-50 border-rose-300 text-rose-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        validationReport.errors.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block uppercase tracking-wider text-[10px]">Blocking Errors</span>
                      <span className="text-lg font-bold font-mono">{validationReport.errors.length}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    validationReport.warnings.length > 0
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        validationReport.warnings.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block uppercase tracking-wider text-[10px]">Privacy Warnings</span>
                      <span className="text-lg font-bold font-mono">{validationReport.warnings.length}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border bg-blue-50 border-blue-200 text-blue-950 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block uppercase tracking-wider text-[10px]">Info Guidance</span>
                      <span className="text-lg font-bold font-mono">{validationReport.infos.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COMPLIANCE AUDIT ISSUES BREAKDOWN */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Record Validation Taxonomy & Audit Log
                  </h4>
                  <span className="text-[11px] font-medium text-slate-500">
                    {validationReport.errors.length + validationReport.warnings.length + validationReport.infos.length} Audit Item(s)
                  </span>
                </div>

                {validationReport.errors.length === 0 &&
                validationReport.warnings.length === 0 &&
                validationReport.infos.length === 0 ? (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 flex items-center gap-2.5 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-semibold">
                      All required fields are complete and validated! No errors or warnings identified.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Render ERRORS */}
                    {validationReport.errors.map(issue => (
                      <div
                        key={issue.id}
                        className="p-3 bg-rose-50/80 rounded-lg border border-rose-300 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-200 text-rose-950 uppercase">
                                ERROR
                              </span>
                              <span className="font-bold text-slate-900">{issue.message}</span>
                            </div>
                            {issue.description && (
                              <p className="text-slate-600 text-[11px] mt-0.5">{issue.description}</p>
                            )}
                            <span className="text-[10px] font-medium text-slate-400 block mt-1">
                              Step {issue.step}: {issue.stepName} {issue.field ? `• Field: ${issue.field}` : ''}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(issue.step)}
                          className="px-2.5 py-1 rounded bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 font-semibold text-[11px] transition shrink-0"
                        >
                          Fix in Step {issue.step} →
                        </button>
                      </div>
                    ))}

                    {/* Render WARNINGS */}
                    {validationReport.warnings.map(issue => (
                      <div
                        key={issue.id}
                        className="p-3 bg-amber-50/80 rounded-lg border border-amber-300 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-200 text-amber-950 uppercase">
                                WARNING
                              </span>
                              <span className="font-bold text-slate-900">{issue.message}</span>
                            </div>
                            {issue.description && (
                              <p className="text-slate-600 text-[11px] mt-0.5">{issue.description}</p>
                            )}
                            <span className="text-[10px] font-medium text-slate-400 block mt-1">
                              Step {issue.step}: {issue.stepName} {issue.field ? `• Field: ${issue.field}` : ''}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(issue.step)}
                          className="px-2.5 py-1 rounded bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-[11px] transition shrink-0"
                        >
                          Review Step {issue.step} →
                        </button>
                      </div>
                    ))}

                    {/* Render INFOS */}
                    {validationReport.infos.map(issue => (
                      <div
                        key={issue.id}
                        className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-200 text-blue-950 uppercase">
                                INFO
                              </span>
                              <span className="font-bold text-slate-900">{issue.message}</span>
                            </div>
                            {issue.description && (
                              <p className="text-slate-600 text-[11px] mt-0.5">{issue.description}</p>
                            )}
                            <span className="text-[10px] font-medium text-slate-400 block mt-1">
                              Step {issue.step}: {issue.stepName}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(issue.step)}
                          className="px-2.5 py-1 rounded bg-white border border-blue-200 text-blue-800 hover:bg-blue-100 font-semibold text-[11px] transition shrink-0"
                        >
                          View Step {issue.step} →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RECORD SECTIONS SUMMARY MATRIX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Overview & Role */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600 block">
                    1. Overview & Role
                  </span>
                  <div>
                    <span className="text-slate-500 font-medium">Name: </span>
                    <strong className="text-slate-900">{formData.name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Owner: </span>
                    <span className="text-slate-800">{formData.owner || 'Unassigned'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Role: </span>
                    <strong className="text-slate-900">{formData.role}</strong>
                  </div>
                </div>

                {/* 6. Retention & Legal Basis Summary */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600 block">
                    6. Retention & Legal Basis Summary
                  </span>
                  <div>
                    <span className="text-slate-500 font-medium">Retention Policy Type: </span>
                    <span className="font-semibold text-slate-900">
                      {formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Retention Period / Schedule: </span>
                    {(formData.retentionPolicyType ?? (formData.hasRetentionPolicy ? 'Custom' : 'None')) === 'None' ? (
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300 text-[11px] inline-block mt-0.5">
                        No defined data retention policy.
                      </span>
                    ) : (
                      <span className="text-slate-800 font-medium">{formData.retentionPeriod || 'None'}</span>
                    )}
                  </div>
                  {isControllerRole(formData.role) ? (
                    <>
                      <div>
                        <span className="text-slate-500 font-medium">Art. 6 Legal Basis: </span>
                        <strong className="text-slate-900">{formData.legalBasis || 'Unassigned'}</strong>
                      </div>
                      {(formData.legalBasis === 'Legitimate Interest of the Controller' || formData.legalBasis === 'Legitimate Interest') && (
                        <div>
                          <span className="text-slate-500 font-medium">LIA Confirmation: </span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              formData.liaFiled ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {formData.liaFiled
                              ? 'LIA Filed & Confirmed'
                              : 'Legitimate Interest selected but LIA has not been confirmed'}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <span className="text-slate-500 font-medium">Legal Basis: </span>
                      <span className="text-slate-500 italic">Established by Controller (Processor Record)</span>
                    </div>
                  )}
                </div>

                {/* 7. Technical & Organisational Security Measures (TOMs) & TSP Summary */}
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-indigo-600 block">
                    7. Security Measures & TSP Registration Summary
                  </span>
                  <div>
                    <span className="text-slate-500 font-medium">TSP Registration Status: </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 ${
                        formData.tspStatus === 'Yes'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : formData.tspStatus === 'Pending'
                          ? 'bg-amber-100 text-amber-950 border border-amber-300'
                          : formData.tspStatus === 'N/A'
                          ? 'bg-purple-100 text-purple-950 border border-purple-300'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {formData.tspStatus === 'Pending' && <Clock className="w-3 h-3 text-amber-800 shrink-0" />}
                      {formData.tspStatus || 'Unassigned'}
                    </span>
                  </div>
                  {formData.tspStatus === 'N/A' && (
                    <div>
                      <span className="text-slate-500 font-medium">TSP Justification: </span>
                      <span className="text-slate-800 italic block mt-0.5">
                        {formData.tspJustification || 'No justification provided'}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 font-medium">Documented TOMs ({formData.toms?.length || 0}): </span>
                    {formData.toms && formData.toms.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {formData.toms.map(tom => (
                          <span key={tom} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 border border-indigo-200 text-[10px] font-semibold">
                            {tom}
                            {tom === 'Other' && formData.tomsOther && ` (${formData.tomsOther})`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-amber-700 font-semibold block mt-0.5">No TOMs selected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* STEP FOOTER CONTROLS */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              Save Draft
            </button>

            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 9 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(9, prev + 1))}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
              >
                Next Section
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleFinalSubmit}
                className="px-5 py-2 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" />
                {isEdit ? 'Update Record' : 'Save & Publish Record'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ROLE SWITCH WARNING MODAL */}
      {pendingRoleSwitch && (
        <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Role Change Warning</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Switching role from <strong>{formData.role}</strong> to <strong>{pendingRoleSwitch}</strong> will reset role-specific field entries (e.g. Purposes of Processing or Categories of Processing).
            </p>
            <p className="text-xs text-slate-500">
              Compatible shared information (record name, description, owner, DPO contact, and relationships) will be preserved.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingRoleSwitch(null)}
                className="px-3.5 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel Role Switch
              </button>
              <button
                type="button"
                onClick={() => applyRoleChange(pendingRoleSwitch)}
                className="px-4 py-2 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-sm"
              >
                Confirm Role Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DATA SUBJECT REMOVAL WARNING MODAL */}
      {pendingDataSubjectRemoval && (
        <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Remove Data Subject Category?</h4>
                <p className="text-xs text-amber-700 font-semibold mt-0.5">
                  Category: {pendingDataSubjectRemoval.category}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">
                ⚠️ Personal Data Categories are already assigned to this Data Subject!
              </p>
              <p className="text-amber-800 leading-relaxed">
                Unchecking <strong>"{pendingDataSubjectRemoval.category}"</strong> will delete the{' '}
                <strong>{pendingDataSubjectRemoval.itemCount} personal data category(ies)</strong> currently mapped to it.
              </p>
            </div>

            <p className="text-xs text-slate-500">
              Are you sure you want to remove this Data Subject group and clear its mapped data?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPendingDataSubjectRemoval(null)}
                className="px-3.5 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel (Keep Category)
              </button>
              <button
                type="button"
                onClick={() => executeRemoveDataSubjectCategory(pendingDataSubjectRemoval.category)}
                className="px-4 py-2 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm & Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
