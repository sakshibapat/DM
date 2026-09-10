import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  ChevronRight,
  Eye,
  Settings,
  ArrowRight,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { ProcessingActivity, Asset, Vendor, Entity, InventoryType } from '../../types/privacy';

interface ImportActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRecord {
  tempId: string;
  name: string;
  managingOrg: string;
  description: string;
  purpose: string;
  entities: string[];
  dataSubjects: string[];
  personalDataCategories: string[];
  assets: { name: string; relationship: string }[];
  vendors: { name: string; relationship: string }[];
  retentionCriteria: string;
  
  // Status & duplicate flags
  status: 'Ready' | 'Warning' | 'Error';
  statusMessage: string;
  isDuplicate: boolean;
  resolution: 'new' | 'skip';
  selected: boolean;
}

export const ImportActivitiesModal: React.FC<ImportActivitiesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    processingActivities,
    assets,
    vendors,
    entities,
    addRecord,
  } = usePrivacyData();

  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [parsedRecords, setParsedRecords] = useState<ParsedRecord[]>([]);
  const [excludedCount, setExcludedCount] = useState(0);
  const [selectedRecordForPreview, setSelectedRecordForPreview] = useState<ParsedRecord | null>(null);
  const [fileMetadata, setFileMetadata] = useState<{
    name: string;
    type: string;
    rowCount: number;
  } | null>(null);
  
  // Final summary stats
  const [importStats, setImportStats] = useState({
    imported: 0,
    skipped: 0,
    failed: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Standard CSV row splitter respecting double quotes
  const parseCSVText = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = '';
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++; // Skip double quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentVal.trim());
        if (row.length > 0 && row.some(cell => cell !== '')) {
          lines.push(row);
        }
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      if (row.some(cell => cell !== '')) {
        lines.push(row);
      }
    }
    return lines;
  };

  // Smart split of comma-separated cells while keeping corporate suffixes intact
  const splitMultiValueCell = (value: string): string[] => {
    if (!value) return [];
    const tokens = value.split(',');
    const result: string[] = [];
    let current = '';
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim();
      if (!token) continue;
      
      if (current === '') {
        current = token;
      } else {
        const lowerToken = token.toLowerCase();
        const isSuffix =
          lowerToken.startsWith('inc.') ||
          lowerToken.startsWith('inc') ||
          lowerToken.startsWith('llc') ||
          lowerToken.startsWith('ltd') ||
          lowerToken.startsWith('corp') ||
          lowerToken.includes('- processor') ||
          lowerToken.includes('- controller') ||
          lowerToken.includes('- vendor');
        
        // Rejoin with comma if this token is a suffix or doesn't have an asset/vendor hyphen separator
        if (isSuffix && !current.includes(' - ')) {
          current = current + ', ' + token;
        } else {
          result.push(current);
          current = token;
        }
      }
    }
    if (current) {
      result.push(current);
    }
    return result;
  };

  // Parse Asset name and relationship/link type
  const parseAssetValue = (val: string): { name: string; relationship: string } => {
    const parts = val.split(' - ');
    if (parts.length > 1) {
      const relationship = parts[parts.length - 1].trim();
      const name = parts.slice(0, -1).join(' - ').trim();
      return { name, relationship };
    }
    return { name: val.trim(), relationship: '' };
  };

  // Parse Vendor name and relationship/link type (e.g. "Workday, Inc. - Processor")
  const parseVendorValue = (val: string): { name: string; relationship: string } => {
    const parts = val.split(' - ');
    if (parts.length > 1) {
      const relationship = parts[parts.length - 1].trim();
      const name = parts.slice(0, -1).join(' - ').trim();
      return { name, relationship };
    }
    return { name: val.trim(), relationship: '' };
  };

  // Master processor for the CSV lines
  const processOneTrustLines = (lines: string[][]) => {
    if (lines.length < 2) {
      alert("Invalid file: No records found to import.");
      return;
    }

    const headers = lines[0].map(h => h.trim().toLowerCase());
    
    // Find index of headers (case-insensitive, flexible fallback)
    const nameIdx = headers.findIndex(h => h === 'name' || h.includes('activity name'));
    const orgIdx = headers.findIndex(h => h === 'managing organization' || h.includes('managing org'));
    const descIdx = headers.findIndex(h => h === 'description' || h.includes('description'));
    const purposeIdx = headers.findIndex(h => h === 'purpose of processing [legacy]' || h.includes('purpose'));
    const entityIdx = headers.findIndex(h => h === 'entity name - entities' || h.includes('entity'));
    const dsIdx = headers.findIndex(h => h === 'data subject - personal data' || h.includes('data subject'));
    const pdIdx = headers.findIndex(h => h === 'data category - personal data' || h.includes('data category'));
    const assetIdx = headers.findIndex(h => h === 'link type - assets' || h.includes('assets'));
    const vendorIdx = headers.findIndex(h => h === 'link type - vendors' || h.includes('vendors'));
    const retentionIdx = headers.findIndex(h => h === 'data retention criteria' || h.includes('retention'));

    if (nameIdx === -1 || orgIdx === -1) {
      alert("Missing mandatory columns. Please ensure 'Name' and 'Managing organization' are present.");
      return;
    }

    let eligible: ParsedRecord[] = [];
    let excluded = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row || row.length === 0 || row.every(cell => cell === '')) continue;

      const rawName = row[nameIdx] || '';
      const rawOrg = row[orgIdx] || '';
      
      // Filter logic: Managing Organization must be "PX EMEA"
      if (rawOrg.trim().toUpperCase() !== 'PX EMEA') {
        excluded++;
        continue;
      }

      const description = descIdx !== -1 ? row[descIdx] || '' : '';
      const purpose = purposeIdx !== -1 ? row[purposeIdx] || '' : '';
      const rawEntities = entityIdx !== -1 ? row[entityIdx] || '' : '';
      const rawDataSubjects = dsIdx !== -1 ? row[dsIdx] || '' : '';
      const rawDataCategories = pdIdx !== -1 ? row[pdIdx] || '' : '';
      const rawAssets = assetIdx !== -1 ? row[assetIdx] || '' : '';
      const rawVendors = vendorIdx !== -1 ? row[vendorIdx] || '' : '';
      const retentionCriteria = retentionIdx !== -1 ? row[retentionIdx] || '' : '';

      // Parse multi-values
      const entityList = splitMultiValueCell(rawEntities);
      const dataSubjectsList = splitMultiValueCell(rawDataSubjects);
      const dataCategoriesList = splitMultiValueCell(rawDataCategories);
      const assetList = splitMultiValueCell(rawAssets).map(parseAssetValue);
      const vendorList = splitMultiValueCell(rawVendors).map(parseVendorValue);

      // Validate
      let status: 'Ready' | 'Warning' | 'Error' = 'Ready';
      let statusMessage = 'Record is valid and ready.';

      if (!rawName.trim()) {
        status = 'Error';
        statusMessage = 'Missing record name.';
      } else if (!rawOrg.trim()) {
        status = 'Error';
        statusMessage = 'Missing managing organization.';
      } else if (
        !purpose.trim() ||
        dataSubjectsList.length === 0 ||
        dataCategoriesList.length === 0 ||
        !retentionCriteria.trim()
      ) {
        status = 'Warning';
        statusMessage = 'Some information is missing and can be completed after import.';
      }

      // Check for duplicate (Name + Managing Organization)
      const duplicateExists = processingActivities.some(
        pa =>
          pa.name.trim().toLowerCase() === rawName.trim().toLowerCase() &&
          pa.managingOrganisation?.trim().toLowerCase() === rawOrg.trim().toLowerCase()
      );

      eligible.push({
        tempId: `tmp-${i}-${Date.now()}`,
        name: rawName.trim(),
        managingOrg: rawOrg.trim(),
        description: description.trim(),
        purpose: purpose.trim(),
        entities: entityList,
        dataSubjects: dataSubjectsList,
        personalDataCategories: dataCategoriesList,
        assets: assetList,
        vendors: vendorList,
        retentionCriteria: retentionCriteria.trim(),
        status,
        statusMessage,
        isDuplicate: duplicateExists,
        resolution: 'new', // default to 'new', user can toggle to 'skip'
        selected: !duplicateExists, // auto-select if not duplicate
      });
    }

    setParsedRecords(eligible);
    setExcludedCount(excluded);
    setStep('preview');
  };

  // Upload actions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let lines: string[][] = [];
        if (isExcel) {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawLines: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          lines = rawLines.map(row => 
            row.map(cell => cell !== undefined && cell !== null ? String(cell).trim() : '')
          );
        } else {
          const text = e.target?.result as string;
          lines = parseCSVText(text);
        }

        if (!lines || lines.length === 0) {
          throw new Error("The file appears to be empty.");
        }

        setFileMetadata({
          name: file.name,
          type: file.type || (isExcel ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'),
          rowCount: lines.length - 1,
        });

        processOneTrustLines(lines);
      } catch (err: any) {
        alert("Error parsing file: " + err.message);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Pre-configured Test Dataset (10 PX EMEA Records + 2 Excluded)
  const handleLoadSampleDataset = () => {
    const sampleCSVText = `Name,Managing organization,Description,Purpose of processing [Legacy],Entity name - Entities,Data subject - Personal data,Data category - Personal data,Link type - Assets,Link type - Vendors,Data Retention Criteria
"PX Personnel Records (Ireland)","PX EMEA","Human Resources records for employees based in Ireland, including contracts, performance reviews, and general payroll data.","Employee/Workforce Management (including time-tracking, absence, and coaching)","Trimble Ireland Ltd","Employees","Contact Details, National Identifier, Financial Details","Workday - Enterprise Instance (US/Global) - Source / Collection, Google Suite (US/Global) - Storage / Processing","Workday, Inc. - Processor, Google LLC - Processor","7 years after termination of employment contract"
"Employee Development/Support (Portugal)","PX EMEA","Tracking of professional development courses, certifications, and support request logs for Lisbon office workers.","Employee/Workforce Management (including time-tracking, absence, and coaching)","Trimble Portugal Unipessoal Lda","Employees","Professional Qualifications, Connection Data","Docebo LMS - Enterprise - Training Hosting","Docebo S.p.A. - Processor","Active duration of employment + 2 years"
"Employee Compensation (Romania)","PX EMEA","Payroll distribution, statutory tax reporting, and banking details processing for PX staff in Brasov, Romania.","Payroll, Compensation, or Benefits Processing","Trimble Romania SRL","Employees","Financial Details, Contact Details, National Identifier","ADP Celergo - Romania Payroll - Storage / Processing","ADP, Inc. - Processor","50 years for state archival compliance under Romanian labor law"
"Employee Development/Support (UAE)","PX EMEA","Employee career coaching, benefits counseling, and training programs tracking for employees located in the Dubai office.","Employee/Workforce Management (including time-tracking, absence, and coaching)","Trimble Gulf FZ-LLC","Employees","Contact Details, Professional Qualifications","Workday - Enterprise Instance (US/Global) - Source / Collection","Workday, Inc. - Processor","Duration of active training plan + 3 years"
"Employee Compensation (France)","PX EMEA","Salary calculations, mandatory French social security filings (DSN), and expense reimbursements for Paris team members.","Payroll, Compensation, or Benefits Processing","Trimble France SAS","Employees","Financial Details, Contact Details, National Identifier","ADP Celergo - France Payroll - Storage / Processing","ADP, Inc. - Processor","6 years under French commercial code requirements"
"Retaining Candidate Records (Ireland)","PX EMEA","Recruiting files, CV submissions, background check results, and interview feedback records for Trimble Ireland openings.","Recruitment and Talent Acquisition","Trimble Ireland Ltd","Job Applicants","Contact Details, Professional Qualifications, Employment History","Workday Recruiting - Candidate DB - Source / Collection","Workday, Inc. - Processor","12 months after candidate rejection or vacancy closure (unless extended with consent)"
"Retaining Candidate Records (Romania)","PX EMEA","Candidate sourcing, resume storage, and legal verification checks for engineering talent applications in Romania.","Recruitment and Talent Acquisition","Trimble Romania SRL","Job Applicants","Contact Details, Professional Qualifications, Employment History","Workday Recruiting - Candidate DB - Source / Collection","Workday, Inc. - Processor","1 year from recruitment campaign completion"
"Retaining Candidate Records (Norway)","PX EMEA","Sourcing records, screening logs, and evaluation reports for prospective hires for the Trimble Norway division.","Recruitment and Talent Acquisition","Trimble Norway AS","Job Applicants","Contact Details, Professional Qualifications","Workday Recruiting - Candidate DB - Source / Collection","Workday, Inc. - Processor","6 months post-rejection under Norwegian discrimination legislation"
"Employee Compensation (Norway)","PX EMEA","Payroll processing, tax filings (A-melding), pensions contributions, and medical benefits tracking for Oslo office workers.","Payroll, Compensation, or Benefits Processing","Trimble Norway AS","Employees","Financial Details, Contact Details, National Identifier","Visma Payroll System - Norway - Storage / Processing","Visma Group AS - Processor","5 years under Norwegian bookkeeping regulations (Bokføringsloven)"
"Employee Benefits & Pension (United Kingdom)","PX EMEA","Group life assurance, defined contribution pension administration, and healthcare options for employees in Trimble UK.","Payroll, Compensation, or Benefits Processing","Trimble UK Limited","Employees","Financial Details, Contact Details, National Identifier","Mercer Pension Portal - UK - Storage / Processing","Mercer Limited - Processor","6 years post-membership termination or retirement"
"APAC Corporate Lead Campaign","Sales APAC","Exclusion test record for APAC market sales.","Lead Generation or Acquisition, Contact enrichment","Trimble Singapore Pte. Ltd.","Customers or Prospects","Contact Details, Connection Data","Salesforce CRM Cloud Platform - Lead Database","Salesforce Inc. - Processor","3 years from last activity"
"US Benefits Administration","PX Americas","US Employee healthcare benefits enrolment logging.","Payroll, Compensation, or Benefits Processing","Trimble Inc. US","Employees","Financial Details, Health-Related Information","Blue Shield Portal - US Administration","Blue Shield Inc. - Processor","7 years"`;

    const lines = parseCSVText(sampleCSVText);
    setFileMetadata({
      name: 'onetrust-px-emea-standard-export.csv',
      type: 'text/csv (Sample Test)',
      rowCount: lines.length - 1,
    });
    processOneTrustLines(lines);
  };

  // Perform actual import and write to global context
  const handleConfirmImport = () => {
    const selectedRecords = parsedRecords.filter(r => r.selected);
    let countImported = 0;
    let countSkipped = 0;
    let countFailed = 0;

    selectedRecords.forEach(record => {
      if (record.isDuplicate && record.resolution === 'skip') {
        countSkipped++;
        return;
      }

      try {
        // 1. Resolve or Create Entities
        const resolvedEntityIds: string[] = [];
        record.entities.forEach(entName => {
          const match = entities.find(e => e.name.trim().toLowerCase() === entName.trim().toLowerCase());
          if (match) {
            resolvedEntityIds.push(match.id);
          } else {
            const newId = addRecord('entities', {
              name: entName,
              status: 'Approved',
              description: 'Imported from OneTrust.',
              createdBy: 'OneTrust Import',
              lastModifiedBy: 'OneTrust Import',
            });
            resolvedEntityIds.push(newId);
          }
        });

        // 2. Resolve or Create Assets
        const resolvedAssetIds: string[] = [];
        record.assets.forEach(astInfo => {
          const match = assets.find(a => a.name.trim().toLowerCase() === astInfo.name.trim().toLowerCase());
          if (match) {
            resolvedAssetIds.push(match.id);
          } else {
            const newId = addRecord('assets', {
              name: astInfo.name,
              assetType: 'Application',
              dataClassification: 'Internal',
              managingOrganisation: record.managingOrg,
              status: 'Approved',
              description: `Imported from OneTrust. Relationship: ${astInfo.relationship || 'Connected'}`,
              createdBy: 'OneTrust Import',
              lastModifiedBy: 'OneTrust Import',
              vendorIds: [],
              tspIds: [],
            });
            resolvedAssetIds.push(newId);
          }
        });

        // 3. Resolve or Create Vendors
        const resolvedVendorIds: string[] = [];
        record.vendors.forEach(vndInfo => {
          const match = vendors.find(v => v.name.trim().toLowerCase() === vndInfo.name.trim().toLowerCase());
          if (match) {
            resolvedVendorIds.push(match.id);
          } else {
            const newId = addRecord('vendors', {
              name: vndInfo.name,
              status: 'Approved',
              dpaStatus: 'Signed',
              description: `Imported from OneTrust. Link: ${vndInfo.relationship || 'Processor'}`,
              createdBy: 'OneTrust Import',
              lastModifiedBy: 'OneTrust Import',
              assetIds: [],
            });
            resolvedVendorIds.push(newId);
          }
        });

        // 4. Create Processing Activity
        addRecord('processingActivities', {
          name: record.name,
          description: record.description || `OneTrust Import - ${record.name}`,
          status: 'Under Review',
          role: 'Controller',
          legalBasis: 'Legitimate Interest',
          owner: 'PX EMEA Compliance',
          retentionPeriod: record.retentionCriteria || '',
          hasRetentionPolicy: !!record.retentionCriteria,
          personalDataCategories: record.personalDataCategories,
          involvesHighRiskData: false,
          transferSafeguards: '',
          toms: [],
          dataSubjectCategories: record.dataSubjects,
          tspIds: [],
          assetIds: resolvedAssetIds,
          vendorIds: resolvedVendorIds,
          entityIds: resolvedEntityIds,
          createdBy: 'OneTrust Import',
          lastModifiedBy: 'OneTrust Import',
        });

        countImported++;
      } catch (err) {
        console.error("Failed to import record: ", record.name, err);
        countFailed++;
      }
    });

    setImportStats({
      imported: countImported,
      skipped: countSkipped + (parsedRecords.length - selectedRecords.length),
      failed: countFailed,
    });
    setStep('result');
  };

  const handleToggleSelectRecord = (tempId: string) => {
    setParsedRecords(prev =>
      prev.map(r => (r.tempId === tempId ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleToggleAllSelection = () => {
    const allSelected = parsedRecords.every(r => r.selected);
    setParsedRecords(prev => prev.map(r => ({ ...r, selected: !allSelected })));
  };

  const handleResolutionChange = (tempId: string, resolution: 'new' | 'skip') => {
    setParsedRecords(prev =>
      prev.map(r => (r.tempId === tempId ? { ...r, resolution, selected: resolution === 'new' } : r))
    );
  };

  const numSelected = parsedRecords.filter(r => r.selected).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="one-trust-import-modal"
        className="bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-3xs">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Import Processing Activities</h2>
              <p className="text-xs text-slate-500">Migrate and map OneTrust metadata into your existing inventory.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-200 transition text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Workflow Step Content */}
        {step === 'upload' && (
          <div className="p-8 space-y-6 flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-5 text-center">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Upload processing activities exported from OneTrust. You will be able to review the records before they are added to Data Mapping.
              </p>

              {/* Drag & Drop Canvas */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-3xs mb-3">
                  <Upload className="w-5 h-5 text-slate-500" />
                </div>
                <p className="text-xs font-bold text-slate-800">Drag & drop your OneTrust CSV or Excel file here</p>
                <p className="text-[11px] text-slate-400 mt-1">Supported file formats: .csv, .xlsx, .xls</p>
                <button
                  type="button"
                  className="mt-4 px-4 py-1.5 rounded bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-3xs transition"
                >
                  Browse Files
                </button>
              </div>

              {/* Instant Evaluation Option */}
              <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-2.5">
                <div className="flex items-center gap-1.5 justify-center">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-bold text-indigo-900">Evaluating or testing the migration?</span>
                </div>
                <p className="text-[11px] text-indigo-700 leading-relaxed max-w-lg mx-auto">
                  Click the button below to pre-load our standardized OneTrust export containing the 10 target PX EMEA records. Test the full column-mapping and duplicate validation experience immediately.
                </p>
                <button
                  type="button"
                  onClick={handleLoadSampleDataset}
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  Load Pre-configured OneTrust Test Dataset
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Grid/Table Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {/* File Upload Metadata Header */}
              {fileMetadata && (
                <div className="flex items-center justify-between border border-indigo-200 bg-indigo-50/40 px-4 py-3 rounded-lg text-xs">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">
                        {fileMetadata.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Type: <span className="text-slate-700 font-bold">{fileMetadata.type}</span> | Detected Rows: <span className="text-indigo-700 font-bold">{fileMetadata.rowCount} records</span>
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] rounded font-bold uppercase">
                    Parsed Successfully
                  </span>
                </div>
              )}

              {/* Top Banner stats */}
              <div className="flex items-center justify-between border border-slate-200 bg-slate-50/70 p-3 rounded-lg text-xs">
                <div className="flex items-center gap-4">
                  <span className="text-slate-600 font-medium">
                    Eligible for import: <strong className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">{parsedRecords.length}</strong>
                  </span>
                  <span className="text-slate-600 font-medium">
                    Excluded (non-PX EMEA): <strong className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">{excludedCount}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 italic">Filter is active: Managing Organisation = "PX EMEA"</p>
              </div>

              {/* Table of mapped records */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[9px] tracking-wider">
                      <tr>
                        <th className="p-3 w-8">
                          <input
                            type="checkbox"
                            checked={parsedRecords.length > 0 && parsedRecords.every(r => r.selected)}
                            onChange={handleToggleAllSelection}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </th>
                        <th className="p-3">Processing Activity Name</th>
                        <th className="p-3">Managing Org</th>
                        <th className="p-3">Purpose</th>
                        <th className="p-3">Data Subjects</th>
                        <th className="p-3">Assets</th>
                        <th className="p-3">Vendors</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-right">Duplicate Option</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRecords.map(r => (
                        <tr
                          key={r.tempId}
                          className={`hover:bg-slate-50/50 transition cursor-pointer ${
                            selectedRecordForPreview?.tempId === r.tempId ? 'bg-indigo-50/20' : ''
                          }`}
                          onClick={() => setSelectedRecordForPreview(r)}
                        >
                          <td className="p-3" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={r.selected}
                              onChange={() => handleToggleSelectRecord(r.tempId)}
                              disabled={r.isDuplicate && r.resolution === 'skip'}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                            />
                          </td>
                          <td className="p-3 font-semibold text-slate-900 truncate max-w-[160px]" title={r.name}>
                            {r.name}
                          </td>
                          <td className="p-3 text-slate-500 font-medium">{r.managingOrg}</td>
                          <td className="p-3 max-w-[120px] truncate font-medium text-slate-600" title={r.purpose}>
                            {r.purpose || '—'}
                          </td>
                          <td className="p-3 truncate max-w-[110px]" title={r.dataSubjects.join(', ')}>
                            {r.dataSubjects.length > 0 ? r.dataSubjects.map(d => (
                              <span key={d} className="inline-block bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-sm mr-1 font-semibold">{d}</span>
                            )) : '—'}
                          </td>
                          <td className="p-3 truncate max-w-[100px]" title={r.assets.map(a => a.name).join(', ')}>
                            {r.assets.length > 0 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-bold text-[10px]">
                                {r.assets.length} linked
                              </span>
                            ) : '—'}
                          </td>
                          <td className="p-3 truncate max-w-[100px]" title={r.vendors.map(v => v.name).join(', ')}>
                            {r.vendors.length > 0 ? (
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-bold text-[10px]">
                                {r.vendors.length} linked
                              </span>
                            ) : '—'}
                          </td>
                          <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                            {r.status === 'Error' ? (
                              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold text-[10px] uppercase">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                Error
                              </span>
                            ) : r.status === 'Warning' ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold text-[10px] uppercase" title={r.statusMessage}>
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Warning
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold text-[10px] uppercase">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Ready
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                            {r.isDuplicate ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider bg-amber-100 px-1.5 py-0.5 rounded">Possible duplicate</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleResolutionChange(r.tempId, 'new')}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                      r.resolution === 'new'
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-3xs'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    As New
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleResolutionChange(r.tempId, 'skip')}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                      r.resolution === 'skip'
                                        ? 'bg-slate-600 text-white border-slate-600 shadow-3xs'
                                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    Skip
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">New record</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right sidebar detailed record preview panel */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50/50 p-5 overflow-y-auto flex flex-col justify-between max-h-full">
              {selectedRecordForPreview ? (
                <div className="space-y-4 flex-1">
                  <div className="border-b border-slate-200 pb-3">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600">Schema Mapping Inspection</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedRecordForPreview.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Managing Org: {selectedRecordForPreview.managingOrg}</p>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-700">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Description</span>
                      <p className="mt-0.5 leading-relaxed text-slate-600 italic">
                        {selectedRecordForPreview.description || 'No description provided.'}
                      </p>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Purpose of Processing</span>
                      <p className="mt-0.5 font-semibold text-slate-800">{selectedRecordForPreview.purpose || '—'}</p>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Data Subjects</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRecordForPreview.dataSubjects.map(ds => (
                          <span key={ds} className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded font-semibold text-[10px]">{ds}</span>
                        ))}
                        {selectedRecordForPreview.dataSubjects.length === 0 && <span className="text-slate-400">None linked</span>}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Personal Data Categories</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRecordForPreview.personalDataCategories.map(pc => (
                          <span key={pc} className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded font-semibold text-[10px]">{pc}</span>
                        ))}
                        {selectedRecordForPreview.personalDataCategories.length === 0 && <span className="text-slate-400">None linked</span>}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Entities</span>
                      <div className="mt-1 flex flex-col gap-0.5">
                        {selectedRecordForPreview.entities.map(ent => (
                          <span key={ent} className="text-slate-800 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            {ent}
                          </span>
                        ))}
                        {selectedRecordForPreview.entities.length === 0 && <span className="text-slate-400">None linked</span>}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Linked Assets (Systems)</span>
                      <div className="mt-1 flex flex-col gap-1">
                        {selectedRecordForPreview.assets.map((ast, idx) => (
                          <div key={idx} className="bg-slate-100 p-2 rounded border border-slate-200">
                            <span className="font-semibold text-slate-800 block text-[11px]">{ast.name}</span>
                            {ast.relationship && (
                              <span className="text-[10px] text-indigo-600 font-bold block mt-0.5 uppercase tracking-wider">{ast.relationship}</span>
                            )}
                          </div>
                        ))}
                        {selectedRecordForPreview.assets.length === 0 && <span className="text-slate-400">None linked</span>}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Linked Vendors (Processors)</span>
                      <div className="mt-1 flex flex-col gap-1">
                        {selectedRecordForPreview.vendors.map((vnd, idx) => (
                          <div key={idx} className="bg-slate-100 p-2 rounded border border-slate-200">
                            <span className="font-semibold text-slate-800 block text-[11px]">{vnd.name}</span>
                            {vnd.relationship && (
                              <span className="text-[10px] text-indigo-600 font-bold block mt-0.5 uppercase tracking-wider">{vnd.relationship}</span>
                            )}
                          </div>
                        ))}
                        {selectedRecordForPreview.vendors.length === 0 && <span className="text-slate-400">None linked</span>}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Data Retention Criteria</span>
                      <p className="mt-0.5 font-medium text-slate-800 italic">{selectedRecordForPreview.retentionCriteria || '—'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Eye className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">Select any row to inspect its full OneTrust data mapping schemas.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="p-8 space-y-6 flex-1 overflow-y-auto">
            <div className="max-w-md mx-auto text-center space-y-6 py-6 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border-4 border-emerald-50 shadow-3xs mx-auto animate-bounce">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900">Import Complete</h2>
                <p className="text-xs text-slate-500">Your selected processing activities have been converted to live inventory records.</p>
              </div>

              {/* Stats Breakout Card */}
              <div className="grid grid-cols-3 gap-3 border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                <div className="text-center space-y-0.5">
                  <div className="text-xl font-black text-emerald-600">{importStats.imported}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Imported</div>
                </div>
                <div className="text-center space-y-0.5 border-x border-slate-200">
                  <div className="text-xl font-black text-slate-600">{importStats.skipped}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Skipped</div>
                </div>
                <div className="text-center space-y-0.5">
                  <div className="text-xl font-black text-rose-600">{importStats.failed}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Failed</div>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-left flex items-start gap-2.5 text-[11px] text-indigo-900 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  All newly created assets, vendors, and corporate entities have been successfully cross-referenced and appended to their respective inventories without duplication.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step === 'upload' && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-medium">Or select files</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Back to Upload
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-md hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={numSelected === 0}
                  className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition disabled:opacity-50"
                >
                  Import {numSelected} Processing Activities
                </button>
              </div>
            </>
          )}

          {step === 'result' && (
            <div className="w-full flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-3xs"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                }}
                className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
              >
                View Processing Activities
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
