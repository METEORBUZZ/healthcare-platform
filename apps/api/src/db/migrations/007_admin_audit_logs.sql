CREATE TABLE admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(80) NOT NULL,
  target_id VARCHAR(160),
  outcome VARCHAR(16) NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE', 'DENIED')),
  request_id VARCHAR(128),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_logs_created_idx ON admin_audit_logs (created_at DESC, id DESC);
CREATE INDEX admin_audit_logs_actor_idx ON admin_audit_logs (actor_user_id, id DESC);
CREATE INDEX admin_audit_logs_action_idx ON admin_audit_logs (action, id DESC);
