import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Bell, 
  Cpu, 
  Database, 
  FileCheck, 
  Lock, 
  Moon, 
  Scale, 
  ShieldCheck, 
  Sliders, 
  User, 
  Zap 
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'models' | 'privacy'>('general');
  const [selectedModel, setSelectedModel] = useState('gemini-pro');
  const [strictPrivacy, setStrictPrivacy] = useState(true);
  const [autoHighlight, setAutoHighlight] = useState(true);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Settings & Preferences"
      subtitle="Configure LegalLens AI document intelligence, model parameters, and data security policies."
      maxWidth="2xl"
    >
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="w-full sm:w-44 flex sm:flex-col gap-1 border-b sm:border-b-0 sm:border-r border-slate-100 pb-3 sm:pb-0 sm:pr-3">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'general' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('models')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'models' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'privacy' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Data Privacy</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 text-xs">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-slate-900 block mb-1">
                  Default Legal Jurisdiction
                </label>
                <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <option>United States (Delaware General Corporation Law)</option>
                  <option>United States (California Commercial Code)</option>
                  <option>United States (New York Commercial Division)</option>
                  <option>United Kingdom (English Common Law)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Sets the default legal standard used when evaluating ambiguity and liability clauses.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Automatic Clause Highlighting
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Visually mark categorized clauses directly within the document text.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoHighlight}
                  onChange={(e) => setAutoHighlight(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    Attorney Disclaimer Bar
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Display informational notice banner on every active workspace session.
                  </span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  disabled
                  className="w-4 h-4 rounded text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900">
                <span className="font-semibold block">GenAI Engine Integration (Phase 2 Ready)</span>
                <span className="text-[11px] text-indigo-700">
                  Select your organization&apos;s preferred enterprise model for legal summarization and clause extraction.
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    id: 'gemini-pro',
                    name: 'Gemini 2.0 Flash / Pro (Legal Tuned)',
                    speed: 'Ultra-fast',
                    context: '1M tokens (Full Book of Business)'
                  },
                  {
                    id: 'claude-sonnet',
                    name: 'Claude 3.5 Sonnet (Enterprise Legal)',
                    speed: 'High precision',
                    context: '200K tokens'
                  },
                  {
                    id: 'gpt-4o',
                    name: 'GPT-4o (Commercial Contracts)',
                    speed: 'Standard',
                    context: '128K tokens'
                  }
                ].map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedModel === m.id
                        ? 'border-indigo-600 bg-indigo-50/30'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{m.name}</span>
                      <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {m.speed}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Context Window: {m.context}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-950 flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Zero Data Retention Guarantee</span>
                  <span className="text-[11px] text-emerald-800">
                    Uploaded documents are processed in an isolated ephemeral sandbox. Customer data is never used to train public models.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Enforce Client-Side Redaction</span>
                  <input
                    type="checkbox"
                    checked={strictPrivacy}
                    onChange={(e) => setStrictPrivacy(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Automatically scrub Social Security Numbers, Bank Account Details, and executive personal addresses before sending to the analysis engine.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={onClose}>
          Save Preferences
        </Button>
      </div>
    </Modal>
  );
};
