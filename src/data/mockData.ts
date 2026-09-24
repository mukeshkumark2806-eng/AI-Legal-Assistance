import type { LegalDocument, ComparisonData } from '../types/document';

export const SAMPLE_MSA: LegalDocument = {
  id: 'doc-msa-2025',
  name: 'Master Services Agreement (CloudScale & Apex)',
  fileType: 'PDF',
  fileSize: '1.4 MB',
  uploadDate: 'March 14, 2025',
  totalPages: 7,
  jurisdiction: 'State of Delaware, United States',
  parties: {
    client: 'Apex Enterprises LLC ("Client")',
    counterparty: 'CloudScale Technologies Inc. ("Provider")',
  },
  summary: 'A commercial technology and managed cloud infrastructure agreement establishing service levels, compensation schedules, intellectual property rights, and termination obligations between Provider and Client.',
  overallRisk: 'Moderate',
  sections: [
    {
      id: 'sec-1',
      sectionNumber: '1.0',
      title: 'Provision of Services and Scope of Work',
      paragraphs: [
        '1.1 Provider agrees to deliver the cloud hosting, maintenance, and technical consulting services described in Statement of Work No. 1 (the "Services"). Provider shall perform all Services in accordance with the specifications, timelines, and architectural milestones set forth therein.',
        '1.2 Client shall provide timely access to necessary credentialing, environment configurations, and technical liaisons required for Provider to fulfill its service delivery commitments.'
      ],
      clauseIds: ['cl-1']
    },
    {
      id: 'sec-2',
      sectionNumber: '2.0',
      title: 'Service Levels and Uptime Warranties',
      paragraphs: [
        '2.1 Provider warrants a 99.9% monthly service availability for critical hosting infrastructure ("SLA Commitment"). In the event availability falls below 99.9% in any calendar month, Client shall be entitled to service credits calculated pursuant to Schedule B.',
        '2.2 Service credit claims must be submitted within thirty (30) days following the conclusion of the calendar month in which the outage occurred. Failure to submit within said timeframe constitutes a waiver of credit remedies.'
      ],
      clauseIds: ['cl-2', 'cl-3']
    },
    {
      id: 'sec-3',
      sectionNumber: '3.0',
      title: 'Term, Renewal, and Opt-Out Requirements',
      paragraphs: [
        '3.1 Initial Term. This Agreement commences on the Effective Date (April 1, 2025) and shall continue for an initial period of twenty-four (24) months ("Initial Term").',
        '3.2 Automatic Renewal. Upon expiration of the Initial Term, this Agreement shall automatically renew for successive twelve (12) month periods unless either party delivers written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term.'
      ],
      clauseIds: ['cl-4', 'cl-5']
    },
    {
      id: 'sec-4',
      sectionNumber: '4.0',
      title: 'Fees, Invoicing, and Payment Obligations',
      paragraphs: [
        '4.1 Base Compensation. Client shall pay Provider a recurring monthly service fee of $18,500.00 USD, payable on the first day of each calendar month.',
        '4.2 Payment Terms and Penalties. All undisputed invoices are due within thirty (30) calendar days from the invoice date (Net 30). Late payments shall accrue interest at the rate of one and one-half percent (1.5%) per month or the maximum statutory rate permitted by law, whichever is less.',
        '4.3 In the event Client fails to cure any delinquent balance within fifteen (15) days of written notice, Provider reserves the right to suspend platform access without liability.'
      ],
      clauseIds: ['cl-6', 'cl-7', 'cl-8']
    },
    {
      id: 'sec-5',
      sectionNumber: '5.0',
      title: 'Intellectual Property and Work Product',
      paragraphs: [
        '5.1 Pre-existing IP. Each party retains sole and exclusive ownership of its pre-existing intellectual property, patents, trade secrets, and proprietary tools developed prior to this Agreement.',
        '5.2 Custom Deliverables. All custom software configurations and custom workflow scripts specifically developed for Client under a paid Statement of Work shall constitute "Work Made for Hire" upon receipt of full and final payment by Provider.'
      ],
      clauseIds: ['cl-9']
    },
    {
      id: 'sec-6',
      sectionNumber: '6.0',
      title: 'Confidentiality and Restrictive Covenants',
      paragraphs: [
        '6.1 Protection of Confidential Information. Each party agrees to hold the other party\'s Confidential Information in strict confidence, exercising at least the same standard of care used to safeguard its own proprietary information, but no less than reasonable care.',
        '6.2 Non-Solicitation. During the term of this Agreement and for a period of twelve (12) months thereafter, neither party shall actively solicit or hire any employee or contractor of the other party directly engaged in the performance of this Agreement without express written consent.'
      ],
      clauseIds: ['cl-10', 'cl-11']
    },
    {
      id: 'sec-7',
      sectionNumber: '7.0',
      title: 'Indemnification and Defense',
      paragraphs: [
        '7.1 Provider Indemnity. Provider shall defend, indemnify, and hold harmless Client from and against third-party claims alleging that the standard Services infringe any registered United States patent, copyright, or trademark.',
        '7.2 Client Data Indemnity. Client shall indemnify and defend Provider against any third-party claims arising out of unauthorized, unlawful, or infringing data ingested or transmitted by Client through the hosted environment.'
      ],
      clauseIds: ['cl-12']
    },
    {
      id: 'sec-8',
      sectionNumber: '8.0',
      title: 'Limitation of Liability and Consequential Damages',
      paragraphs: [
        '8.1 Consequential Damages Waiver. IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS OR DATA.',
        '8.2 Aggregate Cap. The total aggregate liability of either party arising out of or related to this Agreement shall not exceed the total fees actually paid by Client to Provider in the twelve (12) months preceding the incident giving rise to the claim.'
      ],
      clauseIds: ['cl-13']
    },
    {
      id: 'sec-9',
      sectionNumber: '9.0',
      title: 'Termination for Cause and Convenience',
      paragraphs: [
        '9.1 Termination for Material Breach. Either party may terminate this Agreement if the other party breaches any material term and fails to cure such breach within thirty (30) days of receiving written notice specifying the default.',
        '9.2 Termination for Convenience. Client may terminate this Agreement without cause upon ninety (90) days prior written notice, subject to an early termination fee equal to three (3) months of the base monthly service fee.'
      ],
      clauseIds: ['cl-14', 'cl-15']
    },
    {
      id: 'sec-10',
      sectionNumber: '10.0',
      title: 'Governing Law and Dispute Resolution',
      paragraphs: [
        '10.1 This Agreement shall be governed by, and construed in accordance with, the laws of the State of Delaware, without regard to its conflict of laws principles.',
        '10.2 Mandatory Arbitration. Any controversy or claim arising out of or relating to this contract shall be settled by binding arbitration administered by the American Arbitration Association in Wilmington, Delaware.'
      ],
      clauseIds: ['cl-16']
    }
  ],
  clauses: [
    {
      id: 'cl-1',
      sectionNumber: '1.2',
      title: 'Client Cooperation & Access Obligation',
      category: 'Obligation',
      importance: 'Medium',
      originalText: 'Client shall provide timely access to necessary credentialing, environment configurations, and technical liaisons required for Provider to fulfill its service delivery commitments.',
      plainEnglishExplanation: 'You are legally required to furnish CloudScale with technical credentials and staff contacts in a timely manner. Delays in providing access could excuse delivery delays on their end.',
      pageNumber: 1
    },
    {
      id: 'cl-2',
      sectionNumber: '2.1',
      title: 'Uptime Warranty & SLA Credits',
      category: 'Important',
      importance: 'High',
      originalText: 'Provider warrants a 99.9% monthly service availability for critical hosting infrastructure ("SLA Commitment"). In the event availability falls below 99.9% in any calendar month, Client shall be entitled to service credits calculated pursuant to Schedule B.',
      plainEnglishExplanation: 'The provider guarantees 99.9% uptime (roughly 43 minutes maximum allowed unplanned downtime per month). If they fail, your only recourse is service credits toward future bills, not cash refunds.',
      pageNumber: 2
    },
    {
      id: 'cl-3',
      sectionNumber: '2.2',
      title: 'Strict 30-Day Credit Waiver Deadline',
      category: 'Deadline',
      importance: 'High',
      originalText: 'Service credit claims must be submitted within thirty (30) days following the conclusion of the calendar month in which the outage occurred. Failure to submit within said timeframe constitutes a waiver of credit remedies.',
      plainEnglishExplanation: 'You have only 30 days after the end of the month to file an outage credit claim. If you miss this window, you permanently lose the right to any rebate or compensation for that downtime.',
      pageNumber: 2,
      riskNote: 'Strict forfeiture clause: Requires proactive calendar tracking of any platform interruptions.'
    },
    {
      id: 'cl-4',
      sectionNumber: '3.1',
      title: 'Two-Year Minimum Term Commitment',
      category: 'Obligation',
      importance: 'Medium',
      originalText: 'Initial Term. This Agreement commences on the Effective Date (April 1, 2025) and shall continue for an initial period of twenty-four (24) months ("Initial Term").',
      plainEnglishExplanation: 'You are entering into a binding 24-month commitment running from April 1, 2025 through March 31, 2027.',
      pageNumber: 2
    },
    {
      id: 'cl-5',
      sectionNumber: '3.2',
      title: 'Automatic 12-Month Renewal (Opt-Out Window)',
      category: 'Termination',
      importance: 'Critical',
      originalText: 'Automatic Renewal. Upon expiration of the Initial Term, this Agreement shall automatically renew for successive twelve (12) month periods unless either party delivers written notice of non-renewal at least sixty (60) days prior to the expiration of the then-current term.',
      plainEnglishExplanation: 'The contract will automatically renew for another full year unless you send formal written cancellation at least 60 days before March 31, 2027 (deadline: January 30, 2027).',
      pageNumber: 2,
      riskNote: 'High risk of accidental renewal if notice deadline is not tracked in your corporate calendar.'
    },
    {
      id: 'cl-6',
      sectionNumber: '4.1',
      title: 'Monthly Recurring Service Fee ($18,500/mo)',
      category: 'Payment',
      importance: 'High',
      originalText: 'Base Compensation. Client shall pay Provider a recurring monthly service fee of $18,500.00 USD, payable on the first day of each calendar month.',
      plainEnglishExplanation: 'Your core financial obligation is $18,500 per month ($222,000 annually), due on the 1st of every month.',
      pageNumber: 3
    },
    {
      id: 'cl-7',
      sectionNumber: '4.2',
      title: 'Net 30 Invoicing & 1.5% Monthly Penalty',
      category: 'Payment',
      importance: 'Medium',
      originalText: 'All undisputed invoices are due within thirty (30) calendar days from the invoice date (Net 30). Late payments shall accrue interest at the rate of one and one-half percent (1.5%) per month or the maximum statutory rate permitted by law, whichever is less.',
      plainEnglishExplanation: 'Invoices must be paid within 30 days. Overdue balances incur an 18% annualized interest charge (1.5% monthly compound penalty).',
      pageNumber: 3
    },
    {
      id: 'cl-8',
      sectionNumber: '4.3',
      title: 'Platform Suspension Right for Overdue Accounts',
      category: 'Restriction',
      importance: 'High',
      originalText: 'In the event Client fails to cure any delinquent balance within fifteen (15) days of written notice, Provider reserves the right to suspend platform access without liability.',
      plainEnglishExplanation: 'If an invoice remains unpaid 15 days after notice, CloudScale can shut down your systems without being liable for any resulting business downtime.',
      pageNumber: 3,
      riskNote: 'Operational risk: 15-day notice window is relatively short for enterprise billing cycles.'
    },
    {
      id: 'cl-9',
      sectionNumber: '5.2',
      title: 'IP Transfer Contingent on Full Payment',
      category: 'Obligation',
      importance: 'High',
      originalText: 'Custom Deliverables. All custom software configurations and custom workflow scripts specifically developed for Client under a paid Statement of Work shall constitute "Work Made for Hire" upon receipt of full and final payment by Provider.',
      plainEnglishExplanation: 'You do not own custom scripts or integrations created for you until every dollar owed to Provider is paid in full.',
      pageNumber: 4
    },
    {
      id: 'cl-10',
      sectionNumber: '6.2',
      title: '12-Month Post-Termination Non-Solicitation',
      category: 'Restriction',
      importance: 'Medium',
      originalText: 'During the term of this Agreement and for a period of twelve (12) months thereafter, neither party shall actively solicit or hire any employee or contractor of the other party directly engaged in the performance of this Agreement without express written consent.',
      plainEnglishExplanation: 'Neither party can recruit or hire the other company\'s staff who worked on this project for the duration of the agreement plus one year after it ends.',
      pageNumber: 4
    },
    {
      id: 'cl-11',
      sectionNumber: '6.1',
      title: 'Mutual Confidentiality Obligations',
      category: 'Obligation',
      importance: 'Medium',
      originalText: 'Each party agrees to hold the other party\'s Confidential Information in strict confidence, exercising at least the same standard of care used to safeguard its own proprietary information, but no less than reasonable care.',
      plainEnglishExplanation: 'Both companies are mutually bound to maintain strict secrecy regarding non-public proprietary information and data.',
      pageNumber: 4
    },
    {
      id: 'cl-12',
      sectionNumber: '7.2',
      title: 'Client Data Indemnification Exposure',
      category: 'Important',
      importance: 'Critical',
      originalText: 'Client shall indemnify and defend Provider against any third-party claims arising out of unauthorized, unlawful, or infringing data ingested or transmitted by Client through the hosted environment.',
      plainEnglishExplanation: 'If third parties sue CloudScale over content or data that your company uploads into their platform, you must pay all legal fees and damage awards.',
      pageNumber: 5,
      riskNote: 'Verify that your cyber-liability insurance covers this third-party indemnity burden.'
    },
    {
      id: 'cl-13',
      sectionNumber: '8.2',
      title: '12-Month Aggregate Liability Cap',
      category: 'Important',
      importance: 'High',
      originalText: 'The total aggregate liability of either party arising out of or related to this Agreement shall not exceed the total fees actually paid by Client to Provider in the twelve (12) months preceding the incident giving rise to the claim.',
      plainEnglishExplanation: 'If either party breaches or causes catastrophic failure, the maximum financial recovery is capped at 12 months of paid fees ($222,000).',
      pageNumber: 5
    },
    {
      id: 'cl-14',
      sectionNumber: '9.1',
      title: '30-Day Cure Period for Material Breach',
      category: 'Termination',
      importance: 'Medium',
      originalText: 'Either party may terminate this Agreement if the other party breaches any material term and fails to cure such breach within thirty (30) days of receiving written notice specifying the default.',
      plainEnglishExplanation: 'If either party violates a major contract term, they must be given a written warning and 30 full days to fix the violation before cancellation.',
      pageNumber: 6
    },
    {
      id: 'cl-15',
      sectionNumber: '9.2',
      title: 'Termination for Convenience & 3-Month Fee',
      category: 'Termination',
      importance: 'High',
      originalText: 'Client may terminate this Agreement without cause upon ninety (90) days prior written notice, subject to an early termination fee equal to three (3) months of the base monthly service fee.',
      plainEnglishExplanation: 'You may end the agreement early without showing fault, but you must provide 90 days notice and pay an early exit penalty of $55,500 (3 months x $18,500).',
      pageNumber: 6,
      riskNote: 'Financial penalty: Ending this contract early carries a fixed cash penalty of $55,500.'
    },
    {
      id: 'cl-16',
      sectionNumber: '10.2',
      title: 'Mandatory Binding Arbitration in Delaware',
      category: 'Restriction',
      importance: 'Medium',
      originalText: 'Any controversy or claim arising out of or relating to this contract shall be settled by binding arbitration administered by the American Arbitration Association in Wilmington, Delaware.',
      plainEnglishExplanation: 'You waive your right to a public jury trial; any legal dispute must be handled in private binding arbitration in Wilmington, Delaware.',
      pageNumber: 6
    }
  ],
  analysis: {
    overview: {
      executiveSummary: 'This Master Services Agreement governs managed cloud infrastructure services provided by CloudScale Technologies to Apex Enterprises. The agreement features a firm 24-month term with automatic 12-month renewal cycles, fixed monthly remuneration of $18,500, a mutual 12-month liability cap, and binding Delaware arbitration.',
      documentType: 'Commercial Master Services Agreement (MSA)',
      effectiveDate: 'April 1, 2025',
      termLength: '24 Months (Exp: March 31, 2027) with auto-renewal',
      governingLaw: 'Delaware, United States',
      disputeResolution: 'Binding AAA Arbitration in Wilmington, Delaware'
    },
    keyObligations: [
      {
        id: 'ob-1',
        party: 'Client',
        description: 'Provide timely credentials, network access, and designated technical liaisons to enable infrastructure deployment.',
        clauseRef: 'Section 1.2',
        importance: 'Medium'
      },
      {
        id: 'ob-2',
        party: 'Client',
        description: 'Pay base recurring service fee of $18,500 monthly on the 1st of each month via Net 30 terms.',
        clauseRef: 'Section 4.1 & 4.2',
        importance: 'High'
      },
      {
        id: 'ob-3',
        party: 'Client',
        description: 'Deliver written non-renewal notice at least 60 days before March 31, 2027 to prevent automatic extension.',
        clauseRef: 'Section 3.2',
        deadline: 'January 30, 2027',
        importance: 'Critical'
      },
      {
        id: 'ob-4',
        party: 'Counterparty',
        description: 'Maintain 99.9% monthly uptime availability across all covered hosting infrastructure.',
        clauseRef: 'Section 2.1',
        importance: 'High'
      },
      {
        id: 'ob-5',
        party: 'Mutual',
        description: 'Maintain strict confidentiality of proprietary specifications and trade secrets for the full contract term.',
        clauseRef: 'Section 6.1',
        importance: 'Medium'
      },
      {
        id: 'ob-6',
        party: 'Mutual',
        description: 'Refrain from soliciting or hiring personnel engaged on the project during the term plus 12 months post-expiry.',
        clauseRef: 'Section 6.2',
        importance: 'Medium'
      }
    ],
    importantDates: [
      {
        id: 'date-1',
        title: 'Effective Start Date',
        date: 'April 1, 2025',
        type: 'Effective',
        clauseRef: 'Section 3.1',
        description: 'Commencement of services, billing cycle, and initial 24-month term commitment.'
      },
      {
        id: 'date-2',
        title: 'Initial Term Expiration',
        date: 'March 31, 2027',
        type: 'Termination',
        clauseRef: 'Section 3.1',
        description: 'Conclusion of the initial 24-month term unless renewed or terminated earlier.'
      },
      {
        id: 'date-3',
        title: 'Non-Renewal Written Notice Cutoff',
        date: 'January 30, 2027',
        type: 'Deadline',
        clauseRef: 'Section 3.2',
        description: 'Strict 60-day advance notice required to prevent automatic 12-month extension through March 2028.'
      },
      {
        id: 'date-4',
        title: 'Monthly Invoicing Due Date',
        date: '1st of each calendar month (Net 30)',
        type: 'Deadline',
        clauseRef: 'Section 4.1',
        isRecurring: true,
        description: 'Recurring payment due date for $18,500 base fee.'
      },
      {
        id: 'date-5',
        title: 'SLA Outage Credit Filing Window',
        date: 'Within 30 days of month end',
        type: 'Deadline',
        clauseRef: 'Section 2.2',
        isRecurring: true,
        description: 'Outage rebate claims must be filed before month-end + 30 days or credit is forfeited.'
      }
    ],
    financialCommitments: [
      {
        id: 'fin-1',
        item: 'Monthly Platform & Cloud Services Retainer',
        amount: '$18,500.00 / month',
        schedule: 'Due 1st of month (Net 30 days)',
        clauseRef: 'Section 4.1',
        penaltyTerms: '1.5% monthly late interest accrual after 30 days',
        importance: 'High'
      },
      {
        id: 'fin-2',
        item: 'Total Initial 24-Month Term Commitment',
        amount: '$444,000.00 USD total',
        schedule: 'Cumulative minimum contract value',
        clauseRef: 'Section 3.1 & 4.1',
        importance: 'Critical'
      },
      {
        id: 'fin-3',
        item: 'Early Termination for Convenience Fee',
        amount: '$55,500.00 USD',
        schedule: 'Payable upon 90-day early cancellation notice',
        clauseRef: 'Section 9.2',
        penaltyTerms: 'Calculated as 3 months x $18,500 base fee',
        importance: 'High'
      },
      {
        id: 'fin-4',
        item: 'Mutual Aggregate Liability Ceiling',
        amount: '$222,000.00 USD (12-Month Trailing Fees)',
        schedule: 'Capped claim limit',
        clauseRef: 'Section 8.2',
        importance: 'Medium'
      }
    ],
    potentialConcerns: [
      {
        id: 'con-1',
        title: 'Automatic 12-Month Evergreen Renewal Clause',
        severity: 'High',
        clauseRef: 'Section 3.2',
        description: 'Contract automatically locks in another full year ($222,000 commitment) unless written notice is given at least 60 days prior to March 31, 2027.',
        mitigationAdvice: 'Set multiple calendar reminders starting 90 days before the January 30, 2027 cutoff to conduct an executive review of vendor utility.'
      },
      {
        id: 'con-2',
        title: '15-Day Service Suspension on Disputed Invoices',
        severity: 'High',
        clauseRef: 'Section 4.3',
        description: 'CloudScale may shut down platform hosting access with only 15 days written notice if an invoice remains unpaid, without explicit exception for good-faith disputed amounts.',
        mitigationAdvice: 'Propose an amendment explicitly carving out "amounts subject to a good-faith billing dispute" from triggering suspension rights.'
      },
      {
        id: 'con-3',
        title: 'Strict 30-Day Forfeiture of SLA Downtime Credits',
        severity: 'Medium',
        clauseRef: 'Section 2.2',
        description: 'If you fail to claim SLA rebate credits within 30 days of the end of the month in which downtime occurred, the right to credit is permanently waived.',
        mitigationAdvice: 'Implement an automated server uptime logging integration that notifies internal IT to file credit requests within 5 business days of any incident.'
      },
      {
        id: 'con-4',
        title: 'Uncapped Consequential Damages Carve-out Ambiguity',
        severity: 'Medium',
        clauseRef: 'Section 8.1 & 7.2',
        description: 'While Section 8.1 excludes indirect damages, indemnification obligations under Section 7.2 may expose Client to unbounded third-party claims.',
        mitigationAdvice: 'Ensure your enterprise cyber liability insurance covers third-party indemnification obligations in SaaS environments.'
      }
    ],
    questionsToConsider: [
      {
        id: 'q-1',
        question: 'Can we amend the automatic renewal to require affirmative mutual agreement rather than automatic extension?',
        category: 'Contract Term',
        clauseRef: 'Section 3.2',
        rationale: 'Evergreen automatic renewals carry significant financial risk if contract administration transitions between internal personnel.'
      },
      {
        id: 'q-2',
        question: 'Should we negotiate cash refunds for catastrophic SLA outages exceeding 99.0% downtime rather than only future service credits?',
        category: 'Remedies',
        clauseRef: 'Section 2.1',
        rationale: 'Service credits are of negligible value if vendor unreliability forces you to migrate to an alternative host.'
      },
      {
        id: 'q-3',
        question: 'Can the 15-day platform suspension notice period be extended to 30 business days?',
        category: 'Operational Risk',
        clauseRef: 'Section 4.3',
        rationale: 'Enterprise accounts payable reconciliation frequently takes up to 21 days; a 15-day window poses unwarranted operational risk.'
      },
      {
        id: 'q-4',
        question: 'Does our internal compliance team approve binding Delaware arbitration over local court litigation?',
        category: 'Legal Venue',
        clauseRef: 'Section 10.2',
        rationale: 'Arbitration requires paying arbitrator fees and limits appeal rights compared to judicial dispute proceedings.'
      }
    ]
  },
  checklist: [
    {
      id: 'chk-1',
      task: 'Review termination clause (Section 9.2) - requires 90-day written notice and 3-month buyout fee',
      clauseRef: 'Section 9.2',
      priority: 'Critical',
      completed: false,
      notes: 'Verify exit cost exposure ($55,500) against project contingency reserve.'
    },
    {
      id: 'chk-2',
      task: 'Verify payment obligations (Section 4.1) - Net 30 with 1.5% monthly late interest',
      clauseRef: 'Section 4.1 & 4.2',
      priority: 'Recommended',
      completed: true,
      notes: 'Confirmed AP department can handle Net 30 recurring automated wire.'
    },
    {
      id: 'chk-3',
      task: 'Check notice period (Section 3.2) - calendar January 30, 2027 non-renewal deadline',
      clauseRef: 'Section 3.2',
      priority: 'Critical',
      completed: false,
      notes: 'Add reminder to legal operations calendar at 180, 90, and 60 days.'
    },
    {
      id: 'chk-4',
      task: 'Confirm renewal conditions (Section 3.2) - 12-month auto-extension',
      clauseRef: 'Section 3.2',
      priority: 'Recommended',
      completed: false,
      notes: 'Discuss mutual renewal option with vendor sales rep.'
    },
    {
      id: 'chk-5',
      task: 'Confirm IP ownership transfer timing (Section 5.2) - contingent on full payment',
      clauseRef: 'Section 5.2',
      priority: 'Standard',
      completed: true,
      notes: 'Acceptable standard language once milestone deliverables are reconciled.'
    }
  ],
  lawyerQuestions: [
    {
      id: 'lq-1',
      question: 'Is the unilateral data indemnity under Section 7.2 standard, or can we add a reciprocal indemnity for vendor data breaches?',
      context: 'Section 7.2 requires Client to indemnify Provider for data claims, but Section 7.1 only protects Client against IP infringement claims.',
      clauseRef: 'Section 7.1 & 7.2',
      reason: 'Balances risk in event vendor infrastructure suffers a breach affecting our customer data.'
    },
    {
      id: 'lq-2',
      question: 'Does the 12-month liability cap in Section 8.2 apply to gross negligence and data confidentiality breaches?',
      context: 'Section 8.2 does not explicitly carve out breaches of confidentiality or gross negligence from the liability ceiling.',
      clauseRef: 'Section 8.2',
      reason: 'Confidentiality leaks can exceed 12 months of paid fees in regulatory fines and legal defense.'
    },
    {
      id: 'lq-3',
      question: 'Should we request an explicit carve-out protecting us from suspension during good-faith fee disputes in Section 4.3?',
      context: 'Currently, the provider can suspend core services after 15 days if any invoice is unpaid, even if disputed in good faith.',
      clauseRef: 'Section 4.3',
      reason: 'Prevents operational shutdown during accounting discrepancies.'
    }
  ]
};

export const SAMPLE_COMPARISON_DATA: ComparisonData = {
  originalDoc: {
    name: 'Master Services Agreement (v1.0 Baseline)',
    version: '1.0 (Draft 2024)',
    date: 'Dec 12, 2024',
    size: '1.2 MB'
  },
  newDoc: {
    name: 'Master Services Agreement (v2.0 Redline Revised)',
    version: '2.0 (Proposed 2025)',
    date: 'March 10, 2025',
    size: '1.4 MB'
  },
  summary: {
    totalChanges: 6,
    addedCount: 2,
    removedCount: 1,
    modifiedCount: 2,
    unchangedCount: 1
  },
  changes: [
    {
      id: 'diff-1',
      sectionNumber: 'Section 4.2',
      title: 'Payment Terms & Invoicing Window',
      type: 'modified',
      importance: 'High',
      originalSnippet: 'All undisputed invoices are due within forty-five (45) calendar days from the invoice date (Net 45).',
      newSnippet: 'All undisputed invoices are due within thirty (30) calendar days from the invoice date (Net 30). Late payments shall accrue interest at 1.5% per month.',
      summary: 'Payment window accelerated from Net 45 to Net 30, and late payment interest was added.',
      legalImpact: 'Accelerates cash outflow timeline by 15 days and introduces financial penalties for delayed payment processing.'
    },
    {
      id: 'diff-2',
      sectionNumber: 'Section 7.3',
      title: 'Data Security & SOC2 Compliance Obligations',
      type: 'added',
      importance: 'High',
      originalSnippet: undefined,
      newSnippet: 'Provider warrants that it shall maintain annual SOC 2 Type II certification, conduct annual third-party penetration audits, and notify Client within forty-eight (48) hours of any confirmed security incident.',
      summary: 'Brand new data protection standards and 48-hour breach notification obligation added.',
      legalImpact: 'Substantially increases vendor accountability for cyber risk and provides audit rights previously missing.'
    },
    {
      id: 'diff-3',
      sectionNumber: 'Section 8.2',
      title: 'Limitation of Liability Ceiling',
      type: 'modified',
      importance: 'Critical',
      originalSnippet: 'The total aggregate liability of either party shall not exceed two times (2x) the total fees paid or payable in the preceding twelve (12) months.',
      newSnippet: 'The total aggregate liability of either party shall not exceed the total fees actually paid by Client to Provider in the twelve (12) months preceding the incident.',
      summary: 'Liability cap reduced from 200% (2x) of trailing annual fees down to 100% (1x) of fees actually paid.',
      legalImpact: 'Cuts maximum recoverable damages in half ($444,000 down to $222,000), reducing Provider financial exposure if severe outage occurs.'
    },
    {
      id: 'diff-4',
      sectionNumber: 'Section 9.3',
      title: 'Immediate Termination for Insolvency / Bankruptcy',
      type: 'removed',
      importance: 'Medium',
      originalSnippet: 'Either party may immediately terminate this Agreement upon written notice if the other party enters into liquidation, files for bankruptcy, or becomes insolvent.',
      newSnippet: undefined,
      summary: 'The immediate bankruptcy/insolvency termination clause was deleted from the revised version.',
      legalImpact: 'If Provider becomes insolvent, Client may be forced to navigate standard 30-day default cure notice rather than executing immediate transition.'
    },
    {
      id: 'diff-5',
      sectionNumber: 'Section 11.4',
      title: 'AI Usage & Training Data Restriction',
      type: 'added',
      importance: 'High',
      originalSnippet: undefined,
      newSnippet: 'Provider covenants that no Client Confidential Information or Client Data shall be ingested into public large language models, generative AI algorithms, or machine learning training sets.',
      summary: 'New protective restriction prohibiting vendor from training AI models on confidential data.',
      legalImpact: 'Protects proprietary corporate data and intellectual property from leakage into public AI model weights.'
    },
    {
      id: 'diff-6',
      sectionNumber: 'Section 10.1',
      title: 'Governing Law & Delaware Jurisdiction',
      type: 'unchanged',
      importance: 'Low',
      originalSnippet: 'This Agreement shall be governed by, and construed in accordance with, the laws of the State of Delaware.',
      newSnippet: 'This Agreement shall be governed by, and construed in accordance with, the laws of the State of Delaware.',
      summary: 'Delaware governing law clause remains verbatim identical.',
      legalImpact: 'No legal change; predictable established corporate law standards apply.'
    }
  ]
};

export const INITIAL_CHAT_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'assistant' as const,
    text: 'Hello! I am your LegalLens AI assistant. I have reviewed the Master Services Agreement between CloudScale Technologies and Apex Enterprises.\n\nYou can ask any question about obligations, deadlines, liabilities, or termination rules. Or tap one of the suggested prompts below to start.',
    timestamp: '10:00 AM'
  }
];

export const MOCK_QA_RESPONSES: Record<string, { answer: string; citations: { clauseRef: string; title: string }[] }> = {
  'What are my main obligations?': {
    answer: 'Under this agreement, your primary obligations as Client include:\n\n1. **Financial Payment:** Paying $18,500/month by the 1st of each month with Net 30 terms (Section 4.1 & 4.2).\n2. **Access & Cooperation:** Providing timely server access, credentials, and technical contacts so Provider can deliver services (Section 1.2).\n3. **Cancellation Notice:** Giving 60 days advance written notice prior to March 31, 2027 if you do not want the contract to automatically renew for another year (Section 3.2).\n4. **Data Indemnity:** Indemnifying Provider against any third-party claims arising from unauthorized data your team uploads (Section 7.2).',
    citations: [
      { clauseRef: 'Section 1.2', title: 'Client Cooperation & Access Obligation' },
      { clauseRef: 'Section 3.2', title: 'Automatic 12-Month Renewal' },
      { clauseRef: 'Section 4.1', title: 'Monthly Recurring Service Fee' },
      { clauseRef: 'Section 7.2', title: 'Client Data Indemnification' }
    ]
  },
  'Can I terminate this agreement early?': {
    answer: 'Yes, you can terminate in two ways:\n\n1. **For Cause (Material Breach):** If CloudScale breaches the agreement and fails to fix it within **30 days** of your written notice, you may terminate without penalty (Section 9.1).\n\n2. **For Convenience (No Fault):** You may cancel early without reason, but you must provide **90 days prior written notice** AND pay an **early exit fee of $55,500** (equivalent to 3 months of service fees) (Section 9.2).',
    citations: [
      { clauseRef: 'Section 9.1', title: 'Termination for Material Breach' },
      { clauseRef: 'Section 9.2', title: 'Termination for Convenience & Fee' }
    ]
  },
  'What payments am I responsible for?': {
    answer: 'Your financial commitments breakdown as follows:\n\n• **Base Retainer:** **$18,500.00 USD/month**, totaling **$444,000** over the initial 24-month term (Section 4.1).\n• **Payment Terms:** Invoices are due **Net 30 days** (Section 4.2).\n• **Late Penalties:** Unpaid balances incur **1.5% monthly interest** (~18% annualized) (Section 4.2).\n• **Suspension Warning:** CloudScale can freeze services if fees remain unpaid **15 days** after notice (Section 4.3).\n• **Early Cancellation:** **$55,500** penalty if you terminate early for convenience (Section 9.2).',
    citations: [
      { clauseRef: 'Section 4.1', title: 'Monthly Recurring Fee' },
      { clauseRef: 'Section 4.2', title: 'Net 30 Invoicing & 1.5% Penalty' },
      { clauseRef: 'Section 9.2', title: 'Early Termination Buyout Fee' }
    ]
  },
  'Which clauses should I review carefully?': {
    answer: 'We recommend prioritizing review of these 4 key clauses before signing:\n\n1. **Section 3.2 (Automatic Renewal):** Auto-renews for 12 months unless cancelled 60 days prior to March 31, 2027.\n2. **Section 4.3 (15-Day Service Suspension):** CloudScale can cut off access with only 15 days notice without an explicit carve-out for good-faith fee disputes.\n3. **Section 7.2 (Data Indemnity):** Unilateral liability if your team uploads data that infringes third-party rights.\n4. **Section 8.2 (Liability Cap):** Total liability is capped at 12 months fees ($222,000), which may be insufficient if significant data loss occurs.',
    citations: [
      { clauseRef: 'Section 3.2', title: 'Automatic Renewal' },
      { clauseRef: 'Section 4.3', title: 'Service Suspension Right' },
      { clauseRef: 'Section 7.2', title: 'Client Data Indemnity' },
      { clauseRef: 'Section 8.2', title: '12-Month Liability Cap' }
    ]
  }
};
