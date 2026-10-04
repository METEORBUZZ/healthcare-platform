ALTER TABLE clinical_access_audit
  DROP CONSTRAINT clinical_access_audit_action_check;

ALTER TABLE clinical_access_audit
  ADD CONSTRAINT clinical_access_audit_action_check CHECK (action IN (
    'TRACKING_LIST_READ',
    'PATIENT_TRACKING_READ',
    'PATIENT_PROFILE_READ',
    'PATIENT_PROFILE_UPDATE',
    'PATIENT_VITALS_CREATE',
    'APPOINTMENT_LIST_READ',
    'APPOINTMENT_READ',
    'APPOINTMENT_STATUS_UPDATE',
    'APPOINTMENT_REVIEW_CREATE',
    'APPOINTMENT_CREATE'
  ));
