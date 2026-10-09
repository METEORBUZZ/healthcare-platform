-- Migration 009: Core hospital tables for Private Hospital Management System
-- Fulfills BRD/PRD, UI/UX, Backend, Database and Security specifications

-- 1. Departments
CREATE TABLE IF NOT EXISTS departments (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,
  code          VARCHAR(20)  NOT NULL UNIQUE,
  description   TEXT,
  head_doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 2. Staff Profiles
CREATE TABLE IF NOT EXISTS staff (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  designation   VARCHAR(100) NOT NULL,
  employee_code VARCHAR(50) UNIQUE,
  phone         VARCHAR(25),
  assigned_area VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Patient Assignments (Doctors to Patients)
CREATE TABLE IF NOT EXISTS patient_assignments (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id   INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id  INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  notes       TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, patient_id)
);

-- 4. Floor & Operational Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title               VARCHAR(150) NOT NULL,
  description         TEXT,
  assigned_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ward                VARCHAR(100),
  status              VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  priority            VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
  patient_id          INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  due_date            TIMESTAMPTZ,
  created_by          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Clinical Medical Records (SOAP Notes & Diagnoses)
CREATE TABLE IF NOT EXISTS medical_records (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id       INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  record_type     VARCHAR(50) NOT NULL DEFAULT 'CLINICAL_NOTE',
  chief_complaint TEXT,
  diagnosis       TEXT,
  soap_notes      TEXT NOT NULL,
  treatment_plan  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id      INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id       INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  medication_name VARCHAR(150) NOT NULL,
  dosage          VARCHAR(50) NOT NULL,
  frequency       VARCHAR(50) NOT NULL,
  duration        VARCHAR(50) NOT NULL,
  instructions    TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISCONTINUED', 'COMPLETED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Diagnostic Reports (UUID Primary Key to prevent sequential enumeration)
CREATE TABLE IF NOT EXISTS reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  prescribing_doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL,
  uploaded_by_user_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  test_name             VARCHAR(150) NOT NULL,
  category              VARCHAR(80) NOT NULL DEFAULT 'Diagnostic',
  report_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  file_name             VARCHAR(255) NOT NULL,
  file_path             TEXT NOT NULL,
  file_size             INTEGER NOT NULL DEFAULT 0,
  mime_type             VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  status                VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'VERIFIED')),
  summary               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queries and referential checks
CREATE INDEX IF NOT EXISTS staff_user_idx ON staff(user_id);
CREATE INDEX IF NOT EXISTS staff_department_idx ON staff(department_id);
CREATE INDEX IF NOT EXISTS patient_assignments_doctor_idx ON patient_assignments(doctor_id, is_active);
CREATE INDEX IF NOT EXISTS patient_assignments_patient_idx ON patient_assignments(patient_id, is_active);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON tasks(assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS medical_records_patient_idx ON medical_records(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS prescriptions_patient_idx ON prescriptions(patient_id, status);
CREATE INDEX IF NOT EXISTS reports_patient_idx ON reports(patient_id, report_date DESC);
CREATE INDEX IF NOT EXISTS reports_doctor_idx ON reports(prescribing_doctor_id);
