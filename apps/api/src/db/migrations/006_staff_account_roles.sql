ALTER TABLE users
  ALTER COLUMN role TYPE VARCHAR(32);

ALTER TABLE users
  DROP CONSTRAINT users_role_check,
  ADD CONSTRAINT users_role_check CHECK (
    role IN (
      'PATIENT',
      'DOCTOR',
      'ADMIN',
      'STAFF',
      'NURSE',
      'RECEPTIONIST',
      'PHARMACIST',
      'LABORATORY_STAFF'
    )
  );
