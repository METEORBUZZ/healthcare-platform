CREATE TABLE IF NOT EXISTS patient_vitals (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id    INTEGER NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  blood_pressure VARCHAR(20) NOT NULL,
  heart_rate    SMALLINT NOT NULL CHECK (heart_rate BETWEEN 30 AND 250),
  glucose       SMALLINT CHECK (glucose BETWEEN 20 AND 600),
  cholesterol   SMALLINT CHECK (cholesterol BETWEEN 20 AND 600),
  notes         TEXT,
  recorded_by   INTEGER REFERENCES users (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patient_vitals_patient_created_idx
  ON patient_vitals (patient_id, created_at DESC);

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bed_number VARCHAR(20);

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS diagnosis TEXT,
  ADD COLUMN IF NOT EXISTS severity VARCHAR(10),
  ADD COLUMN IF NOT EXISTS treatment_status VARCHAR(30);
