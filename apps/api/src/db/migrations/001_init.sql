-- HealthCare+ initial schema

CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------- users
CREATE TABLE users (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(254) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  role          VARCHAR(10)  NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
  status        VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  avatar_url    TEXT,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));
CREATE INDEX users_role_idx ON users (role);

-- ---------------------------------------------------------------- patients
CREATE TABLE patients (
  id                INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id           INTEGER NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  date_of_birth     DATE,
  gender            VARCHAR(20),
  phone             VARCHAR(25),
  blood_group       VARCHAR(3) CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  emergency_contact VARCHAR(150),
  address           TEXT,
  medical_history   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- doctors
CREATE TABLE doctors (
  id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id              INTEGER NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  specialization       VARCHAR(100) NOT NULL,
  experience_years     SMALLINT NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  qualification        VARCHAR(200) NOT NULL DEFAULT '',
  consultation_fee     NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (consultation_fee >= 0),
  bio                  TEXT,
  languages            TEXT[] NOT NULL DEFAULT '{}',
  hospital_affiliation VARCHAR(200),
  -- New doctors stay hidden from the public directory until an admin verifies them.
  is_verified          BOOLEAN NOT NULL DEFAULT false,
  verified_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX doctors_specialization_idx ON doctors (lower(specialization));
CREATE INDEX doctors_verified_idx ON doctors (is_verified);

-- One working window per weekday (0 = Sunday).
CREATE TABLE doctor_availability (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id    INTEGER  NOT NULL REFERENCES doctors (id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME     NOT NULL,
  end_time     TIME     NOT NULL,
  slot_minutes SMALLINT NOT NULL DEFAULT 30 CHECK (slot_minutes BETWEEN 10 AND 120),
  is_available BOOLEAN  NOT NULL DEFAULT true,
  UNIQUE (doctor_id, day_of_week),
  CHECK (end_time > start_time)
);

-- ---------------------------------------------------------------- appointments
CREATE TABLE appointments (
  id                  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  patient_id          INTEGER NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  doctor_id           INTEGER NOT NULL REFERENCES doctors (id) ON DELETE CASCADE,
  appointment_date    DATE    NOT NULL,
  start_time          TIME    NOT NULL,
  duration_minutes    SMALLINT NOT NULL DEFAULT 30,
  status              VARCHAR(10) NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  appointment_type    VARCHAR(50) NOT NULL DEFAULT 'Consultation',
  reason              TEXT NOT NULL,
  notes               TEXT,
  doctor_notes        TEXT,
  cancellation_reason TEXT,
  cancelled_by        VARCHAR(10) CHECK (cancelled_by IN ('PATIENT', 'DOCTOR', 'ADMIN')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Double-booking protection lives in the database so it holds under concurrent requests.
-- Cancelled appointments release their slot.
CREATE UNIQUE INDEX appointments_doctor_slot_active_key
  ON appointments (doctor_id, appointment_date, start_time) WHERE status <> 'CANCELLED';
CREATE UNIQUE INDEX appointments_patient_slot_active_key
  ON appointments (patient_id, appointment_date, start_time) WHERE status <> 'CANCELLED';

CREATE INDEX appointments_doctor_date_idx ON appointments (doctor_id, appointment_date);
CREATE INDEX appointments_patient_date_idx ON appointments (patient_id, appointment_date);
CREATE INDEX appointments_status_idx ON appointments (status);

-- ---------------------------------------------------------------- reviews
CREATE TABLE reviews (
  id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id INTEGER NOT NULL UNIQUE REFERENCES appointments (id) ON DELETE CASCADE,
  doctor_id      INTEGER NOT NULL REFERENCES doctors (id) ON DELETE CASCADE,
  patient_id     INTEGER NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX reviews_doctor_idx ON reviews (doctor_id, created_at DESC);

-- ---------------------------------------------------------------- notifications
CREATE TABLE notifications (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title      VARCHAR(150) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(20) NOT NULL DEFAULT 'SYSTEM' CHECK (type IN ('APPOINTMENT', 'SYSTEM')),
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, is_read, created_at DESC);

-- ---------------------------------------------------------------- refresh tokens
-- Only a SHA-256 hash of the token is stored; the raw value lives in an httpOnly cookie.
CREATE TABLE refresh_tokens (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);

-- ---------------------------------------------------------------- updated_at triggers
CREATE TRIGGER users_updated_at        BEFORE UPDATE ON users        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER patients_updated_at     BEFORE UPDATE ON patients     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER doctors_updated_at      BEFORE UPDATE ON doctors      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
