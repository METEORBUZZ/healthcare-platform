CREATE TABLE clinical_access_audit (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
  actor_role    VARCHAR(32) NOT NULL,
  action        VARCHAR(40) NOT NULL CHECK (action IN (
                  'TRACKING_LIST_READ',
                  'PATIENT_TRACKING_READ',
                  'PATIENT_PROFILE_READ',
                  'PATIENT_PROFILE_UPDATE',
                  'PATIENT_VITALS_CREATE',
                  'APPOINTMENT_LIST_READ',
                  'APPOINTMENT_READ',
                  'APPOINTMENT_STATUS_UPDATE',
                  'APPOINTMENT_REVIEW_CREATE'
                )),
  patient_id    INTEGER REFERENCES patients (id) ON DELETE SET NULL,
  outcome       VARCHAR(10) NOT NULL CHECK (outcome IN ('ALLOWED', 'DENIED')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX clinical_access_audit_actor_created_idx
  ON clinical_access_audit (actor_user_id, created_at DESC);
CREATE INDEX clinical_access_audit_patient_created_idx
  ON clinical_access_audit (patient_id, created_at DESC);
