import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Network,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  FileText,
  Cpu,
  Server,
  Building2,
  Globe2,
  Building,
  Save,
  ArrowUpDown,
  X,
  Clock,
  Shield,
  Layers,
  Upload,
} from 'lucide-react';
import { usePrivacyData } from '../../context/PrivacyDataContext';
import { ImportActivitiesModal } from './ImportActivitiesModal';
import {
  InventoryType,
  StatusType,
  PrivacyRecord,
  ProcessingActivity,
  TSPReference,
  Asset,
  Vendor,
  Entity,
  CONTROLLER_PURPOSES,
  TOMS_OPTIONS,
} from '../../types/privacy';
import {
  DATA_SUBJECT_CATEGORIES,
  CONTROLLED_PERSONAL_DATA_ITEMS,
} from '../../data/personalDataCatalog';
import { StatusBadge, ClassificationBadge, DpaStatusBadge, TagChip } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

interface InventoryListViewProps {
  inventoryType: InventoryType;
  onOpenCreateModal: (type: InventoryType) => void;
  onEditRecord: (type: InventoryType, id: string) => void;
}

export const InventoryListView: React.FC<InventoryListViewProps> = ({
  inventoryType,
  onOpenCreateModal,
  onEditRecord,
}) => {
  const {
    processingActivities,
    tspReferences,
    assets,
    vendors,
    entities,
    deleteRecord,
    duplicateRecord,
    updateRecord,
    setSelectedRecord,
    getRelatedRecords,
    globalSearchQuery,
  } = usePrivacyData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [attentionOnlyFilter, setAttentionOnlyFilter] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Advanced filters state
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [filterPurpose, setFilterPurpose] = useState('all');
  const [filterDataSubject, setFilterDataSubject] = useState('all');
  const [filterDataCategory, setFilterDataCategory] = useState('all');
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterTSP, setFilterTSP] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterIntTransfer, setFilterIntTransfer] = useState('all');
  const [filterSafeguard, setFilterSafeguard] = useState('all');
  const [filterRetentionStatus, setFilterRetentionStatus] = useState('all');
  const [filterTOM, setFilterTOM] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRoleFilter('all');
    setRiskFilter('all');
    setAttentionOnlyFilter(false);
    setFilterPurpose('all');
    setFilterDataSubject('all');
    setFilterDataCategory('all');
    setFilterAsset('all');
    setFilterVendor('all');
    setFilterEntity('all');
    setFilterTSP('all');
    setFilterCountry('all');
    setFilterIntTransfer('all');
    setFilterSafeguard('all');
    setFilterRetentionStatus('all');
    setFilterTOM('all');
    setFilterOwner('all');
  };

  const isAnyFilterActive = useMemo(() => {
    return (
      searchQuery !== '' ||
      statusFilter !== 'all' ||
      roleFilter !== 'all' ||
      riskFilter !== 'all' ||
      attentionOnlyFilter ||
      filterPurpose !== 'all' ||
      filterDataSubject !== 'all' ||
      filterDataCategory !== 'all' ||
      filterAsset !== 'all' ||
      filterVendor !== 'all' ||
      filterEntity !== 'all' ||
      filterTSP !== 'all' ||
      filterCountry !== 'all' ||
      filterIntTransfer !== 'all' ||
      filterSafeguard !== 'all' ||
      filterRetentionStatus !== 'all' ||
      filterTOM !== 'all' ||
      filterOwner !== 'all'
    );
  }, [
    searchQuery,
    statusFilter,
    roleFilter,
    riskFilter,
    attentionOnlyFilter,
    filterPurpose,
    filterDataSubject,
    filterDataCategory,
    filterAsset,
    filterVendor,
    filterEntity,
    filterTSP,
    filterCountry,
    filterIntTransfer,
    filterSafeguard,
    filterRetentionStatus,
    filterTOM,
    filterOwner,
  ]);
  
  // Sorting State
  const [sortBy, setSortBy] = useState<string>('lastModifiedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Delete Confirmation State
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; name: string } | null>(null);

  // Get source records according to current inventory
  const currentRecords = useMemo(() => {
    switch (inventoryType) {
      case 'processingActivities':
        return processingActivities;
      case 'tspReferences':
        return tspReferences;
      case 'assets':
        return assets;
      case 'vendors':
        return vendors;
      case 'entities':
        return entities;
    }
  }, [inventoryType, processingActivities, tspReferences, assets, vendors, entities]);

  const getInventoryMetadata = () => {
    switch (inventoryType) {
      case 'processingActivities':
        return {
          title: 'Processing Activities (RoPA)',
          description: 'Register of Processing Activities (Article 30 GDPR) listing operational data processing workflows.',
          icon: FileText,
          accent: 'text-indigo-600',
        };
      case 'tspReferences':
        return {
          title: 'TSP / Product References',
          description: 'Inventory of technology service provider architectures, SaaS engines, and cloud software platforms.',
          icon: Cpu,
          accent: 'text-blue-600',
        };
      case 'assets':
        return {
          title: 'Systems & Assets Inventory',
          description: 'Databases, cloud servers, storage buckets, applications, and physical filing systems housing personal data.',
          icon: Server,
          accent: 'text-emerald-600',
        };
      case 'vendors':
        return {
          title: 'Vendors & Processors',
          description: 'Third-party vendors, processors, and sub-processors with signed DPAs and security assessments.',
          icon: Building2,
          accent: 'text-amber-600',
        };
      case 'entities':
        return {
          title: 'Legal Entities',
          description: 'Group corporate entities, subsidiaries, operating establishments, and regional data protection jurisdictions.',
          icon: Globe2,
          accent: 'text-purple-600',
        };
    }
  };

  const metadata = getInventoryMetadata();
  const IconHeader = metadata.icon;

  // Unique owners in current register
  const uniqueOwners = useMemo(() => {
    const list: string[] = [];
    currentRecords.forEach((r: any) => {
      const o = r.owner || r.businessProcessOwner || r.privacyContact || r.dpoContact;
      if (o && o.trim() !== '' && !list.includes(o)) {
        list.push(o);
      }
    });
    return list.sort();
  }, [currentRecords]);

  // Unique countries in active records
  const uniqueCountries = useMemo(() => {
    const list: string[] = [];
    assets.forEach(a => {
      if (a.primaryHostingLocation && !list.includes(a.primaryHostingLocation)) {
        list.push(a.primaryHostingLocation);
      }
    });
    processingActivities.forEach(pa => {
      if (pa.internationalTransferDetails) {
        pa.internationalTransferDetails.forEach(d => {
          if (d.country && !list.includes(d.country)) {
            list.push(d.country);
          }
        });
      }
    });
    vendors.forEach(v => {
      if (v.headquarters && !list.includes(v.headquarters)) {
        list.push(v.headquarters);
      }
    });
    return list.sort();
  }, [assets, processingActivities, vendors]);

  // Filter & Sort records
  const filteredRecords = useMemo(() => {
    const q = (searchQuery || globalSearchQuery).toLowerCase();

    let list = currentRecords.filter((record: any) => {
      // 1. Text Search across name, description, owner, purpose, ID, tags
      const matchesText =
        record.id.toLowerCase().includes(q) ||
        record.name.toLowerCase().includes(q) ||
        (record.description && record.description.toLowerCase().includes(q)) ||
        (record.owner && record.owner.toLowerCase().includes(q)) ||
        (record.purpose && record.purpose.toLowerCase().includes(q)) ||
        (record.tags && record.tags.some((t: string) => t.toLowerCase().includes(q)));

      // 2. Status Filter
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

      // 3. Role Filter (for Processing Activities)
      let matchesRole = true;
      if (inventoryType === 'processingActivities' && roleFilter !== 'all') {
        const pa = record as ProcessingActivity;
        if (roleFilter === 'Controller') matchesRole = pa.role === 'Controller' || pa.role === 'Joint Controller';
        else if (roleFilter.startsWith('Processor')) matchesRole = pa.role.includes('Processor');
      }

      // 4. Risk Filter
      let matchesRisk = true;
      if (inventoryType === 'processingActivities' && riskFilter === 'high') {
        const pa = record as ProcessingActivity;
        matchesRisk = pa.involvesHighRiskData;
      }

      // 5. Attention Filter
      let matchesAttention = true;
      if (attentionOnlyFilter) {
        if (inventoryType === 'processingActivities') {
          const pa = record as ProcessingActivity;
          matchesAttention = !pa.hasRetentionPolicy || !pa.legalBasis || !pa.owner || pa.involvesHighRiskData;
        } else if (inventoryType === 'assets') {
          const ast = record as Asset;
          matchesAttention = !ast.owner;
        } else if (inventoryType === 'vendors') {
          const v = record as Vendor;
          matchesAttention = v.dpaStatus !== 'Signed';
        }
      }

      // 6. Purpose Filter
      let matchesPurpose = true;
      if (filterPurpose !== 'all') {
        const purposeVal = record.purpose || '';
        const cats = record.categoriesOfProcessing || [];
        matchesPurpose = purposeVal === filterPurpose || cats.includes(filterPurpose);
      }

      // 7. Data Subject Categories Filter
      let matchesDataSubject = true;
      if (filterDataSubject !== 'all') {
        matchesDataSubject =
          record.dataSubjectCategories && record.dataSubjectCategories.includes(filterDataSubject);
      }

      // 8. Personal Data Category Filter
      let matchesDataCategory = true;
      if (filterDataCategory !== 'all') {
        matchesDataCategory =
          record.personalDataCategories && record.personalDataCategories.includes(filterDataCategory);
      }

      // 9. Asset Relationship Filter
      let matchesAsset = true;
      if (filterAsset !== 'all') {
        matchesAsset = record.assetIds && record.assetIds.includes(filterAsset);
      }

      // 10. Vendor Relationship Filter
      let matchesVendor = true;
      if (filterVendor !== 'all') {
        matchesVendor = record.vendorIds && record.vendorIds.includes(filterVendor);
      }

      // 11. Entity Relationship Filter
      let matchesEntity = true;
      if (filterEntity !== 'all') {
        matchesEntity = record.entityIds && record.entityIds.includes(filterEntity);
      }

      // 12. TSP / Product Reference Filter
      let matchesTSP = true;
      if (filterTSP !== 'all') {
        matchesTSP = record.tspIds && record.tspIds.includes(filterTSP);
      }

      // 13. Country / Location Filter
      let matchesCountry = true;
      if (filterCountry !== 'all') {
        if (inventoryType === 'processingActivities') {
          matchesCountry =
            record.internationalTransferDetails &&
            record.internationalTransferDetails.some((d: any) => d.country === filterCountry);
        } else if (inventoryType === 'assets') {
          matchesCountry = record.primaryHostingLocation === filterCountry;
        } else if (inventoryType === 'vendors') {
          matchesCountry = record.headquarters === filterCountry;
        } else if (inventoryType === 'entities') {
          matchesCountry = record.jurisdiction && record.jurisdiction.toLowerCase().includes(filterCountry.toLowerCase());
        }
      }

      // 14. International Transfer Status Filter
      let matchesIntTransfer = true;
      if (filterIntTransfer !== 'all') {
        matchesIntTransfer = record.hasInternationalTransfer === filterIntTransfer;
      }

      // 15. Safeguards Filter
      let matchesSafeguard = true;
      if (filterSafeguard !== 'all') {
        if (inventoryType === 'processingActivities') {
          matchesSafeguard =
            record.internationalTransferDetails &&
            record.internationalTransferDetails.some((d: any) => d.safeguard === filterSafeguard);
        }
      }

      // 16. Retention Status Filter
      let matchesRetentionStatus = true;
      if (filterRetentionStatus !== 'all') {
        const hasPol = !!record.hasRetentionPolicy;
        const hasPer = !!(record.retentionPeriod && record.retentionPeriod.trim() !== '');
        if (filterRetentionStatus === 'Yes') {
          matchesRetentionStatus = hasPol && hasPer;
        } else {
          matchesRetentionStatus = !hasPol || !hasPer;
        }
      }

      // 17. TOMs Filter
      let matchesTOM = true;
      if (filterTOM !== 'all') {
        matchesTOM = record.toms && record.toms.includes(filterTOM);
      }

      // 18. Business Process Owner Filter
      let matchesOwner = true;
      if (filterOwner !== 'all') {
        const o = record.owner || record.businessProcessOwner || record.privacyContact || record.dpoContact || '';
        matchesOwner = o.toLowerCase() === filterOwner.toLowerCase();
      }

      return (
        matchesText &&
        matchesStatus &&
        matchesRole &&
        matchesRisk &&
        matchesAttention &&
        matchesPurpose &&
        matchesDataSubject &&
        matchesDataCategory &&
        matchesAsset &&
        matchesVendor &&
        matchesEntity &&
        matchesTSP &&
        matchesCountry &&
        matchesIntTransfer &&
        matchesSafeguard &&
        matchesRetentionStatus &&
        matchesTOM &&
        matchesOwner
      );
    });

    // Apply Sorting
    list = [...list].sort((a: any, b: any) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [
    currentRecords,
    searchQuery,
    globalSearchQuery,
    statusFilter,
    roleFilter,
    riskFilter,
    attentionOnlyFilter,
    inventoryType,
    sortBy,
    sortOrder,
    filterPurpose,
    filterDataSubject,
    filterDataCategory,
    filterAsset,
    filterVendor,
    filterEntity,
    filterTSP,
    filterCountry,
    filterIntTransfer,
    filterSafeguard,
    filterRetentionStatus,
    filterTOM,
    filterOwner,
  ]);

  // Bulk actions
  const toggleSelectRow = (id: string) => {
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter(x => x !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedRowIds.length === filteredRecords.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredRecords.map(r => r.id));
    }
  };

  const handleSaveDraftQuick = (id: string) => {
    updateRecord(inventoryType, id, { status: 'Draft' });
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      deleteRecord(inventoryType, recordToDelete.id);
      setRecordToDelete(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 shadow-2xs">
            <IconHeader className={`w-5 h-5 ${metadata.accent}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{metadata.title}</h1>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">{metadata.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {inventoryType === 'processingActivities' && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 rounded-md border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-2xs flex items-center gap-1.5 shrink-0"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              Import Processing Activities
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenCreateModal(inventoryType)}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add {inventoryType === 'processingActivities' ? 'Processing Activity' : 'Record'}
          </button>
        </div>
      </div>

      {/* Filter & Toolbar Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
        {/* Search, Status, Role, and Risk Filters */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${metadata.title}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs">
            {['all', 'Approved', 'Under Review', 'Draft'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'all' ? 'All Status' : status}
              </button>
            ))}
          </div>

          {/* Processing Activity Specific Role Filter */}
          {inventoryType === 'processingActivities' && (
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              <option value="all">All Roles</option>
              <option value="Controller">Controller</option>
              <option value="Processor">Processor</option>
            </select>
          )}

          {/* Risk Level Filter Toggle */}
          {inventoryType === 'processingActivities' && (
            <button
              type="button"
              onClick={() => setRiskFilter(riskFilter === 'high' ? 'all' : 'high')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition flex items-center gap-1 border ${
                riskFilter === 'high'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 font-semibold'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              High Risk Only
            </button>
          )}

          {/* Attention Filter */}
          <button
            type="button"
            onClick={() => setAttentionOnlyFilter(!attentionOnlyFilter)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition flex items-center gap-1 border ${
              attentionOnlyFilter
                ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Compliance Gaps
          </button>

          {/* Advanced Filters Trigger */}
          <button
            type="button"
            onClick={() => setAdvancedFiltersOpen(!advancedFiltersOpen)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition flex items-center gap-1 border ${
              advancedFiltersOpen
                ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                : isAnyFilterActive
                ? 'bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-900" />
            <span>Advanced Filters</span>
            {isAnyFilterActive && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        {/* Sort Controls & View Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 pl-1">Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="name">Name</option>
              <option value="role">Role</option>
              <option value="owner">Owner</option>
              <option value="status">Status</option>
              <option value="lastModifiedDate">Last Updated</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-slate-500 hover:text-slate-900 transition"
              title={`Sort Direction (${sortOrder.toUpperCase()})`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            <strong className="text-slate-900">{filteredRecords.length}</strong> of {currentRecords.length}
          </span>

          {/* Table / Grid Mode Toggle */}
          <div className="flex items-center border border-slate-200 rounded-md p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded text-xs transition ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded text-xs transition ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Collapsible Filters Panel */}
      {advancedFiltersOpen && (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg shadow-2xs space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold text-slate-800">Advanced Register Filter Controls</h3>
            </div>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-3xs"
              >
                <X className="w-3 h-3" />
                Reset All Active Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Column 1: Core Parameters */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-600 border-b border-slate-200 pb-1 uppercase text-[9px] tracking-wider">Core Parameters</h4>
              
              {/* Business Process Owner */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Process/Record Owner</label>
                <select
                  value={filterOwner}
                  onChange={e => setFilterOwner(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Owners</option>
                  {uniqueOwners.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Purpose (RoPA specific or general search) */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Purpose of Processing</label>
                <select
                  value={filterPurpose}
                  onChange={e => setFilterPurpose(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Purposes</option>
                  {CONTROLLER_PURPOSES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 2: Data Scope */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-600 border-b border-slate-200 pb-1 uppercase text-[9px] tracking-wider">Data & Subject Scope</h4>

              {/* Data Subject Category */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Data Subject Category</label>
                <select
                  value={filterDataSubject}
                  onChange={e => setFilterDataSubject(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Subject Categories</option>
                  {DATA_SUBJECT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Personal Data Category */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Personal Data Category</label>
                <select
                  value={filterDataCategory}
                  onChange={e => setFilterDataCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Personal Data Items</option>
                  {CONTROLLED_PERSONAL_DATA_ITEMS.slice(0, 20).map(item => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 3: Linked Infrastructure */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-600 border-b border-slate-200 pb-1 uppercase text-[9px] tracking-wider">Linked Architecture</h4>

              {/* Asset/System Relationship */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Linked Asset / System</label>
                <select
                  value={filterAsset}
                  onChange={e => setFilterAsset(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Systems/Assets</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.id})</option>
                  ))}
                </select>
              </div>

              {/* Vendor/Processor Relationship */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Linked Third Party Vendor</label>
                <select
                  value={filterVendor}
                  onChange={e => setFilterVendor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Vendors</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Legal Entity */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Entity</label>
                  <select
                    value={filterEntity}
                    onChange={e => setFilterEntity(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All</option>
                    {entities.map(ent => (
                      <option key={ent.id} value={ent.id}>{ent.name}</option>
                    ))}
                  </select>
                </div>

                {/* Product/TSP */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Product/TSP</label>
                  <select
                    value={filterTSP}
                    onChange={e => setFilterTSP(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All</option>
                    {tspReferences.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Column 4: Compliance & Transfers */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-600 border-b border-slate-200 pb-1 uppercase text-[9px] tracking-wider">Compliance & Security</h4>

              <div className="grid grid-cols-2 gap-2">
                {/* International Transfer */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Intl Transfer</label>
                  <select
                    value={filterIntTransfer}
                    onChange={e => setFilterIntTransfer(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                {/* Retention Status */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Retention Pol</label>
                  <select
                    value={filterRetentionStatus}
                    onChange={e => setFilterRetentionStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="all">All</option>
                    <option value="Yes">Configured</option>
                    <option value="No">Missing</option>
                  </select>
                </div>
              </div>

              {/* Hosting Country */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Hosting Country / Location</label>
                <select
                  value={filterCountry}
                  onChange={e => setFilterCountry(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Countries</option>
                  {uniqueCountries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* TOMs */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Technical Security (TOMs)</label>
                <select
                  value={filterTOM}
                  onChange={e => setFilterTOM(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Security Standards</option>
                  {TOMS_OPTIONS.map(tom => (
                    <option key={tom} value={tom}>{tom}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Table or Grid View */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          title={`No ${metadata.title} found`}
          description="Try adjusting your search query, status filters, or create a new inventory record."
          actionLabel="Create Record"
          onAction={() => onOpenCreateModal(inventoryType)}
        />
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="p-3.5 w-8">
                    <input
                      type="checkbox"
                      checked={selectedRowIds.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="p-3.5">Name & ID</th>

                  {/* Processing Activity Specific Columns */}
                  {inventoryType === 'processingActivities' && (
                    <>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Purpose / Categories</th>
                      <th className="p-3.5">Business Process Owner</th>
                      <th className="p-3.5">TSP / Product</th>
                      <th className="p-3.5">Risk</th>
                      <th className="p-3.5">Retention</th>
                    </>
                  )}

                  {/* TSP Specific Columns */}
                  {inventoryType === 'tspReferences' && (
                    <>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Version / Plan</th>
                      <th className="p-3.5">Linked Assets</th>
                    </>
                  )}

                  {/* Asset Specific Columns */}
                  {inventoryType === 'assets' && (
                    <>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Managing Org</th>
                      <th className="p-3.5">Hosting Type</th>
                      <th className="p-3.5">Hosting Provider</th>
                      <th className="p-3.5">Primary Location</th>
                      <th className="p-3.5">IT Owner</th>
                      <th className="p-3.5">Related Processing Activities</th>
                    </>
                  )}

                  {/* Vendor Specific Columns */}
                  {inventoryType === 'vendors' && (
                    <>
                      <th className="p-3.5">DPA Status</th>
                      <th className="p-3.5">Headquarters</th>
                      <th className="p-3.5">Certifications</th>
                    </>
                  )}

                  {/* Entity Specific Columns */}
                  {inventoryType === 'entities' && (
                    <>
                      <th className="p-3.5">Jurisdiction</th>
                      <th className="p-3.5">Registration #</th>
                      <th className="p-3.5">DPO Contact</th>
                    </>
                  )}

                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Last Updated</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record: any) => {
                  const isSelected = selectedRowIds.includes(record.id);
                  const relations = getRelatedRecords(record.id, inventoryType);

                  return (
                    <tr
                      key={record.id}
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-indigo-50/30' : ''}`}
                    >
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(record.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Name & ID */}
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            {record.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedRecord({ id: record.id, type: inventoryType })}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left truncate"
                          >
                            {record.name}
                          </button>
                        </div>
                        {record.description && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{record.description}</p>
                        )}
                      </td>

                      {/* Processing Activity Specific Fields */}
                      {inventoryType === 'processingActivities' && (
                        <>
                          {/* Role */}
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                record.role === 'Controller'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {record.role}
                            </span>
                          </td>

                          {/* Purpose / Categories */}
                          <td className="p-3.5 max-w-xs">
                            {record.purpose ? (
                              <span className="text-slate-800 font-medium truncate block" title={record.purpose}>
                                {record.purpose}
                              </span>
                            ) : record.categoriesOfProcessing && record.categoriesOfProcessing.length > 0 ? (
                              <span className="text-slate-800 font-medium truncate block">
                                {record.categoriesOfProcessing.join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unspecified</span>
                            )}
                          </td>

                          {/* Business Process Owner */}
                          <td className="p-3.5 font-medium text-slate-700">{record.owner || '—'}</td>

                          {/* TSP / Product */}
                          <td className="p-3.5">
                            {relations.tspReferences.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {relations.tspReferences.slice(0, 1).map(tsp => (
                                  <span key={tsp.id} className="font-medium text-slate-800 truncate max-w-[140px]">
                                    {tsp.name}
                                  </span>
                                ))}
                                {relations.tspReferences.length > 1 && (
                                  <span className="text-[10px] text-indigo-600 font-bold">
                                    +{relations.tspReferences.length - 1} more TSPs
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">None linked</span>
                            )}
                          </td>

                          {/* Risk */}
                          <td className="p-3.5">
                            {record.involvesHighRiskData ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 flex items-center gap-1 w-fit">
                                <ShieldAlert className="w-3 h-3 text-rose-600" /> High Risk
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                                Standard
                              </span>
                            )}
                          </td>

                          {/* Retention */}
                          <td className="p-3.5">
                            {record.retentionPeriod ? (
                              <span className="text-slate-700 text-[11px] font-medium">{record.retentionPeriod}</span>
                            ) : (
                              <span className="text-amber-700 font-semibold text-[10px] flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 w-fit">
                                <AlertCircle className="w-3 h-3" /> Missing
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {/* TSP Specific Fields */}
                      {inventoryType === 'tspReferences' && (
                        <>
                          <td className="p-3.5 font-medium text-slate-700">{record.category}</td>
                          <td className="p-3.5 text-slate-600">{record.versionOrPlan || 'N/A'}</td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-500">
                            {relations.assets.length} Linked Assets
                          </td>
                        </>
                      )}

                      {/* Asset Specific Fields */}
                      {inventoryType === 'assets' && (
                        <>
                          <td className="p-3.5 font-medium text-slate-800">{record.assetType}</td>
                          <td className="p-3.5 text-slate-600 max-w-[150px] truncate" title={record.managingOrganisation || 'Unassigned'}>
                            {record.managingOrganisation || 'Unassigned'}
                          </td>
                          <td className="p-3.5 text-slate-600 truncate max-w-[130px]" title={record.hostingType || 'Unassigned'}>
                            {record.hostingType || '—'}
                          </td>
                          <td className="p-3.5 font-medium text-slate-700 truncate max-w-[140px]" title={record.hostingProvider || 'Unassigned'}>
                            {record.hostingProvider || '—'}
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">
                            {record.primaryHostingLocation || record.hostingLocation || '—'}
                          </td>
                          <td className="p-3.5 text-slate-700">{record.itOwner || record.owner || '—'}</td>
                          <td className="p-3.5">
                            {relations.processingActivities.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => setSelectedRecord({ id: record.id, type: 'assets' })}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold hover:bg-indigo-100 transition border border-indigo-200"
                              >
                                <FileText className="w-3 h-3 text-indigo-600" />
                                {relations.processingActivities.length} Linked Activity{relations.processingActivities.length > 1 ? 'ies' : ''}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">0 Linked</span>
                            )}
                          </td>
                        </>
                      )}

                      {/* Vendor Specific Fields */}
                      {inventoryType === 'vendors' && (
                        <>
                          <td className="p-3.5">
                            <DpaStatusBadge dpaStatus={record.dpaStatus} />
                          </td>
                          <td className="p-3.5 text-slate-600">{record.headquarters}</td>
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1">
                              {(record.securityCertifications || []).slice(0, 2).map((cert: string) => (
                                <TagChip key={cert} label={cert} />
                              ))}
                            </div>
                          </td>
                        </>
                      )}

                      {/* Entity Specific Fields */}
                      {inventoryType === 'entities' && (
                        <>
                          <td className="p-3.5 font-medium text-slate-700">{record.jurisdiction}</td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-600">{record.registrationNumber}</td>
                          <td className="p-3.5 text-slate-700">{record.dpoContact}</td>
                        </>
                      )}

                      {/* Status */}
                      <td className="p-3.5">
                        <StatusBadge status={record.status} />
                      </td>

                      {/* Last Updated */}
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {record.lastModifiedDate ? new Date(record.lastModifiedDate).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Row Actions */}
                      <td className="p-3.5 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord({ id: record.id, type: inventoryType })}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="View Record Details & Lineage"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditRecord(inventoryType, record.id)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            title="Edit Record"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveDraftQuick(record.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Save as Draft"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateRecord(inventoryType, record.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            title="Duplicate Record"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecordToDelete({ id: record.id, name: record.name })}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record: any) => {
            const relations = getRelatedRecords(record.id, inventoryType);

            return (
              <div
                key={record.id}
                className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs hover:border-slate-300 transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-500">{record.id}</span>
                    <StatusBadge status={record.status} />
                  </div>

                  <h3
                    className="text-sm font-bold text-slate-900 mt-2 hover:text-indigo-600 transition cursor-pointer"
                    onClick={() => setSelectedRecord({ id: record.id, type: inventoryType })}
                  >
                    {record.name}
                  </h3>

                  {record.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{record.description}</p>
                  )}
                </div>

                {/* Grid card relations preview */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium text-slate-600">
                    {relations.processingActivities.length + relations.assets.length + relations.vendors.length} Connected Items
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord({ id: record.id, type: inventoryType })}
                      className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
                    >
                      View Record
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STYLED DELETE CONFIRMATION MODAL */}
      {recordToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Delete Record Confirmation</h4>
                <p className="text-xs text-slate-500 font-mono">{recordToDelete.id}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong>"{recordToDelete.name}"</strong>? This will remove the record from your enterprise RoPA registry and clear its relationship links.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-sm"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OneTrust Import Workflow Modal */}
      <ImportActivitiesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

