import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Trash2,
  X,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { AppointmentDto, DoctorDto } from '@healthcare/shared';
import { hospitalOperationsService } from '../utils/hospitalOperationsService';

export const CalendarAppointmentsView: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode: 'calendar' (grid) or 'list' (table)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Month navigation: starts at current date
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Selected row checkboxes for list view
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // New appointment form state
  const [formPatientName, setFormPatientName] = useState('');
  const [formDoctorId, setFormDoctorId] = useState<number>(0);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formTime, setFormTime] = useState('10:00');
  const [formType, setFormType] = useState('Consultation');
  const [formReason, setFormReason] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Weekly scratchpad notes stored per year-month-week
  const [weekNotes, setWeekNotes] = useState<Record<string, string>>({
    'week-1': 'Routine oncology & surgical reviews scheduled.',
    'week-2': 'Follow-up consultations for post-op cardiology.',
    'week-3': 'General medicine pediatric checkups.',
  });

  // Load appointments and doctors
  const loadData = async () => {
    try {
      setLoading(true);
      const [aptRes, docRes] = await Promise.allSettled([
        api.getAppointments(),
        api.getDoctors(),
      ]);

      if (aptRes.status === 'fulfilled') {
        setAppointments(aptRes.value.data);
      }
      if (docRes.status === 'fulfilled') {
        setDoctors(docRes.value.data);
        if (docRes.value.data.length > 0 && formDoctorId === 0) {
          setFormDoctorId(docRes.value.data[0]!.id);
        }
      }
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Format month and year e.g. "June 2024"
  const formattedMonthYear = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
  }, [currentDate]);

  const monthNameOnly = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
  }, [currentDate]);

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Generate 5-day weekday grid (Monday - Friday + Notes) for the current month
  const calendarWeeks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First and last day of month
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Find the Monday of the week containing the first day of month
    const start = new Date(firstDayOfMonth);
    const dayOfWeek = start.getDay(); // 0 is Sun, 1 is Mon...
    const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + distToMon);

    const weeks = [];
    const curr = new Date(start);

    // Generate weeks until we pass the last day of the month
    while (curr <= lastDayOfMonth || weeks.length < 5) {
      const weekDays = [];
      for (let i = 0; i < 5; i++) {
        // Monday through Friday
        const d = new Date(curr);
        const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        weekDays.push({
          date: d,
          isoDate,
          dayNum: d.getDate(),
          isCurrentMonth: d.getMonth() === month,
          isToday: d.toDateString() === new Date().toDateString(),
        });
        curr.setDate(curr.getDate() + 1);
      }
      // Skip Saturday & Sunday
      curr.setDate(curr.getDate() + 2);

      weeks.push(weekDays);
      if (weeks.length >= 6) break;
    }

    return weeks;
  }, [currentDate]);

  // Map appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentDto[]>();
    for (const apt of appointments) {
      const list = map.get(apt.date) || [];
      list.push(apt);
      map.set(apt.date, list);
    }
    return map;
  }, [appointments]);

  // Checkbox handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === appointments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(appointments.map((a) => a.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Create new appointment
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDoctorId || !formDate || !formTime || !formReason) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api.createAppointment({
        doctorId: formDoctorId,
        date: formDate,
        time: formTime,
        type: formType as any,
        reason: formReason,
        notes: formNotes || undefined,
      });

      setShowNewModal(false);
      setFormReason('');
      setFormNotes('');
      void loadData();
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError ? err.message : 'Could not create appointment.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel appointment
  const handleCancelAppointment = async (apt: AppointmentDto) => {
    if (!window.confirm(`Are you sure you want to cancel the appointment for ${apt.patient.name}?`)) {
      return;
    }
    try {
      await api.updateAppointmentStatus(apt.id, {
        status: 'CANCELLED',
        cancellationReason: 'Cancelled by clinician/admin via calendar view',
      });
      void loadData();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to cancel appointment');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0.5rem 0',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ─── Top Header: Title, Month Selector, New Appointment, View Toggles ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-primary, #0f172a)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Appointments
          </h1>
          {/* Month selector with chevrons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginTop: '0.45rem',
              color: 'var(--text-secondary, #475569)',
              fontSize: '0.92rem',
              fontWeight: 600,
            }}
          >
            <ChevronLeft
              size={18}
              style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
              onClick={handlePrevMonth}
            />
            <span style={{ minWidth: '90px', textAlign: 'center', userSelect: 'none' }}>
              {monthNameOnly}
            </span>
            <ChevronRight
              size={18}
              style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
              onClick={handleNextMonth}
            />
          </div>
        </div>

        {/* Right Actions: + New appointment & View toggle icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#003b73',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0, 59, 115, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} /> New appointment
          </button>

          {/* Toggle buttons container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-card-subtle, #f1f5f9)',
              padding: '0.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #e2e8f0)',
              gap: '0.2rem',
            }}
          >
            {/* List View Toggle */}
            <button
              onClick={() => setViewMode('list')}
              title="Table View"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'list' ? '#003b73' : 'transparent',
                color: viewMode === 'list' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <List size={18} />
            </button>

            {/* Grid / Calendar View Toggle */}
            <button
              onClick={() => setViewMode('calendar')}
              title="Calendar Grid View"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'calendar' ? '#003b73' : 'transparent',
                color: viewMode === 'calendar' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Mode 1: Calendar Grid View (Left Screenshot) ─── */}
      {viewMode === 'calendar' && (
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #e2e8f0)',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Calendar Header Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr) 1.25fr',
              background: '#f0f7fd',
              borderBottom: '1px solid #e2e8f0',
              fontWeight: 700,
              fontSize: '0.86rem',
              color: '#003b73',
              textAlign: 'center',
              padding: '0.9rem 0',
            }}
          >
            <div>Monday</div>
            <div>Tuesday</div>
            <div>Wednesday</div>
            <div>Thursday</div>
            <div>Friday</div>
            <div>Notes</div>
          </div>

          {/* Calendar Grid Weeks */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {calendarWeeks.map((week, weekIdx) => (
              <div
                key={weekIdx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr) 1.25fr',
                  borderBottom:
                    weekIdx === calendarWeeks.length - 1 ? 'none' : '1px solid #eef2f6',
                  minHeight: '120px',
                }}
              >
                {/* 5 Weekday Cells */}
                {week.map((day, dayIdx) => {
                  const dayApts = appointmentsByDate.get(day.isoDate) || [];
                  return (
                    <div
                      key={dayIdx}
                      style={{
                        padding: '0.65rem',
                        borderRight: '1px solid #eef2f6',
                        background: day.isToday
                          ? 'rgba(0, 59, 115, 0.03)'
                          : day.isCurrentMonth
                            ? 'transparent'
                            : 'rgba(248, 250, 252, 0.65)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                        position: 'relative',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Day Number */}
                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: day.isToday ? 800 : 600,
                          color: day.isToday
                            ? '#003b73'
                            : day.isCurrentMonth
                              ? 'var(--text-primary, #1e293b)'
                              : '#94a3b8',
                          textAlign: 'right',
                          paddingRight: '0.25rem',
                        }}
                      >
                        {day.dayNum}
                      </div>

                      {/* Day Appointments */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
                        {dayApts.map((apt) => (
                          <div
                            key={apt.id}
                            onClick={() => {
                              setSelectedAppointment(apt);
                              setShowDetailModal(true);
                            }}
                            title={`${apt.patient.name} (${apt.time})`}
                            style={{
                              background: '#eef6fc',
                              borderRadius: '8px',
                              padding: '0.45rem 0.55rem',
                              border: '1px solid #d8e8f8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.55rem',
                              transition: 'transform 0.12s, box-shadow 0.12s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 59, 115, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {/* Patient Circular Avatar */}
                            <div
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: '#003b73',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                flexShrink: 0,
                                overflow: 'hidden',
                              }}
                            >
                              {apt.patient.name.charAt(0).toUpperCase()}
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  color: '#003b73',
                                  lineHeight: 1.1,
                                }}
                              >
                                {apt.time}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  color: '#0f172a',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  marginTop: '2px',
                                }}
                              >
                                {apt.patient.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Notes Column on the Right */}
                <div
                  style={{
                    padding: '0.75rem 0.95rem',
                    background: '#fafbfc',
                    fontSize: '0.8rem',
                    color: '#64748b',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    borderLeft: '1px solid #eef2f6',
                  }}
                >
                  <div style={{ fontStyle: 'italic', lineHeight: 1.4 }}>
                    {weekNotes[`week-${weekIdx + 1}`] || (
                      <span style={{ color: '#94a3b8' }}>No clinical notes for this week</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Mode 2: Appointments List / Table View (Right Screenshot) ─── */}
      {viewMode === 'list' && (
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            border: '1px solid var(--border, #e2e8f0)',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border, #e2e8f0)',
                    color: 'var(--text-secondary, #64748b)',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    background: 'var(--bg-card-subtle, #f8fafc)',
                  }}
                >
                  <th style={{ padding: '0.85rem 1rem', width: '38px' }}>
                    <input
                      type="checkbox"
                      checked={appointments.length > 0 && selectedIds.length === appointments.length}
                      onChange={handleToggleSelectAll}
                      style={{ accentColor: '#003b73', cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>ID Code</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Name</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Date/Time</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Notes</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textAlign: 'center', width: '130px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.length > 0 ? (
                  appointments.map((apt) => {
                    const isChecked = selectedIds.includes(apt.id);
                    const formattedDateTime = `${new Date(apt.date).toLocaleDateString('en-GB')}, ${apt.time}`;
                    const idCode = `APT-${apt.id.toString().padStart(6, '0')}`;

                    return (
                      <tr
                        key={apt.id}
                        style={{
                          borderBottom: '1px solid var(--border, #f1f5f9)',
                          color: 'var(--text-primary, #1e293b)',
                          background: isChecked ? 'rgba(0, 59, 115, 0.04)' : 'transparent',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectRow(apt.id)}
                            style={{ accentColor: '#003b73', cursor: 'pointer' }}
                          />
                        </td>

                        {/* ID Code */}
                        <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                          {idCode}
                        </td>

                        {/* Patient Name */}
                        <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                          {apt.patient.name}
                        </td>

                        {/* Date/Time */}
                        <td style={{ padding: '0.9rem 1rem', color: '#475569', fontWeight: 500 }}>
                          {formattedDateTime}
                        </td>

                        {/* Notes */}
                        <td
                          style={{
                            padding: '0.9rem 1rem',
                            color: '#64748b',
                            fontSize: '0.84rem',
                            maxWidth: '260px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {apt.notes || apt.reason || '—'}
                        </td>

                        {/* Actions (3 Colored Buttons Matching Screenshot) */}
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                            {/* Teal/Green: View Details */}
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setShowDetailModal(true);
                              }}
                              title="View Details"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#0d9488',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                              }}
                            >
                              <Eye size={14} />
                            </button>

                            {/* Indigo/Purple: Edit / Reschedule */}
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setShowDetailModal(true);
                              }}
                              title="Edit / Reschedule"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#6366f1',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                              }}
                            >
                              <Edit3 size={13} />
                            </button>

                            {/* Magenta/Pink: Delete / Cancel */}
                            <button
                              onClick={() => handleCancelAppointment(apt)}
                              title="Cancel Appointment"
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#db2777',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.1s',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                      <CalendarIcon size={36} color="#cbd5e1" style={{ marginBottom: '0.5rem' }} />
                      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>
                        No appointments found for the selected period
                      </div>
                      <div style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                        Click &ldquo;+ New appointment&rdquo; above to schedule a consultation.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal: New Appointment ─── */}
      {showNewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#e0f2fe',
                    color: '#003b73',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarIcon size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Schedule New Appointment
                </h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '0.84rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <AlertCircle size={16} /> {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Attending Doctor *
                </label>
                <select
                  value={formDoctorId}
                  onChange={(e) => setFormDoctorId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    background: '#ffffff',
                  }}
                >
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} — {doc.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                    Time Slot *
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      color: '#0f172a',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Appointment Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    background: '#ffffff',
                  }}
                >
                  <option value="Consultation">Consultation</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Routine checkup">Routine checkup</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Reason / Symptoms *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chest pain evaluation, annual checkup..."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                  Additional Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Clinical instructions or patient preparation details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  style={{
                    padding: '0.65rem 1.15rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '0.65rem 1.45rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#003b73',
                    color: '#ffffff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Appointment Details ─── */}
      {showDetailModal && selectedAppointment && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    textTransform: 'uppercase',
                  }}
                >
                  APT-{selectedAppointment.id.toString().padStart(6, '0')}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.45rem 0 0', color: '#0f172a' }}>
                  {selectedAppointment.patient.name}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem', color: '#334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Date & Time</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {selectedAppointment.date} at {selectedAppointment.time}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Doctor</span>
                <span style={{ fontWeight: 700, color: '#003b73' }}>
                  Dr. {selectedAppointment.doctor.name} ({selectedAppointment.doctor.specialization})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Type</span>
                <span style={{ fontWeight: 600 }}>{selectedAppointment.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Status</span>
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      selectedAppointment.status === 'CONFIRMED'
                        ? '#15803d'
                        : selectedAppointment.status === 'CANCELLED'
                          ? '#b91c1c'
                          : '#b45309',
                  }}
                >
                  {selectedAppointment.status}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', marginBottom: '0.25rem' }}>Reason</span>
                <div style={{ padding: '0.65rem', background: '#f8fafc', borderRadius: '8px', lineHeight: 1.4 }}>
                  {selectedAppointment.reason}
                </div>
              </div>
              {selectedAppointment.notes && (
                <div>
                  <span style={{ display: 'block', color: '#64748b', marginBottom: '0.25rem' }}>Clinical Notes</span>
                  <div style={{ padding: '0.65rem', background: '#f8fafc', borderRadius: '8px', lineHeight: 1.4 }}>
                    {selectedAppointment.notes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleCancelAppointment(selectedAppointment);
                }}
                style={{
                  padding: '0.6rem 1.15rem',
                  borderRadius: '8px',
                  border: '1px solid #fecaca',
                  background: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel Appointment
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#003b73',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
