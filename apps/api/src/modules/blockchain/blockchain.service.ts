import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  BlockchainBlockDto,
  BlockchainChainStatusDto,
  BlockchainTransactionDto,
  BlockchainVerificationResult,
} from '@healthcare/shared';
import { pool, withTransaction } from '../../db/pool';
import { notFound } from '../../common/errors';

export class BlockchainService {
  /** Deterministic SHA-256 hash for medical reports */
  public static calculateReportHash(report: {
    id: string;
    patientId: number;
    testName: string;
    category: string;
    reportDate: string | Date;
    summary: string | null;
    fileName: string;
    fileContent?: Buffer | null;
  }): string {
    const dateStr =
      report.reportDate instanceof Date
        ? report.reportDate.toISOString().slice(0, 10)
        : String(report.reportDate).slice(0, 10);

    const payload = JSON.stringify({
      id: report.id,
      patientId: Number(report.patientId),
      testName: report.testName.trim(),
      category: report.category.trim(),
      reportDate: dateStr,
      summary: report.summary ? report.summary.trim() : '',
      fileName: report.fileName.trim(),
      fileContentHash: report.fileContent
        ? crypto.createHash('sha256').update(report.fileContent).digest('hex')
        : null,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /** Deterministic SHA-256 hash for clinical medical records */
  public static calculateMedicalRecordHash(record: {
    id: number;
    patientId: number;
    doctorId: number;
    recordType: string;
    chiefComplaint: string | null;
    diagnosis: string | null;
    soapNotes: string;
    treatmentPlan: string | null;
  }): string {
    const payload = JSON.stringify({
      id: Number(record.id),
      patientId: Number(record.patientId),
      doctorId: Number(record.doctorId),
      recordType: record.recordType.trim(),
      chiefComplaint: record.chiefComplaint ? record.chiefComplaint.trim() : '',
      diagnosis: record.diagnosis ? record.diagnosis.trim() : '',
      soapNotes: record.soapNotes.trim(),
      treatmentPlan: record.treatmentPlan ? record.treatmentPlan.trim() : '',
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /** Merkle Root calculation */
  public static calculateMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) {
      return crypto.createHash('sha256').update('EMPTY_MERKLE_ROOT').digest('hex');
    }
    let currentLevel = [...hashes];
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i]!;
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1]! : left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }
    return currentLevel[0]!;
  }

  /** Block header hashing */
  public static calculateBlockHash(
    index: number,
    previousHash: string,
    merkleRoot: string,
    timestamp: string,
    nonce: number,
  ): string {
    return crypto
      .createHash('sha256')
      .update(`${index}:${previousHash}:${merkleRoot}:${timestamp}:${nonce}`)
      .digest('hex');
  }

  /** Ensure Genesis Block exists */
  public static async ensureGenesisBlock(): Promise<void> {
    const { rows } = await pool.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM blockchain_blocks WHERE block_index = 0',
    );
    if (Number(rows[0]?.count ?? 0) === 0) {
      const prevHash = '0'.repeat(64);
      const merkleRoot = crypto.createHash('sha256').update('GENESIS_HOSPITAL_ROOT').digest('hex');
      const timestamp = '2026-01-01T00:00:00.000Z';
      const blockHash = this.calculateBlockHash(0, prevHash, merkleRoot, timestamp, 0);

      await pool.query(
        `INSERT INTO blockchain_blocks (block_index, block_hash, previous_hash, merkle_root, nonce, transaction_count, timestamp)
         VALUES (0, $1, $2, $3, 0, 0, $4)
         ON CONFLICT (block_index) DO NOTHING`,
        [blockHash, prevHash, merkleRoot, timestamp],
      );
    }
  }

  /** Anchor a record on the blockchain */
  public static async anchorRecordOnChain(params: {
    recordId: string;
    recordType: 'REPORT' | 'MEDICAL_RECORD';
    sha256Hash: string;
    eventType:
      | 'REPORT_CREATED'
      | 'REPORT_FINALIZED'
      | 'REPORT_UPDATED'
      | 'REPORT_APPROVED'
      | 'RECORD_FINALIZED'
      | 'CRITICAL_VERIFICATION';
    actorUserId?: number | null;
    metadata?: Record<string, unknown>;
  }): Promise<{ txId: string; blockIndex: number; blockHash: string; timestamp: string }> {
    await this.ensureGenesisBlock();

    return withTransaction(async (tx) => {
      // Get tip of chain
      const tipRes = await tx.query<{ block_index: string; block_hash: string }>(
        'SELECT block_index, block_hash FROM blockchain_blocks ORDER BY block_index DESC LIMIT 1 FOR UPDATE',
      );
      const prevBlockIndex = Number(tipRes.rows[0]?.block_index ?? 0);
      const prevBlockHash = tipRes.rows[0]?.block_hash ?? '0'.repeat(64);

      const newBlockIndex = prevBlockIndex + 1;
      const txId = '0x' + crypto.randomBytes(32).toString('hex');
      const merkleRoot = this.calculateMerkleRoot([params.sha256Hash]);
      const nowIso = new Date().toISOString();
      const nonce = 0;
      const blockHash = this.calculateBlockHash(newBlockIndex, prevBlockHash, merkleRoot, nowIso, nonce);

      // 1. Insert new block
      await tx.query(
        `INSERT INTO blockchain_blocks (block_index, block_hash, previous_hash, merkle_root, nonce, transaction_count, timestamp)
         VALUES ($1, $2, $3, $4, $5, 1, $6)`,
        [newBlockIndex, blockHash, prevBlockHash, merkleRoot, nonce, nowIso],
      );

      // 2. Insert transaction
      const actorRef = params.actorUserId ? `actor_user_id:${params.actorUserId}` : 'system:integrity_engine';
      await tx.query(
        `INSERT INTO blockchain_transactions (tx_id, block_index, record_id, record_type, sha256_hash, event_type, actor_ref, metadata, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          txId,
          newBlockIndex,
          params.recordId,
          params.recordType,
          params.sha256Hash,
          params.eventType,
          actorRef,
          JSON.stringify(params.metadata ?? {}),
          nowIso,
        ],
      );

      // 3. Link back in primary database
      if (params.recordType === 'REPORT') {
        await tx.query(
          `UPDATE reports
              SET blockchain_tx_id = $1, blockchain_hash = $2, blockchain_status = 'VERIFIED', blockchain_anchored_at = $3
            WHERE id = $4`,
          [txId, params.sha256Hash, nowIso, params.recordId],
        );
      } else if (params.recordType === 'MEDICAL_RECORD') {
        await tx.query(
          `UPDATE medical_records
              SET blockchain_tx_id = $1, blockchain_hash = $2, blockchain_anchored_at = $3
            WHERE id = $4`,
          [txId, params.sha256Hash, nowIso, Number(params.recordId)],
        );
      }

      return {
        txId,
        blockIndex: newBlockIndex,
        blockHash,
        timestamp: nowIso,
      };
    });
  }

  /** Tamper detection for a diagnostic report */
  public static async verifyReport(reportId: string): Promise<BlockchainVerificationResult> {
    const { rows } = await pool.query(
      `SELECT r.id, r.patient_id AS "patientId", r.test_name AS "testName",
              r.category, r.report_date AS "reportDate", r.file_name AS "fileName",
              r.file_path AS "filePath", r.summary, r.blockchain_tx_id AS "blockchainTxId",
              r.blockchain_hash AS "blockchainHash", r.blockchain_anchored_at AS "blockchainAnchoredAt"
         FROM reports r
        WHERE r.id = $1`,
      [reportId],
    );
    if (!rows[0]) throw notFound('Report not found');
    const report = rows[0];

    // Read file if exists
    let fileContent: Buffer | null = null;
    if (report.filePath && fs.existsSync(report.filePath)) {
      try {
        fileContent = fs.readFileSync(report.filePath);
      } catch {
        fileContent = null;
      }
    }

    const currentHash = this.calculateReportHash({
      id: report.id,
      patientId: report.patientId,
      testName: report.testName,
      category: report.category,
      reportDate: report.reportDate,
      summary: report.summary,
      fileName: report.fileName,
      fileContent,
    });

    // Fetch latest blockchain transaction for this report
    const txRes = await pool.query(
      `SELECT tx_id AS "txId", block_index AS "blockIndex", sha256_hash AS "sha256Hash", timestamp
         FROM blockchain_transactions
        WHERE record_id = $1 AND record_type = 'REPORT'
     ORDER BY timestamp DESC, block_index DESC
        LIMIT 1`,
      [reportId],
    );

    const nowIso = new Date().toISOString();

    if (!txRes.rows[0]) {
      // Not anchored yet
      return {
        status: 'UNANCHORED',
        recordId: reportId,
        recordType: 'REPORT',
        matches: false,
        originalHash: null,
        currentHash,
        verifiedAt: nowIso,
        details: 'No blockchain integrity proof found for this report.',
      };
    }

    const onChainTx = txRes.rows[0];
    const originalHash = onChainTx.sha256Hash.trim();
    const matches = currentHash.toLowerCase() === originalHash.toLowerCase();

    const status = matches ? 'VERIFIED' : 'TAMPER_DETECTED';

    // Update status in primary table
    await pool.query(
      'UPDATE reports SET blockchain_status = $1 WHERE id = $2',
      [status, reportId],
    );

    return {
      status,
      recordId: reportId,
      recordType: 'REPORT',
      matches,
      originalHash,
      currentHash,
      blockIndex: Number(onChainTx.blockIndex),
      txId: onChainTx.txId,
      anchoredAt: onChainTx.timestamp,
      verifiedAt: nowIso,
      details: matches
        ? `Cryptographic SHA-256 integrity match confirmed against Block #${onChainTx.blockIndex}.`
        : `CRITICAL ALERT: Tamper detected! Current hash (${currentHash.slice(0, 16)}...) differs from original blockchain anchor (${originalHash.slice(0, 16)}...).`,
    };
  }

  /** Tamper detection for clinical medical records */
  public static async verifyMedicalRecord(recordId: number): Promise<BlockchainVerificationResult> {
    const { rows } = await pool.query(
      `SELECT mr.id, mr.patient_id AS "patientId", mr.doctor_id AS "doctorId",
              mr.record_type AS "recordType", mr.chief_complaint AS "chiefComplaint",
              mr.diagnosis, mr.soap_notes AS "soapNotes", mr.treatment_plan AS "treatmentPlan",
              mr.blockchain_tx_id AS "blockchainTxId", mr.blockchain_hash AS "blockchainHash",
              mr.blockchain_anchored_at AS "blockchainAnchoredAt"
         FROM medical_records mr
        WHERE mr.id = $1`,
      [recordId],
    );
    if (!rows[0]) throw notFound('Medical record not found');
    const record = rows[0];

    const currentHash = this.calculateMedicalRecordHash({
      id: record.id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      recordType: record.recordType,
      chiefComplaint: record.chiefComplaint,
      diagnosis: record.diagnosis,
      soapNotes: record.soapNotes,
      treatmentPlan: record.treatmentPlan,
    });

    const txRes = await pool.query(
      `SELECT tx_id AS "txId", block_index AS "blockIndex", sha256_hash AS "sha256Hash", timestamp
         FROM blockchain_transactions
        WHERE record_id = $1 AND record_type = 'MEDICAL_RECORD'
     ORDER BY timestamp DESC, block_index DESC
        LIMIT 1`,
      [String(recordId)],
    );

    const nowIso = new Date().toISOString();

    if (!txRes.rows[0]) {
      return {
        status: 'UNANCHORED',
        recordId: String(recordId),
        recordType: 'MEDICAL_RECORD',
        matches: false,
        originalHash: null,
        currentHash,
        verifiedAt: nowIso,
        details: 'No blockchain integrity proof found for this clinical record.',
      };
    }

    const onChainTx = txRes.rows[0];
    const originalHash = onChainTx.sha256Hash.trim();
    const matches = currentHash.toLowerCase() === originalHash.toLowerCase();
    const status = matches ? 'VERIFIED' : 'TAMPER_DETECTED';

    return {
      status,
      recordId: String(recordId),
      recordType: 'MEDICAL_RECORD',
      matches,
      originalHash,
      currentHash,
      blockIndex: Number(onChainTx.blockIndex),
      txId: onChainTx.txId,
      anchoredAt: onChainTx.timestamp,
      verifiedAt: nowIso,
      details: matches
        ? `Clinical record verified. Integrity matches Block #${onChainTx.blockIndex}.`
        : `TAMPER DETECTED: Clinical record content has been altered since Block #${onChainTx.blockIndex}.`,
    };
  }

  /** Complete cryptographic chain integrity validation */
  public static async verifyChainIntegrity(): Promise<BlockchainChainStatusDto> {
    await this.ensureGenesisBlock();

    const { rows: blocks } = await pool.query(
      `SELECT block_index AS "blockIndex", block_hash AS "blockHash",
              previous_hash AS "previousHash", merkle_root AS "merkleRoot",
              nonce, timestamp
         FROM blockchain_blocks
     ORDER BY block_index ASC`,
    );

    const { rows: txCountRes } = await pool.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM blockchain_transactions',
    );
    const totalTransactions = Number(txCountRes[0]?.count ?? 0);

    const issues: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]!;
      const index = Number(block.blockIndex);

      if (i > 0) {
        const prevBlock = blocks[i - 1]!;
        if (block.previousHash.trim() !== prevBlock.blockHash.trim()) {
          issues.push(
            `Broken chain link at Block #${index}: previous_hash does not match Block #${index - 1} hash!`,
          );
        }
      }

      // Check header hash recalculation
      const recalculatedHash = this.calculateBlockHash(
        index,
        block.previousHash.trim(),
        block.merkleRoot.trim(),
        new Date(block.timestamp).toISOString(),
        Number(block.nonce),
      );

      // (Genesis block is canonical; for blocks > 0 verify recalculation)
      if (index > 0 && recalculatedHash.toLowerCase() !== block.blockHash.trim().toLowerCase()) {
        issues.push(`Block #${index} header hash recalculation failed (Tampered block data)!`);
      }
    }

    const latestBlockHash = blocks[blocks.length - 1]?.blockHash ?? '';

    return {
      valid: issues.length === 0,
      totalBlocks: blocks.length,
      totalTransactions,
      latestBlockHash,
      issues,
    };
  }

  /** Get blocks with pagination */
  public static async getBlocks(limit = 20, offset = 0): Promise<BlockchainBlockDto[]> {
    await this.ensureGenesisBlock();
    const { rows } = await pool.query(
      `SELECT b.block_index AS "blockIndex", b.block_hash AS "blockHash",
              b.previous_hash AS "previousHash", b.merkle_root AS "merkleRoot",
              b.nonce, b.transaction_count AS "transactionCount", b.timestamp
         FROM blockchain_blocks b
     ORDER BY b.block_index DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows;
  }

  /** Get transactions with pagination */
  public static async getTransactions(limit = 30, offset = 0): Promise<BlockchainTransactionDto[]> {
    const { rows } = await pool.query(
      `SELECT tx_id AS "txId", block_index AS "blockIndex", record_id AS "recordId",
              record_type AS "recordType", sha256_hash AS "sha256Hash", event_type AS "eventType",
              actor_ref AS "actorRef", timestamp
         FROM blockchain_transactions
     ORDER BY block_index DESC, timestamp DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return rows;
  }
}
