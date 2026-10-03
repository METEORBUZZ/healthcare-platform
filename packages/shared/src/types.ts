import type { AppointmentStatus, AppointmentType, Role, UserStatus } from './constants';

/** Shapes returned by the API. All JSON is camelCase; dates are ISO strings or YYYY-MM-DD. */

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  doctorId: number | null;
  patientId: number | null;
  /** Only meaningful for doctors: unverified doctors are hidden from the public directory. */
  isVerified: boolean | null;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  avatarUrl: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AvailabilityDayDto {
  dayOfWeek: number;
  isAvailable: boolean;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  slotMinutes: number;
}

export interface DoctorDto {
  id: number;
  userId: number;
  name: string;
  email?: string; // only exposed to admins and to the doctor themself
  avatarUrl: string | null;
  specialization: string;
  experienceYears: number;
  qualification: string;
  consultationFee: number;
  bio: string | null;
  languages: string[];
  hospitalAffiliation: string | null;
  isVerified: boolean;
  rating: number | null;
  reviewCount: number;
}

export interface DoctorDetailDto extends DoctorDto {
  availability: AvailabilityDayDto[];
}

export interface SlotDto {
  time: string; // HH:MM
  available: boolean;
}

export interface SlotsDto {
  date: string;
  durationMinutes: number;
  slots: SlotDto[];
}

export interface PatientDto {
  id: number;
  userId: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  emergencyContact: string | null;
  address: string | null;
  medicalHistory: string | null;
}

export interface AppointmentDto {
  id: number;
  date: string; // YYYY-MM-DD (clinic timezone)
  time: string; // HH:MM 24h
  durationMinutes: number;
  status: AppointmentStatus;
  type: AppointmentType | string;
  reason: string;
  notes: string | null;
  doctorNotes: string | null;
  cancellationReason: string | null;
  cancelledBy: Role | null;
  hasReview: boolean;
  createdAt: string;
  updatedAt: string;
  doctor: { id: number; name: string; avatarUrl: string | null; specialization: string };
  patient: { id: number; name: string; email: string; phone: string | null };
}

export interface ReviewDto {
  id: number;
  rating: number;
  comment: string | null;
  authorName: string; // masked, e.g. "Rohan S."
  createdAt: string;
}

export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PageMeta;
}

export interface PublicMeta {
  today: string; // YYYY-MM-DD in the clinic timezone
  timezone: string;
  bookingWindowDays: number;
}

export type StatusCounts = Record<AppointmentStatus, number>;

export interface PatientDashboardDto {
  role: 'PATIENT';
  upcoming: AppointmentDto[];
  counts: { total: number; completed: number; cancelled: number; upcoming: number };
}

export interface DoctorDashboardDto {
  role: 'DOCTOR';
  isVerified: boolean;
  today: AppointmentDto[];
  counts: { today: number; upcoming: number; completed: number; pendingRequests: number };
}

export interface AdminDashboardDto {
  role: 'ADMIN';
  counts: {
    users: number;
    patients: number;
    doctors: number;
    doctorsAwaitingVerification: number;
    appointments: number;
  };
  byStatus: StatusCounts;
  last7Days: { date: string; count: number }[];
  recent: AppointmentDto[];
}

export type DashboardDto = PatientDashboardDto | DoctorDashboardDto | AdminDashboardDto;

export interface PatientVitalsDto {
  id: number;
  patientId: number;
  bloodPressure: string;
  heartRate: number;
  glucose: number | null;
  cholesterol: number | null;
  notes: string | null;
  recordedBy: number | null;
  createdAt: string;
}

export interface PatientTrackingHistoryItem {
  id: number;
  date: string;
  time: string;
  doctorName: string;
  department: string;
  diagnosis: string;
  severity: 'High' | 'Medium' | 'Low';
  totalVisits: number;
  status: string;
  doctorNotes: string | null;
}

export interface PatientTrackingDto {
  patient: {
    id: number;
    userId: number;
    name: string;
    email: string;
    avatarUrl: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    age: number | null;
    bloodGroup: string | null;
    status: string;
    department: string;
    registeredDate: string;
    totalAppointments: number;
    bedNumber: string;
    phone: string | null;
    emergencyContact: string | null;
    medicalHistory: string | null;
  };
  vitals: {
    current: PatientVitalsDto | null;
    history: PatientVitalsDto[];
  };
  history: PatientTrackingHistoryItem[];
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: Record<string, string[]> };
}

// ─── Hospital Operations Types ───────────────────────────────────────────────

export interface DoctorProfileDto {
  id: number;
  userId: number;
  name: string;
  avatarUrl: string | null;
  employeeId: string;
  phone: string;
  email: string;
  department: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  todayShift: string;
  shiftHours: string;
  breakTime: string;
  workingDays: string;
  workingLocation: string;
  roomNumber: string;
  nextShift: string;
  status: UserStatus;
  assignedPatientCount: number;
}

export interface StaffProfileDto {
  id: number;
  userId: number;
  name: string;
  avatarUrl: string | null;
  employeeId: string;
  phone: string;
  email: string;
  staffType: string;
  department: string;
  todayShift: string;
  shiftHours: string;
  breakTime: string;
  workingDays: string;
  workingLocation: string;
  assignedArea: string;
  nextShift: string;
  status: UserStatus;
}

export interface AssignedPatientDto {
  id: number;
  patientId: string; // e.g. "PT-10029"
  name: string;
  age: number;
  gender: string;
  phone: string;
  appointmentTime: string;
  appointmentStatus: AppointmentStatus;
  department: string;
  lastVisit: string;
  medicalRecordStatus: 'Up to Date' | 'Pending Review' | 'Critical Review';
  priority: 'Routine' | 'Urgent' | 'STAT Emergency';
  doctorId: number;
  diagnosis?: string;
  prescriptions?: Array<{ medication: string; dosage: string; frequency: string; duration: string }>;
  medicalNotes?: string[];
  labReports?: Array<{ testName: string; status: 'Normal' | 'Abnormal' | 'Pending'; date: string; resultSummary: string }>;
  history?: Array<{ date: string; title: string; doctor: string; notes: string }>;
}

export interface WardBedAssignmentDto {
  id: string;
  bedNumber: string;
  ward: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: string;
  diagnosis: string;
  vitals: { bp: string; pulse: number; temp: string; spO2: number };
  nursingNotes: string[];
  status: 'Stable' | 'Needs Observation' | 'Critical';
  admittedAt: string;
}

export interface ReceptionAppointmentDto {
  id: number;
  patientName: string;
  phone: string;
  doctorName: string;
  department: string;
  time: string;
  date: string;
  status: 'Scheduled' | 'Checked In' | 'In Consultation' | 'Completed' | 'Cancelled';
  tokenNumber: string;
}

export interface PrescriptionQueueItemDto {
  id: number;
  patientName: string;
  patientId: string;
  doctorName: string;
  date: string;
  medicines: Array<{ name: string; dosage: string; quantity: number; instructions: string }>;
  status: 'Pending' | 'Dispensed' | 'Out of Stock';
  dispensedAt?: string;
}

export interface MedicineStockItemDto {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  expiryDate: string;
}

export interface LaboratoryTestItemDto {
  id: string;
  testId: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  testName: string;
  sampleType: string;
  priority: 'Routine' | 'Urgent' | 'STAT Emergency';
  status: 'Pending Collection' | 'Sample Received' | 'In Analysis' | 'Completed';
  resultSummary?: string;
  completedAt?: string;
}

export interface HospitalOverviewDto {
  totalDoctors: number;
  totalStaff: number;
  activeStaff: number;
  onDutyStaff: number;
  currentShifts: number;
  departments: number;
  workingLocations: number;
  todayAppointments: number;
  patientCount: number;
  pendingTasks: number;
}

