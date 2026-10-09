import React, { useState, useEffect } from 'react';
import type {
  BlockchainBlockDto,
  BlockchainTransactionDto,
  BlockchainChainStatusDto,
  BlockchainVerificationResult,
} from '@healthcare/shared';
import { api } from '../api/client';
import {
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Blocks,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Lock,
} from 'lucide-react';

export const BlockchainLedgerExplorerView: React.FC = () => {
  const [chainStatus, setChainStatus] = useState<BlockchainChainStatusDto | null>(null);
  const [blocks, setBlocks] = useState<BlockchainBlockDto[]>([]);
  const [transactions, setTransactions] = useState<BlockchainTransactionDto[]>([]);
  const [activeTab, setActiveTab] = useState<'BLOCKS' | 'TRANSACTIONS' | 'VERIFIER'>('BLOCKS');
  const [loading, setLoading] = useState(true);

  // Verifier tool state
  const [testReportId, setTestReportId] = useState('');
  const [verifierResult, setVerifierResult] = useState<BlockchainVerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [status, blks, txs] = await Promise.all([
        api.getBlockchainChainStatus(),
        api.getBlockchainBlocks(30, 0),
        api.getBlockchainTransactions(50, 0),
      ]);
      setChainStatus(status);
      setBlocks(blks);
      setTransactions(txs);
      if (txs.length > 0 && !testReportId) {
        setTestReportId(txs[0]!.recordId);
      }
    } catch (err) {
      console.error('Failed to load blockchain ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testReportId.trim()) return;
    try {
      setVerifying(true);
      setVerifierResult(null);
      const res = await api.verifyReportBlockchain(testReportId.trim());
      setVerifierResult(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          borderRadius: '12px',
          padding: '2rem',
          color: '#ffffff',
          marginBottom: '1.5rem',
          border: '1px solid #334155',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Cpu size={20} color="#38BDF8" />
              <span style={{ fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#7DD3FC', fontWeight: 600 }}>
                Enterprise Healthcare Blockchain Ledger
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>
              Medical Record Integrity & Tamper Detection Ledger
            </h1>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.85, fontSize: '0.92rem' }}>
              Cryptographically linked SHA-256 Merkle block ledger verifying clinical reports and medical record immutability.
            </p>
          </div>
          <button
            onClick={loadData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0284C7',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >
            <RefreshCw size={16} /> Re-Verify Chain
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>CRYPTOGRAPHIC STATUS</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.2rem', fontWeight: 700, color: chainStatus?.valid ? '#059669' : '#dc2626' }}>
            {chainStatus?.valid ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
            {chainStatus?.valid ? 'CHAIN INTACT (VALID)' : 'TAMPER DETECTED'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Merkle roots & headers valid</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>BLOCK HEIGHT</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>
            {chainStatus?.totalBlocks ?? 0} Blocks
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>Genesis Block #0 to tip</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>ANCHORED TRANSACTIONS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0284c7' }}>
            {chainStatus?.totalTransactions ?? 0} Hashes
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>SHA-256 document proofs</div>
        </div>

        <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>DATA PRIVACY (ZERO PII)</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={18} /> 100% Compliant
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>No names or clinical notes on chain</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('BLOCKS')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'BLOCKS' ? '3px solid #0284C7' : '3px solid transparent',
            color: activeTab === 'BLOCKS' ? '#0284C7' : '#64748b',
            fontWeight: activeTab === 'BLOCKS' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Blocks size={18} />
          Blocks Stream ({blocks.length})
        </button>
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'TRANSACTIONS' ? '3px solid #0284C7' : '3px solid transparent',
            color: activeTab === 'TRANSACTIONS' ? '#0284C7' : '#64748b',
            fontWeight: activeTab === 'TRANSACTIONS' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Cpu size={18} />
          Integrity Transactions ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('VERIFIER')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'VERIFIER' ? '3px solid #0284C7' : '3px solid transparent',
            color: activeTab === 'VERIFIER' ? '#0284C7' : '#64748b',
            fontWeight: activeTab === 'VERIFIER' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ShieldCheck size={18} />
          Audit & Tamper Verifier
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          Loading blockchain state…
        </div>
      ) : activeTab === 'BLOCKS' ? (
        /* Blocks View */
        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>BLOCK INDEX</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>BLOCK HEADER HASH (SHA-256)</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>PREVIOUS BLOCK HASH</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>MERKLE ROOT</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>TXS</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={block.blockIndex} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                    #{block.blockIndex} {Number(block.blockIndex) === 0 ? '(Genesis)' : ''}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#0284c7' }}>
                    {block.blockHash.substring(0, 16)}…{block.blockHash.substring(block.blockHash.length - 8)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#64748b' }}>
                    {block.previousHash.substring(0, 16)}…
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#64748b' }}>
                    {block.merkleRoot.substring(0, 14)}…
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {block.transactionCount}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(block.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'TRANSACTIONS' ? (
        /* Transactions View */
        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>TX IDENTIFIER</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>BLOCK</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>EVENT TYPE</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>RECORD ID REF</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>DOCUMENT SHA-256 HASH</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.txId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#0284c7', fontWeight: 600 }}>
                    {tx.txId.substring(0, 16)}…
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                    #{tx.blockIndex}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: '#ECFDF5', color: '#065F46', padding: '3px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                      {tx.eventType}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>
                    {tx.recordType}: #{tx.recordId.substring(0, 8)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#334155' }}>
                    {tx.sha256Hash.substring(0, 20)}…
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Tamper Verifier Sandbox */
        <div style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#0f172a' }}>
            Live Diagnostic Report Cryptographic Audit Tool
          </h2>
          <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
            Enter any report UUID below. The backend will recompute the live SHA-256 hash from the PostgreSQL record and compare it with the immutable blockchain ledger.
          </p>

          <form onSubmit={handleVerifyReport} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', maxWidth: '600px' }}>
            <input
              type="text"
              placeholder="Paste Report UUID (e.g. 0aa4917f-c72e-416d-b771-b7d235f5a5a0)"
              value={testReportId}
              onChange={(e) => setTestReportId(e.target.value)}
              style={{
                flex: 1,
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
              }}
            />
            <button
              type="submit"
              disabled={verifying}
              style={{
                padding: '0.65rem 1.25rem',
                background: '#0284C7',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {verifying ? 'Auditing…' : 'Verify Integrity'}
            </button>
          </form>

          {verifierResult && (
            <div
              style={{
                padding: '1.5rem',
                borderRadius: '8px',
                background: verifierResult.matches ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${verifierResult.matches ? '#A7F3D0' : '#FECACA'}`,
                maxWidth: '750px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                {verifierResult.matches ? (
                  <CheckCircle2 size={28} color="#059669" />
                ) : (
                  <ShieldAlert size={28} color="#DC2626" />
                )}
                <div>
                  <h3 style={{ margin: 0, color: verifierResult.matches ? '#065F46' : '#991B1B', fontSize: '1.1rem' }}>
                    Status: {verifierResult.status}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: verifierResult.matches ? '#047857' : '#B91C1C' }}>
                    {verifierResult.details}
                  </div>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>BLOCKCHAIN ANCHORED HASH:</span>
                  <div style={{ fontFamily: 'monospace', color: '#0284C7', wordBreak: 'break-all', marginTop: '2px' }}>
                    {verifierResult.originalHash || 'NONE'}
                  </div>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>CURRENT RECOMPUTED DATABASE HASH:</span>
                  <div style={{ fontFamily: 'monospace', color: verifierResult.matches ? '#059669' : '#DC2626', wordBreak: 'break-all', marginTop: '2px' }}>
                    {verifierResult.currentHash}
                  </div>
                </div>
                {verifierResult.blockIndex !== undefined && (
                  <div style={{ marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', display: 'flex', gap: '1.5rem' }}>
                    <div>Block Height: <strong>#{verifierResult.blockIndex}</strong></div>
                    <div>Transaction: <strong style={{ fontFamily: 'monospace' }}>{verifierResult.txId?.substring(0, 16)}…</strong></div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
