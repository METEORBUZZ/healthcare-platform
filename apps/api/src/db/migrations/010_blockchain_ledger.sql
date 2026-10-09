-- Migration 010: Blockchain Ledger for Medical Record Integrity & Tamper Detection
-- Pure cryptographic integrity layer: Stores only SHA-256 hashes, Merkle roots, and safe IDs (NO PII)

CREATE TABLE IF NOT EXISTS blockchain_blocks (
  block_index       BIGINT PRIMARY KEY,
  block_hash        CHAR(64) NOT NULL UNIQUE,
  previous_hash     CHAR(64) NOT NULL,
  merkle_root       CHAR(64) NOT NULL,
  nonce             BIGINT NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blockchain_transactions (
  tx_id             CHAR(66) PRIMARY KEY,
  block_index       BIGINT NOT NULL REFERENCES blockchain_blocks(block_index) ON DELETE CASCADE,
  record_id         VARCHAR(100) NOT NULL,
  record_type       VARCHAR(50) NOT NULL CHECK (record_type IN ('REPORT', 'MEDICAL_RECORD')),
  sha256_hash       CHAR(64) NOT NULL,
  event_type        VARCHAR(50) NOT NULL CHECK (event_type IN (
                      'REPORT_CREATED',
                      'REPORT_FINALIZED',
                      'REPORT_UPDATED',
                      'REPORT_APPROVED',
                      'RECORD_FINALIZED',
                      'CRITICAL_VERIFICATION'
                    )),
  actor_ref         VARCHAR(100),
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link reports and medical records to blockchain transaction hashes
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS blockchain_tx_id CHAR(66),
  ADD COLUMN IF NOT EXISTS blockchain_hash CHAR(64),
  ADD COLUMN IF NOT EXISTS blockchain_status VARCHAR(20) DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS blockchain_anchored_at TIMESTAMPTZ;

ALTER TABLE medical_records
  ADD COLUMN IF NOT EXISTS blockchain_tx_id CHAR(66),
  ADD COLUMN IF NOT EXISTS blockchain_hash CHAR(64),
  ADD COLUMN IF NOT EXISTS blockchain_anchored_at TIMESTAMPTZ;

-- Indices for rapid lookup during verification audits
CREATE INDEX IF NOT EXISTS blockchain_tx_record_idx ON blockchain_transactions(record_id, record_type);
CREATE INDEX IF NOT EXISTS blockchain_tx_hash_idx ON blockchain_transactions(sha256_hash);
CREATE INDEX IF NOT EXISTS blockchain_tx_block_idx ON blockchain_transactions(block_index);
CREATE INDEX IF NOT EXISTS blockchain_blocks_hash_idx ON blockchain_blocks(block_hash);
