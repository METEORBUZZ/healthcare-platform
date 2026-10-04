import React, { useState, useEffect } from 'react';
import type {
  AdminDashboardDto,
  DoctorDashboardDto,
  DoctorDto,
  UserDto,
  AppointmentDto,
  SessionUser,
} from '@healthcare/shared';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  User,
  FileText,
  Phone,
  Check,
  Users,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Stethoscope,
  Activity,
  BarChart3,
  Search,
  ShieldCheck,
  X,
  UserPlus,
  Moon,
  Sun,
  Smartphone,
  Send,
  Lock,
} from 'lucide-react';
import { shiftRosterService, type DutyShiftRecord } from '../utils/shiftRosterService';

interface StaffPortalViewProps {
  onOpenTracking?: (patientId: number) => void;
  onOpenAuth?: (role?: 'PATIENT' | 'DOCTOR' | 'ADMIN') => void;
  defaultTab?: 'CONSULTATIONS' | 'ANALYTICS' | 'DOCTORS' | 'USERS' | 'SHIFTS';
}

export const StaffPortalView: React.FC<StaffPortalViewProps> = ({
  onOpenTracking,
  onOpenAuth,
  defaultTab = 'CONSULTATIONS',
}) => {
  const { user, quickLogin } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const _isDoctor = user?.role === 'DOCTOR';

  const [activeTab, setActiveTab] = useState<
    'CONSULTATIONS' | 'ANALYTICS' | 'DOCTORS' | 'USERS' | 'SHIFTS'
  >(() => {
    if (
      !isAdmin &&
      (defaultTab === 'ANALYTICS' || defaultTab === 'DOCTORS' || defaultTab === 'USERS')
    ) {
      return 'CONSULTATIONS';
    }
    return defaultTab;
  });

  // Automatically fall back to CONSULTATIONS if non-admin attempts to access admin-only tabs
  useEffect(() => {
    if (
      !isAdmin &&
      (activeTab === 'ANALYTICS' || activeTab === 'DOCTORS' || activeTab === 'USERS')
    ) {
      setActiveTab('CONSULTATIONS');
    }
  }, [isAdmin, activeTab]);

  // Doctor Desk State
  const [doctorDashboard, setDoctorDashboard] = useState<DoctorDashboardDto | null>(null);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [docFilter, setDocFilter] = useState<'TODAY' | 'ALL'>('TODAY');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Admin Desk State
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardDto | null>(null);
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [updatingDoctorId, setUpdatingDoctorId] = useState<number | null>(null);

  // General Loading & Search
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [statusModal, setStatusModal] = useState<{
    appointment: AppointmentDto;
    status: 'COMPLETED' | 'CANCELLED';
  } | null>(null);
  const [modalNotes, setModalNotes] = useState('');
  const [modalReason, setModalReason] = useState('Doctor unavailable / Emergency reschedule');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Direct Onboarding State for Doctors & Staff
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newRole, setNewRole] = useState<'DOCTOR' | 'STAFF'>('DOCTOR');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('Cardiologist');
  const [newQualification, setNewQualification] = useState('MBBS, MD');
  const [newExperience, setNewExperience] = useState(6);
  const [newFee, setNewFee] = useState(1000);
  const [newShift, setNewShift] = useState('Day Shift (08:00 - 16:30)');
  const [addStaffLoading, setAddStaffLoading] = useState(false);

  const handleAddDoctorOrStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    setAddStaffLoading(true);
    const newId = Date.now();
    const formattedName =
      newRole === 'DOCTOR' && !newName.trim().toLowerCase().startsWith('dr.')
        ? `Dr. ${newName.trim()}`
        : newName.trim();

    const newUser: UserDto = {
      id: newId,
      name: formattedName,
      email: newEmail.trim().toLowerCase(),
      role: newRole === 'DOCTOR' ? 'DOCTOR' : 'ADMIN',
      status: 'ACTIVE',
      avatarUrl:
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    };

    if (newRole === 'DOCTOR') {
      const newDoctor: DoctorDto = {
        id: newId,
        userId: newId,
        name: formattedName,
        email: newEmail.trim().toLowerCase(),
        avatarUrl:
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
        specialization: newDepartment,
        experienceYears: Number(newExperience) || 5,
        qualification: newQualification || 'MBBS, MD',
        consultationFee: Number(newFee) || 800,
        bio: `${newQualification} specializing in ${newDepartment}. Newly onboarded by Hospital Administration.`,
        languages: ['English', 'Hindi'],
        hospitalAffiliation: 'Niramaya Hospital',
        isVerified: true,
        rating: 5.0,
        reviewCount: 0,
      };
      setDoctors((prev) => [newDoctor, ...prev]);
    }

    setUsers((prev) => [newUser, ...prev]);
    const dutyShiftType: 'Day Shift' | 'Night Shift' = newShift.includes('Night')
      ? 'Night Shift'
      : 'Day Shift';
    const dutyHours = newShift.includes('Night')
      ? '20:00 - 08:00 (12 hrs)'
      : '08:00 - 16:30 (8.5 hrs)';
    try {
      const adminOperator: SessionUser = user || {
        id: 1,
        name: 'Hospital Administration',
        email: 'admin@demo.test',
        role: 'ADMIN',
        avatarUrl: null,
        doctorId: null,
        patientId: null,
        isVerified: true,
      };
      shiftRosterService.assignDutyShift(
        adminOperator,
        {
          personId: newId,
          personName: formattedName,
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          department: newDepartment,
        },
        {
          shiftType: dutyShiftType,
          shiftHours: dutyHours,
          dutyDays: 'Mon - Fri',
          reportingStation:
            newRole === 'DOCTOR' ? `${newDepartment} OPD Wing` : 'General Clinical Station',
          dutyNotes: 'Directly onboarded by Hospital Administration.',
        },
      );
      setDutyRoster(shiftRosterService.getDutyRoster());
    } catch {
      // ignore
    }

    setAddStaffLoading(false);
    setShowAddStaffModal(false);
    setToastMessage(
      `✓ ${formattedName} successfully onboarded as ${newRole}. Direct credentials & ${dutyShiftType} active.`,
    );

    // Reset fields
    setNewName('');
    setNewEmail('');
    setNewQualification('MBBS, MD');
  };

  // Duty Shift Roster State
  const [dutyRoster, setDutyRoster] = useState<DutyShiftRecord[]>(() =>
    shiftRosterService.getDutyRoster(),
  );
  const [shiftPersonnelFilter, setShiftPersonnelFilter] = useState<'ALL' | 'DOCTORS' | 'STAFF'>(
    'ALL',
  );
  const [shiftTypeFilter, setShiftTypeFilter] = useState<
    'ALL' | 'DAY' | 'NIGHT' | 'EVENING' | 'EMERGENCY'
  >('ALL');
  const [assignModalRecord, setAssignModalRecord] = useState<DutyShiftRecord | null>(null);
  const [selectedShiftType, setSelectedShiftType] = useState<
    'Day Shift' | 'Night Shift' | 'Evening Shift' | '24x7 Emergency Rotation'
  >('Night Shift');
  const [selectedShiftHours, setSelectedShiftHours] = useState('20:00 - 08:00 (12 hrs)');
  const [selectedShiftDays, setSelectedShiftDays] = useState('Mon - Fri');
  const [selectedStation, setSelectedStation] = useState('Emergency Trauma Ward');
  const [selectedNotes, setSelectedNotes] = useState(
    'Assigned by Hospital Administration. Oversee patient queue and night telemetry.',
  );
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Sync duty roster with custom events
  useEffect(() => {
    setDutyRoster(shiftRosterService.getDutyRoster());
    const handleShiftUpdated = () => {
      setDutyRoster(shiftRosterService.getDutyRoster());
    };
    window.addEventListener('niramaya:shift-updated', handleShiftUpdated);
    return () => {
      window.removeEventListener('niramaya:shift-updated', handleShiftUpdated);
    };
  }, []);

  const handleShiftTypeChange = (
    type: 'Day Shift' | 'Night Shift' | 'Evening Shift' | '24x7 Emergency Rotation',
  ) => {
    setSelectedShiftType(type);
    if (type === 'Day Shift') {
      setSelectedShiftHours('08:00 - 16:30 (8.5 hrs)');
      setSelectedStation((prev) => (prev.includes('Ward') ? 'Cardiology OPD Wing B' : prev));
    } else if (type === 'Night Shift') {
      setSelectedShiftHours('20:00 - 08:00 (12 hrs)');
      setSelectedStation((prev) => (prev.includes('OPD') ? 'Emergency Trauma Ward' : prev));
    } else if (type === 'Evening Shift') {
      setSelectedShiftHours('16:00 - 00:30 (8.5 hrs)');
      setSelectedStation((prev) => (prev.includes('OPD') ? 'ICU 3rd Floor' : prev));
    } else if (type === '24x7 Emergency Rotation') {
      setSelectedShiftHours('24-Hour Emergency Triage');
      setSelectedStation('Emergency & Trauma Center');
    }
  };

  const handleOpenAssignModal = (record: DutyShiftRecord) => {
    setAssignModalRecord(record);
    setSelectedShiftType(record.shiftType);
    setSelectedShiftHours(record.shiftHours);
    setSelectedShiftDays(record.dutyDays);
    setSelectedStation(record.reportingStation);
    setSelectedNotes(record.dutyNotes || 'Assigned by Hospital Administration.');
  };

  const handleSaveShiftAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalRecord || !user) return;
    if (user.role !== 'ADMIN') {
      alert('Security violation: Only Hospital Administration can assign duty shifts.');
      return;
    }

    setAssignSubmitting(true);
    try {
      const result = shiftRosterService.assignDutyShift(
        user,
        {
          personId: assignModalRecord.personId,
          personName: assignModalRecord.personName,
          role: assignModalRecord.role,
          department: assignModalRecord.department,
          email: assignModalRecord.email,
        },
        {
          shiftType: selectedShiftType,
          shiftHours: selectedShiftHours,
          dutyDays: selectedShiftDays,
          reportingStation: selectedStation,
          dutyNotes: selectedNotes,
        },
      );

      setDutyRoster(shiftRosterService.getDutyRoster());
      setAssignModalRecord(null);
      setToastMessage(
        `✓ Shift updated for ${result.record.personName} (${result.record.shiftType}). Real-time notification dispatched to device.`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign duty shift';
      alert(msg);
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Find active duty shift for logged in doctor or staff
  const myShift = user ? shiftRosterService.getDutyShiftForUser(user) : null;

  const filteredRoster = dutyRoster.filter((item) => {
    if (shiftPersonnelFilter === 'DOCTORS' && item.role !== 'DOCTOR') return false;
    if (shiftPersonnelFilter === 'STAFF' && item.role !== 'STAFF') return false;
    if (shiftTypeFilter === 'DAY' && item.shiftType !== 'Day Shift') return false;
    if (shiftTypeFilter === 'NIGHT' && item.shiftType !== 'Night Shift') return false;
    if (shiftTypeFilter === 'EVENING' && item.shiftType !== 'Evening Shift') return false;
    if (shiftTypeFilter === 'EMERGENCY' && item.shiftType !== '24x7 Emergency Rotation')
      return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        item.personName.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.reportingStation.toLowerCase().includes(q) ||
        item.shiftType.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Escape to close statusModal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && statusModal) {
        setStatusModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [statusModal]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [aptsRes, docsRes, docDash, admDash, usersRes] = await Promise.all([
        api.getAppointments(),
        api.getDoctors({ pageSize: 50 }),
        api.getDashboard({ mode: 'doctor' }).catch(() => null),
        api.getDashboard({ mode: 'admin' }).catch(() => null),
        api.getAdminUsers({ pageSize: 50 }).catch(() => ({ data: [] })),
      ]);

      setAppointments(aptsRes?.data || []);
      setDoctors(docsRes?.data || []);
      if (docDash) setDoctorDashboard(docDash as DoctorDashboardDto);
      if (admDash) setAdminDashboard(admDash as AdminDashboardDto);
      if (usersRes?.data) setUsers(usersRes.data);
    } catch (err) {
      console.error('Failed to load staff hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInitiateStatusChange = (
    apt: AppointmentDto,
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
  ) => {
    if (status === 'CONFIRMED') {
      handleDirectConfirm(apt.id);
    } else {
      setStatusModal({ appointment: apt, status });
      setModalNotes('');
      setModalReason('Doctor unavailable / Emergency reschedule');
      setModalError(null);
    }
  };

  const handleDirectConfirm = async (id: number) => {
    try {
      setActionLoading(id);
      await api.updateAppointmentStatus(id, { status: 'CONFIRMED' });
      setToastMessage('Appointment confirmed successfully.');
      await loadData();
    } catch {
      // Offline / local fallback resilience for uninterrupted clinic operations
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'CONFIRMED' } : a)));
      setToastMessage('Appointment confirmed (Clinical continuity offline mode).');
    } finally {
      setActionLoading(null);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModal) return;

    try {
      setModalSubmitting(true);
      setModalError(null);
      await api.updateAppointmentStatus(statusModal.appointment.id, {
        status: statusModal.status,
        doctorNotes:
          statusModal.status === 'COMPLETED' ? modalNotes.trim() || undefined : undefined,
        cancellationReason: statusModal.status === 'CANCELLED' ? modalReason.trim() : undefined,
      });
      setToastMessage(
        statusModal.status === 'COMPLETED'
          ? 'Consultation marked as completed.'
          : 'Appointment cancelled.',
      );
      setStatusModal(null);
      await loadData();
    } catch {
      // Offline / local fallback resilience for uninterrupted clinic operations
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === statusModal.appointment.id
            ? {
                ...a,
                status: statusModal.status,
                doctorNotes:
                  statusModal.status === 'COMPLETED' ? modalNotes.trim() || null : a.doctorNotes,
                cancellationReason:
                  statusModal.status === 'CANCELLED'
                    ? modalReason.trim() || null
                    : a.cancellationReason,
              }
            : a,
        ),
      );
      setToastMessage(
        statusModal.status === 'COMPLETED'
          ? 'Consultation marked as completed (Clinical continuity offline mode).'
          : 'Appointment cancelled (Clinical continuity offline mode).',
      );
      setStatusModal(null);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleVerification = async (doctor: DoctorDto) => {
    if (!isAdmin) {
      setToastMessage('Security restriction: Only Hospital Administration can verify doctors.');
      return;
    }
    try {
      setUpdatingDoctorId(doctor.id);
      await api.verifyDoctor(doctor.id, !doctor.isVerified);
      setToastMessage(
        `Doctor verification updated to ${!doctor.isVerified ? 'Verified' : 'Unverified'}.`,
      );
      await loadData();
    } catch {
      // Local fallback
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, isVerified: !d.isVerified } : d)),
      );
      setToastMessage(
        `Doctor verification updated to ${!doctor.isVerified ? 'Verified' : 'Unverified'} (Offline mode).`,
      );
    } finally {
      setUpdatingDoctorId(null);
    }
  };

  // Filtered consultations — Fixed bug where empty today queue fell back to all appointments
  const todayDateStr: string = new Date().toISOString().split('T')[0] ?? '';
  const displayedAppointments =
    docFilter === 'TODAY'
      ? (doctorDashboard?.today ??
        appointments.filter(
          (a) => a.date === todayDateStr || Boolean(a.date && a.date.startsWith(todayDateStr)),
        ))
      : appointments;

  const filteredAppointments = displayedAppointments.filter((a) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      a.patient?.name?.toLowerCase().includes(s) ||
      a.doctor?.name?.toLowerCase().includes(s) ||
      a.reason?.toLowerCase().includes(s)
    );
  });

  // Filtered doctors
  const filteredDoctors = doctors.filter((d) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(s) ||
      d.specialization.toLowerCase().includes(s) ||
      d.hospitalAffiliation?.toLowerCase().includes(s)
    );
  });

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      u.name.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.role.toLowerCase().includes(s)
    );
  });

  // Metrics for overview
  const totalConsultations = appointments.length;
  const todayCount =
    doctorDashboard?.counts?.today ??
    appointments.filter((a) => a.date === new Date().toISOString().split('T')[0]).length;
  const pendingCount =
    doctorDashboard?.counts?.pendingRequests ??
    appointments.filter((a) => a.status === 'PENDING').length;
  const completedCount =
    doctorDashboard?.counts?.completed ??
    appointments.filter((a) => a.status === 'COMPLETED').length;

  if (!user) {
    return (
      <div style={{ maxWidth: '960px', margin: '3rem auto', padding: '0 1rem' }}>
        <div
          className="card"
          style={{
            background:
              'linear-gradient(135deg, rgba(2, 132, 199, 0.05) 0%, rgba(13, 148, 136, 0.05) 100%)',
            border: '2px solid rgba(2, 132, 199, 0.2)',
            borderRadius: '1.25rem',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.4)',
            }}
          >
            <Lock size={32} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(2, 132, 199, 0.12)',
              color: '#0284c7',
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={14} /> Private Healthcare Portal Gate
          </div>

          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '0.75rem',
            }}
          >
            Healthcare+ Clinical & Administration Console
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              maxWidth: '620px',
              margin: '0 auto 2.5rem',
              lineHeight: 1.6,
            }}
          >
            This is a restricted, internal hospital management portal. Only verified Medical
            Doctors, Clinical Staff, and Authorized Hospital Administrators may proceed.
          </p>

          {/* Quick Role Sign-In Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.25rem',
              maxWidth: '680px',
              margin: '0 auto 2.5rem',
              textAlign: 'left',
            }}
          >
            <div
              className="card"
              style={{
                border: '1px solid var(--border)',
                borderRadius: '1rem',
                padding: '1.5rem',
                background: 'var(--bg-card)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onClick={() => (onOpenAuth ? onOpenAuth('DOCTOR') : quickLogin('DOCTOR'))}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(0, 194, 203, 0.15)',
                    color: '#00C2CB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                    Medical Doctor
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Consultation Desk & Shifts
                  </div>
                </div>
              </div>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  margin: '0 0 1rem',
                  lineHeight: 1.4,
                }}
              >
                Review live patient queues, write consultation prescriptions, update vitals, and
                view duty shift rosters.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                  border: 'none',
                  fontWeight: 700,
                }}
              >
                Access as Doctor
              </button>
            </div>
          </div>

          {/* Compliance & Security Details */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              flexWrap: 'wrap',
              borderTop: '1px solid var(--border)',
              paddingTop: '1.5rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} color="#0d9488" /> NABH & HIPAA Audit Compliant
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={14} color="#0284c7" /> Session Cookie RBAC Enforced
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} color="#f59e0b" /> Real-time Duty Shift Broadcasting
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Top Header Hub */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(0, 194, 203, 0.08) 0%, rgba(255, 42, 133, 0.06) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '0.4rem',
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #00C2CB 0%, #0284c7 100%)',
                  color: 'white',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Unified Staff Hub
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Active as <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong> (
                {user?.role})
              </span>
            </div>
            <h1
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              Doctor & Admin Operations Console
            </h1>
            <p
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                margin: '0.4rem 0 0',
                maxWidth: '680px',
              }}
            >
              Manage consultations, live queue, doctor credentials, patient clinical records, and
              hospital performance metrics in one unified dashboard.
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('CONSULTATIONS')}
              className="btn btn-sm"
              style={{
                background: activeTab === 'CONSULTATIONS' ? '#00C2CB' : 'var(--bg-card)',
                color: activeTab === 'CONSULTATIONS' ? 'white' : 'var(--text-primary)',
                border: '1px solid var(--border)',
                fontWeight: 700,
              }}
            >
              <Stethoscope size={15} />
              Consultations ({todayCount})
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('ANALYTICS')}
                className="btn btn-sm"
                style={{
                  background: activeTab === 'ANALYTICS' ? '#00C2CB' : 'var(--bg-card)',
                  color: activeTab === 'ANALYTICS' ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  fontWeight: 700,
                }}
              >
                <BarChart3 size={15} />
                Analytics
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid var(--border)',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div
          role="tablist"
          aria-label="Staff Portal Operations"
          style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}
        >
          <button
            role="tab"
            id="tab-consultations"
            aria-selected={activeTab === 'CONSULTATIONS'}
            aria-controls="panel-consultations"
            onClick={() => setActiveTab('CONSULTATIONS')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              borderBottom:
                activeTab === 'CONSULTATIONS' ? '3px solid #00C2CB' : '3px solid transparent',
              color: activeTab === 'CONSULTATIONS' ? '#00C2CB' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Stethoscope size={17} />
            Consultation Desk
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                background:
                  activeTab === 'CONSULTATIONS'
                    ? 'rgba(0, 194, 203, 0.15)'
                    : 'var(--bg-card-subtle)',
                color: activeTab === 'CONSULTATIONS' ? '#00C2CB' : 'var(--text-muted)',
                fontWeight: 800,
              }}
            >
              {appointments.length}
            </span>
          </button>

          {isAdmin && (
            <button
              role="tab"
              id="tab-analytics"
              aria-selected={activeTab === 'ANALYTICS'}
              aria-controls="panel-analytics"
              onClick={() => setActiveTab('ANALYTICS')}
              style={{
                padding: '0.75rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                borderBottom:
                  activeTab === 'ANALYTICS' ? '3px solid #00C2CB' : '3px solid transparent',
                color: activeTab === 'ANALYTICS' ? '#00C2CB' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
            >
              <BarChart3 size={17} />
              Hospital Analytics
            </button>
          )}

          {isAdmin && (
            <button
              role="tab"
              id="tab-doctors"
              aria-selected={activeTab === 'DOCTORS'}
              aria-controls="panel-doctors"
              onClick={() => setActiveTab('DOCTORS')}
              style={{
                padding: '0.75rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                borderBottom:
                  activeTab === 'DOCTORS' ? '3px solid #00C2CB' : '3px solid transparent',
                color: activeTab === 'DOCTORS' ? '#00C2CB' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
            >
              <ShieldCheck size={17} />
              Doctor Verification
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  background:
                    activeTab === 'DOCTORS' ? 'rgba(0, 194, 203, 0.15)' : 'var(--bg-card-subtle)',
                  color: activeTab === 'DOCTORS' ? '#00C2CB' : 'var(--text-muted)',
                  fontWeight: 800,
                }}
              >
                {doctors.length}
              </span>
            </button>
          )}

          {isAdmin && (
            <button
              role="tab"
              id="tab-users"
              aria-selected={activeTab === 'USERS'}
              aria-controls="panel-users"
              onClick={() => setActiveTab('USERS')}
              style={{
                padding: '0.75rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === 'USERS' ? '3px solid #00C2CB' : '3px solid transparent',
                color: activeTab === 'USERS' ? '#00C2CB' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
              }}
            >
              <Users size={17} />
              Users & Patients
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  background:
                    activeTab === 'USERS' ? 'rgba(0, 194, 203, 0.15)' : 'var(--bg-card-subtle)',
                  color: activeTab === 'USERS' ? '#00C2CB' : 'var(--text-muted)',
                  fontWeight: 800,
                }}
              >
                {users.length}
              </span>
            </button>
          )}

          <button
            role="tab"
            id="tab-shifts"
            aria-selected={activeTab === 'SHIFTS'}
            aria-controls="panel-shifts"
            onClick={() => setActiveTab('SHIFTS')}
            style={{
              padding: '0.75rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'SHIFTS' ? '3px solid #00C2CB' : '3px solid transparent',
              color: activeTab === 'SHIFTS' ? '#00C2CB' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Clock size={17} />
            Duty Rosters & Shifts
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                background:
                  activeTab === 'SHIFTS' ? 'rgba(0, 194, 203, 0.15)' : 'var(--bg-card-subtle)',
                color: activeTab === 'SHIFTS' ? '#00C2CB' : 'var(--text-muted)',
                fontWeight: 800,
              }}
            >
              {dutyRoster.length}
            </span>
          </button>
        </div>

        {/* Global Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.35rem 0.75rem',
            gap: '0.4rem',
            width: '280px',
            marginBottom: '0.5rem',
          }}
        >
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search records, names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* Loading indicator */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div className="pulse" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Syncing Niramaya Hospital Operations...
          </div>
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════════════════════
              TAB 1: CONSULTATION DESK & QUEUE (Doctor Operations)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'CONSULTATIONS' && (
            <div role="tabpanel" id="panel-consultations" aria-labelledby="tab-consultations">
              {/* Doctor / Staff Active Shift Alert Banner */}
              {myShift && (
                <div
                  style={{
                    background:
                      myShift.shiftType === 'Night Shift'
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 23, 42, 0.35) 100%)'
                        : 'linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(13, 148, 136, 0.08) 100%)',
                    border:
                      myShift.shiftType === 'Night Shift'
                        ? '1px solid rgba(99, 102, 241, 0.3)'
                        : '1px solid rgba(2, 132, 199, 0.25)',
                    borderRadius: '16px',
                    padding: '1.1rem 1.35rem',
                    marginBottom: '1.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        background:
                          myShift.shiftType === 'Night Shift'
                            ? 'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)'
                            : 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow:
                          myShift.shiftType === 'Night Shift'
                            ? '0 6px 16px rgba(79, 70, 229, 0.35)'
                            : '0 6px 16px rgba(2, 132, 199, 0.3)',
                      }}
                    >
                      {myShift.shiftType === 'Night Shift' ? <Moon size={22} /> : <Sun size={22} />}
                    </div>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                          }}
                        >
                          Active Duty Shift: {myShift.shiftType}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '0.2rem 0.65rem',
                            borderRadius: '999px',
                            background: myShift.shiftType === 'Night Shift' ? '#312e81' : '#0369a1',
                            color: '#ffffff',
                            letterSpacing: '0.02em',
                          }}
                        >
                          {myShift.shiftHours}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Smartphone size={11} /> Real-time Terminal Synced
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                        }}
                      >
                        Station:{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {myShift.reportingStation}
                        </strong>{' '}
                        · Days:{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>{myShift.dutyDays}</strong>{' '}
                        · Assigned by <strong>{myShift.assignedByAdmin}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <button
                      onClick={() => setActiveTab('SHIFTS')}
                      className="btn btn-outline btn-sm"
                      style={{
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Clock size={14} /> Full Duty Roster Hub
                    </button>
                  </div>
                </div>
              )}

              {/* Metric Cards Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}
              >
                <div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(0, 194, 203, 0.12)',
                      color: '#00C2CB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Calendar size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Today's Queue
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{todayCount}</div>
                  </div>
                </div>

                <div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'var(--warning-bg)',
                      color: 'var(--warning)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Clock size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Pending Requests
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{pendingCount}</div>
                  </div>
                </div>

                <div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'var(--success-bg)',
                      color: 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{completedCount}</div>
                  </div>
                </div>

                <div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'var(--info-bg)',
                      color: 'var(--info)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Activity size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Total Consultations
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{totalConsultations}</div>
                  </div>
                </div>
              </div>

              {/* View Switcher: Today's Queue vs All Appointments */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setDocFilter('TODAY')}
                    className="btn btn-sm"
                    style={{
                      background: docFilter === 'TODAY' ? '#00C2CB' : 'var(--bg-card-subtle)',
                      color: docFilter === 'TODAY' ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      fontWeight: 700,
                    }}
                  >
                    Today's Queue ({todayCount})
                  </button>
                  <button
                    onClick={() => setDocFilter('ALL')}
                    className="btn btn-sm"
                    style={{
                      background: docFilter === 'ALL' ? '#00C2CB' : 'var(--bg-card-subtle)',
                      color: docFilter === 'ALL' ? 'white' : 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      fontWeight: 700,
                    }}
                  >
                    All Consultations ({appointments.length})
                  </button>
                </div>
              </div>

              {/* Consultation List */}
              {filteredAppointments.length === 0 ? (
                <div
                  className="card"
                  style={{
                    textAlign: 'center',
                    padding: '3.5rem 1rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <Calendar size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    No consultations scheduled
                  </h3>
                  <p style={{ fontSize: '0.85rem' }}>
                    {docFilter === 'TODAY'
                      ? "Today's queue is completely clear."
                      : 'No appointments match your search criteria.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredAppointments.map((apt) => {
                    const isPending = apt.status === 'PENDING';
                    const isConfirmed = apt.status === 'CONFIRMED';
                    const badgeClass =
                      {
                        CONFIRMED: 'badge-success',
                        PENDING: 'badge-warning',
                        COMPLETED: 'badge-primary',
                        CANCELLED: 'badge-danger',
                      }[apt.status] || 'badge-info';

                    return (
                      <div
                        key={apt.id}
                        className="card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '1rem',
                        }}
                      >
                        {/* Patient & Doctor Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: 'var(--bg-card-subtle)',
                              border: '1.5px solid var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              color: '#00C2CB',
                              fontSize: '1.1rem',
                            }}
                          >
                            {apt.patient?.name?.charAt(0) || <User size={20} />}
                          </div>

                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                                {apt.patient?.name || 'Patient'}
                              </h4>
                              <span className={`badge ${badgeClass}`}>{apt.status}</span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--text-muted)',
                                  background: 'var(--bg-card-subtle)',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                }}
                              >
                                Dr: {apt.doctor?.name}
                              </span>
                            </div>

                            <div
                              style={{
                                fontSize: '0.82rem',
                                color: 'var(--text-secondary)',
                                marginTop: '0.2rem',
                              }}
                            >
                              <strong>Reason:</strong> {apt.reason}
                            </div>

                            {apt.patient?.phone && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-muted)',
                                  marginTop: '0.2rem',
                                }}
                              >
                                <Phone size={12} /> {apt.patient.phone} • {apt.patient.email}
                              </div>
                            )}

                            {apt.doctorNotes && (
                              <div
                                style={{
                                  background: 'var(--bg-card-subtle)',
                                  padding: '0.35rem 0.65rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  color: 'var(--text-secondary)',
                                  marginTop: '0.4rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <FileText size={12} />
                                <strong>Prescription / Notes:</strong> {apt.doctorNotes}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Timing & Action Controls */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.25rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{apt.date}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {apt.time} ({apt.durationMinutes} min)
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {/* Direct Patient Health Tracking Button */}
                            {onOpenTracking && apt.patient?.id && (
                              <button
                                onClick={() => onOpenTracking(apt.patient.id)}
                                title="Open Patient Clinical Vitals & Tracking"
                                className="btn btn-outline btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <Activity size={14} color="#00C2CB" />
                                <span>Track Vitals</span>
                              </button>
                            )}

                            {isPending && (
                              <button
                                onClick={() => handleInitiateStatusChange(apt, 'CONFIRMED')}
                                disabled={actionLoading === apt.id}
                                className="btn btn-primary btn-sm"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                              >
                                <Check size={14} /> Accept
                              </button>
                            )}

                            {isConfirmed && (
                              <button
                                onClick={() => handleInitiateStatusChange(apt, 'COMPLETED')}
                                disabled={actionLoading === apt.id}
                                className="btn btn-primary btn-sm"
                                style={{
                                  background: 'var(--success)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <CheckCircle2 size={14} /> Complete
                              </button>
                            )}

                            {(isPending || isConfirmed) && (
                              <button
                                onClick={() => handleInitiateStatusChange(apt, 'CANCELLED')}
                                disabled={actionLoading === apt.id}
                                className="btn btn-secondary btn-sm"
                                style={{ color: 'var(--danger)' }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 2: HOSPITAL ANALYTICS & METRICS (Admin Operations)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'ANALYTICS' && isAdmin && adminDashboard && (
            <div role="tabpanel" id="panel-analytics" aria-labelledby="tab-analytics">
              {/* High-level summary cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}
              >
                <div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'rgba(0, 194, 203, 0.12)',
                      color: '#00C2CB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Users size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Total Users
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                      {adminDashboard.counts.users}
                    </div>
                  </div>
                </div>

                <div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Doctors Onboarded
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                      {adminDashboard.counts.doctors}
                    </div>
                  </div>
                </div>

                <div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'var(--warning-bg)',
                      color: 'var(--warning)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Awaiting Verification
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                      {adminDashboard.counts.doctorsAwaitingVerification}
                    </div>
                  </div>
                </div>

                <div
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'var(--info-bg)',
                      color: 'var(--info)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Calendar size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Total Consultations
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                      {adminDashboard.counts.appointments}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown & Trends */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Consultations by Status
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {Object.entries(adminDashboard.byStatus).map(([status, count]) => (
                      <div
                        key={status}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.4rem 0',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{status}</span>
                        <span className="badge badge-primary">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                    7-Day Activity Trends
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      height: '140px',
                      gap: '0.75rem',
                      paddingTop: '1rem',
                    }}
                  >
                    {adminDashboard.last7Days.map((d) => {
                      const max = Math.max(...adminDashboard.last7Days.map((x) => x.count), 1);
                      const heightPercent = Math.max((d.count / max) * 100, 15);
                      return (
                        <div
                          key={d.date}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00C2CB' }}>
                            {d.count}
                          </span>
                          <div
                            style={{
                              width: '100%',
                              height: `${heightPercent}%`,
                              background: 'linear-gradient(180deg, #00C2CB 0%, #0369a1 100%)',
                              borderRadius: '4px',
                              transition: 'height 0.3s ease',
                            }}
                          />
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {d.date.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 3: DOCTOR VERIFICATION & DIRECTORY (Admin Controls)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'DOCTORS' && isAdmin && (
            <div
              role="tabpanel"
              id="panel-doctors"
              aria-labelledby="tab-doctors"
              className="card"
              style={{ overflowX: 'auto' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    Niramaya Medical Practitioners
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Verify, manage, or directly onboard new practitioners to the hospital.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setNewRole('DOCTOR');
                        setShowAddStaffModal(true);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                        border: 'none',
                        fontWeight: 700,
                      }}
                    >
                      <UserPlus size={15} /> + Add Doctor / Practitioner
                    </button>
                  )}
                  <span className="badge badge-info">{filteredDoctors.length} Doctors</span>
                </div>
              </div>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr
                    style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}
                  >
                    <th style={{ padding: '0.75rem' }}>Doctor</th>
                    <th style={{ padding: '0.75rem' }}>Specialization</th>
                    <th style={{ padding: '0.75rem' }}>Experience</th>
                    <th style={{ padding: '0.75rem' }}>Consultation Fee</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDoctors.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'rgba(0, 194, 203, 0.1)',
                              color: '#00C2CB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                            }}
                          >
                            {doc.name.replace(/^Dr\.\s*/, '').charAt(0)}
                          </div>
                          <div>
                            <div>{doc.name}</div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                fontWeight: 400,
                              }}
                            >
                              {doc.qualification}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#00C2CB', fontWeight: 600 }}>
                        {doc.specialization}
                      </td>
                      <td style={{ padding: '0.75rem' }}>{doc.experienceYears} yrs</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                        ₹{doc.consultationFee}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {doc.isVerified ? (
                          <span
                            className="badge badge-success"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <CheckCircle size={12} /> Verified
                          </span>
                        ) : (
                          <span
                            className="badge badge-warning"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <XCircle size={12} /> Unverified
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleVerification(doc)}
                          disabled={updatingDoctorId === doc.id}
                          className={`btn btn-sm ${doc.isVerified ? 'btn-secondary' : 'btn-primary'}`}
                          style={{
                            background: doc.isVerified ? undefined : '#00C2CB',
                            borderColor: doc.isVerified ? undefined : '#00C2CB',
                          }}
                        >
                          {updatingDoctorId === doc.id
                            ? 'Updating...'
                            : doc.isVerified
                              ? 'Revoke'
                              : 'Verify Doctor'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 4: USERS & PATIENTS DIRECTORY (Admin Controls + Patient Tracking)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'USERS' && isAdmin && (
            <div
              role="tabpanel"
              id="panel-users"
              aria-labelledby="tab-users"
              className="card"
              style={{ overflowX: 'auto' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    Registered Platform Users
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    All patient accounts, practitioners, and administrative staff members.
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setNewRole('STAFF');
                        setShowAddStaffModal(true);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                        border: 'none',
                        fontWeight: 700,
                      }}
                    >
                      <UserPlus size={15} /> + Onboard Doctor or Staff
                    </button>
                  )}
                  <span className="badge badge-info">{filteredUsers.length} Users</span>
                </div>
              </div>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr
                    style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}
                  >
                    <th style={{ padding: '0.75rem' }}>ID</th>
                    <th style={{ padding: '0.75rem' }}>Name</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Joined</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>#{u.id}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>{u.name}</td>
                      <td style={{ padding: '0.75rem' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span
                          className={`badge ${
                            u.role === 'ADMIN'
                              ? 'badge-danger'
                              : u.role === 'DOCTOR'
                                ? 'badge-primary'
                                : 'badge-info'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="badge badge-success">{u.status}</span>
                      </td>
                      <td
                        style={{
                          padding: '0.75rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.8rem',
                        }}
                      >
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {/* If user is patient, allow opening their Health & Vitals Tracking */}
                        {u.role === 'PATIENT' && onOpenTracking && (
                          <button
                            onClick={() => onOpenTracking(u.id)}
                            className="btn btn-outline btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Activity size={13} color="#00C2CB" /> Track Vitals
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 5: DUTY ROSTERS & SHIFT MANAGEMENT (Day/Night Shifts + Device Alerts)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'SHIFTS' && (
            <div
              role="tabpanel"
              id="panel-shifts"
              aria-labelledby="tab-shifts"
              style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
            >
              {/* Admin vs Doctor/Staff Banner */}
              <div
                className="card"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(13, 148, 136, 0.06) 100%)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  padding: '1.5rem',
                  borderRadius: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 6px 18px rgba(2, 132, 199, 0.3)',
                      }}
                    >
                      <Clock size={28} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                          Hospital Duty Shift Management
                        </h2>
                        {user?.role === 'ADMIN' ? (
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.65rem',
                              borderRadius: '999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <ShieldCheck size={13} /> Admin Authority Active
                          </span>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: '#6366f1',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.65rem',
                              borderRadius: '999px',
                            }}
                          >
                            Personnel View · Read Only
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: '0.35rem 0 0 0',
                          fontSize: '0.86rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {user?.role === 'ADMIN'
                          ? 'Only Hospital Administrators can assign day and night duty shifts. Real-time push & device notifications trigger immediately on doctor & staff devices.'
                          : 'Hospital shifts are administered exclusively by Hospital Administration. Active duty assignments and device notifications are synchronized below.'}
                      </p>
                    </div>
                  </div>

                  {/* Shift Summary Metrics */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.65rem 1rem',
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                      }}
                    >
                      <Sun size={18} color="#0284c7" />
                      <div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          DAY SHIFTS
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                          {dutyRoster.filter((r) => r.shiftType === 'Day Shift').length}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.65rem 1rem',
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                      }}
                    >
                      <Moon size={18} color="#6366f1" />
                      <div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          NIGHT SHIFTS
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                          {dutyRoster.filter((r) => r.shiftType === 'Night Shift').length}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.65rem 1rem',
                        background: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                      }}
                    >
                      <Smartphone size={18} color="#10b981" />
                      <div>
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          DEVICE NOTIFIED
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                          {dutyRoster.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current logged-in Doctor or Staff Active Shift Showcase */}
              {myShift && (
                <div
                  className="card"
                  style={{
                    background:
                      myShift.shiftType === 'Night Shift'
                        ? 'linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)'
                        : 'linear-gradient(135deg, rgba(2, 132, 199, 0.09) 0%, rgba(13, 148, 136, 0.06) 100%)',
                    border:
                      myShift.shiftType === 'Night Shift'
                        ? '2px solid rgba(99, 102, 241, 0.45)'
                        : '2px solid rgba(2, 132, 199, 0.35)',
                    borderRadius: '20px',
                    padding: '1.35rem 1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '16px',
                          background:
                            myShift.shiftType === 'Night Shift'
                              ? 'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)'
                              : 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          boxShadow:
                            myShift.shiftType === 'Night Shift'
                              ? '0 6px 18px rgba(79, 70, 229, 0.4)'
                              : '0 6px 18px rgba(2, 132, 199, 0.3)',
                        }}
                      >
                        {myShift.shiftType === 'Night Shift' ? (
                          <Moon size={26} />
                        ) : (
                          <Sun size={26} />
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.78rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'var(--text-muted)',
                              fontWeight: 800,
                            }}
                          >
                            YOUR ALLOCATED DUTY SHIFT
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.6rem',
                              borderRadius: '999px',
                              background:
                                myShift.shiftType === 'Night Shift' ? '#4338ca' : '#0284c7',
                              color: '#ffffff',
                            }}
                          >
                            {myShift.shiftType}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.2rem 0' }}>
                          {myShift.personName} (
                          {myShift.role === 'DOCTOR'
                            ? 'Attending Physician'
                            : 'Clinical Nursing Staff'}
                          )
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Duty Hours:{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {myShift.shiftHours}
                          </strong>{' '}
                          · Days:{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {myShift.dutyDays}
                          </strong>{' '}
                          · Station:{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>
                            {myShift.reportingStation}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.65rem 1rem',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.12)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.55rem',
                      }}
                    >
                      <Smartphone size={18} color="#10b981" />
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981' }}>
                          Device Notification Active
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Real-time terminal sync verified
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter Toolbar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                  padding: '0.25rem 0',
                }}
              >
                {/* Personnel Filter */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}
                >
                  <button
                    onClick={() => setShiftPersonnelFilter('ALL')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border:
                        shiftPersonnelFilter === 'ALL'
                          ? '2px solid #0284c7'
                          : '1px solid var(--border)',
                      background:
                        shiftPersonnelFilter === 'ALL'
                          ? 'rgba(2, 132, 199, 0.12)'
                          : 'var(--bg-card)',
                      color: shiftPersonnelFilter === 'ALL' ? '#0284c7' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    All Personnel ({dutyRoster.length})
                  </button>
                  <button
                    onClick={() => setShiftPersonnelFilter('DOCTORS')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border:
                        shiftPersonnelFilter === 'DOCTORS'
                          ? '2px solid #0284c7'
                          : '1px solid var(--border)',
                      background:
                        shiftPersonnelFilter === 'DOCTORS'
                          ? 'rgba(2, 132, 199, 0.12)'
                          : 'var(--bg-card)',
                      color:
                        shiftPersonnelFilter === 'DOCTORS' ? '#0284c7' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Stethoscope size={13} /> Doctors (
                    {dutyRoster.filter((r) => r.role === 'DOCTOR').length})
                  </button>
                  <button
                    onClick={() => setShiftPersonnelFilter('STAFF')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border:
                        shiftPersonnelFilter === 'STAFF'
                          ? '2px solid #0d9488'
                          : '1px solid var(--border)',
                      background:
                        shiftPersonnelFilter === 'STAFF'
                          ? 'rgba(13, 148, 136, 0.12)'
                          : 'var(--bg-card)',
                      color: shiftPersonnelFilter === 'STAFF' ? '#0d9488' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Users size={13} /> Staff ({dutyRoster.filter((r) => r.role === 'STAFF').length}
                    )
                  </button>
                </div>

                {/* Shift Type Filter */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}
                >
                  <button
                    onClick={() => setShiftTypeFilter('ALL')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border:
                        shiftTypeFilter === 'ALL' ? '1px solid #0284c7' : '1px solid var(--border)',
                      background:
                        shiftTypeFilter === 'ALL' ? 'rgba(2, 132, 199, 0.1)' : 'transparent',
                      color: shiftTypeFilter === 'ALL' ? '#0284c7' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    All Shifts
                  </button>
                  <button
                    onClick={() => setShiftTypeFilter('DAY')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border:
                        shiftTypeFilter === 'DAY' ? '1px solid #0284c7' : '1px solid var(--border)',
                      background:
                        shiftTypeFilter === 'DAY' ? 'rgba(2, 132, 199, 0.1)' : 'transparent',
                      color: shiftTypeFilter === 'DAY' ? '#0284c7' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Sun size={13} /> Day Shifts
                  </button>
                  <button
                    onClick={() => setShiftTypeFilter('NIGHT')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border:
                        shiftTypeFilter === 'NIGHT'
                          ? '1px solid #6366f1'
                          : '1px solid var(--border)',
                      background:
                        shiftTypeFilter === 'NIGHT' ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                      color: shiftTypeFilter === 'NIGHT' ? '#6366f1' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Moon size={13} /> Night Shifts
                  </button>
                  <button
                    onClick={() => setShiftTypeFilter('EVENING')}
                    style={{
                      padding: '0.4rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      border:
                        shiftTypeFilter === 'EVENING'
                          ? '1px solid #d97706'
                          : '1px solid var(--border)',
                      background:
                        shiftTypeFilter === 'EVENING' ? 'rgba(217, 119, 6, 0.12)' : 'transparent',
                      color: shiftTypeFilter === 'EVENING' ? '#d97706' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Clock size={13} /> Evening
                  </button>
                </div>
              </div>

              {/* Duty Roster Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      textAlign: 'left',
                      fontSize: '0.88rem',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: 'var(--bg-card-subtle)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.78rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        <th style={{ padding: '0.9rem 1.25rem' }}>Personnel & Role</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Shift Allocation</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Duty Hours</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Station / Ward</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Schedule Days</th>
                        <th style={{ padding: '0.9rem 1rem' }}>Device Alert Status</th>
                        <th style={{ padding: '0.9rem 1.25rem', textAlign: 'right' }}>
                          Admin Control
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoster.map((person) => {
                        const isNight = person.shiftType === 'Night Shift';
                        const isDay = person.shiftType === 'Day Shift';
                        const isEvening = person.shiftType === 'Evening Shift';

                        return (
                          <tr
                            key={person.id}
                            style={{
                              borderBottom: '1px solid var(--border)',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            {/* Personnel info */}
                            <td style={{ padding: '1rem 1.25rem' }}>
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                              >
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background:
                                      person.role === 'DOCTOR'
                                        ? 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)'
                                        : 'linear-gradient(135deg, #0d9488 0%, #10b981 100%)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '0.88rem',
                                    flexShrink: 0,
                                  }}
                                >
                                  {person.personName.replace(/^Dr\.\s*/, '').charAt(0)}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 800,
                                      color: 'var(--text-primary)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                    }}
                                  >
                                    {person.personName}
                                    {user?.email === person.email && (
                                      <span
                                        style={{
                                          fontSize: '0.65rem',
                                          background: 'rgba(2, 132, 199, 0.15)',
                                          color: '#0284c7',
                                          padding: '0.1rem 0.4rem',
                                          borderRadius: '4px',
                                          fontWeight: 800,
                                        }}
                                      >
                                        YOU
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {person.department} · {person.reportingStation}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Shift Badge */}
                            <td style={{ padding: '1rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '999px',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  background: isNight
                                    ? 'rgba(99, 102, 241, 0.14)'
                                    : isDay
                                      ? 'rgba(2, 132, 199, 0.14)'
                                      : isEvening
                                        ? 'rgba(217, 119, 6, 0.14)'
                                        : 'rgba(244, 63, 94, 0.14)',
                                  color: isNight
                                    ? '#6366f1'
                                    : isDay
                                      ? '#0284c7'
                                      : isEvening
                                        ? '#d97706'
                                        : '#e11d48',
                                  border: isNight
                                    ? '1px solid rgba(99, 102, 241, 0.3)'
                                    : isDay
                                      ? '1px solid rgba(2, 132, 199, 0.3)'
                                      : isEvening
                                        ? '1px solid rgba(217, 119, 6, 0.3)'
                                        : '1px solid rgba(244, 63, 94, 0.3)',
                                }}
                              >
                                {isNight ? (
                                  <Moon size={13} />
                                ) : isDay ? (
                                  <Sun size={13} />
                                ) : (
                                  <Clock size={13} />
                                )}
                                {person.shiftType}
                              </span>
                            </td>

                            {/* Duty Hours */}
                            <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.84rem' }}>
                              {person.shiftHours}
                            </td>

                            {/* Station / Ward */}
                            <td
                              style={{
                                padding: '1rem',
                                fontSize: '0.84rem',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {person.reportingStation}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                Updated {new Date(person.assignedAt).toLocaleDateString()}
                              </div>
                            </td>

                            {/* Schedule Days */}
                            <td style={{ padding: '1rem', fontSize: '0.84rem', fontWeight: 600 }}>
                              {person.dutyDays}
                            </td>

                            {/* Device Alert Status */}
                            <td style={{ padding: '1rem' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: '#10b981',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '999px',
                                }}
                              >
                                <Smartphone size={12} /> Device Alerted
                              </span>
                            </td>

                            {/* Admin Control */}
                            <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                              {user?.role === 'ADMIN' ? (
                                <button
                                  onClick={() => handleOpenAssignModal(person)}
                                  className="btn btn-sm"
                                  style={{
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.45rem 0.85rem',
                                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Clock size={13} />
                                  Assign / Change Shift
                                </button>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  Admin Managed
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Accessible Status Update Modal */}
      {statusModal && (
        <div
          className="modal-overlay"
          onClick={() => setStatusModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-status-modal-title"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '95%' }}
          >
            <div className="modal-header">
              <div>
                <h3
                  id="staff-status-modal-title"
                  style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}
                >
                  {statusModal.status === 'COMPLETED'
                    ? 'Complete Consultation'
                    : 'Cancel Appointment'}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Patient: {statusModal.appointment.patient?.name} • {statusModal.appointment.date}{' '}
                  at {statusModal.appointment.time}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStatusModal(null)}
                aria-label="Close dialog"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit}>
              <div
                className="modal-body"
                style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {modalError && (
                  <div
                    role="alert"
                    style={{
                      background: 'var(--danger-bg)',
                      color: 'var(--danger)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {modalError}
                  </div>
                )}

                {statusModal.status === 'COMPLETED' ? (
                  <div>
                    <label htmlFor="modal-notes" className="form-label">
                      Consultation Summary & Prescription Notes (Optional)
                    </label>
                    <textarea
                      id="modal-notes"
                      className="form-textarea"
                      rows={4}
                      placeholder="Enter clinical observations, advice, medication or dosage prescribed..."
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="modal-cancellation-select" className="form-label">
                        Reason for Cancellation *
                      </label>
                      <select
                        id="modal-cancellation-select"
                        className="form-select"
                        value={modalReason}
                        onChange={(e) => setModalReason(e.target.value)}
                      >
                        <option value="Doctor unavailable / Emergency reschedule">
                          Doctor unavailable / Emergency reschedule
                        </option>
                        <option value="Patient requested cancellation">
                          Patient requested cancellation
                        </option>
                        <option value="Duplicate booking">Duplicate booking</option>
                        <option value="Clinic closed / Operational reason">
                          Clinic closed / Operational reason
                        </option>
                        <option value="Other administrative reason">
                          Other administrative reason
                        </option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setStatusModal(null)}
                  className="btn btn-secondary"
                  disabled={modalSubmitting}
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className={
                    statusModal.status === 'COMPLETED' ? 'btn btn-primary' : 'btn btn-danger'
                  }
                >
                  {modalSubmitting
                    ? 'Updating...'
                    : statusModal.status === 'COMPLETED'
                      ? 'Confirm & Mark Completed'
                      : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Direct Onboard Doctor or Staff Modal */}
      {showAddStaffModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddStaffModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-staff-modal-title"
          style={{
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '520px',
              width: '100%',
              borderRadius: '24px',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              boxShadow: '0 25px 60px -15px rgba(2, 132, 199, 0.25)',
              overflow: 'hidden',
              background: 'var(--bg-card)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.4rem 1.6rem 1.1rem 1.6rem',
                background:
                  'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(13, 148, 136, 0.06) 100%)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3
                    id="add-staff-modal-title"
                    style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}
                  >
                    Direct Staff & Doctor Onboarding
                  </h3>
                  <div
                    style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}
                  >
                    Hospital Admin Desk · Issue clinical credentials
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStaffModal(false)}
                aria-label="Close dialog"
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddDoctorOrStaff}>
              <div
                style={{
                  padding: '1.4rem 1.6rem',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* Role Switcher */}
                <div>
                  <label
                    className="form-label"
                    style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}
                  >
                    Select Professional Role
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setNewRole('DOCTOR')}
                      style={{
                        padding: '0.65rem',
                        borderRadius: '10px',
                        border:
                          newRole === 'DOCTOR' ? '2px solid #0284c7' : '1px solid var(--border)',
                        background:
                          newRole === 'DOCTOR' ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-card)',
                        color: newRole === 'DOCTOR' ? '#0284c7' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Stethoscope size={16} /> Attending Doctor
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewRole('STAFF')}
                      style={{
                        padding: '0.65rem',
                        borderRadius: '10px',
                        border:
                          newRole === 'STAFF' ? '2px solid #0d9488' : '1px solid var(--border)',
                        background:
                          newRole === 'STAFF' ? 'rgba(13, 148, 136, 0.08)' : 'var(--bg-card)',
                        color: newRole === 'STAFF' ? '#0d9488' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Users size={16} /> Clinical / Nursing Staff
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label
                    className="form-label"
                    style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}
                  >
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder={
                      newRole === 'DOCTOR' ? 'e.g. Dr. Rajesh Sharma' : 'e.g. Sister Ananya Roy'
                    }
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label
                    className="form-label"
                    style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}
                  >
                    Official Hospital Email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="e.g. rajesh.sharma@niramaya.health"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                {/* Department / Specialization */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label
                      className="form-label"
                      style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}
                    >
                      {newRole === 'DOCTOR' ? 'Specialization' : 'Department'}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={
                        newRole === 'DOCTOR' ? 'e.g. Cardiology' : 'e.g. Critical Care ICU'
                      }
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                  <div>
                    <label
                      className="form-label"
                      style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}
                    >
                      Qualifications
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MBBS, MD or B.Sc Nursing"
                      value={newQualification}
                      onChange={(e) => setNewQualification(e.target.value)}
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                </div>

                {/* Shift Schedule & Fees / Experience */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label
                      className="form-label"
                      style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}
                    >
                      Duty Shift Allocation
                    </label>
                    <select
                      className="form-select"
                      value={newShift}
                      onChange={(e) => setNewShift(e.target.value)}
                      style={{ borderRadius: '10px' }}
                    >
                      <option value="Day Shift (08:00 - 16:30)">
                        ☀️ Day Shift (08:00 - 16:30)
                      </option>
                      <option value="Night Shift (20:00 - 08:00)">
                        🌙 Night Shift (20:00 - 08:00)
                      </option>
                      <option value="Evening Shift (15:00 - 23:30)">
                        🌆 Evening Shift (15:00 - 23:30)
                      </option>
                      <option value="24x7 Emergency Rotation">🚨 24×7 Emergency Rotation</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="form-label"
                      style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}
                    >
                      {newRole === 'DOCTOR' ? 'Consultation Fee (₹)' : 'Experience (Years)'}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={newRole === 'DOCTOR' ? newFee : newExperience}
                      onChange={(e) =>
                        newRole === 'DOCTOR'
                          ? setNewFee(Number(e.target.value))
                          : setNewExperience(Number(e.target.value))
                      }
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                </div>

                {/* Default password note */}
                <div
                  style={{
                    background: 'rgba(2, 132, 199, 0.08)',
                    border: '1px dashed rgba(2, 132, 199, 0.25)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.8rem',
                    fontSize: '0.74rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  🔒 Initial login password for this employee will be set to:{' '}
                  <strong>Demo@12345</strong>. They can change it upon first login.
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  padding: '1rem 1.6rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="btn btn-secondary"
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addStaffLoading}
                  className="btn btn-primary"
                  style={{
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  <UserPlus size={16} />
                  <span>Onboard & Activate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Shift Assignment Modal with Real-time Device Push Notification */}
      {assignModalRecord && (
        <div
          className="modal-overlay"
          onClick={() => setAssignModalRecord(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shift-assign-modal-title"
          style={{
            zIndex: 1000,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '540px',
              width: '100%',
              borderRadius: '24px',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              boxShadow: '0 25px 60px -15px rgba(2, 132, 199, 0.25)',
              overflow: 'hidden',
              background: 'var(--bg-card)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.4rem 1.6rem 1.1rem 1.6rem',
                background:
                  'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(13, 148, 136, 0.06) 100%)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <Clock size={20} />
                </div>
                <div>
                  <h3
                    id="shift-assign-modal-title"
                    style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}
                  >
                    Assign Duty Shift & Dispatch Alert
                  </h3>
                  <div
                    style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}
                  >
                    Target:{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {assignModalRecord.personName}
                    </strong>{' '}
                    ({assignModalRecord.department})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalRecord(null)}
                aria-label="Close dialog"
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveShiftAssignment}>
              <div
                style={{
                  padding: '1.4rem 1.6rem',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {/* Shift Type Selection */}
                <div>
                  <label
                    className="form-label"
                    style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}
                  >
                    Select Duty Shift (Admin Only)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={() => handleShiftTypeChange('Day Shift')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border:
                          selectedShiftType === 'Day Shift'
                            ? '2px solid #0284c7'
                            : '1px solid var(--border)',
                        background:
                          selectedShiftType === 'Day Shift'
                            ? 'rgba(2, 132, 199, 0.1)'
                            : 'var(--bg-card)',
                        color:
                          selectedShiftType === 'Day Shift' ? '#0284c7' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Sun size={17} /> Day Shift
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShiftTypeChange('Night Shift')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border:
                          selectedShiftType === 'Night Shift'
                            ? '2px solid #6366f1'
                            : '1px solid var(--border)',
                        background:
                          selectedShiftType === 'Night Shift'
                            ? 'rgba(99, 102, 241, 0.12)'
                            : 'var(--bg-card)',
                        color:
                          selectedShiftType === 'Night Shift' ? '#6366f1' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Moon size={17} /> Night Shift
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShiftTypeChange('Evening Shift')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border:
                          selectedShiftType === 'Evening Shift'
                            ? '2px solid #d97706'
                            : '1px solid var(--border)',
                        background:
                          selectedShiftType === 'Evening Shift'
                            ? 'rgba(217, 119, 6, 0.12)'
                            : 'var(--bg-card)',
                        color:
                          selectedShiftType === 'Evening Shift'
                            ? '#d97706'
                            : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Clock size={17} /> Evening Shift
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShiftTypeChange('24x7 Emergency Rotation')}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border:
                          selectedShiftType === '24x7 Emergency Rotation'
                            ? '2px solid #e11d48'
                            : '1px solid var(--border)',
                        background:
                          selectedShiftType === '24x7 Emergency Rotation'
                            ? 'rgba(244, 63, 94, 0.12)'
                            : 'var(--bg-card)',
                        color:
                          selectedShiftType === '24x7 Emergency Rotation'
                            ? '#e11d48'
                            : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <Activity size={17} /> 24x7 Emergency
                    </button>
                  </div>
                </div>

                {/* Duty Hours & Schedule Days */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label
                      className="form-label"
                      style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}
                    >
                      Duty Hours
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. 20:00 - 08:00 (12 hrs)"
                      value={selectedShiftHours}
                      onChange={(e) => setSelectedShiftHours(e.target.value)}
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                  <div>
                    <label
                      className="form-label"
                      style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}
                    >
                      Duty Days
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Mon - Fri"
                      value={selectedShiftDays}
                      onChange={(e) => setSelectedShiftDays(e.target.value)}
                      style={{ borderRadius: '10px' }}
                    />
                  </div>
                </div>

                {/* Hospital Ward / Station */}
                <div>
                  <label
                    className="form-label"
                    style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}
                  >
                    Station / Ward Assignment
                  </label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Emergency Trauma Ward or ICU 3rd Floor"
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                {/* Clinical Directives / Shift Notes */}
                <div>
                  <label
                    className="form-label"
                    style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}
                  >
                    Duty Notes & Clinical Instructions
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Provide specific directives (e.g. Lead night ICU telemetry, report to supervisor...)"
                    value={selectedNotes}
                    onChange={(e) => setSelectedNotes(e.target.value)}
                    style={{ borderRadius: '10px' }}
                  />
                </div>

                {/* Real-time Device Push Notification Callout */}
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '14px',
                    background:
                      'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(2, 132, 199, 0.08) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.65rem',
                  }}
                >
                  <Smartphone
                    size={20}
                    color="#10b981"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <div>
                    <div
                      style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}
                    >
                      Instant Device Alert Dispatch
                    </div>
                    <div
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-secondary)',
                        marginTop: '2px',
                        lineHeight: 1.4,
                      }}
                    >
                      Submitting this shift immediately broadcasts a push alert and slide-down
                      banner to {assignModalRecord.personName}'s device informing them of their{' '}
                      <strong>{selectedShiftType}</strong> ({selectedShiftHours}).
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '1rem 1.6rem',
                  borderTop: '1px solid var(--border)',
                  background: 'var(--bg-card-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setAssignModalRecord(null)}
                  className="btn btn-secondary"
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="btn btn-primary"
                  style={{
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  <Send size={15} />
                  <span>{assignSubmitting ? 'Dispatching...' : 'Assign & Notify Device'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            zIndex: 9999,
            animation: 'slideUp 0.25s ease-out',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--primary)',
            }}
          />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss message"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              marginLeft: '0.5rem',
              display: 'flex',
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
