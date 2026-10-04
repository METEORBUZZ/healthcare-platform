-- Migration 008: Add must_change_password column for first-login force password change flow
ALTER TABLE users
  ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX users_must_change_password_idx ON users (must_change_password) WHERE must_change_password = true;
