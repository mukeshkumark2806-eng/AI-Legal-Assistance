import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('BUILD 6 — Footer Navigation, Compliance Pages, & Header UX', () => {
  const footerSourcePath = path.join(projectRoot, 'src', 'components', 'navigation', 'Footer.tsx');
  const headerSourcePath = path.join(projectRoot, 'src', 'components', 'navigation', 'Header.tsx');
  const complianceModalPath = path.join(projectRoot, 'src', 'components', 'compliance', 'ComplianceModal.tsx');
  const appSourcePath = path.join(projectRoot, 'src', 'App.tsx');

  const footerCode = fs.readFileSync(footerSourcePath, 'utf8');
  const headerCode = fs.readFileSync(headerSourcePath, 'utf8');
  const complianceCode = fs.readFileSync(complianceModalPath, 'utf8');
  const appCode = fs.readFileSync(appSourcePath, 'utf8');

  test('1. Footer Platform Links: All 4 links are clickable buttons and navigate to existing views', () => {
    // Platform links must be buttons with onNavigate calls
    assert.match(footerCode, /Dashboard & Upload/);
    assert.match(footerCode, /Document Intelligence/);
    assert.match(footerCode, /Compare Documents/);
    assert.match(footerCode, /My Documents Repository/);

    assert.ok(footerCode.includes("onNavigate('dashboard')"), 'Dashboard & Upload navigates to dashboard');
    assert.ok(footerCode.includes("onNavigate('workspace')"), 'Document Intelligence navigates to workspace');
    assert.ok(footerCode.includes("onNavigate('compare')"), 'Compare Documents navigates to compare');
    assert.ok(footerCode.includes("onNavigate('my-documents')"), 'My Documents Repository navigates to my-documents');

    // Must NOT have empty href="#" dead links
    assert.ok(!footerCode.includes('href="#"'), 'Footer does not use dead href="#" links');
  });

  test('2. Footer Compliance Links: All 4 links are clickable buttons wired to real compliance modal', () => {
    assert.match(footerCode, /Terms of Service/);
    assert.match(footerCode, /Privacy Policy & GDPR/);
    assert.match(footerCode, /Informational Disclaimer/);
    assert.match(footerCode, /Security Whitepaper/);

    assert.ok(footerCode.includes("handleOpenCompliance('terms')"), 'Terms of Service opens terms modal');
    assert.ok(footerCode.includes("handleOpenCompliance('privacy')"), 'Privacy Policy opens privacy modal');
    assert.ok(footerCode.includes("handleOpenCompliance('disclaimer')"), 'Informational Disclaimer opens disclaimer modal');
    assert.ok(footerCode.includes("handleOpenCompliance('security')"), 'Security Whitepaper opens security modal');
  });

  test('3. App Integration: App.tsx manages activeComplianceModal state and passes onOpenCompliance', () => {
    assert.ok(appCode.includes('ComplianceModal'), 'App imports ComplianceModal');
    assert.ok(appCode.includes('activeComplianceModal'), 'App tracks activeComplianceModal state');
    assert.ok(appCode.includes('onOpenCompliance'), 'App passes onOpenCompliance to Footer');
    assert.ok(appCode.includes("<ComplianceModal"), 'App mounts ComplianceModal');
  });

  test('4. Header UX: Removed misleading "Legal Team" / "Enterprise" / "JD" account UI', () => {
    // Must NOT have misleading enterprise credentials
    assert.ok(!headerCode.includes('Legal Team'), 'Header does not display fake "Legal Team"');
    assert.ok(!headerCode.includes('Enterprise'), 'Header does not display fake "Enterprise"');
    assert.ok(!headerCode.includes('JD'), 'Header does not display fake "JD" initials');

    // Must display Guest Document Workspace
    assert.ok(headerCode.includes('Guest'), 'Header displays "Guest"');
    assert.ok(headerCode.includes('Document Workspace'), 'Header displays "Document Workspace"');
  });

  test('5. Footer Security Claims: Removed unsupported claims and replaced with factual wording', () => {
    // Must NOT have unverified claims
    assert.ok(!footerCode.includes('256-Bit TLS'), 'Footer does not claim unverified "256-Bit TLS"');
    assert.ok(!footerCode.includes('Zero Model Retention'), 'Footer does not claim unverified "Zero Model Retention"');

    // Must have factual wording
    assert.ok(footerCode.includes('Server-side API processing'), 'Footer includes "Server-side API processing"');
    assert.ok(footerCode.includes('API keys kept server-side'), 'Footer includes "API keys kept server-side"');
  });

  test('6. Compliance Content: Terms of Service truthfully details application usage terms', () => {
    assert.ok(complianceCode.includes('Terms of Service'), 'Contains Terms of Service section');
    assert.ok(complianceCode.includes('Informational Assistance Only'), 'Highlights informational scope');
    assert.ok(complianceCode.includes('User Responsibility'), 'Clarifies user responsibility and attorney verification');
    assert.ok(complianceCode.includes('Limitation of Liability'), 'Contains limitation of liability');
  });

  test('7. Compliance Content: Privacy Policy & GDPR notice details actual data flow without fake certifications', () => {
    assert.ok(complianceCode.includes('Privacy Policy & Data Processing Notice'), 'Contains Privacy Policy section');
    assert.ok(complianceCode.includes('Browser-Side Processing'), 'Notes local browser extraction');
    assert.ok(complianceCode.includes('Server-Side Analysis'), 'Discloses server-side processing flow');
    assert.ok(complianceCode.includes('Sensitive Data Notice'), 'Advises users on sensitive data');
    assert.ok(!complianceCode.includes('SOC 2 Certified'), 'Does not claim fake SOC 2 certification');
    assert.ok(complianceCode.includes('do not make unsupported claims of formal GDPR'), 'Transparent about compliance status');
  });

  test('8. Compliance Content: Informational Disclaimer clearly defines legal boundaries', () => {
    assert.ok(complianceCode.includes('Informational Assistance Disclaimer') || complianceCode.includes('Informational Disclaimer'), 'Contains Disclaimer section');
    assert.ok(complianceCode.includes('does not replace professional legal advice'), 'Standard attorney disclaimer present');
    assert.ok(complianceCode.includes('No Attorney-Client Relationship') || complianceCode.includes('does not provide legal representation'), 'States lack of attorney-client relationship');
    assert.ok(complianceCode.includes('Role Ambiguity'), 'States ambiguous pronoun and role non-assumption');
  });

  test('9. Compliance Content: Security Whitepaper truthfully details actual architecture and secret isolation', () => {
    assert.ok(complianceCode.includes('Security Whitepaper & Architecture') || complianceCode.includes('Security Whitepaper'), 'Contains Security Whitepaper section');
    assert.ok(complianceCode.includes('React 19'), 'Details React frontend');
    assert.ok(complianceCode.includes('Node.js') && complianceCode.includes('Express'), 'Details Node backend');
    assert.ok(complianceCode.includes('GROQ_API_KEY'), 'Mentions GROQ_API_KEY');
    assert.ok(complianceCode.includes('never exposed'), 'Confirms API key is never exposed to browser');
    assert.ok(complianceCode.includes('do not advertise unverified security certifications'), 'Explicitly disclaims unverified certifications');
  });
});
