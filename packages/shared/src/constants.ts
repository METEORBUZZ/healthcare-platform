export const ROLES = [
  'ADMIN',
  'DOCTOR',
  'STAFF',
  'NURSE',
  'RECEPTIONIST',
  'PHARMACIST',
  'LABORATORY_STAFF',
  'PATIENT',
] as const;
export type Role = (typeof ROLES)[number];

export const DEPARTMENTS = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Gynecology & Obstetrics',
  'General Medicine',
  'Emergency & Trauma',
  'Intensive Care Unit (ICU)',
  'Radiology & Imaging',
  'Pathology & Laboratory',
  'Pharmacy Services',
  'Surgery & Operation Theatre',
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const WORKING_LOCATIONS = [
  'OPD',
  'Emergency',
  'ICU',
  'General Ward',
  'Private Ward',
  'Laboratory',
  'Pharmacy',
  'Reception',
  'Radiology',
  'Operation Theatre',
  'Consultation Room',
] as const;
export type WorkingLocation = (typeof WORKING_LOCATIONS)[number];

export const STAFF_TYPES = [
  'Nurse',
  'Receptionist',
  'Pharmacist',
  'Laboratory Staff',
  'Administrative Staff',
] as const;
export type StaffType = (typeof STAFF_TYPES)[number];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'General checkup'] as const;
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'] as const;
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * Appointment lifecycle. Terminal states (COMPLETED, CANCELLED) have no outgoing edges.
 * Enforced on the server; mirrored on the client only to decide which buttons to show.
 */
export const STATUS_TRANSITIONS: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}
