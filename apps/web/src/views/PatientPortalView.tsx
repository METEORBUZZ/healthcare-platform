import React, { useState, useEffect, useCallback } from 'react';
import type { AppointmentDto, PatientDashboardDto } from '@healthcare/shared';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  PlusCircle,
  AlertTriangle,
  X,
} from 'lucide-react';

interface PatientPortalViewProps {
  onOpenReview: (appointmentId: number, doctorName: string) => void;
  onNavigateDirectory: () => void;
  onOpenTracking?: () => void;
}

const CANCELLATION_REASONS = [
  'Scheduling conflict',
  'Feeling better / Consultation not required',
  'Personal emergency',
  'Doctor requested reschedule',
  'Found earlier appointment',
  'Other reason',
];

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  onOpenReview,
  onNavigateDirectory,
  onOpenTracking,
}) => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<PatientDashboardDto | null>(null);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [cancellingAppointment, setCancellingAppointment] = useState<AppointmentDto | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<string>(CANCELLATION_REASONS[0] || 'Scheduling conflict');
  const [cancelNotes, setCancelNotes] = useState<string>('');
  const [submittingCancel, setSubmittingCancel] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashData, aptsData] = await Promise.all([
        api.getDashboard() as Promise<PatientDashboardDto>,
        api.getAppointments({ status: filterStatus }),
      ]);
      setDashboard(dashData);
      setAppointments(aptsData.data);
    } catch (err: unknown) {
      console.error('Failed to load patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle escape key to close cancel modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cancellingAppointment) {
        setCancellingAppointment(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancellingAppointment]);

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingAppointment) return;

    const fullReason = cancelNotes.trim()
      ? `${cancelReasonPreset}: ${cancelNotes.trim()}`
      : cancelReasonPreset;

    try {
      setSubmittingCancel(true);
      setCancelError(null);
      await api.updateAppointmentStatus(cancellingAppointment.id, {
        status: 'CANCELLED',
        cancellationReason: fullReason,
      });
      setCancellingAppointment(null);
      setCancelNotes('');
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel appointment';
      setCancelError(message);
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <div>
      {/* Top Welcome Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Patient Dashboard</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Welcome back, <strong>{user?.name}</strong>. Here is your appointment summary.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {onOpenTracking && (
            <button
              onClick={onOpenTracking}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid #ef4444',
                padding: '0.6rem 1.1rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              📊 Health Tracking Panel
            </button>
          )}

          <button onClick={onNavigateDirectory} className="btn btn-primary">
            <PlusCircle size={16} /> Book New Consultation
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {dashboard && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upcoming</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.upcoming}</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              <CheckCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.completed}</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <XCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cancelled</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.cancelled}</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'var(--bg-card-subtle)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Bookings</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.total}</div>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List Filter & Heading */}
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
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Your Appointments</h2>

        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }} role="tablist">
          {['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              role="tab"
              aria-selected={filterStatus === st}
              onClick={() => setFilterStatus(st)}
              className="btn btn-sm"
              style={{
                background: filterStatus === st ? 'var(--primary)' : 'var(--bg-card-subtle)',
                color: filterStatus === st ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          Loading your appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <Calendar size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No appointments found</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>You have not booked any consultations in this category.</p>
          <button onClick={onNavigateDirectory} className="btn btn-primary btn-sm">
            Find a Doctor
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {appointments.map((apt) => {
            const isCompleted = apt.status === 'COMPLETED';
            const canCancel = apt.status === 'PENDING' || apt.status === 'CONFIRMED';

            const badgeClass = {
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
                {/* Doctor details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                    }}
                  >
                    {apt.doctor.name.replace(/^(Dr\.\s*)/, '').charAt(0)}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{apt.doctor.name}</h3>
                      <span className={`badge ${badgeClass}`}>{apt.status}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {apt.doctor.specialization}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      <strong>Reason:</strong> {apt.reason} {apt.notes ? `• ${apt.notes}` : ''}
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                      <Calendar size={14} color="var(--primary)" />
                      <span>{apt.date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Clock size={13} />
                      <span>{apt.time} ({apt.durationMinutes} mins)</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {canCancel && (
                      <button
                        onClick={() => {
                          setCancellingAppointment(apt);
                          setCancelReasonPreset(CANCELLATION_REASONS[0] || 'Scheduling conflict');
                          setCancelNotes('');
                          setCancelError(null);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)' }}
                      >
                        Cancel
                      </button>
                    )}

                    {isCompleted && !apt.hasReview && (
                      <button
                        onClick={() => onOpenReview(apt.id, apt.doctor.name)}
                        className="btn btn-outline btn-sm"
                      >
                        <Star size={14} /> Rate Doctor
                      </button>
                    )}

                    {isCompleted && apt.hasReview && (
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                        <CheckCircle size={12} /> Reviewed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accessible Cancel Appointment Confirmation Modal */}
      {cancellingAppointment && (
        <div
          className="modal-overlay"
          onClick={() => setCancellingAppointment(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '95%' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={18} />
                </div>
                <h3 id="cancel-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                  Cancel Appointment
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancellingAppointment(null)}
                aria-label="Close cancellation modal"
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

            <form onSubmit={handleConfirmCancel}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    background: 'var(--bg-card-subtle)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    {cancellingAppointment.doctor.name} ({cancellingAppointment.doctor.specialization})
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Scheduled for: <strong>{cancellingAppointment.date}</strong> at{' '}
                    <strong>{cancellingAppointment.time}</strong>
                  </div>
                </div>

                {cancelError && (
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
                    {cancelError}
                  </div>
                )}

                <div>
                  <label htmlFor="cancel-reason-select" className="form-label">
                    Reason for Cancellation *
                  </label>
                  <select
                    id="cancel-reason-select"
                    className="form-select"
                    value={cancelReasonPreset}
                    onChange={(e) => setCancelReasonPreset(e.target.value)}
                  >
                    {CANCELLATION_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cancel-notes-input" className="form-label">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    id="cancel-notes-input"
                    className="form-textarea"
                    rows={2}
                    placeholder="Let the clinic know why you are cancelling..."
                    value={cancelNotes}
                    onChange={(e) => setCancelNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setCancellingAppointment(null)}
                  className="btn btn-secondary"
                  disabled={submittingCancel}
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel}
                  className="btn btn-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {submittingCancel ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
