import React, { useState, useRef, useMemo } from 'react';
import type { LegalDocument, ExtractionProgress } from '../../types/document';
import { 
  compareDocumentsWithAi, 
  type FullComparisonResult, 
  type ComparisonStageUpdate,
  type ComparisonCategory,
  type ComparisonSeverity
} from '../../services/api/documentComparisonApi';
import { parseDocumentFile } from '../../services/document/documentParser';
import { SAMPLE_MSA, SAMPLE_COMPARISON_DATA } from '../../data/mockData';
import { 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Check, 
  CheckCircle2, 
  CheckSquare, 
  Copy, 
  CreditCard, 
  FileCheck, 
  FileDiff, 
  FileText, 
  GitCompare, 
  HelpCircle, 
  Info, 
  MinusCircle, 
  PlusCircle, 
  RefreshCw, 
  RotateCcw, 
  Scale, 
  Search, 
  Sparkles, 
  Square, 
  UploadCloud 
} from 'lucide-react';
import { ComparisonBadge, ImportanceBadge, CategoryBadge } from '../ui/StatusBadge';
import { Button } from '../ui/Button';

// Convert mock data to full comparison result schema for instant demo preview
function createDemoComparisonResult(): FullComparisonResult {
  return {
    documentA: {
      fileName: SAMPLE_COMPARISON_DATA.originalDoc.name,
      documentType: 'Master Services Agreement (v1.0 Baseline)',
      fileSize: SAMPLE_COMPARISON_DATA.originalDoc.size,
      totalPages: 7
    },
    documentB: {
      fileName: SAMPLE_COMPARISON_DATA.newDoc.name,
      documentType: 'Master Services Agreement (v2.0 Redline Revised)',
      fileSize: SAMPLE_COMPARISON_DATA.newDoc.size,
      totalPages: 8
    },
    summary: {
      totalChanges: SAMPLE_COMPARISON_DATA.summary.totalChanges,
      addedCount: SAMPLE_COMPARISON_DATA.summary.addedCount,
      removedCount: SAMPLE_COMPARISON_DATA.summary.removedCount,
      modifiedCount: SAMPLE_COMPARISON_DATA.summary.modifiedCount,
      unchangedCount: SAMPLE_COMPARISON_DATA.summary.unchangedCount,
      executiveSummary: 'AI Redline Analysis identified 6 substantive changes between v1.0 Baseline and v2.0 Redline. Key shifts include accelerated payment terms (Net 45 to Net 30), a 50% reduction in Provider liability ceiling ($444k to $222k), deletion of the immediate bankruptcy termination remedy, and introduction of annual SOC 2 Type II compliance covenants.'
    },
    changes: SAMPLE_COMPARISON_DATA.changes.map((c) => ({
      id: c.id,
      changeType: c.type.toUpperCase() as any,
      category: (c.sectionNumber.includes('4') ? 'PAYMENT' : c.sectionNumber.includes('7') ? 'CONFIDENTIALITY' : c.sectionNumber.includes('8') ? 'LIABILITY' : c.sectionNumber.includes('9') ? 'TERMINATION' : 'GENERAL') as ComparisonCategory,
      severity: (c.importance === 'Critical' ? 'CRITICAL' : c.importance === 'High' ? 'HIGH' : 'MODERATE') as ComparisonSeverity,
      sectionNumber: c.sectionNumber,
      sectionTitle: c.title,
      oldText: c.originalSnippet || null,
      newText: c.newSnippet || null,
      explanation: c.summary,
      whyItMatters: c.legalImpact,
      legalImpact: c.legalImpact,
      actionRequired: c.type === 'modified' ? 'Verify whether internal finance and operational stakeholders approve this change.' : null,
      pageNumberA: 2,
      pageNumberB: 2,
      sourceA: c.originalSnippet || null,
      sourceB: c.newSnippet || null
    })),
    keyChanges: [
      {
        id: 'kc-1',
        title: 'Payment Window Accelerated to Net 30',
        description: 'Vendor shortened invoice settlement timeframe from 45 calendar days to 30 calendar days and added 1.5% monthly late interest penalties.',
        category: 'PAYMENT',
        severity: 'HIGH',
        clauseRef: 'Section 4.2'
      },
      {
        id: 'kc-2',
        title: 'Aggregate Liability Cap Reduced by 50%',
        description: 'Liability ceiling reduced from 200% (2x) trailing annual fees down to 100% (1x) fees paid, reducing financial recovery in the event of an outage.',
        category: 'LIABILITY',
        severity: 'CRITICAL',
        clauseRef: 'Section 8.2'
      },
      {
        id: 'kc-3',
        title: 'SOC 2 Type II Cybersecurity Warranty Added',
        description: 'New requirement mandating annual penetration testing and 48-hour breach notification.',
        category: 'CONFIDENTIALITY',
        severity: 'HIGH',
        clauseRef: 'Section 7.3'
      }
    ],
    riskChanges: [
      {
        id: 'rc-1',
        title: 'Diminished Outage Damage Recovery',
        description: 'Limiting aggregate liability to 1x fees paid ($222,000) creates exposure if infrastructure failure causes substantial operational interruption.',
        severity: 'CRITICAL',
        clauseRef: 'Section 8.2',
        mitigation: 'Propose maintaining a 2x liability ceiling or establishing a separate uncapped liability carveout for confidentiality breaches and data loss.'
      },
      {
        id: 'rc-2',
        title: 'Cash Outflow Acceleration & Late Interest',
        description: 'Net 30 invoice turnaround creates operational pressure on corporate accounts payable reconciliation.',
        severity: 'HIGH',
        clauseRef: 'Section 4.2',
        mitigation: 'Negotiate Net 45 terms for enterprise billing or insert a 15-day grace period prior to late interest accrual.'
      }
    ],
    changedObligations: [
      {
        party: 'Client',
        oldObligation: 'Pay invoices within Net 45 calendar days.',
        newObligation: 'Pay invoices within Net 30 calendar days or incur 1.5% monthly late interest penalty.',
        impact: 'Accelerates accounts payable obligations and imposes late fees for delayed approval cycles.',
        clauseRef: 'Section 4.2'
      },
      {
        party: 'Counterparty',
        oldObligation: 'Provide standard cloud hosting availability without certified third-party audit requirements.',
        newObligation: 'Maintain annual SOC 2 Type II certification and notify Client within 48 hours of security breaches.',
        impact: 'Strengthens provider cybersecurity audit compliance and incident reporting requirements.',
        clauseRef: 'Section 7.3'
      }
    ],
    changedDeadlines: [
      {
        title: 'Invoice Payment Deadline',
        oldDeadline: '45 calendar days from invoice date',
        newDeadline: '30 calendar days from invoice date',
        impact: 'Shortens financial processing window by 15 calendar days.',
        clauseRef: 'Section 4.2'
      },
      {
        title: 'Security Incident Notification Timeframe',
        oldDeadline: 'No specific notification deadline defined',
        newDeadline: '48 hours from confirmed breach',
        impact: 'Establishes rapid incident disclosure for client risk mitigation.',
        clauseRef: 'Section 7.3'
      }
    ],
    changedFinancialTerms: [
      {
        item: 'Late Payment Penalty Rate',
        oldValue: 'No late payment interest specified',
        newValue: '1.5% monthly interest on delinquent balances',
        impact: 'Direct financial exposure for delayed invoice disbursements.',
        clauseRef: 'Section 4.2'
      },
      {
        item: 'Maximum Damage Liability Ceiling',
        oldValue: '2x Trailing 12-Month Fees ($444,000 USD)',
        newValue: '1x Trailing 12-Month Fees ($222,000 USD)',
        impact: 'Halves maximum insurance and damages recovery in dispute.',
        clauseRef: 'Section 8.2'
      }
    ],
    actionChecklist: [
      {
        id: 'act-1',
        task: 'Confirm whether internal Accounts Payable can guarantee Net 30 payments to prevent 1.5% late interest penalty.',
        clauseRef: 'Section 4.2',
        priority: 'Critical',
        completed: false,
        notes: 'Consult with Finance Director before accepting.'
      },
      {
        id: 'act-2',
        task: 'Request counter-proposal on Section 8.2 to preserve 2x liability ceiling for data breaches and willful misconduct.',
        clauseRef: 'Section 8.2',
        priority: 'Critical',
        completed: false,
        notes: 'Standard legal counsel negotiation point.'
      },
      {
        id: 'act-3',
        task: 'Verify annual SOC 2 Type II report deliverable schedule with vendor security office.',
        clauseRef: 'Section 7.3',
        priority: 'Recommended',
        completed: true,
        notes: 'Security team verified vendor SOC 2 compliance.'
      }
    ],
    lawyerQuestions: [
      {
        id: 'lq-1',
        question: 'Should we accept the reduction of the aggregate liability ceiling from 2x ($444k) to 1x ($222k) trailing annual fees?',
        context: 'Section 8.2 cuts recoverable compensation in half during prolonged outage or catastrophic downtime.',
        clauseRef: 'Section 8.2',
        reason: 'Evaluating if liability reduction leaves business underinsured against cloud downtime losses.'
      },
      {
        id: 'lq-2',
        question: 'Does removal of the immediate insolvency termination clause in Section 9.3 prejudice our ability to retrieve our data if provider enters bankruptcy?',
        context: 'Original Section 9.3 allowed immediate contract termination upon counterparty insolvency.',
        clauseRef: 'Section 9.3',
        reason: 'Prevents being locked into a bankrupt vendor during business continuity disruptions.'
      }
    ],
    disclaimer: 'LegalLens provides informational comparison assistance based on the two document versions and does not replace qualified legal counsel.'
  };
}

export const ComparisonPanel: React.FC = () => {
  // Document slots
  const [docA, setDocA] = useState<LegalDocument | null>(null);
  const [docB, setDocB] = useState<LegalDocument | null>(null);

  // Extraction states
  const [isExtractingA, setIsExtractingA] = useState<boolean>(false);
  const [progressA, setProgressA] = useState<ExtractionProgress | null>(null);
  const [isExtractingB, setIsExtractingB] = useState<boolean>(false);
  const [progressB, setProgressB] = useState<ExtractionProgress | null>(null);

  // Comparison states
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareProgress, setCompareProgress] = useState<ComparisonStageUpdate | null>(null);
  const [comparisonResult, setComparisonResult] = useState<FullComparisonResult | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tabs & filters
  const [activeTab, setActiveTab] = useState<'redline' | 'key-changes' | 'terms' | 'checklist'>('redline');
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | 'ADDED' | 'MODIFIED' | 'REMOVED' | 'UNCHANGED'>('ALL');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [activeSeverityFilter, setActiveSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const tabOrder: Array<'redline' | 'key-changes' | 'terms' | 'checklist'> = [
    'redline',
    'key-changes',
    'terms',
    'checklist'
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % tabOrder.length;
      const nextTab = tabOrder[nextIndex];
      setActiveTab(nextTab);
      document.getElementById(`comp-tab-${nextTab}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + tabOrder.length) % tabOrder.length;
      const prevTab = tabOrder[prevIndex];
      setActiveTab(prevTab);
      document.getElementById(`comp-tab-${prevTab}`)?.focus();
    }
  };

  // UI helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);

  // Handle Document A File Selection
  const handleFileSelectA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingA(true);
    setErrorMessage(null);
    try {
      const parsedDoc = await parseDocumentFile(file, (prog) => {
        setProgressA(prog);
      });
      setDocA(parsedDoc);
      setIsDemoMode(false);
      // Reset previous comparison
      setComparisonResult(null);
    } catch (err: any) {
      setErrorMessage(`Failed to extract Document A: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExtractingA(false);
      if (fileInputARef.current) fileInputARef.current.value = '';
    }
  };

  // Handle Document B File Selection
  const handleFileSelectB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingB(true);
    setErrorMessage(null);
    try {
      const parsedDoc = await parseDocumentFile(file, (prog) => {
        setProgressB(prog);
      });
      setDocB(parsedDoc);
      setIsDemoMode(false);
      // Reset previous comparison
      setComparisonResult(null);
    } catch (err: any) {
      setErrorMessage(`Failed to extract Document B: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExtractingB(false);
      if (fileInputBRef.current) fileInputBRef.current.value = '';
    }
  };

  // Quick helper to load Sample Baseline Contract as Doc A
  const handleLoadSampleA = () => {
    setDocA({
      ...SAMPLE_MSA,
      rawText: SAMPLE_MSA.rawText || SAMPLE_MSA.sections.flatMap(s => [s.title, ...s.paragraphs]).join('\n\n')
    });
    setErrorMessage(null);
  };

  // Quick helper to load Sample Revised Contract as Doc B
  const handleLoadSampleB = () => {
    // Create a modified copy representing v2.0
    const revisedSections = SAMPLE_MSA.sections.map((sec) => {
      if (sec.sectionNumber === '4.0') {
        return {
          ...sec,
          title: 'Fees, Invoicing, and Payment Obligations',
          paragraphs: [
            '4.1 Base Compensation. Client shall pay Provider a recurring monthly service fee of $18,500.00 USD, payable on the first day of each calendar month.',
            '4.2 Payment Terms and Penalties. All undisputed invoices are due within thirty (30) calendar days from the invoice date (Net 30). Late payments shall accrue interest at the rate of one and one-half percent (1.5%) per month or the maximum statutory rate permitted by law, whichever is less.',
            '4.3 In the event Client fails to cure any delinquent balance within fifteen (15) days of written notice, Provider reserves the right to suspend platform access without liability.'
          ]
        };
      }
      if (sec.sectionNumber === '8.0') {
        return {
          ...sec,
          paragraphs: [
            '8.1 Consequential Damages Waiver. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS OR DATA.',
            '8.2 Aggregate Cap. The total aggregate liability of either party arising out of or related to this Agreement shall not exceed the total fees actually paid by Client to Provider in the twelve (12) months preceding the incident giving rise to the claim.'
          ]
        };
      }
      return sec;
    });

    // Add a new section 7.3
    revisedSections.splice(7, 0, {
      id: 'sec-7-new',
      sectionNumber: '7.3',
      title: 'Data Security & SOC 2 Compliance Covenants',
      paragraphs: [
        'Provider warrants that it shall maintain annual SOC 2 Type II certification, conduct annual third-party penetration audits, and notify Client within forty-eight (48) hours of any confirmed security incident.'
      ],
      clauseIds: ['cl-soc2']
    });

    const revisedDoc: LegalDocument = {
      ...SAMPLE_MSA,
      id: 'doc-msa-v2',
      name: 'Master Services Agreement (v2.0 Redline Revised)',
      uploadDate: 'March 20, 2025',
      sections: revisedSections,
      rawText: revisedSections.flatMap(s => [s.title, ...s.paragraphs]).join('\n\n')
    };

    setDocB(revisedDoc);
    setErrorMessage(null);
  };

  // Run AI Redline Comparison
  const handleRunComparison = async () => {
    if (!docA || !docB) {
      setErrorMessage('Please upload or select both Document A and Document B to compare.');
      return;
    }

    setIsComparing(true);
    setErrorMessage(null);
    setCompareProgress({ stage: 'Initiating comparison pipeline...', percent: 5 });

    try {
      const result = await compareDocumentsWithAi(docA, docB, (update) => {
        setCompareProgress(update);
      });
      setComparisonResult(result);
      setIsDemoMode(false);
      setActiveTab('redline');
    } catch (err: any) {
      console.error('Comparison error:', err);
      setErrorMessage(err.message || 'An error occurred while comparing the two documents.');
    } finally {
      setIsComparing(false);
      setCompareProgress(null);
    }
  };

  // Toggle Demo Mode
  const handleLoadDemo = () => {
    const demo = createDemoComparisonResult();
    setComparisonResult(demo);
    setIsDemoMode(true);
    setErrorMessage(null);
    setActiveTab('redline');
  };

  // Reset comparison
  const handleReset = () => {
    setComparisonResult(null);
    setIsDemoMode(false);
    setErrorMessage(null);
  };

  // Copy text to clipboard
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle checklist item
  const handleToggleTask = (id: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filtered clause changes
  const filteredChanges = useMemo(() => {
    if (!comparisonResult) return [];

    return comparisonResult.changes.filter((c) => {
      // Change Type Filter
      if (activeTypeFilter !== 'ALL') {
        const normChangeType = c.changeType.toUpperCase();
        if (normChangeType !== activeTypeFilter) return false;
      }

      // Category Filter
      if (activeCategoryFilter !== 'ALL') {
        if (c.category !== activeCategoryFilter) return false;
      }

      // Severity Filter
      if (activeSeverityFilter !== 'ALL') {
        if (c.severity !== activeSeverityFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.sectionTitle.toLowerCase().includes(q);
        const matchesNum = c.sectionNumber.toLowerCase().includes(q);
        const matchesExpl = c.explanation.toLowerCase().includes(q);
        const matchesImpact = c.legalImpact.toLowerCase().includes(q);
        const matchesOld = c.oldText ? c.oldText.toLowerCase().includes(q) : false;
        const matchesNew = c.newText ? c.newText.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesNum && !matchesExpl && !matchesImpact && !matchesOld && !matchesNew) {
          return false;
        }
      }

      return true;
    });
  }, [comparisonResult, activeTypeFilter, activeCategoryFilter, activeSeverityFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hidden file inputs */}
      <label htmlFor="file-input-doc-a" className="sr-only">Upload Baseline Document A</label>
      <input
        id="file-input-doc-a"
        type="file"
        ref={fileInputARef}
        onChange={handleFileSelectA}
        accept=".pdf,.docx"
        className="hidden"
        aria-label="Upload Baseline Document A"
      />
      <label htmlFor="file-input-doc-b" className="sr-only">Upload Revised Redline Document B</label>
      <input
        id="file-input-doc-b"
        type="file"
        ref={fileInputBRef}
        onChange={handleFileSelectB}
        accept=".pdf,.docx"
        className="hidden"
        aria-label="Upload Revised Redline Document B"
      />

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <GitCompare className="w-4 h-4" />
            <span>Redline & Version Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Compare Two Legal Documents
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Upload two contract revisions to align matching sections, track added and removed clauses, detect payment or deadline shifts, and evaluate legal exposure.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadDemo}
            disabled={isComparing || isExtractingA || isExtractingB}
            icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
          >
            Load Demo Comparison
          </Button>
          {comparisonResult && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              icon={<RotateCcw className="w-4 h-4 text-slate-500" />}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div role="alert" aria-live="assertive" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <h4 className="font-bold">Comparison Notice</h4>
            <p className="mt-0.5 text-rose-800">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Demo Banner */}
      {isDemoMode && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600" />
            <span>
              <strong>Demo Mode:</strong> Displaying benchmark Master Services Agreement v1.0 vs v2.0 comparison. Upload your own documents below to compare real legal files.
            </span>
          </div>
          <span className="bg-amber-200/70 text-amber-900 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
            Sample Redline
          </span>
        </div>
      )}

      {/* Two Upload Cards: Document A vs Document B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Document A (Baseline) */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all hover:border-slate-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                A
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Baseline Version
              </span>
            </div>
            {docA && (
              <span className="text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {docA.sections.length} Sections
              </span>
            )}
          </div>

          {isExtractingA ? (
            <div role="status" aria-live="polite" className="py-8 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                {progressA?.message || 'Extracting Document A...'}
              </p>
              <div className="w-48 bg-slate-100 rounded-full h-1.5 mx-auto overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressA?.percent || 20}%` }}
                />
              </div>
            </div>
          ) : docA ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate" title={docA.name}>
                    {docA.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Format: {docA.fileType} • Size: {docA.fileSize || 'Unknown'} • Pages: {docA.totalPages || 1}
                  </p>
                  <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                    Extracted text: {docA.rawText ? `${Math.round(docA.rawText.length / 1000)}k chars` : 'Ready'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Baseline ready
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputARef.current?.click()}
                >
                  Replace File
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/50">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Select Baseline Document (v1.0)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload PDF or DOCX file
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputARef.current?.click()}
                  icon={<UploadCloud className="w-3.5 h-3.5" />}
                >
                  Browse Document A
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSampleA}
                >
                  Use Sample Baseline
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Document B (Revised Redline) */}
        <div className="bg-white border-2 border-indigo-200/90 bg-indigo-50/10 rounded-2xl p-6 shadow-xs relative overflow-hidden transition-all hover:border-indigo-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs flex items-center justify-center font-bold">
                B
              </span>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Revised Redline Version
              </span>
            </div>
            {docB && (
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                {docB.sections.length} Sections
              </span>
            )}
          </div>

          {isExtractingB ? (
            <div role="status" aria-live="polite" className="py-8 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-800">
                {progressB?.message || 'Extracting Document B...'}
              </p>
              <div className="w-48 bg-slate-100 rounded-full h-1.5 mx-auto overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressB?.percent || 20}%` }}
                />
              </div>
            </div>
          ) : docB ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <FileDiff className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate" title={docB.name}>
                    {docB.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Format: {docB.fileType} • Size: {docB.fileSize || 'Unknown'} • Pages: {docB.totalPages || 1}
                  </p>
                  <span className="text-[11px] font-mono text-indigo-600 mt-1 block">
                    Extracted text: {docB.rawText ? `${Math.round(docB.rawText.length / 1000)}k chars` : 'Ready'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-indigo-700 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Revised draft ready
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputBRef.current?.click()}
                >
                  Replace File
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-6 border-2 border-dashed border-indigo-200/80 rounded-xl text-center space-y-3 bg-indigo-50/20">
              <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Select Revised Document (v2.0)
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload PDF or DOCX file
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputBRef.current?.click()}
                  icon={<UploadCloud className="w-3.5 h-3.5" />}
                >
                  Browse Document B
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSampleB}
                >
                  Use Sample Revised
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compare Action Button & Loading Bar */}
      {docA && docB && !comparisonResult && !isComparing && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Ready to execute AI legal comparison
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Comparing <strong>{docA.name}</strong> ({docA.sections.length} sections) against <strong>{docB.name}</strong> ({docB.sections.length} sections).
            </p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleRunComparison}
            icon={<Sparkles className="w-4 h-4" />}
            className="w-full sm:w-auto shadow-lg"
          >
            Run AI Redline Comparison
          </Button>
        </div>
      )}

      {/* Comparison In Progress Bar */}
      {isComparing && (
        <div role="status" aria-live="polite" className="p-8 rounded-2xl bg-white border-2 border-indigo-200/90 shadow-sm space-y-4 text-center">
          <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {compareProgress?.stage || 'Running Contract Redline Analysis...'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              LegalLens is aligning clauses, detecting modified obligations, and calculating risk shifts.
            </p>
          </div>
          <div className="max-w-md mx-auto bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${compareProgress?.percent || 30}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-400 block">
            {compareProgress?.percent || 30}% Complete
          </span>
        </div>
      )}

      {/* Comparison Results Section */}
      {comparisonResult && (
        <div className="space-y-8">
          {/* Executive Summary Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Redline Executive Summary
                </span>
              </div>
              <span className="text-[11px] font-mono bg-white/10 text-white/90 px-2.5 py-0.5 rounded-full">
                Redline Analysis Active
              </span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-indigo-50/95 font-medium">
              {comparisonResult.summary.executiveSummary}
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs text-indigo-200/80">
              <span>Baseline: <strong>{comparisonResult.documentA.fileName}</strong></span>
              <span>•</span>
              <span>Revised: <strong>{comparisonResult.documentB.fileName}</strong></span>
              <span>•</span>
              <span>Total Material Deltas: <strong>{comparisonResult.summary.totalChanges}</strong></span>
            </div>
          </div>

          {/* Metric Counters Banner (Interactive Filters) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              type="button"
              aria-pressed={activeTypeFilter === 'ALL'}
              onClick={() => setActiveTypeFilter('ALL')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeTypeFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              <span className={`text-[11px] uppercase tracking-wider block font-medium ${activeTypeFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'}`}>
                Total Deltas
              </span>
              <span className="text-2xl font-bold font-mono mt-0.5 block">
                {comparisonResult.summary.totalChanges}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={activeTypeFilter === 'ADDED'}
              onClick={() => setActiveTypeFilter('ADDED')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                activeTypeFilter === 'ADDED'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-700/20'
                  : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] uppercase tracking-wider block font-medium ${activeTypeFilter === 'ADDED' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  Added
                </span>
                <PlusCircle className={`w-3.5 h-3.5 ${activeTypeFilter === 'ADDED' ? 'text-white' : 'text-emerald-600'}`} aria-hidden="true" />
              </div>
              <span className="text-2xl font-bold font-mono mt-0.5 block">
                {comparisonResult.summary.addedCount}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={activeTypeFilter === 'MODIFIED'}
              onClick={() => setActiveTypeFilter('MODIFIED')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                activeTypeFilter === 'MODIFIED'
                  ? 'bg-amber-700 text-white border-amber-700 shadow-sm ring-2 ring-amber-700/20'
                  : 'bg-white border-slate-200 hover:border-amber-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] uppercase tracking-wider block font-medium ${activeTypeFilter === 'MODIFIED' ? 'text-amber-100' : 'text-amber-700'}`}>
                  Modified
                </span>
                <RefreshCw className={`w-3.5 h-3.5 ${activeTypeFilter === 'MODIFIED' ? 'text-white' : 'text-amber-600'}`} aria-hidden="true" />
              </div>
              <span className="text-2xl font-bold font-mono mt-0.5 block">
                {comparisonResult.summary.modifiedCount}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={activeTypeFilter === 'REMOVED'}
              onClick={() => setActiveTypeFilter('REMOVED')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                activeTypeFilter === 'REMOVED'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-sm ring-2 ring-rose-700/20'
                  : 'bg-white border-slate-200 hover:border-rose-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] uppercase tracking-wider block font-medium ${activeTypeFilter === 'REMOVED' ? 'text-rose-100' : 'text-rose-700'}`}>
                  Removed
                </span>
                <MinusCircle className={`w-3.5 h-3.5 ${activeTypeFilter === 'REMOVED' ? 'text-white' : 'text-rose-600'}`} aria-hidden="true" />
              </div>
              <span className="text-2xl font-bold font-mono mt-0.5 block">
                {comparisonResult.summary.removedCount}
              </span>
            </button>

            <button
              type="button"
              aria-pressed={activeTypeFilter === 'UNCHANGED'}
              onClick={() => setActiveTypeFilter('UNCHANGED')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 ${
                activeTypeFilter === 'UNCHANGED'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-sm ring-2 ring-slate-700/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] uppercase tracking-wider block font-medium ${activeTypeFilter === 'UNCHANGED' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Unchanged
                </span>
                <FileText className={`w-3.5 h-3.5 ${activeTypeFilter === 'UNCHANGED' ? 'text-white' : 'text-slate-400'}`} aria-hidden="true" />
              </div>
              <span className="text-2xl font-bold font-mono mt-0.5 block">
                {comparisonResult.summary.unchangedCount}
              </span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div role="tablist" aria-label="Comparison View Options" className="flex border-b border-slate-200 overflow-x-auto">
            <button
              type="button"
              role="tab"
              id="comp-tab-redline"
              aria-selected={activeTab === 'redline'}
              aria-controls="comp-panel-redline"
              tabIndex={activeTab === 'redline' ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 0)}
              onClick={() => setActiveTab('redline')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeTab === 'redline'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Visual Redline & Clauses ({comparisonResult.changes.length})
            </button>
            <button
              type="button"
              role="tab"
              id="comp-tab-key-changes"
              aria-selected={activeTab === 'key-changes'}
              aria-controls="comp-panel-key-changes"
              tabIndex={activeTab === 'key-changes' ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 1)}
              onClick={() => setActiveTab('key-changes')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeTab === 'key-changes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Material Shifts & Risks ({comparisonResult.keyChanges.length + comparisonResult.riskChanges.length})
            </button>
            <button
              type="button"
              role="tab"
              id="comp-tab-terms"
              aria-selected={activeTab === 'terms'}
              aria-controls="comp-panel-terms"
              tabIndex={activeTab === 'terms' ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 2)}
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeTab === 'terms'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Obligations & Deadlines ({comparisonResult.changedObligations.length + comparisonResult.changedDeadlines.length})
            </button>
            <button
              type="button"
              role="tab"
              id="comp-tab-checklist"
              aria-selected={activeTab === 'checklist'}
              aria-controls="comp-panel-checklist"
              tabIndex={activeTab === 'checklist' ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, 3)}
              onClick={() => setActiveTab('checklist')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activeTab === 'checklist'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Checklist & Lawyer Questions ({comparisonResult.actionChecklist.length + comparisonResult.lawyerQuestions.length})
            </button>
          </div>

          {/* TAB 1: Visual Redline Cards */}
          {activeTab === 'redline' && (
            <div id="comp-panel-redline" role="tabpanel" aria-labelledby="comp-tab-redline" tabIndex={0} className="space-y-6 focus:outline-none">
              {/* Search & Secondary Filter Toolbar */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <label htmlFor="comp-clause-search" className="sr-only">Search comparison clauses</label>
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    id="comp-clause-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clause text, title, or legal explanation..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear clause search query"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Category Filter */}
                  <label htmlFor="comp-category-select" className="sr-only">Filter by category</label>
                  <select
                    id="comp-category-select"
                    value={activeCategoryFilter}
                    onChange={(e) => setActiveCategoryFilter(e.target.value)}
                    className="text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="TERMINATION">Termination</option>
                    <option value="LIABILITY">Liability</option>
                    <option value="CONFIDENTIALITY">Confidentiality</option>
                    <option value="OBLIGATION">Obligations</option>
                    <option value="DEADLINE">Deadlines</option>
                    <option value="RESTRICTION">Restrictions</option>
                    <option value="GOVERNING_LAW">Governing Law</option>
                    <option value="RENEWAL">Renewal</option>
                    <option value="GENERAL">General</option>
                  </select>

                  {/* Severity Filter */}
                  <label htmlFor="comp-severity-select" className="sr-only">Filter by severity</label>
                  <select
                    id="comp-severity-select"
                    value={activeSeverityFilter}
                    onChange={(e) => setActiveSeverityFilter(e.target.value)}
                    className="text-xs px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="LOW">Low</option>
                    <option value="INFORMATIONAL">Informational</option>
                  </select>

                  {(activeTypeFilter !== 'ALL' || activeCategoryFilter !== 'ALL' || activeSeverityFilter !== 'ALL' || searchQuery) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveTypeFilter('ALL');
                        setActiveCategoryFilter('ALL');
                        setActiveSeverityFilter('ALL');
                        setSearchQuery('');
                      }}
                      className="text-xs text-indigo-600 shrink-0"
                    >
                      Reset Filters
                    </Button>
                  )}
                </div>
              </div>

              {/* Clause List Count */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Displaying <strong>{filteredChanges.length}</strong> of <strong>{comparisonResult.changes.length}</strong> clauses
                </span>
                {activeTypeFilter !== 'ALL' && (
                  <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Filter: {activeTypeFilter}
                  </span>
                )}
              </div>

              {/* Clause Cards */}
              {filteredChanges.length === 0 ? (
                <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-2">
                  <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">No matching clauses found</h4>
                  <p className="text-xs text-slate-500">
                    Try adjusting your search query, change type filter, or category selection.
                  </p>
                </div>
              ) : (
                filteredChanges.map((change) => (
                  <div
                    key={change.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                  >
                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <ComparisonBadge type={change.changeType} />
                        <span className="font-mono text-xs font-bold text-slate-500">
                          {change.sectionNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {change.sectionTitle}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={change.category} size="sm" />
                        <ImportanceBadge level={change.severity} size="sm" />
                      </div>
                    </div>

                    {/* Change Explanations & Legal Impact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                        <span className="font-bold text-slate-700 block mb-1">
                          Plain-English Change Summary:
                        </span>
                        <p className="text-slate-600 leading-relaxed">{change.explanation}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-950">
                        <span className="font-bold text-indigo-900 block mb-1">
                          Legal & Commercial Exposure Impact:
                        </span>
                        <p className="text-indigo-900/90 leading-relaxed">{change.legalImpact}</p>
                      </div>
                    </div>

                    {/* Action Required if present */}
                    {change.actionRequired && (
                      <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Action / Verification Recommendation:</strong> {change.actionRequired}
                        </div>
                      </div>
                    )}

                    {/* Side-by-side Redline Snippets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      {/* Document A (Baseline) */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                        change.changeType === 'REMOVED'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-2">
                            <span>Document A (Baseline)</span>
                            {change.changeType === 'REMOVED' && (
                              <span className="text-rose-600 font-semibold flex items-center gap-1">
                                <MinusCircle className="w-3 h-3" /> Deleted
                              </span>
                            )}
                          </div>
                          <div className="leading-relaxed whitespace-pre-wrap">
                            {change.oldText ? (
                              change.oldText
                            ) : (
                              <span className="text-slate-400 italic font-sans text-xs">
                                [Clause did not exist in baseline agreement]
                              </span>
                            )}
                          </div>
                        </div>

                        {change.oldText && (
                          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between font-sans text-[11px] text-slate-400">
                            <span>{change.pageNumberA ? `Page ${change.pageNumberA}` : 'Baseline Text'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(change.oldText || '', `old-${change.id}`)}
                              aria-label={`Copy Baseline text for ${change.sectionTitle}`}
                              className="hover:text-slate-700 flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded px-1"
                            >
                              {copiedId === `old-${change.id}` ? (
                                <><Check className="w-3 h-3 text-emerald-600" /> Copied</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy</>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Document B (Revised Redline) */}
                      <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                        change.changeType === 'ADDED'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                          : change.changeType === 'MODIFIED'
                          ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-2">
                            <span>Document B (Revised Redline)</span>
                            {change.changeType === 'ADDED' && (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <PlusCircle className="w-3 h-3" /> Newly Inserted
                              </span>
                            )}
                            {change.changeType === 'MODIFIED' && (
                              <span className="text-amber-700 font-semibold flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" /> Modified
                              </span>
                            )}
                          </div>
                          <div className="leading-relaxed whitespace-pre-wrap">
                            {change.newText ? (
                              change.newText
                            ) : (
                              <span className="text-slate-400 italic font-sans text-xs">
                                [Clause was completely removed in revised draft]
                              </span>
                            )}
                          </div>
                        </div>

                        {change.newText && (
                          <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between font-sans text-[11px] text-slate-400">
                            <span>{change.pageNumberB ? `Page ${change.pageNumberB}` : 'Revised Text'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(change.newText || '', `new-${change.id}`)}
                              aria-label={`Copy Revised Redline text for ${change.sectionTitle}`}
                              className="hover:text-slate-700 flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded px-1"
                            >
                              {copiedId === `new-${change.id}` ? (
                                <><Check className="w-3 h-3 text-emerald-600" /> Copied</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Copy</>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Material Shifts & Risk Changes */}
          {activeTab === 'key-changes' && (
            <div id="comp-panel-key-changes" role="tabpanel" aria-labelledby="comp-tab-key-changes" tabIndex={0} className="space-y-6 focus:outline-none">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Substantive Material Modifications ({comparisonResult.keyChanges.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Core contractual provisions with substantive commercial or operational shifts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparisonResult.keyChanges.map((kc) => (
                  <div key={kc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500">{kc.clauseRef}</span>
                      <div className="flex items-center gap-1.5">
                        <CategoryBadge category={kc.category} size="sm" />
                        <ImportanceBadge level={kc.severity} size="sm" />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{kc.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{kc.description}</p>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-200">
                <h3 className="text-base font-bold text-slate-900">
                  Risk Shifts & Legal Exposure Changes ({comparisonResult.riskChanges.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provisions where liability, warranties, or remedies shifted significantly between versions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparisonResult.riskChanges.map((rc) => (
                  <div key={rc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500">{rc.clauseRef}</span>
                      <ImportanceBadge level={rc.severity} size="sm" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">{rc.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{rc.description}</p>
                    <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950">
                      <strong>Recommended Mitigation:</strong> {rc.mitigation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Obligations & Deadlines */}
          {activeTab === 'terms' && (
            <div id="comp-panel-terms" role="tabpanel" aria-labelledby="comp-tab-terms" tabIndex={0} className="space-y-6 focus:outline-none">
              {/* Changed Obligations */}
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Altered Contractual Obligations ({comparisonResult.changedObligations.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shifts in duties, performance standards, or deliverables.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="divide-y divide-slate-100">
                  {comparisonResult.changedObligations.map((ob, idx) => (
                    <div key={idx} className="p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                          Party: {ob.party}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-500">{ob.clauseRef}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Baseline Obligation</span>
                          <p className="text-slate-700">{ob.oldObligation || '[None defined]'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
                          <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-0.5">Revised Obligation</span>
                          <p className="text-indigo-950">{ob.newObligation || '[Removed]'}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 pt-1">
                        <strong>Impact:</strong> {ob.impact}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Changed Deadlines & Financials */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* Changed Deadlines */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Changed Deadlines ({comparisonResult.changedDeadlines.length})
                  </h4>
                  <div className="space-y-3">
                    {comparisonResult.changedDeadlines.map((dl, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-900">{dl.title}</h5>
                          <span className="font-mono text-slate-400">{dl.clauseRef}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="line-through text-slate-400">{dl.oldDeadline || 'N/A'}</span>
                          <ArrowRight className="w-3 h-3 text-indigo-600 shrink-0" />
                          <span className="font-bold text-indigo-700">{dl.newDeadline || 'Deleted'}</span>
                        </div>
                        <p className="text-slate-500">{dl.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Changed Financial Terms */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Changed Financial Terms ({comparisonResult.changedFinancialTerms.length})
                  </h4>
                  <div className="space-y-3">
                    {comparisonResult.changedFinancialTerms.map((fin, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-900">{fin.item}</h5>
                          <span className="font-mono text-slate-400">{fin.clauseRef}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="line-through text-slate-400">{fin.oldValue || 'None'}</span>
                          <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-bold text-emerald-700">{fin.newValue || 'Deleted'}</span>
                        </div>
                        <p className="text-slate-500">{fin.impact}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Checklist & Lawyer Questions */}
          {activeTab === 'checklist' && (
            <div id="comp-panel-checklist" role="tabpanel" aria-labelledby="comp-tab-checklist" tabIndex={0} className="grid grid-cols-1 lg:grid-cols-2 gap-6 focus:outline-none">
              {/* Action Checklist */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    Redline Action Checklist
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recommended operational and verification tasks before signing.
                  </p>
                </div>

                <div className="space-y-3">
                  {comparisonResult.actionChecklist.map((act) => {
                    const isDone = completedTasks[act.id] ?? act.completed;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        role="checkbox"
                        aria-checked={isDone}
                        onClick={() => handleToggleTask(act.id)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            handleToggleTask(act.id);
                          }
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          isDone
                            ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0 text-indigo-600">
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {act.task}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400 shrink-0 ml-2">
                                {act.clauseRef}
                              </span>
                            </div>
                            {act.notes && (
                              <p className="text-slate-500 text-[11px]">{act.notes}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lawyer Questions */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    Key Counsel Discussion Questions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Strategic legal questions grounded in the observed redline modifications.
                  </p>
                </div>

                <div className="space-y-3">
                  {comparisonResult.lawyerQuestions.map((lq) => (
                    <div key={lq.id} className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {lq.clauseRef}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 leading-snug">
                        {lq.question}
                      </h4>
                      <p className="text-slate-600 text-[11px]">
                        <strong>Context:</strong> {lq.context}
                      </p>
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <strong>Strategic Reason:</strong> {lq.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Legal Disclaimer Footer */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 text-xs flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{comparisonResult.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
};
