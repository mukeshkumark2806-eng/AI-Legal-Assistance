import React, { useState } from 'react';
import { SAMPLE_MSA } from './data/mockData';
import type { LegalDocument } from './types/document';
import { Header } from './components/navigation/Header';
import type { NavTab } from './components/navigation/Header';
import { Footer } from './components/navigation/Footer';
import { DisclaimerBanner } from './components/ui/DisclaimerBanner';
import { Dashboard } from './components/dashboard/Dashboard';
import { Workspace } from './components/workspace/Workspace';
import { ComparisonPanel } from './components/comparison/ComparisonPanel';
import { MyDocuments } from './components/dashboard/MyDocuments';
import { UploadModal } from './components/upload/UploadModal';
import { SettingsModal } from './components/navigation/SettingsModal';
import { ComplianceModal } from './components/compliance/ComplianceModal';
import type { ComplianceDocType } from './components/compliance/ComplianceModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [activeDocument, setActiveDocument] = useState<LegalDocument>(SAMPLE_MSA);
  const [uploadedDocuments, setUploadedDocuments] = useState<LegalDocument[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [activeComplianceModal, setActiveComplianceModal] = useState<ComplianceDocType | null>(null);

  // Called when a real PDF or DOCX file has been parsed locally in the browser
  const handleDocumentParsed = (parsedDoc: LegalDocument) => {
    setUploadedDocuments((prev) => [
      parsedDoc,
      ...prev.filter((d) => d.id !== parsedDoc.id)
    ]);
    setActiveDocument(parsedDoc);
    setCurrentTab('workspace');
    setIsUploadModalOpen(false);
  };

  // Called when a sample demo agreement is selected
  const handleSelectSample = (sampleName: string) => {
    setActiveDocument({
      ...SAMPLE_MSA,
      name: sampleName,
      isUploaded: false,
      source: 'sample'
    });
    setCurrentTab('workspace');
    setIsUploadModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Disclaimer Notice */}
      <DisclaimerBanner variant="subtle" />

      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        onUploadClick={() => setIsUploadModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentTab === 'dashboard' && (
          <Dashboard
            onAnalyzeClick={() => setIsUploadModalOpen(true)}
            onCompareClick={() => setCurrentTab('compare')}
            onDocumentParsed={handleDocumentParsed}
            onSelectSampleDocument={handleSelectSample}
          />
        )}

        {currentTab === 'workspace' && (
          <Workspace
            document={activeDocument}
            onUploadNewClick={() => setIsUploadModalOpen(true)}
          />
        )}

        {currentTab === 'compare' && (
          <ComparisonPanel />
        )}

        {currentTab === 'my-documents' && (
          <MyDocuments
            onOpenDocument={handleSelectSample}
            onOpenUploadedDoc={(doc) => {
              setActiveDocument(doc);
              setCurrentTab('workspace');
            }}
            uploadedDocs={uploadedDocuments}
            onUploadClick={() => setIsUploadModalOpen(true)}
          />
        )}
      </main>

      {/* Global Footer (hidden on workspace to preserve full viewport height) */}
      {currentTab !== 'workspace' && (
        <Footer 
          onNavigate={(tab) => setCurrentTab(tab)} 
          onOpenCompliance={(type) => setActiveComplianceModal(type)}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentParsed={handleDocumentParsed}
        onSampleSelect={handleSelectSample}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Compliance & Transparency Modal */}
      <ComplianceModal
        type={activeComplianceModal}
        onClose={() => setActiveComplianceModal(null)}
        onSelectType={(t) => setActiveComplianceModal(t)}
        onNavigateToWorkspace={() => {
          setActiveComplianceModal(null);
          setCurrentTab('workspace');
        }}
      />
    </div>
  );
};

export default App;
