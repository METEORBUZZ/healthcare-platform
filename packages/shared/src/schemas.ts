import { z } from 'zod';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  BLOOD_GROUPS,
  GENDERS,
  USER_STATUSES,
} from './constants';

// ---------- primitives ----------
const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

/** Optional text field where an empty string means "not provided". */
const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254);

export const shiftAssignmentSchema = z.object({
  targetEmail: emailSchema,
  shiftName: trimmed(2, 50, 'Shift name'),
  shiftHours: trimmed(3, 80, 'Shift hours'),
  breakTime: trimmed(3, 80, 'Break time'),
  workingDays: trimmed(2, 100, 'Working days'),
  workingLocation: trimmed(2, 100, 'Working location'),
  roomArea: trimmed(1, 100, 'Room or assigned area'),
});
export type ShiftAssignmentInput = z.infer<typeof shiftAssignmentSchema>;

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters') // bcrypt truncates beyond 72 bytes
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'Password must include a letter and a number');

export const createStaffAccountSchema = z.object({
  name: trimmed(2, 100, 'Full name'),
  email: emailSchema,
  password: passwordSchema.optional(),
  role: z.enum(['STAFF', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LABORATORY_STAFF']),
  shiftAssignment: shiftAssignmentSchema.omit({ targetEmail: true }),
});
export type CreateStaffAccountInput = z.infer<typeof createStaffAccountSchema>;

export const adminCreateUserSchema = z.object({
  name: trimmed(2, 100, 'Full name'),
  email: emailSchema,
  password: passwordSchema.optional(),
  role: z.enum([
    'PATIENT',
    'DOCTOR',
    'ADMIN',
    'STAFF',
    'NURSE',
    'RECEPTIONIST',
    'PHARMACIST',
    'LABORATORY_STAFF',
  ]),
  specialization: optionalText(100),
  department: optionalText(100),
  phone: optionalText(30),
});
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(72),
    newPassword: passwordSchema,
    confirmPassword: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.confirmPassword !== undefined && v.newPassword !== v.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'New password and confirmation do not match',
      });
    }
    if (v.currentPassword === v.newPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['newPassword'],
        message: 'New password must be different from current password',
      });
    }
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(v);
  }, 'Enter a valid date');

export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use the format HH:MM');

const idParam = z.coerce.number().int().positive();
export const idParamSchema = z.object({ id: idParam });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

// ---------- auth ----------
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: trimmed(2, 100, 'Full name'),
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(['PATIENT', 'DOCTOR']).default('PATIENT'),
    specialization: optionalText(100),
  })
  .superRefine((v, ctx) => {
    if (v.role === 'DOCTOR' && !v.specialization) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specialization'],
        message: 'Specialization is required for doctors',
      });
    }
  });
export type RegisterInput = z.infer<typeof registerSchema>;

// ---------- profiles ----------
export const patientProfileSchema = z.object({
  name: trimmed(2, 100, 'Full name'),
  avatarUrl: optionalText(500000),
  phone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number')
      .optional(),
  ),
  gender: z.preprocess(emptyToUndefined, z.enum(GENDERS).optional()),
  dateOfBirth: z.preprocess(
    emptyToUndefined,
    isoDateSchema
      .refine(
        (v) => v <= new Date().toISOString().slice(0, 10),
        'Date of birth cannot be in the future',
      )
      .optional(),
  ),
  bloodGroup: z.preprocess(emptyToUndefined, z.enum(BLOOD_GROUPS).optional()),
  emergencyContact: optionalText(150),
  address: optionalText(500),
  medicalHistory: optionalText(2000),
});
export type PatientProfileInput = z.infer<typeof patientProfileSchema>;

export const doctorProfileSchema = z.object({
  name: trimmed(2, 100, 'Full name'),
  avatarUrl: optionalText(500000),
  specialization: trimmed(2, 100, 'Specialization'),
  experienceYears: z.coerce.number({ invalid_type_error: 'Enter a number' }).int().min(0).max(70),
  qualification: trimmed(2, 200, 'Qualification'),
  consultationFee: z.coerce.number({ invalid_type_error: 'Enter an amount' }).min(0).max(100000),
  bio: optionalText(1500),
  languages: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  hospitalAffiliation: optionalText(200),
});
export type DoctorProfileInput = z.infer<typeof doctorProfileSchema>;

export const updateMeSchema = z.object({
  name: trimmed(2, 100, 'Full name').optional(),
  avatarUrl: optionalText(500000),
  phone: optionalText(30),
  gender: z.preprocess(emptyToUndefined, z.enum(GENDERS).optional()),
  dateOfBirth: optionalText(30),
  bloodGroup: z.preprocess(emptyToUndefined, z.enum(BLOOD_GROUPS).optional()),
  emergencyContact: optionalText(150),
  address: optionalText(500),
  medicalHistory: optionalText(2000),
  specialization: optionalText(100),
  bio: optionalText(1500),
  qualification: optionalText(200),
  consultationFee: z.coerce.number().min(0).max(100000).optional(),
  hospitalAffiliation: optionalText(200),
});
export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export const vitalsSchema = z.object({
  patientId: z.coerce.number().int().positive().optional(),
  bloodPressure: z.string().trim().min(3).max(20).default('120/80'),
  heartRate: z.coerce.number().int().min(30).max(250).default(75),
  glucose: z.coerce.number().int().min(20).max(600).optional(),
  cholesterol: z.coerce.number().int().min(20).max(600).optional(),
  notes: optionalText(500),
});
export type VitalsInput = z.infer<typeof vitalsSchema>;

export const availabilityDaySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    isAvailable: z.boolean(),
    startTime: timeSchema,
    endTime: timeSchema,
    slotMinutes: z.number().int().min(10).max(120),
  })
  .refine((d) => !d.isAvailable || d.startTime < d.endTime, {
    path: ['endTime'],
    message: 'End time must be after start time',
  })
  .refine(
    (d) => {
      if (!d.isAvailable) return true;
      const [sh = 0, sm = 0] = d.startTime.split(':').map(Number);
      const [eh = 0, em = 0] = d.endTime.split(':').map(Number);
      return eh * 60 + em - (sh * 60 + sm) >= d.slotMinutes;
    },
    { path: ['endTime'], message: 'Working hours must fit at least one slot' },
  );

export const availabilitySchema = z
  .array(availabilityDaySchema)
  .length(7, 'Provide all 7 days')
  .refine(
    (days) => new Set(days.map((d) => d.dayOfWeek)).size === 7,
    'Each weekday must appear once',
  );
export type AvailabilityInput = z.infer<typeof availabilitySchema>;

// ---------- doctors (public search) ----------
export const doctorListQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  specialization: z.string().trim().max(100).optional(),
  availableOn: z.enum(['today', 'tomorrow']).optional(),
  sort: z.enum(['rating', 'experience', 'fee_asc', 'name']).default('rating'),
  verified: z.enum(['true', 'false', 'all']).optional(), // admin only
});
export type DoctorListQuery = z.infer<typeof doctorListQuerySchema>;

export const slotsQuerySchema = z.object({ date: isoDateSchema });

// ---------- appointments ----------
export const createAppointmentSchema = z.object({
  doctorId: z.number().int().positive(),
  date: isoDateSchema,
  time: timeSchema,
  type: z.enum(APPOINTMENT_TYPES).default('Consultation'),
  reason: trimmed(5, 1000, 'Reason'),
  notes: optionalText(1000),
});
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  doctorNotes: optionalText(2000),
  cancellationReason: optionalText(500),
});
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;

export const appointmentListQuerySchema = paginationSchema.extend({
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  when: z.enum(['upcoming', 'past', 'all']).default('all'),
  date: isoDateSchema.optional(),
  doctorId: z.coerce.number().int().positive().optional(), // admin only
});
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'Choose a rating').max(5),
  comment: optionalText(1000),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

// ---------- notifications / admin ----------
export const notificationListQuerySchema = paginationSchema.extend({
  unread: z.enum(['true', 'false']).optional(),
});

export const adminUserListQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  role: z
    .enum(['PATIENT', 'DOCTOR', 'ADMIN', 'STAFF', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LABORATORY_STAFF'])
    .optional(),
  status: z.enum(USER_STATUSES).optional(),
});

export const adminAuditQuerySchema = paginationSchema.extend({
  action: z.string().trim().min(1).max(80).optional(),
  actorUserId: z.coerce.number().int().positive().optional(),
});

export const updateUserStatusSchema = z.object({ status: z.enum(USER_STATUSES) });
export const updateDoctorVerificationSchema = z.object({ isVerified: z.boolean() });
