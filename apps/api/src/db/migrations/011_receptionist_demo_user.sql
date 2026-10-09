-- Migration 011: Ensure receptionist demo user and shift assignment exist
INSERT INTO users (name, email, password_hash, role, status)
VALUES (
  'Kavita Sundaram',
  'receptionist@demo.test',
  '$2b$10$6Sc7tWpmQB.5fKDnMJNT0.DAhugdg0whlds7gtV09kOx2tvK64xxy', -- Demo@12345
  'RECEPTIONIST',
  'ACTIVE'
)
ON CONFLICT ((lower(email))) DO UPDATE SET password_hash = EXCLUDED.password_hash, status = 'ACTIVE';

-- Ensure receptionist has a staff entry
INSERT INTO staff (user_id, department_id, designation, employee_code, phone, assigned_area)
SELECT u.id, d.id, 'OPD Reception Lead', 'STF-105', '+91 98765 00005', 'Main Hospital Entrance — Counter 02 (OPD Registration Desk)'
FROM users u
CROSS JOIN (SELECT id FROM departments ORDER BY id ASC LIMIT 1) d
WHERE lower(u.email) = 'receptionist@demo.test'
ON CONFLICT (user_id) DO NOTHING;

-- Ensure shift assignment for receptionist exists
INSERT INTO staff_shift_assignments (target_email, shift_name, shift_hours, break_time, working_days, working_location, room_area, created_by_user_id, updated_by_user_id)
SELECT 'receptionist@demo.test', 'Morning Shift', '07:30 AM - 03:30 PM', '12:00 PM - 12:45 PM', 'Mon to Sat', 'Reception', 'Main Hospital Entrance — Counter 02 (OPD Registration Desk)', u.id, u.id
FROM users u
WHERE lower(u.email) = 'admin@demo.test'
ON CONFLICT (target_email) DO UPDATE SET
  shift_name = EXCLUDED.shift_name,
  shift_hours = EXCLUDED.shift_hours,
  break_time = EXCLUDED.break_time,
  working_days = EXCLUDED.working_days,
  working_location = EXCLUDED.working_location,
  room_area = EXCLUDED.room_area;
