import type {
  AdminCreateUserInput,
  AdminDashboardDto,
  AdminAnalyticsDto,
  AdminAuditLogDto,
  AdminSettingsDto,
  AppointmentDto,
  ChangePasswordInput,
  CreateStaffAccountInput,
  CreateAppointmentInput,
  CreateReviewInput,
  DoctorDetailDto,
  DoctorDto,
  NotificationDto,
  Paginated,
  PatientDashboardDto,
  DoctorDashboardDto,
  PublicMeta,
  RegisterInput,
  SessionUser,
  SlotsDto,
  ShiftAssignmentDto,
  ShiftAssignmentInput,
  UserDto,
  UpdateMeInput,
  PatientTrackingDto,
  PatientVitalsDto,
  VitalsInput,
} from '@healthcare/shared';

const BASE_URL = '/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Raw fetch helper ─────────────────────────────────────────────────────────

async function fetchJson(path: string, options: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    // non-JSON body
  }

  if (!res.ok) {
    const error = json?.error as
      { code?: string; message?: string; details?: Record<string, string[]> } | undefined;
    if (error?.code === 'PASSWORD_CHANGE_REQUIRED') {
      window.dispatchEvent(new CustomEvent('password-change-required'));
    }
    throw new ApiError(
      res.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? `Request failed with status ${res.status}`,
      error?.details,
    );
  }

  return json;
}

/**
 * For endpoints that return `{ data: T }` — returns the unwrapped item directly.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const json = await fetchJson(path, options);
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

/**
 * For endpoints that return `{ data: T[], meta: { page, pageSize, total, totalPages } }`.
 * Returns the full Paginated<T> envelope so callers can access both `.data` and `.meta`.
 */
async function requestList<T>(path: string, options: RequestInit = {}): Promise<Paginated<T>> {
  const json = await fetchJson(path, options);
  // Normalise: if the server returned a plain array, wrap it
  if (Array.isArray(json)) {
    return {
      data: json as T[],
      meta: { page: 1, pageSize: json.length, total: json.length, totalPages: 1 },
    };
  }
  if (json && typeof json === 'object' && 'data' in json) {
    return json as Paginated<T>;
  }
  return { data: [], meta: { page: 1, pageSize: 0, total: 0, totalPages: 0 } };
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const api = {
  // ── Meta ──────────────────────────────────────────────────────────────────
  getMeta: () => request<PublicMeta>('/meta'),

  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (credentials: { email: string; password: string }) =>
    request<SessionUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  adminLogin: (credentials: { email: string; password: string }) =>
    request<SessionUser>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getAdminMe: () => request<SessionUser>('/admin/auth/me'),

  adminLogout: () =>
    request<void>('/admin/auth/logout', {
      method: 'POST',
    }),

  register: (data: RegisterInput) =>
    request<SessionUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<void>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<SessionUser>('/auth/me'),

  // ── Doctors ───────────────────────────────────────────────────────────────
  getDoctors: (
    params: { specialization?: string; search?: string; page?: number; pageSize?: number } = {},
  ) => {
    const query = new URLSearchParams();
    if (params.specialization) query.set('specialization', params.specialization);
    if (params.search) query.set('q', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    return requestList<DoctorDto>(`/doctors${qs ? `?${qs}` : ''}`);
  },

  getDoctor: (id: number) => request<DoctorDetailDto>(`/doctors/${id}`),

  getSlots: (doctorId: number, date: string) =>
    request<SlotsDto>(`/doctors/${doctorId}/slots?date=${date}`),

  // ── Appointments ──────────────────────────────────────────────────────────
  getAppointments: (params: { status?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    return requestList<AppointmentDto>(`/appointments${qs ? `?${qs}` : ''}`);
  },

  createAppointment: (data: CreateAppointmentInput) =>
    request<AppointmentDto>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAppointmentStatus: (
    id: number,
    data: { status: string; doctorNotes?: string; cancellationReason?: string },
  ) =>
    request<AppointmentDto>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  reviewAppointment: (id: number, data: CreateReviewInput) =>
    request<void>(`/appointments/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboard: (params?: { mode?: 'admin' | 'doctor' }) =>
    request<PatientDashboardDto | DoctorDashboardDto | AdminDashboardDto>(
      params?.mode ? `/dashboard?mode=${params.mode}` : '/dashboard',
    ),

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotifications: () => requestList<NotificationDto>('/notifications'),

  markNotificationAsRead: (id: number) =>
    request<void>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsAsRead: () =>
    request<void>('/notifications/read-all', {
      method: 'POST',
    }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  getAdminUsers: (params: { role?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    return requestList<UserDto>(`/admin/users${qs ? `?${qs}` : ''}`);
  },

  getAllAdminUsers: async () => {
    const pageSize = 100;
    const firstPage = await requestList<UserDto>(`/admin/users?page=1&pageSize=${pageSize}`);
    if (firstPage.meta.totalPages <= 1) return firstPage.data;
    const remainingPages = await Promise.all(
      Array.from({ length: firstPage.meta.totalPages - 1 }, (_, index) =>
        requestList<UserDto>(`/admin/users?page=${index + 2}&pageSize=${pageSize}`),
      ),
    );
    return [firstPage, ...remainingPages].flatMap((page) => page.data);
  },

  updateAdminUserStatus: (id: number, status: 'ACTIVE' | 'INACTIVE') =>
    request<UserDto>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getAdminAppointments: (params: { status?: string; page?: number; pageSize?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const suffix = query.size ? `?${query}` : '';
    return requestList<AppointmentDto>(`/admin/appointments${suffix}`);
  },

  getAdminAnalytics: () => request<AdminAnalyticsDto>('/admin/analytics'),

  getAdminSettings: () => request<AdminSettingsDto>('/admin/settings'),

  getAdminAuditLogs: (params: { page?: number; pageSize?: number; action?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.action) query.set('action', params.action);
    const suffix = query.size ? `?${query}` : '';
    return requestList<AdminAuditLogDto>(`/admin/audit-logs${suffix}`);
  },

  verifyDoctor: (doctorId: number, isVerified: boolean) =>
    request<DoctorDto>(`/admin/doctors/${doctorId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ isVerified }),
    }),

  getAdminShiftAssignments: () => request<ShiftAssignmentDto[]>('/admin/shift-assignments'),

  saveShiftAssignment: (data: ShiftAssignmentInput) =>
    request<ShiftAssignmentDto>('/admin/shift-assignments', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createStaffAccount: (data: CreateStaffAccountInput) =>
    request<{ user: UserDto; shiftAssignment: ShiftAssignmentDto; temporaryPassword?: string }>(
      '/admin/staff-users',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    ),

  createAdminUser: (data: AdminCreateUserInput) =>
    request<{ user: UserDto; temporaryPassword?: string }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  changePassword: (data: ChangePasswordInput) =>
    request<SessionUser>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyShiftAssignment: () => request<ShiftAssignmentDto | null>('/shifts/me'),

  // ── Profile & Tracking ───────────────────────────────────────────────────
  updateMe: (data: UpdateMeInput) =>
    request<SessionUser>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getPatientTracking: (patientId?: number) =>
    request<PatientTrackingDto>(
      patientId ? `/patients/${patientId}/tracking` : '/patients/me/tracking',
    ),

  getAllPatientTracking: () => request<PatientTrackingDto[]>('/patients/tracking/all'),

  recordVitals: (data: VitalsInput, patientId?: number) =>
    request<PatientVitalsDto>(patientId ? `/patients/${patientId}/vitals` : '/patients/me/vitals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
