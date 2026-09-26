import React, { useState } from 'react';
import { 
  FileCheck2, 
  FileDiff, 
  FolderOpen, 
  Menu, 
  Scale, 
  Settings, 
  Upload, 
  User, 
  X 
} from 'lucide-react';
import { Button } from '../ui/Button';

export type NavTab = 'dashboard' | 'workspace' | 'compare' | 'my-documents';

interface HeaderProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  onUploadClick: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onUploadClick,
  onOpenSettings
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: NavTab) => {
    onNavigate(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              aria-label="LegalLens - Return to dashboard"
              className="flex items-center gap-2.5 group cursor-pointer text-left rounded-lg p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-slate-800 transition-colors">
                <Scale className="w-5 h-5 text-indigo-400" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-slate-900 tracking-tight font-serif">
                    LegalLens
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                  DOCUMENT INTELLIGENCE
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleNavClick('workspace')}
                aria-current={currentTab === 'workspace' ? 'page' : undefined}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  currentTab === 'workspace'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Document Intelligence</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('compare')}
                aria-current={currentTab === 'compare' ? 'page' : undefined}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  currentTab === 'compare'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileDiff className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Compare Documents</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('my-documents')}
                aria-current={currentTab === 'my-documents' ? 'page' : undefined}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  currentTab === 'my-documents'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                <span>My Documents</span>
              </button>
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={onUploadClick}
              aria-label="Upload and analyze a legal document"
            >
              Analyze Document
            </Button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label="Open application settings and preferences"
              title="Settings & Preferences"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Guest / Workspace State Indicator */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div 
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-medium text-xs"
                aria-hidden="true"
              >
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs font-semibold text-slate-800 block leading-tight">
                  Guest
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  Document Workspace
                </span>
              </div>
            </div>
          </div>

          {/* Mobile menu hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <nav aria-label="Mobile navigation" className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            aria-current={currentTab === 'dashboard' ? 'page' : undefined}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              currentTab === 'dashboard' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
            }`}
          >
            Dashboard / Home
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('workspace')}
            aria-current={currentTab === 'workspace' ? 'page' : undefined}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              currentTab === 'workspace' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
            }`}
          >
            Document Intelligence
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('compare')}
            aria-current={currentTab === 'compare' ? 'page' : undefined}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              currentTab === 'compare' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
            }`}
          >
            Compare Documents
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('my-documents')}
            aria-current={currentTab === 'my-documents' ? 'page' : undefined}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              currentTab === 'my-documents' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
            }`}
          >
            My Documents
          </button>
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => {
                setIsMobileMenuOpen(false);
                onUploadClick();
              }}
              aria-label="Analyze Document"
            >
              Analyze Document
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Settings className="w-3.5 h-3.5" />}
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenSettings();
              }}
              aria-label="Settings and Preferences"
            >
              Settings & Preferences
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
};
