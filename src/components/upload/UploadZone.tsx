import React, { useState, useRef } from 'react';
import type { LegalDocument, ExtractionProgress } from '../../types/document';
import { parseDocumentFile } from '../../services/document/documentParser';
import { analyzeDocumentWithAi, ApiError } from '../../services/api/legalAnalysisApi';
import { 
  AlertCircle, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Circle,
  Clock,
  Cpu,
  FileCheck, 
  FileText, 
  FileUp, 
  HelpCircle, 
  Info, 
  Layers, 
  Lock, 
  RefreshCw, 
  ShieldAlert,
  ShieldCheck,
  Sparkles, 
  Upload, 
  X 
} from 'lucide-react';
import { Button } from '../ui/Button';

interface UploadZoneProps {
  onDocumentParsed?: (doc: LegalDocument) => void;
  onSampleSelect?: (sampleName: string) => void;
  onDocumentSelect?: (docName: string, isCustomUpload?: boolean) => void; // backwards compat
  isCompact?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onDocumentParsed,
  onSampleSelect,
  onDocumentSelect,
  isCompact = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [extractedDoc, setExtractedDoc] = useState<LegalDocument | null>(null);
  const [analyzedDoc, setAnalyzedDoc] = useState<LegalDocument | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiStageStep, setAiStageStep] = useState<number>(0);
  const [aiStageText, setAiStageText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [isOcrAlert, setIsOcrAlert] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessRealFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleProcessRealFile(file);
    }
  };

  const executeAiAnalysis = async (docToAnalyze: LegalDocument) => {
    setIsAnalyzingAi(true);
    setAiErrorMessage(null);
    setAiStageStep(2);
    setAiStageText('Analyzing clauses with Groq GenAI...');

    try {
      const fullDoc = await analyzeDocumentWithAi(docToAnalyze, (update) => {
        setAiStageText(update.stage);
        if (update.percent >= 85) setAiStageStep(6);
        else if (update.percent >= 60) setAiStageStep(5);
        else if (update.percent >= 45) setAiStageStep(4);
        else if (update.percent >= 30) setAiStageStep(3);
        else setAiStageStep(2);
      });

      setAiStageStep(7); // all 6 steps complete
      setAiStageText('Analysis Ready');
      setAnalyzedDoc(fullDoc);
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      const msg = err instanceof ApiError 
        ? err.message 
        : err?.message || 'AI inference failed. You can still inspect the extracted document text.';
      setAiErrorMessage(msg);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleProcessRealFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setAiErrorMessage(null);
    setIsOcrAlert(false);
    setExtractedDoc(null);
    setAnalyzedDoc(null);
    setAiStageStep(1);

    try {
      const resultDoc = await parseDocumentFile(file, (p) => {
        setProgress(p);
      });
      setExtractedDoc(resultDoc);

      // Transition immediately into "Analyzing with LegalLens AI" via Groq
      await executeAiAnalysis(resultDoc);
    } catch (err: any) {
      console.error('Document extraction error:', err);
      const msg = err?.message || 'Failed to process document.';
      setErrorMessage(msg);
      if (err?.isOcrNeeded) {
        setIsOcrAlert(true);
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setProgress(null);
    setExtractedDoc(null);
    setAnalyzedDoc(null);
    setIsAnalyzingAi(false);
    setAiStageStep(0);
    setAiStageText('');
    setErrorMessage(null);
    setAiErrorMessage(null);
    setIsOcrAlert(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLaunchWorkspace = () => {
    const docToLaunch = analyzedDoc || extractedDoc;
    if (docToLaunch) {
      if (onDocumentParsed) {
        onDocumentParsed(docToLaunch);
      } else if (onDocumentSelect) {
        onDocumentSelect(docToLaunch.name, true);
      }
    }
  };

  const handleSelectSample = (sampleName: string) => {
    if (onSampleSelect) {
      onSampleSelect(sampleName);
    } else if (onDocumentSelect) {
      onDocumentSelect(sampleName, false);
    }
  };

  const analysisSteps = [
    { step: 1, label: 'Extracting document text & boundaries' },
    { step: 2, label: 'Analyzing clauses & risk language' },
    { step: 3, label: 'Identifying obligations & parties' },
    { step: 4, label: 'Finding important dates & deadlines' },
    { step: 5, label: 'Preparing action checklist' },
    { step: 6, label: 'Preparing lawyer questions' }
  ];

  return (
    <div className="w-full">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
      />

      {/* STATE 1: Empty Drop Zone */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
            isDragging
              ? 'border-indigo-600 bg-indigo-50/70 scale-[1.005]'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
          } ${isCompact ? 'p-6' : 'p-10 sm:p-14'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-105 transition-transform">
            <FileUp className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-semibold text-slate-900 tracking-tight">
            Analyze a legal document
          </h3>
          <p className="text-sm text-slate-500 max-w-md mt-1.5 leading-relaxed">
            Upload an agreement, contract, policy, notice, or other legal document for real-time text extraction and structured Groq GenAI analysis.
          </p>

          <div className="mt-5 flex items-center gap-3">
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={<Upload className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse files
            </Button>
            <span className="text-xs text-slate-400 font-medium">or drag & drop here</span>
          </div>

          {/* Format & Size Requirements */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-slate-700">
              PDF
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium text-slate-700">
              DOCX
            </span>
            <span className="text-slate-400">•</span>
            <span>Up to 25 MB max file size</span>
            <span className="text-slate-400">•</span>
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Sparkles className="w-3 h-3 text-indigo-600" /> Groq AI Powered
            </span>
          </div>
        </div>
      ) : (
        /* STATE 2: File Ingestion & Real-time Extraction / GenAI Status */
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                {analyzedDoc ? (
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                ) : extractedDoc ? (
                  <FileCheck className="w-6 h-6 text-emerald-600" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-semibold text-slate-900 truncate">
                    {selectedFile.name}
                  </h4>
                  <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                    {selectedFile.name.split('.').pop()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {isAnalyzingAi ? 'Groq GenAI Inference in progress' : analyzedDoc ? 'Groq GenAI Analysis complete' : 'Extracted locally in-browser'}
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Cancel and choose another file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* STAGE PROGRESS: Real extraction & Groq pipeline status */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                {analyzedDoc ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Analysis Ready</span>
                  </>
                ) : isAnalyzingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    <span>Analyzing with LegalLens AI ({aiStageText})</span>
                  </>
                ) : progress?.stage !== 'ready' && progress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    <span>{progress.message}</span>
                  </>
                ) : (
                  <span>Analysis Pipeline</span>
                )}
              </span>
              <span className="font-mono text-slate-500">
                {analyzedDoc ? '100%' : isAnalyzingAi ? `${Math.min(aiStageStep * 16, 95)}%` : progress ? `${progress.percent}%` : '0%'}
              </span>
            </div>

            {/* Visual multi-stage progression list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              {analysisSteps.map((step) => {
                const isComplete = analyzedDoc !== null || aiStageStep > step.step || (step.step === 1 && extractedDoc !== null);
                const isCurrent = isAnalyzingAi && aiStageStep === step.step;

                return (
                  <div key={step.step} className="flex items-center gap-2 py-0.5">
                    {isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    )}
                    <span className={`text-[11px] ${isComplete ? 'text-slate-700 font-medium' : isCurrent ? 'text-indigo-700 font-semibold' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Success Summary Metadata */}
          {extractedDoc && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Pages</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">{extractedDoc.totalPages} Pages</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Detected Sections</span>
                <span className="font-semibold text-indigo-700 mt-0.5 block">{extractedDoc.sections.length} Sections</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Extracted Words</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {extractedDoc.extractionStats?.totalWords.toLocaleString() || '0'} words
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">AI Intelligence</span>
                <span className={`mt-0.5 block font-semibold ${analyzedDoc ? 'text-indigo-700' : 'text-slate-500'}`}>
                  {analyzedDoc ? `${analyzedDoc.clauses.length} Clauses Classified` : isAnalyzingAi ? 'Analyzing...' : 'Ready'}
                </span>
              </div>
            </div>
          )}

          {/* AI ERROR ALERT: Missing API Key / Server Offline / Rate Limit */}
          {aiErrorMessage && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 text-xs space-y-2.5 text-rose-950">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-rose-900">GenAI Inference Notice</h5>
                  <p className="mt-0.5 leading-relaxed text-[11px] text-rose-800">{aiErrorMessage}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {extractedDoc && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executeAiAnalysis(extractedDoc)}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Retry AI Analysis
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleLaunchWorkspace}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  iconPosition="right"
                >
                  Open Extracted Text in Workspace
                </Button>
              </div>
            </div>
          )}

          {/* EXTRACTION ERROR ALERT: Corrupted / Unsupported / Oversized / Scanned PDF */}
          {errorMessage && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              isOcrAlert 
                ? 'bg-amber-50/80 border-amber-200 text-amber-900' 
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-start gap-2">
                {isOcrAlert ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h5 className="font-bold">
                    {isOcrAlert ? 'Scanned / Image-Only PDF Detected' : 'Document Ingestion Error'}
                  </h5>
                  <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-end">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Try another document
                </Button>
              </div>
            </div>
          )}

          {/* Legal Safety Notice */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>LegalLens AI provides informational assistance based on the uploaded document and does not replace professional legal advice.</span>
          </div>

          {/* Action Buttons */}
          {(analyzedDoc || extractedDoc) && !isAnalyzingAi && !aiErrorMessage && (
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {analyzedDoc ? 'Document text and AI analysis verified' : 'Text extracted successfully'}
                </span>
              </span>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Upload another
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                  onClick={handleLaunchWorkspace}
                >
                  Open in Document Workspace
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Demo Agreements Section */}
      <div className="mt-6 pt-5 border-t border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Or explore verified demo agreements:
          </span>
          <span className="text-xs text-slate-400 font-mono">Demo Document</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleSelectSample('Master Services Agreement (CloudScale & Apex)')}
            className="group flex flex-col items-start p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                Master Services Agreement
              </span>
              <span className="text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-200">
                Demo Document
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Cloud infrastructure SLA, Net 30 payment, and auto-renewal term.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('Commercial Lease Agreement - Metro Office')}
            className="group flex flex-col items-start p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                Commercial Office Lease
              </span>
              <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200">
                Demo Document
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Triple net (NNN) commercial lease with security deposit & escalation.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSample('Mutual Non-Disclosure Agreement (NDA)')}
            className="group flex flex-col items-start p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                Mutual NDA Agreement
              </span>
              <span className="text-[10px] font-medium bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">
                Demo Document
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-2">
              Standard bilateral confidentiality, non-circumvent, and IP protection.
            </p>
          </button>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 justify-center">
          <Info className="w-3 h-3" />
          <span>Real uploaded documents are analyzed dynamically using server-side Groq GenAI.</span>
        </div>
      </div>
    </div>
  );
};
