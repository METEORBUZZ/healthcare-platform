import { Router } from 'express';
import { z } from 'zod';
import { forbidden, notFound } from '../../common/errors';
import { asyncHandler, parse, requireAuth } from '../../common/http';
import { pool } from '../../db/pool';
import { authenticate } from '../../middleware/auth';
import { BlockchainService } from './blockchain.service';

export const blockchainRoutes = Router();

const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid report identifier format'),
});

const intIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Helper: Verify authorization for verifying a report
async function authorizeReportAccess(userId: number, role: string, reportId: string): Promise<void> {
  if (role === 'ADMIN' || role === 'LABORATORY_STAFF' || role === 'STAFF') {
    return;
  }
  const { rows } = await pool.query<{ patient_id: number }>('SELECT patient_id FROM reports WHERE id = $1', [reportId]);
  if (!rows[0]) throw notFound('Report not found');
  const patientId = rows[0].patient_id;

  if (role === 'PATIENT') {
    const patRes = await pool.query<{ id: number }>('SELECT id FROM patients WHERE user_id = $1', [userId]);
    if (!patRes.rows[0] || patRes.rows[0].id !== patientId) {
      throw forbidden('Access denied: You can only verify your own reports');
    }
    return;
  }

  if (role === 'DOCTOR') {
    const docRes = await pool.query<{ id: number }>('SELECT id FROM doctors WHERE user_id = $1', [userId]);
    if (!docRes.rows[0]) throw forbidden('Doctor profile not found');
    const doctorId = docRes.rows[0].id;
    const isAssigned = await pool.query(
      `SELECT 1 FROM patient_assignments WHERE doctor_id = $1 AND patient_id = $2 AND is_active = true
       UNION
       SELECT 1 FROM appointments WHERE doctor_id = $1 AND patient_id = $2`,
      [doctorId, patientId],
    );
    if (isAssigned.rows.length === 0) {
      throw forbidden('Access denied: You are not assigned to this patient');
    }
    return;
  }

  throw forbidden('Access denied');
}

// GET /api/blockchain/reports/:id/verify - Verify integrity & detect tampering
blockchainRoutes.get(
  '/reports/:id/verify',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    const { id } = parse(uuidParamSchema, req.params);
    await authorizeReportAccess(auth.userId, auth.role, id);

    const result = await BlockchainService.verifyReport(id);
    res.json({ data: result });
  }),
);

// POST /api/blockchain/reports/:id/anchor - Anchor report on blockchain
blockchainRoutes.post(
  '/reports/:id/anchor',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role === 'PATIENT') {
      throw forbidden('Patients cannot initiate blockchain anchoring');
    }
    const { id } = parse(uuidParamSchema, req.params);

    const { rows } = await pool.query(
      'SELECT id, patient_id AS "patientId", test_name AS "testName", category, report_date AS "reportDate", file_name AS "fileName", file_path AS "filePath", summary FROM reports WHERE id = $1',
      [id],
    );
    if (!rows[0]) throw notFound('Report not found');
    const report = rows[0];

    const hash = BlockchainService.calculateReportHash({
      id: report.id,
      patientId: report.patientId,
      testName: report.testName,
      category: report.category,
      reportDate: report.reportDate,
      summary: report.summary,
      fileName: report.fileName,
    });

    const txResult = await BlockchainService.anchorRecordOnChain({
      recordId: id,
      recordType: 'REPORT',
      sha256Hash: hash,
      eventType: 'REPORT_FINALIZED',
      actorUserId: auth.userId,
      metadata: { action: 'MANUAL_ANCHOR' },
    });

    res.json({ data: txResult });
  }),
);

// GET /api/blockchain/medical-records/:id/verify
blockchainRoutes.get(
  '/medical-records/:id/verify',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = parse(intIdParamSchema, req.params);
    const result = await BlockchainService.verifyMedicalRecord(id);
    res.json({ data: result });
  }),
);

// GET /api/blockchain/chain-status - Cryptographic chain validation
blockchainRoutes.get(
  '/chain-status',
  authenticate,
  asyncHandler(async (_req, res) => {
    const status = await BlockchainService.verifyChainIntegrity();
    res.json({ data: status });
  }),
);

// GET /api/blockchain/blocks - List blocks
blockchainRoutes.get(
  '/blocks',
  authenticate,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Number(req.query.offset) || 0;
    const blocks = await BlockchainService.getBlocks(limit, offset);
    res.json({ data: blocks });
  }),
);

// GET /api/blockchain/transactions - List transactions
blockchainRoutes.get(
  '/transactions',
  authenticate,
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const offset = Number(req.query.offset) || 0;
    const txs = await BlockchainService.getTransactions(limit, offset);
    res.json({ data: txs });
  }),
);

// POST /api/blockchain/reports/:id/simulate-tamper - QA & Security testing
blockchainRoutes.post(
  '/reports/:id/simulate-tamper',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role !== 'ADMIN') {
      throw forbidden('Only administrators can simulate tampering for testing');
    }
    const { id } = parse(uuidParamSchema, req.params);
    await pool.query(
      `UPDATE reports
          SET summary = summary || ' [CRITICAL UNAUTHORIZED MODIFICATION: ALTERED PARAMETER]',
              blockchain_status = 'TAMPER_DETECTED'
        WHERE id = $1`,
      [id],
    );
    res.json({ data: { message: 'Report data modified in database to simulate unauthorized tampering.' } });
  }),
);

// POST /api/blockchain/reports/:id/restore - Restore original text for testing
blockchainRoutes.post(
  '/reports/:id/restore',
  authenticate,
  asyncHandler(async (req, res) => {
    const auth = requireAuth(req);
    if (auth.role !== 'ADMIN') {
      throw forbidden('Only administrators can restore reports');
    }
    const { id } = parse(uuidParamSchema, req.params);
    await pool.query(
      `UPDATE reports
          SET summary = REPLACE(summary, ' [CRITICAL UNAUTHORIZED MODIFICATION: ALTERED PARAMETER]', ''),
              blockchain_status = 'VERIFIED'
        WHERE id = $1`,
      [id],
    );
    res.json({ data: { message: 'Report restored to original authentic content.' } });
  }),
);
