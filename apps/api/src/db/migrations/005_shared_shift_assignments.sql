CREATE TABLE staff_shift_assignments (
  target_email TEXT PRIMARY KEY CHECK (target_email = lower(btrim(target_email))),
  shift_name TEXT NOT NULL,
  shift_hours TEXT NOT NULL,
  break_time TEXT NOT NULL,
  working_days TEXT NOT NULL,
  working_location TEXT NOT NULL,
  room_area TEXT NOT NULL,
  created_by_user_id BIGINT NOT NULL REFERENCES users(id),
  updated_by_user_id BIGINT NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE staff_shift_assignment_audit (
  id BIGSERIAL PRIMARY KEY,
  target_email TEXT NOT NULL,
  changed_by_user_id BIGINT NOT NULL REFERENCES users(id),
  previous_assignment JSONB,
  new_assignment JSONB NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX staff_shift_assignment_audit_target_idx
  ON staff_shift_assignment_audit (target_email, changed_at DESC);
