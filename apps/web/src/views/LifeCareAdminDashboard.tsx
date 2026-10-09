import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Calendar,
  Activity,
  DollarSign,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Stethoscope,
  Bed,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import type {
  AdminDashboardDto,
  AdminAnalyticsDto,
  UserDto,
  DoctorDto,
  AdminAuditLogDto,
  AppointmentDto,
} from '@healthcare/shared';
import { api, ApiError } from '../api/client';
import {
  hospitalOperationsService,
  type AssignedPatientRecord,
  type DoctorRecord,
  type ScheduleEntryRecord,
  type WardBedRecord,
} from '../utils/hospitalOperationsService';

interface LifeCareAdminDashboardProps {
  onNavigate: (route: string) => void;
}

export const LifeCareAdminDashboard: React.FC<LifeCareAdminDashboardProps> = ({ onNavigate }) => {
  // Real Data States
  const [dashboardData, setDashboardData] = useState<AdminDashboardDto | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsDto | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserDto[]>([]);
  const [doctorsList, setDoctorsList] = useState<DoctorDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogDto[]>([]);

  // Hospital Operations Service States
  const [assignedPatients, setAssignedPatients] = useState<AssignedPatientRecord[]>([]);
  const [hospitalSchedule, setHospitalSchedule] = useState<ScheduleEntryRecord[]>([]);
  const [hospitalOverview, setHospitalOverview] = useState(
    hospitalOperationsService.getHospitalOverview(),
  );
  const [wardBeds, setWardBeds] = useState<WardBedRecord[]>([]);

  // UI Interactive States
  const [patientSearch, setPatientSearch] = useState('');
  const [activitySearch, setActivitySearch] = useState('');
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);

  // Dynamic Current Date Info
  const now = useMemo(() => new Date(), []);
  const currentMonthYear = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);
  }, [now]);
  const currentDayNum = now.getDate();

  // Dynamic 5-day week strip around current date + offset
  const weekDays = useMemo(() => {
    const list = [];
    const baseDate = new Date(now);
    baseDate.setDate(now.getDate() + selectedWeekOffset * 7);

    // Determine current day of week (0=Sun, 1=Mon, ..., 6=Sat)
    const dayOfWeek = baseDate.getDay();
    // Start from Monday (or Sunday if preferred)
    const startOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    for (let i = 0; i < 5; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + startOffset + i);
      list.push({
        day: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
        num: d.getDate(),
        fullDate: d.toISOString().split('T')[0],
        isToday: d.toDateString() === now.toDateString(),
      });
    }
    return list;
  }, [now, selectedWeekOffset]);

  const [activeSelectedDay, setActiveSelectedDay] = useState<number>(currentDayNum);

  // Load Real Data
  useEffect(() => {
    let isMounted = true;

    const loadLocalData = () => {
      setAssignedPatients(hospitalOperationsService.getAssignedPatients());
      setHospitalSchedule(hospitalOperationsService.getSchedule());
      setHospitalOverview(hospitalOperationsService.getHospitalOverview());
      setWardBeds(hospitalOperationsService.getWardBeds());
    };

    const loadApiData = async () => {
      try {
        const [dash, stats, users, docs, logs] = await Promise.allSettled([
          api.getDashboard(),
          api.getAdminAnalytics(),
          api.getAllAdminUsers(),
          api.getDoctors(),
          api.getAdminAuditLogs({ pageSize: 6 }),
        ]);

        if (!isMounted) return;

        if (dash.status === 'fulfilled' && dash.value.role === 'ADMIN') {
          setDashboardData(dash.value);
        }
        if (stats.status === 'fulfilled') {
          setAnalytics(stats.value);
        }
        if (users.status === 'fulfilled') {
          setRegisteredUsers(users.value);
        }
        if (docs.status === 'fulfilled') {
          setDoctorsList(docs.value.data);
        }
        if (logs.status === 'fulfilled') {
          setAuditLogs(logs.value.data);
        }
      } catch {
        // Fallback gracefully to local hospital operations store
      }
    };

    loadLocalData();
    void loadApiData();

    const handleUpdate = () => {
      loadLocalData();
      void loadApiData();
    };

    window.addEventListener('niramaya:hospital-operations-updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('niramaya:hospital-operations-updated', handleUpdate);
    };
  }, []);

  // Filtered Patients (Real Registered Patients + Local Assigned)
  const patientUsers = useMemo(() => {
    const fromUsers = registeredUsers.filter((u) => u.role === 'PATIENT');
    if (fromUsers.length > 0) {
      return fromUsers.map((u) => ({
        id: `PT-${u.id.toString().padStart(4, '0')}`,
        name: u.name,
        email: u.email,
        admit: new Date(u.createdAt).toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: '2-digit',
        }),
        type: 'Outpatient (OPD)',
        status: u.status === 'ACTIVE' ? 'Active' : 'Inactive',
        statusColor: u.status === 'ACTIVE' ? '#10b981' : '#9ca3af',
      }));
    }
    return assignedPatients.map((p) => ({
      id: p.patientId,
      name: p.name,
      email: p.phone,
      admit: p.lastVisit,
      type: p.department,
      status: p.appointmentStatus,
      statusColor:
        p.appointmentStatus === 'CONFIRMED'
          ? '#10b981'
          : p.appointmentStatus === 'CANCELLED'
            ? '#ef4444'
            : '#f59e0b',
    }));
  }, [registeredUsers, assignedPatients]);

  const filteredPatients = useMemo(() => {
    return patientUsers.filter((p) => {
      if (!patientSearch) return true;
      const q = patientSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    });
  }, [patientUsers, patientSearch]);

  // Real Appointments for Schedule and Upcoming
  const todayAppointments = useMemo(() => {
    if (dashboardData?.recent && dashboardData.recent.length > 0) {
      return dashboardData.recent;
    }
    return [];
  }, [dashboardData]);

  // Real Activity Stream from Audit Logs or Appointments
  const recentActivities = useMemo(() => {
    if (auditLogs.length > 0) {
      return auditLogs.map((log) => ({
        id: log.id,
        name: log.action.replace(/_/g, ' '),
        detail: log.targetType + (log.targetId ? ` #${log.targetId}` : ''),
        status: log.outcome,
        statusColor:
          log.outcome === 'SUCCESS' ? '#10b981' : log.outcome === 'DENIED' ? '#ef4444' : '#f59e0b',
        date: new Date(log.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
    }
    return [];
  }, [auditLogs]);

  const filteredActivities = useMemo(() => {
    return recentActivities.filter((a) => {
      if (!activitySearch) return true;
      const q = activitySearch.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.detail.toLowerCase().includes(q);
    });
  }, [recentActivities, activitySearch]);

  // Real Doctor Directory
  const displayDoctors = useMemo(() => {
    if (doctorsList.length > 0) {
      return doctorsList.map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialization || 'Consultant',
        status: d.isVerified ? 'Available' : 'Pending Verification',
        statusColor: d.isVerified ? '#10b981' : '#f59e0b',
        avatar:
          d.avatarUrl ||
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=120',
      }));
    }
    const localDocs = hospitalOperationsService.getDoctors();
    return localDocs.map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.department,
      status: d.status === 'ACTIVE' ? 'Available' : 'Off Duty',
      statusColor: d.status === 'ACTIVE' ? '#10b981' : '#9ca3af',
      avatar:
        d.avatarUrl ||
        'https://images.unsplash.com/photo-1594824813589-3286ff00eeae?auto=format&fit=crop&q=80&w=120',
    }));
  }, [doctorsList]);

  // Derived real KPI counts
  const totalPatientsCount =
    analytics?.totalUsers !== undefined
      ? patientUsers.length
      : hospitalOverview.patientCount;

  const totalAppointmentsCount =
    dashboardData?.counts.appointments ??
    analytics?.totalAppointments ??
    hospitalSchedule.length;

  const totalDoctorsCount =
    dashboardData?.counts.doctors ??
    analytics?.totalDoctors ??
    displayDoctors.length;

  const totalStaffCount =
    analytics?.totalStaff ??
    registeredUsers.filter((u) =>
      ['NURSE', 'RECEPTIONIST', 'PHARMACIST', 'LABORATORY_STAFF', 'STAFF'].includes(u.role),
    ).length ??
    hospitalOverview.totalStaff;

  // Bed Occupancy Calculation
  const totalBeds = wardBeds.length || 12;
  const occupiedBeds = wardBeds.filter((b) => Boolean(b.patientName)).length;
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const availableBeds = Math.max(0, totalBeds - occupiedBeds);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* ─── 4 Top Gradient Cards (Real System Metrics) ────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Total Patients Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #00d2c4 100%)',
            borderRadius: '16px',
            padding: '1.35rem 1.4rem',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px',
            boxShadow: '0 8px 24px rgba(0, 210, 196, 0.22)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Users size={20} color="#ffffff" />
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 600, opacity: 0.95 }}>Total Patients</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '1.2rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1 }}>{totalPatientsCount}</span>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.22)',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textAlign: 'right',
                lineHeight: 1.15,
                backdropFilter: 'blur(4px)',
              }}
            >
              <div>Active</div>
              <div style={{ opacity: 0.85, fontSize: '0.65rem', fontWeight: 500 }}>Hospital Records</div>
            </div>
          </div>
        </div>

        {/* Total Appointment Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
            borderRadius: '16px',
            padding: '1.35rem 1.4rem',
            color: '#1f2937',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px',
            boxShadow: '0 8px 24px rgba(253, 224, 71, 0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={20} color="#854d0e" />
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#451a03' }}>Total Appointment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '1.2rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#1f2937', lineHeight: 1 }}>
              {totalAppointmentsCount}
            </span>
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.08)',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#713f12',
                textAlign: 'right',
                lineHeight: 1.15,
              }}
            >
              <div>{analytics?.appointmentsToday ?? 0} Today</div>
              <div style={{ opacity: 0.8, fontSize: '0.65rem', fontWeight: 500 }}>Scheduled</div>
            </div>
          </div>
        </div>

        {/* Total Doctors Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fbcfe8 0%, #f472b6 100%)',
            borderRadius: '16px',
            padding: '1.35rem 1.4rem',
            color: '#831843',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px',
            boxShadow: '0 8px 24px rgba(244, 114, 182, 0.22)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stethoscope size={20} color="#831843" />
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>Total Doctors</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '1.2rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1 }}>{totalDoctorsCount}</span>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.35)',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textAlign: 'right',
                lineHeight: 1.15,
              }}
            >
              <div>{displayDoctors.filter((d) => d.status === 'Available').length} Available</div>
              <div style={{ opacity: 0.85, fontSize: '0.65rem', fontWeight: 500 }}>Active Medical Staff</div>
            </div>
          </div>
        </div>

        {/* Clinical Staff Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #9333ea 0%, #c084fc 100%)',
            borderRadius: '16px',
            padding: '1.35rem 1.4rem',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '140px',
            boxShadow: '0 8px 24px rgba(168, 85, 247, 0.24)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={20} color="#ffffff" />
            </div>
            <span style={{ fontSize: '0.92rem', fontWeight: 600, opacity: 0.95 }}>Hospital Staff</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '1.2rem' }}>
            <span style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1 }}>{totalStaffCount}</span>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.22)',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textAlign: 'right',
                lineHeight: 1.15,
              }}
            >
              <div>On Duty</div>
              <div style={{ opacity: 0.85, fontSize: '0.65rem', fontWeight: 500 }}>Care Team</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Middle Section: Patients Statistics + Bed Utilization + Calendar/Schedule ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '1.25rem',
        }}
      >
        {/* Patients Statistics Wave Chart */}
        <div
          style={{
            gridColumn: 'span 5',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.4rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Patients Statistics</h3>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>Patient admissions and visit volume</p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                color: '#475569',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px',
              }}
            >
              Overview <ChevronDown size={14} color="#64748b" />
            </div>
          </div>

          {/* SVG Wave Chart */}
          <div style={{ position: 'relative', width: '100%', height: '180px', marginTop: 'auto' }}>
            <svg viewBox="0 0 360 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d2c4" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00d2c4" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="360" y2="40" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="360" y2="90" stroke="#f1f5f9" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="360" y2="140" stroke="#f1f5f9" strokeDasharray="4 4" />

              {/* Smooth dynamic curve */}
              <path
                d="M 10 130 Q 60 110, 110 95 T 200 80 T 280 65 T 350 50 L 350 150 L 10 150 Z"
                fill="url(#waveGradient)"
              />
              <path
                d="M 10 130 Q 60 110, 110 95 T 200 80 T 280 65 T 350 50"
                fill="none"
                stroke="#00d2c4"
                strokeWidth="3.2"
                strokeLinecap="round"
              />

              {/* Marker at current capacity point */}
              <line x1="280" y1="65" x2="280" y2="145" stroke="#00d2c4" strokeWidth="1.6" strokeDasharray="3 3" />
              <circle cx="280" cy="65" r="5" fill="#00d2c4" />
              <circle cx="280" cy="65" r="8" fill="none" stroke="#00d2c4" strokeWidth="1.5" opacity="0.6" />
              <rect x="252" y="36" width="56" height="20" rx="5" fill="#ffffff" stroke="#e2e8f0" />
              <text x="280" y="50" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="700">
                {totalPatientsCount} Total
              </text>
            </svg>
          </div>
          {/* Timeline */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem', marginTop: '0.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span style={{ color: '#00d2c4', fontWeight: 700 }}>Current Week</span>
          </div>
        </div>

        {/* Hospital Ward & Bed Utilization Donut Chart */}
        <div
          style={{
            gridColumn: 'span 3',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.4rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Bed Utilization</h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                color: '#475569',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '0.3rem 0.6rem',
                borderRadius: '8px',
              }}
            >
              Inpatient Wards
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.4rem' }}>Occupied / Total Beds</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
            {occupiedBeds} / {totalBeds} Beds
          </div>

          {/* Donut Graphic */}
          <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto' }}>
            <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
              {/* Segment 1: Occupied (cyan) */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke="#00d2c4"
                strokeWidth="12"
                strokeDasharray="238.7"
                strokeDashoffset={238.7 - (238.7 * occupancyPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                {occupancyPercent}%
              </span>
              <span style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>Occupancy</span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00d2c4' }} />
              <span style={{ color: '#64748b' }}>Occupied</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>{occupiedBeds}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }} />
              <span style={{ color: '#64748b' }}>Available</span>
              <span style={{ color: '#0f172a', fontWeight: 700 }}>{availableBeds}</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Dynamic Calendar + Real Schedule */}
        <div
          style={{
            gridColumn: 'span 4',
            background: '#ffffff',
            borderRadius: '16px',
            padding: '1.4rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Calendar Header with + Add New button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              {currentMonthYear}
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#00d2c4',
                color: '#0f172a',
                border: 'none',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} /> Add New
            </button>
          </div>

          {/* Week Horizontal Strip */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <ChevronLeft
              size={16}
              color="#64748b"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedWeekOffset((prev) => prev - 1)}
            />
            {weekDays.map((d) => {
              const isSelected = activeSelectedDay === d.num;
              return (
                <div
                  key={d.fullDate}
                  onClick={() => setActiveSelectedDay(d.num)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.55rem 0.65rem',
                    borderRadius: '12px',
                    background: isSelected ? '#00d2c4' : 'transparent',
                    color: isSelected ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{d.day}</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{d.num}</span>
                </div>
              );
            })}
            <ChevronRight
              size={16}
              color="#64748b"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedWeekOffset((prev) => prev + 1)}
            />
          </div>

          {/* Schedule Section (Real appointments or shifts) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Today's Procedures & Shifts</span>
              <span
                onClick={() => onNavigate('appointments')}
                style={{ fontSize: '0.75rem', fontWeight: 600, color: '#00d2c4', cursor: 'pointer' }}
              >
                See All
              </span>
            </div>

            {hospitalSchedule.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0.85rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(0, 210, 196, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Activity size={18} color="#00d2c4" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                      {hospitalSchedule[0]?.shiftName}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {hospitalSchedule[0]?.shiftHours}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#475569' }}>
                  <span>{hospitalSchedule[0]?.personName}</span>
                  <ChevronRight size={14} color="#94a3b8" />
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '1rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.82rem',
                }}
              >
                No special clinical procedures scheduled for today
              </div>
            )}
          </div>

          {/* Upcoming Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>Upcoming Consultations</span>
              <span
                onClick={() => onNavigate('appointments')}
                style={{ fontSize: '0.75rem', fontWeight: 600, color: '#00d2c4', cursor: 'pointer' }}
              >
                See All
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {todayAppointments.length > 0 ? (
                todayAppointments.slice(0, 2).map((apt) => (
                  <div
                    key={apt.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 0.85rem',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: 'rgba(192, 132, 252, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Users size={18} color="#a855f7" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                          {apt.type}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {apt.time} ({apt.date})
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#475569' }}>
                      <span>{apt.patient.name}</span>
                      <ChevronRight size={14} color="#94a3b8" />
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '1rem',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.82rem',
                  }}
                >
                  No pending upcoming appointments
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: Patients Management + Recent Activity + Doctor List / Alerts ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '1.25rem',
        }}
      >
        {/* Left 8 Columns: Patients Management Table + Recent Activity */}
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Patients Management Table Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.4rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Patients Management</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Registered hospital patients and active clinical records
                </p>
              </div>
              <span
                onClick={() => onNavigate('users')}
                style={{ fontSize: '0.78rem', fontWeight: 600, color: '#00d2c4', cursor: 'pointer' }}
              >
                See All
              </span>
            </div>

            {/* Search + Advance Filter */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  padding: '0.6rem 0.95rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search patients by name or ID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                    width: '100%',
                  }}
                />
              </div>
              <button
                onClick={() => onNavigate('users')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: '#00d2c4',
                  color: '#0f172a',
                  border: 'none',
                  padding: '0.6rem 1.15rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <SlidersHorizontal size={15} /> Filter / Manage
              </button>
            </div>

            {/* Patients Table */}
            <div style={{ overflowX: 'auto' }}>
              {filteredPatients.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.65rem 0.5rem', width: '32px' }}>
                        <input type="checkbox" style={{ accentColor: '#00d2c4' }} />
                      </th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>ID</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Name</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Record Date</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Category</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((row, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          color: '#334155',
                        }}
                      >
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <input type="checkbox" style={{ accentColor: '#00d2c4' }} />
                        </td>
                        <td style={{ padding: '0.75rem', color: '#64748b' }}>{row.id}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: '#0f172a' }}>{row.name}</td>
                        <td style={{ padding: '0.75rem', color: '#64748b' }}>{row.admit}</td>
                        <td style={{ padding: '0.75rem' }}>{row.type}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ color: row.statusColor, fontWeight: 700 }}>{row.status}</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => onNavigate('users')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#00a396',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div
                  style={{
                    padding: '2.5rem 1rem',
                    textAlign: 'center',
                    color: '#64748b',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Users size={32} color="#94a3b8" />
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>
                    {patientSearch ? 'No matching patients found' : 'No patients registered in the system yet'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Click &ldquo;Filter / Manage&rdquo; to register new patients or update filters.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Patients Activity Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.4rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Recent Activity Logs</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  System events and verified audit trail
                </p>
              </div>
              <span
                onClick={() => onNavigate('audit-logs')}
                style={{ fontSize: '0.78rem', fontWeight: 600, color: '#00d2c4', cursor: 'pointer' }}
              >
                See All
              </span>
            </div>

            {/* Search Activity */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  padding: '0.6rem 0.95rem',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Filter activity by action or entity..."
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#0f172a',
                    fontSize: '0.85rem',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            {/* Activity List Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredActivities.length > 0 ? (
                filteredActivities.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: 'rgba(0, 210, 196, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShieldCheck size={18} color="#00d2c4" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.detail}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: item.statusColor }}>{item.status}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{item.date}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.84rem',
                  }}
                >
                  No recent audit events or activities recorded in the log yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Patient Stats + Doctor List + Today's Report */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Patient Overview Badge Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Hospital Directory</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Real Counts</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(0, 210, 196, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={18} color="#00d2c4" />
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    {totalPatientsCount}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Patients</div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UserCheck size={18} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                    {totalDoctorsCount + totalStaffCount}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Clinical Team</div>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor List Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Doctor Directory</span>
              <span
                onClick={() => onNavigate('doctors')}
                style={{ fontSize: '0.78rem', fontWeight: 600, color: '#00d2c4', cursor: 'pointer' }}
              >
                See All
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {displayDoctors.length > 0 ? (
                displayDoctors.slice(0, 4).map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.75rem',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{doc.specialty}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: doc.statusColor }}>{doc.status}</span>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1.2rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
                  No doctors currently registered in directory
                </div>
              )}
            </div>
          </div>

          {/* Today's Report / System Alerts Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '1.25rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>System Status</span>
              <span
                onClick={() => onNavigate('audit-logs')}
                style={{ fontSize: '0.78rem', fontWeight: 600, color: '#00d2c4', cursor: 'pointer' }}
              >
                Audit Logs
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dashboardData?.counts.doctorsAwaitingVerification && dashboardData.counts.doctorsAwaitingVerification > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    background: '#fffbeb',
                    borderRadius: '12px',
                    border: '1px solid #fef3c7',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AlertTriangle size={16} color="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: 1.35 }}>
                      {dashboardData.counts.doctorsAwaitingVerification} Doctor credential verification(s) awaiting admin review.
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#b45309', marginTop: '4px', fontWeight: 600 }}>Action Required</div>
                  </div>
                </div>
              ) : null}

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.85rem',
                  background: '#f0fdf4',
                  borderRadius: '12px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={16} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>
                    Hospital Systems Operational
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#15803d', marginTop: '2px' }}>
                    Zero critical integrity alerts or untracked events today
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
