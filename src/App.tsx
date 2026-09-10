import React, { useState } from 'react';
import { PrivacyDataProvider, usePrivacyData } from './context/PrivacyDataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { InventoryListView } from './components/inventory/InventoryListView';
import { RecordDetailDrawer } from './components/inventory/RecordDetailDrawer';
import { RecordFormModal } from './components/inventory/RecordFormModal';
import { DataFlowsView } from './components/flows/DataFlowsView';
import { FutureModulePlaceholder } from './components/future/FutureModulePlaceholder';
import { InventoryType } from './types/privacy';

const MainAppContent: React.FC = () => {
  const { activeNav } = usePrivacyData();

  // Create & Edit Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    inventoryType: InventoryType;
    recordIdToEdit: string | null;
  }>({
    isOpen: false,
    inventoryType: 'processingActivities',
    recordIdToEdit: null,
  });

  const handleOpenCreateModal = (type: InventoryType) => {
    setModalState({
      isOpen: true,
      inventoryType: type,
      recordIdToEdit: null,
    });
  };

  const handleOpenEditModal = (type: InventoryType, id: string) => {
    setModalState({
      isOpen: true,
      inventoryType: type,
      recordIdToEdit: id,
    });
  };

  const handleCloseModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const renderActiveView = () => {
    if (activeNav === 'dashboard') {
      return <DashboardView onOpenCreateModal={handleOpenCreateModal} />;
    }

    if (
      activeNav === 'processingActivities' ||
      activeNav === 'tspReferences' ||
      activeNav === 'assets' ||
      activeNav === 'vendors' ||
      activeNav === 'entities'
    ) {
      return (
        <InventoryListView
          inventoryType={activeNav as InventoryType}
          onOpenCreateModal={handleOpenCreateModal}
          onEditRecord={handleOpenEditModal}
        />
      );
    }

    if (activeNav === 'dataFlows') {
      return <DataFlowsView />;
    }

    if (activeNav.startsWith('future-')) {
      return <FutureModulePlaceholder moduleId={activeNav} />;
    }

    return <DashboardView onOpenCreateModal={handleOpenCreateModal} />;
  };

  return (
    <div className="flex h-screen bg-slate-100/70 text-slate-900 font-sans overflow-hidden antialiased">
      {/* Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header onOpenCreateModal={handleOpenCreateModal} />

        {/* Dynamic Page Workspace */}
        <main className="flex-1 overflow-y-auto bg-slate-100/60">
          {renderActiveView()}
        </main>
      </div>

      {/* Slide-over Detail Drawer */}
      <RecordDetailDrawer onEditRecord={handleOpenEditModal} />

      {/* Create & Edit Modal Dialog */}
      <RecordFormModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        inventoryType={modalState.inventoryType}
        recordIdToEdit={modalState.recordIdToEdit}
      />
    </div>
  );
};

export default function App() {
  return (
    <PrivacyDataProvider>
      <MainAppContent />
    </PrivacyDataProvider>
  );
}
