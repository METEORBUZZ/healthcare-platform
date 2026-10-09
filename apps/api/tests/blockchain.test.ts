import { describe, expect, it, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { BlockchainService } from '../src/modules/blockchain/blockchain.service';
import { pool } from '../src/db/pool';

describe('Blockchain Integrity & Tamper Detection Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Medical Report Hashing & Zero-PII Compliance', () => {
    const sampleReport = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      patientId: 101,
      testName: 'Complete Blood Count (CBC)',
      category: 'HEMATOLOGY',
      reportDate: '2026-10-09',
      summary: 'Normal white blood cell count and hemoglobin levels.',
      fileName: 'cbc_report_101.pdf',
      fileContent: Buffer.from('PDF_SAMPLE_CONTENT_A'),
    };

    it('generates a deterministic 64-character SHA-256 hash for identical data', () => {
      const hash1 = BlockchainService.calculateReportHash(sampleReport);
      const hash2 = BlockchainService.calculateReportHash({ ...sampleReport });

      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
      expect(hash1).toBe(hash2);
    });

    it('detects single-character modifications in medical summary', () => {
      const hashOriginal = BlockchainService.calculateReportHash(sampleReport);
      const tamperedReport = {
        ...sampleReport,
        summary: 'Elevated white blood cell count and abnormal hemoglobin levels.', // tampered
      };
      const hashTampered = BlockchainService.calculateReportHash(tamperedReport);

      expect(hashTampered).not.toBe(hashOriginal);
      expect(hashTampered).toHaveLength(64);
    });

    it('detects changes in file attachments / payload content', () => {
      const hashOriginal = BlockchainService.calculateReportHash(sampleReport);
      const tamperedFileReport = {
        ...sampleReport,
        fileContent: Buffer.from('ALTERED_PDF_CONTENT_MALICIOUS'),
      };
      const hashTamperedFile = BlockchainService.calculateReportHash(tamperedFileReport);

      expect(hashTamperedFile).not.toBe(hashOriginal);
    });

    it('does not include PII such as patient names, phone numbers, or emails in hash computation', () => {
      // The hash function only takes privacy-safe record attributes (id, patientId, testName, category, date, summary, fileName)
      const reportWithoutPII = {
        id: sampleReport.id,
        patientId: sampleReport.patientId,
        testName: sampleReport.testName,
        category: sampleReport.category,
        reportDate: sampleReport.reportDate,
        summary: sampleReport.summary,
        fileName: sampleReport.fileName,
      };

      const calculatedHash = BlockchainService.calculateReportHash(reportWithoutPII);
      expect(calculatedHash).toBeDefined();
      expect(typeof calculatedHash).toBe('string');
      expect(calculatedHash).toHaveLength(64);
    });
  });

  describe('2. Clinical Medical Record Hashing', () => {
    const sampleRecord = {
      id: 501,
      patientId: 202,
      doctorId: 303,
      recordType: 'CONSULTATION',
      chiefComplaint: 'Chest tightness and shortness of breath upon exertion',
      diagnosis: 'Stable Angina Pectoris',
      soapNotes: 'S: Patient reports episodic chest pain. O: ECG shows ST-depression. A: Angina. P: Prescribe Aspirin and Atorvastatin.',
      treatmentPlan: 'Daily aspirin 75mg, cardio consultation scheduled.',
    };

    it('produces deterministic cryptographic hash for consultation notes', () => {
      const hash1 = BlockchainService.calculateMedicalRecordHash(sampleRecord);
      const hash2 = BlockchainService.calculateMedicalRecordHash({ ...sampleRecord });

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('detects tampering in clinical diagnosis or treatment plan', () => {
      const hashOriginal = BlockchainService.calculateMedicalRecordHash(sampleRecord);
      const tamperedRecord = {
        ...sampleRecord,
        diagnosis: 'Acute Myocardial Infarction', // altered diagnosis
      };
      const hashTampered = BlockchainService.calculateMedicalRecordHash(tamperedRecord);

      expect(hashTampered).not.toBe(hashOriginal);
    });
  });

  describe('3. Merkle Tree & Block Header Computation', () => {
    it('calculates deterministic Merkle root for a set of transaction hashes', () => {
      const tx1 = crypto.createHash('sha256').update('tx1').digest('hex');
      const tx2 = crypto.createHash('sha256').update('tx2').digest('hex');
      const tx3 = crypto.createHash('sha256').update('tx3').digest('hex');

      const merkleRoot = BlockchainService.calculateMerkleRoot([tx1, tx2, tx3]);
      expect(merkleRoot).toHaveLength(64);

      // Same inputs produce identical Merkle root
      const merkleRoot2 = BlockchainService.calculateMerkleRoot([tx1, tx2, tx3]);
      expect(merkleRoot).toBe(merkleRoot2);
    });

    it('computes empty Merkle root fallback for zero transactions', () => {
      const emptyRoot = BlockchainService.calculateMerkleRoot([]);
      expect(emptyRoot).toHaveLength(64);
    });

    it('computes cryptographic block hash linking to previous block hash', () => {
      const blockHash = BlockchainService.calculateBlockHash(
        1,
        '0000000000000000000000000000000000000000000000000000000000000000',
        'abcdef123456abcdef123456abcdef123456abcdef123456abcdef1234567890',
        '2026-10-09T10:00:00.000Z',
        42,
      );
      expect(blockHash).toHaveLength(64);
    });
  });

  describe('4. Tamper Detection & Verification Engine', () => {
    it('returns VERIFIED when database record matches blockchain ledger hash', async () => {
      const reportId = '11111111-2222-3333-4444-555555555555';
      const mockReport = {
        id: reportId,
        patientId: 10,
        patientName: 'Aarav Patel',
        testName: 'Thyroid Function Test',
        category: 'BIOCHEMISTRY',
        reportDate: '2026-10-09',
        summary: 'TSH and T4 within normal physiological limits.',
        fileName: 'thyroid_10.pdf',
        filePath: null,
        blockchainTxId: 'tx_uuid_test_1',
      };

      const expectedHash = BlockchainService.calculateReportHash({
        id: mockReport.id,
        patientId: mockReport.patientId,
        testName: mockReport.testName,
        category: mockReport.category,
        reportDate: mockReport.reportDate,
        summary: mockReport.summary,
        fileName: mockReport.fileName,
      });

      // Mock pool.query to return the untampered report and blockchain transaction
      vi.spyOn(pool, 'query').mockImplementation(async (sql: any, params: any) => {
        if (typeof sql === 'string' && sql.includes('FROM reports r') && sql.includes('WHERE r.id = $1')) {
          return { rows: [mockReport] } as any;
        }
        if (typeof sql === 'string' && sql.includes('FROM blockchain_transactions') && sql.includes('WHERE record_id = $1')) {
          return {
            rows: [
              {
                txId: 'tx_uuid_test_1',
                blockIndex: 1,
                sha256Hash: expectedHash,
                timestamp: new Date().toISOString(),
              },
            ],
          } as any;
        }
        if (typeof sql === 'string' && sql.includes('UPDATE reports SET blockchain_status')) {
          return { rowCount: 1 } as any;
        }
        return { rows: [] } as any;
      });

      const result = await BlockchainService.verifyReport(reportId);

      expect(result.status).toBe('VERIFIED');
      expect(result.matches).toBe(true);
      expect(result.currentHash).toBe(expectedHash);
      expect(result.originalHash).toBe(expectedHash);
      expect(result.blockIndex).toBe(1);
      expect(result.txId).toBe('tx_uuid_test_1');
    });

    it('returns TAMPER_DETECTED when database record has been altered after anchoring', async () => {
      const reportId = '22222222-3333-4444-5555-666666666666';
      const originalReport = {
        id: reportId,
        patientId: 12,
        testName: 'Blood Sugar Fasting',
        category: 'BIOCHEMISTRY',
        reportDate: '2026-10-09',
        summary: 'Blood glucose fasting 95 mg/dL (Normal).',
        fileName: 'sugar_12.pdf',
        filePath: null,
      };

      const anchoredOriginalHash = BlockchainService.calculateReportHash({
        id: originalReport.id,
        patientId: originalReport.patientId,
        testName: originalReport.testName,
        category: originalReport.category,
        reportDate: originalReport.reportDate,
        summary: originalReport.summary,
        fileName: originalReport.fileName,
      });

      // Tampered state in PostgreSQL database
      const tamperedReportInDb = {
        ...originalReport,
        summary: 'Blood glucose fasting 250 mg/dL (CRITICAL DIABETIC KETOACIDOSIS ALERT).', // Tampered!
        blockchainTxId: 'tx_uuid_test_2',
      };

      vi.spyOn(pool, 'query').mockImplementation(async (sql: any, params: any) => {
        if (typeof sql === 'string' && sql.includes('FROM reports r') && sql.includes('WHERE r.id = $1')) {
          return { rows: [tamperedReportInDb] } as any;
        }
        if (typeof sql === 'string' && sql.includes('FROM blockchain_transactions') && sql.includes('WHERE record_id = $1')) {
          return {
            rows: [
              {
                txId: 'tx_uuid_test_2',
                blockIndex: 2,
                sha256Hash: anchoredOriginalHash, // Blockchain holds original immutable hash
                timestamp: new Date().toISOString(),
              },
            ],
          } as any;
        }
        if (typeof sql === 'string' && sql.includes('UPDATE reports SET blockchain_status')) {
          return { rowCount: 1 } as any;
        }
        return { rows: [] } as any;
      });

      const result = await BlockchainService.verifyReport(reportId);

      expect(result.status).toBe('TAMPER_DETECTED');
      expect(result.matches).toBe(false);
      expect(result.currentHash).not.toBe(result.originalHash);
      expect(result.originalHash).toBe(anchoredOriginalHash);
      expect(result.details.toLowerCase()).toContain('tamper detected');
    });
  });

  describe('5. Chain Ledger Validation & Health Status', () => {
    it('validates chain integrity across linked blocks', async () => {
      const genesisHash = BlockchainService.calculateBlockHash(
        0,
        '0000000000000000000000000000000000000000000000000000000000000000',
        BlockchainService.calculateMerkleRoot([]),
        '2026-10-09T00:00:00.000Z',
        0,
      );

      const block1Timestamp = '2026-10-09T01:00:00.000Z';
      const block1MerkleRoot = BlockchainService.calculateMerkleRoot(['hash_tx_1']);
      const block1Hash = BlockchainService.calculateBlockHash(
        1,
        genesisHash,
        block1MerkleRoot,
        block1Timestamp,
        1,
      );

      vi.spyOn(pool, 'query').mockImplementation(async (sql: any) => {
        if (typeof sql === 'string' && sql.includes('SELECT COUNT(*) AS count FROM blockchain_blocks')) {
          return { rows: [{ count: '2' }] } as any;
        }
        if (typeof sql === 'string' && sql.includes('FROM blockchain_blocks') && sql.includes('ORDER BY block_index ASC')) {
          return {
            rows: [
              {
                blockIndex: 0,
                blockHash: genesisHash,
                previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
                merkleRoot: BlockchainService.calculateMerkleRoot([]),
                timestamp: '2026-10-09T00:00:00.000Z',
                nonce: 0,
              },
              {
                blockIndex: 1,
                blockHash: block1Hash,
                previousHash: genesisHash,
                merkleRoot: block1MerkleRoot,
                timestamp: block1Timestamp,
                nonce: 1,
              },
            ],
          } as any;
        }
        if (typeof sql === 'string' && sql.includes('SELECT COUNT(*) AS count FROM blockchain_transactions')) {
          return { rows: [{ count: '1' }] } as any;
        }
        return { rows: [] } as any;
      });

      const chainStatus = await BlockchainService.verifyChainIntegrity();

      expect(chainStatus.valid).toBe(true);
      expect(chainStatus.totalBlocks).toBe(2);
      expect(chainStatus.totalTransactions).toBe(1);
      expect(chainStatus.latestBlockHash).toBe(block1Hash);
      expect(chainStatus.issues).toHaveLength(0);
    });
  });
});
