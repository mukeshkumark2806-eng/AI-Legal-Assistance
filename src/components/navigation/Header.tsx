import React, { useState } from 'react';
import { 
  Bell, 
  ChevronDown, 
  FileCheck2, 
  FileDiff, 
  FileText, 
  FolderOpen, 
  Layers, 
  Menu, 
  Scale, 
  Settings, 
  Shield, 
  Sparkles, 
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
              className="flex items-center gap-2.5 group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover:bg-slate-800 transition-colors">
                <Scale className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-slate-900 tracking-tight font-serif">
                    LegalLens
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  DOCUMENT INTELLIGENCE
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleNavClick('workspace')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'workspace'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Document Intelligence</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('compare')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'compare'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileDiff className="w-3.5 h-3.5" />
                <span>Compare Documents</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('my-documents')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'my-documents'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
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
            >
              Analyze Document
            </Button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-medium text-xs">
                JD
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs font-semibold text-slate-800 block leading-tight">
                  Legal Team
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* Mobile menu hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              currentTab === 'dashboard' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
            }`}
          >
            Dashboard / Home
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('workspace')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              currentTab === 'workspace' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
            }`}
          >
            Document Intelligence
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('compare')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              currentTab === 'compare' ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700'
            }`}
          >
            Compare Documents
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('my-documents')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
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
            >
              Settings & Preferences
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
