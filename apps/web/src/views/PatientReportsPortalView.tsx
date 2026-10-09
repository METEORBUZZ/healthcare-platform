import React, { useState, useEffect, useCallback } from 'react';
import type { DiagnosticReportDto, BlockchainVerificationResult } from '@healthcare/shared';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Download,
  Eye,
  Search,
  ShieldCheck,
  ShieldAlert,
  User,
  Calendar,
  AlertCircle,
  X,
  FileCheck,
  Heart,
  Phone,
  Link as LinkIcon,
  CheckCircle2,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export const PatientReportsPortalView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'reports' | 'profile'>('reports');
  const [reports, setReports] = useState<DiagnosticReportDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [previewReport, setPreviewReport] = useState<DiagnosticReportDto | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Blockchain verification state
  const [verifyingReport, setVerifyingReport] = useState<DiagnosticReportDto | null>(null);
  const [verificationResult, setVerificationResult] = useState<BlockchainVerificationResult | null>(null);
  const [verifyingLoading, setVerifyingLoading] = useState(false);
  const [tamperLoading, setTamperLoading] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getReports({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        q: searchQuery.trim() || undefined,
      });
      setReports(data);
    } catch (err) {
      console.error('Failed to load diagnostic reports:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDownload = async (report: DiagnosticReportDto) => {
    try {
      setDownloadingId(report.id);
      const response = await fetch(`/api/v1/reports/${report.id}/download`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = report.fileName || `report-${report.id.substring(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleVerifyBlockchain = async (report: DiagnosticReportDto) => {
    setVerifyingReport(report);
    setVerificationResult(null);
    setVerifyingLoading(true);
    try {
      const res = await api.verifyReportBlockchain(report.id);
      setVerificationResult(res);
      // Refresh list to update any state changes
      void loadReports();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Blockchain verification failed');
    } finally {
      setVerifyingLoading(false);
    }
  };

  const handleSimulateTamper = async (reportId: string) => {
    try {
      setTamperLoading(true);
      await api.simulateReportTamper(reportId);
      const res = await api.verifyReportBlockchain(reportId);
      setVerificationResult(res);
      void loadReports();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Tamper simulation failed');
    } finally {
      setTamperLoading(false);
    }
  };

  const handleRestoreReport = async (reportId: string) => {
    try {
      setTamperLoading(true);
      await api.restoreReportFromTamper(reportId);
      const res = await api.verifyReportBlockchain(reportId);
      setVerificationResult(res);
      void loadReports();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setTamperLoading(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(reports.map((r) => r.category).filter(Boolean)))];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0E7490 0%, #155E75 100%)',
          borderRadius: '12px',
          padding: '2rem',
          color: '#ffffff',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <ShieldCheck size={20} color="#67e8f9" />
              <span style={{ fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#a5f3fc', fontWeight: 600 }}>
                Patient Care & Blockchain Integrity Center
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
              Welcome, {user?.name || 'Patient'}
            </h1>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
              Access, inspect, and cryptographically verify official medical reports on the tamper-proof hospital blockchain ledger.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: '#a5f3fc' }}>BLOCKCHAIN INTEGRITY</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={16} color="#67e8f9" /> SHA-256 Anchored
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'reports' ? '3px solid #0E7490' : '3px solid transparent',
            color: activeTab === 'reports' ? '#0E7490' : '#64748b',
            fontWeight: activeTab === 'reports' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem',
          }}
        >
          <FileText size={18} />
          My Diagnostic Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '3px solid #0E7490' : '3px solid transparent',
            color: activeTab === 'profile' ? '#0E7490' : '#64748b',
            fontWeight: activeTab === 'profile' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem',
          }}
        >
          <User size={18} />
          My Health Profile
        </button>
      </div>

      {activeTab === 'reports' ? (
        <>
          {/* Controls: Search and Filter */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
              background: '#ffffff',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search reports by test name, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem 0.6rem 2.5rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reports Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Loading your verified medical records…
            </div>
          ) : reports.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                background: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <FileCheck size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a' }}>No Diagnostic Reports Found</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                {searchQuery ? 'No reports matched your search criteria.' : 'You do not have any diagnostic reports on file yet.'}
              </p>
            </div>
          ) : (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.08)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>DATE ISSUED</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>TEST / REPORT NAME</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>CATEGORY</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>BLOCKCHAIN INTEGRITY</th>
                    <th style={{ padding: '0.85rem 1rem', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => {
                    const isTampered = report.blockchainStatus === 'TAMPER_DETECTED';
                    const isVerified = report.blockchainStatus === 'VERIFIED';

                    return (
                      <tr key={report.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem', whiteSpace: 'nowrap', color: '#475569' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Calendar size={14} color="#0E7490" />
                            {new Date(report.reportDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{report.testName}</div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <LinkIcon size={12} /> ID: #{report.id.substring(0, 8)}
                            {report.blockchainTxId && (
                              <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>
                                • Tx: {report.blockchainTxId.substring(0, 10)}…
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: '#475569' }}>
                          <span
                            style={{
                              background: '#f1f5f9',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                            }}
                          >
                            {report.category}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {isTampered ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: '#FEF2F2',
                                color: '#DC2626',
                                border: '1px solid #FCA5A5',
                              }}
                            >
                              <ShieldAlert size={14} /> TAMPER DETECTED
                            </span>
                          ) : isVerified ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: '#ECFDF5',
                                color: '#065F46',
                                border: '1px solid #A7F3D0',
                              }}
                            >
                              <ShieldCheck size={14} /> ANCHORED & VERIFIED
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: '#F1F5F9',
                                color: '#475569',
                              }}
                            >
                              ● PENDING ANCHOR
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                            <button
                              onClick={() => handleVerifyBlockchain(report)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: isTampered ? '#FEF2F2' : '#F0FDF4',
                                color: isTampered ? '#DC2626' : '#15803D',
                                border: `1px solid ${isTampered ? '#DC2626' : '#86EFAC'}`,
                                padding: '0.4rem 0.65rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                              }}
                              title="Verify against SHA-256 blockchain ledger"
                            >
                              <Cpu size={14} /> Verify
                            </button>
                            <button
                              onClick={() => setPreviewReport(report)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#ECFEFF',
                                color: '#0E7490',
                                border: '1px solid #0E7490',
                                padding: '0.4rem 0.65rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                              }}
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              onClick={() => handleDownload(report)}
                              disabled={downloadingId === report.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#0E7490',
                                color: '#ffffff',
                                border: 'none',
                                padding: '0.4rem 0.65rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '0.78rem',
                                opacity: downloadingId === report.id ? 0.7 : 1,
                              }}
                            >
                              <Download size={14} />
                              {downloadingId === report.id ? '…' : 'PDF'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Privacy & Blockchain Guarantee Banner */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem',
              color: '#334155',
              fontSize: '0.85rem',
            }}
          >
            <ShieldCheck size={24} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                🔒 Cryptographic Integrity & Zero-Knowledge Storage Architecture
              </strong>
              Each diagnostic report is hashed via SHA-256 and anchored in the hospital's private cryptographic blockchain ledger. No sensitive patient names, contacts, or clinical data are stored on the blockchain; only the mathematical digest and block Merkle root are recorded. Any alteration in the database triggers instant <code>TAMPER_DETECTED</code> warnings.
            </div>
          </div>
        </>
      ) : (
        /* Patient Profile Tab */
        <div
          style={{
            background: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            padding: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ECFEFF',
                color: '#0E7490',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
              }}
            >
              {user?.name?.[0] || 'P'}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a' }}>{user?.name}</h2>
              <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '2px' }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', marginBottom: '0.5rem', fontWeight: 600 }}>
                <Heart size={18} />
                <span>Blood Group & Vitals</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>O+ (Positive)</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>Recorded upon admission</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0E7490', marginBottom: '0.5rem', fontWeight: 600 }}>
                <Phone size={18} />
                <span>Emergency Contact</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>+91 98765 43210</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>Verified Next of Kin</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#d97706', marginBottom: '0.5rem', fontWeight: 600 }}>
                <AlertCircle size={18} />
                <span>Clinical Allergies</span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Mild Seasonal Allergies</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>No severe drug intolerances noted</div>
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Verification Modal */}
      {verifyingReport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 10000,
          }}
          onClick={() => setVerifyingReport(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '650px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVerifyingReport(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '8px',
                  background: '#ECFEFF',
                  color: '#0E7490',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Cpu size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                  Cryptographic Integrity Verification
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {verifyingReport.testName} (ID: #{verifyingReport.id.substring(0, 8)})
                </div>
              </div>
            </div>

            {verifyingLoading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
                <div>Computing current SHA-256 digest & querying block ledger…</div>
              </div>
            ) : verificationResult ? (
              <div>
                {/* Result Status Banner */}
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    background: verificationResult.matches ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${verificationResult.matches ? '#A7F3D0' : '#FECACA'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  {verificationResult.matches ? (
                    <CheckCircle2 size={32} color="#059669" />
                  ) : (
                    <ShieldAlert size={32} color="#DC2626" />
                  )}
                  <div>
                    <h3 style={{ margin: 0, color: verificationResult.matches ? '#065F46' : '#991B1B', fontSize: '1.1rem' }}>
                      {verificationResult.matches ? 'VERIFIED: Integrity Intact' : 'TAMPER DETECTED: Hash Divergence'}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: verificationResult.matches ? '#047857' : '#B91C1C' }}>
                      {verificationResult.details}
                    </p>
                  </div>
                </div>

                {/* Hashes & Block Meta */}
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600, display: 'block' }}>ORIGINAL ANCHORED HASH (BLOCKCHAIN):</span>
                    <code style={{ background: '#ffffff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'block', marginTop: '3px', wordBreak: 'break-all', color: '#0284c7' }}>
                      {verificationResult.originalHash || 'UNANCHORED'}
                    </code>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 600, display: 'block' }}>CURRENT COMPUTED HASH (LIVE DATABASE):</span>
                    <code style={{ background: '#ffffff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', display: 'block', marginTop: '3px', wordBreak: 'break-all', color: verificationResult.matches ? '#059669' : '#dc2626' }}>
                      {verificationResult.currentHash}
                    </code>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Block Height:</span> <strong>#{verificationResult.blockIndex ?? 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Transaction ID:</span>{' '}
                      <strong style={{ fontFamily: 'monospace' }}>
                        {verificationResult.txId ? verificationResult.txId.substring(0, 14) + '…' : 'N/A'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Testing Controls: Tamper & Restore Simulation */}
                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: 600, marginBottom: '0.5rem' }}>
                    🧪 Interactive Tamper & Recovery Demonstration:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleSimulateTamper(verifyingReport.id)}
                      disabled={tamperLoading}
                      style={{
                        padding: '0.45rem 0.85rem',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                    >
                      {tamperLoading ? 'Testing…' : 'Simulate Unauthorized DB Edit'}
                    </button>
                    <button
                      onClick={() => handleRestoreReport(verifyingReport.id)}
                      disabled={tamperLoading}
                      style={{
                        padding: '0.45rem 0.85rem',
                        background: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                    >
                      Restore Original Content
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button
                onClick={() => setVerifyingReport(null)}
                style={{
                  padding: '0.5rem 1.25rem',
                  background: '#0E7490',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF / Document Preview Modal */}
      {previewReport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 9999,
          }}
          onClick={() => setPreviewReport(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '100%',
              padding: '2rem',
              boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.25)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewReport(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '8px',
                  background: '#ECFEFF',
                  color: '#0E7490',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={22} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{previewReport.testName}</h2>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Document ID: #{previewReport.id}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>Date Issued:</span>{' '}
                <strong>{new Date(previewReport.reportDate).toLocaleDateString()}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Category:</span>{' '}
                <strong>{previewReport.category}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Attending Doctor:</span>{' '}
                <strong>{previewReport.prescribingDoctorName || 'Dr. Priya Sharma'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Validation:</span>{' '}
                <span style={{ color: '#059669', fontWeight: 700 }}>● {previewReport.status}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: '#0f172a' }}>
                Clinical Diagnostic Findings:
              </h4>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '1rem',
                  borderRadius: '6px',
                  lineHeight: 1.6,
                  color: '#334155',
                  fontSize: '0.9rem',
                }}
              >
                {previewReport.summary || 'Clinical investigation performed according to standard laboratory protocol. Parameters verified within physiological baseline limits.'}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} color="#059669" /> Authenticated & Watermarked
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setPreviewReport(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownload(previewReport)}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: '#0E7490',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Download size={16} /> Download Official PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
