import React, { useState, useEffect } from 'react';
import type { AppointmentDto, DoctorDashboardDto } from '@healthcare/shared';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  Phone,
  Check,
} from 'lucide-react';

interface DoctorPortalViewProps {
  onOpenTracking?: (patientId: number) => void;
}

export const DoctorPortalView: React.FC<DoctorPortalViewProps> = ({ onOpenTracking }) => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DoctorDashboardDto | null>(null);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TODAY' | 'ALL'>('TODAY');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, apts] = await Promise.all([
        api.getDashboard() as Promise<DoctorDashboardDto>,
        api.getAppointments(),
      ]);
      setDashboard(dash);
      setAppointments(apts.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (
    id: number,
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
  ) => {
    let doctorNotes: string | undefined;
    let cancellationReason: string | undefined;

    if (status === 'COMPLETED') {
      const inputNotes = window.prompt('Enter consultation summary or prescription notes (optional):');
      if (inputNotes !== null) doctorNotes = inputNotes;
    } else if (status === 'CANCELLED') {
      const reason = window.prompt('Enter reason for cancellation:');
      if (!reason) return;
      cancellationReason = reason;
    }

    try {
      setActionLoading(id);
      await api.updateAppointmentStatus(id, {
        status,
        doctorNotes,
        cancellationReason,
      });
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      console.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const displayedAppointments =
    activeTab === 'TODAY' && dashboard ? dashboard.today : appointments;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Doctor Consultation Desk</h1>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Welcome, <strong>{user?.name}</strong>. Manage your consultation queue, verify patients, and record notes.
        </div>
      </div>

      {/* Dashboard KPI cards */}
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
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Today's Patients</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.today}</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              <AlertCircle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Requests</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.pendingRequests}</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Upcoming Ahead</div>
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
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.completed}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('TODAY')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'TODAY' ? 'var(--primary)' : 'var(--bg-card-subtle)',
            color: activeTab === 'TODAY' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          Today's Queue ({dashboard?.today.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('ALL')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'ALL' ? 'var(--primary)' : 'var(--bg-card-subtle)',
            color: activeTab === 'ALL' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          All Appointments ({appointments.length})
        </button>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          Loading schedule...
        </div>
      ) : displayedAppointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <Calendar size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No appointments scheduled</h3>
          <p style={{ fontSize: '0.85rem' }}>Your schedule for this view is currently clear.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayedAppointments.map((apt) => {
            const isPending = apt.status === 'PENDING';
            const isConfirmed = apt.status === 'CONFIRMED';

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
                {/* Patient details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >
                    <User size={20} color="var(--primary)" />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{apt.patient.name}</h4>
                      <span className={`badge ${badgeClass}`}>{apt.status}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      <strong>Reason:</strong> {apt.reason}
                    </div>

                    {apt.patient.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
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
                        <strong>Notes:</strong> {apt.doctorNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Timing and Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{apt.date}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{apt.time} ({apt.durationMinutes} min)</div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isPending && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                        disabled={actionLoading === apt.id}
                        className="btn btn-primary btn-sm"
                      >
                        <Check size={14} /> Accept
                      </button>
                    )}

                    {isConfirmed && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                        disabled={actionLoading === apt.id}
                        className="btn btn-primary btn-sm"
                        style={{ background: 'var(--success)' }}
                      >
                        <CheckCircle2 size={14} /> Complete
                      </button>
                    )}

                    {(isPending || isConfirmed) && (
                      <button
                        onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                        disabled={actionLoading === apt.id}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)' }}
                      >
                        Cancel
                      </button>
                    )}

                    {onOpenTracking && (
                      <button
                        onClick={() => onOpenTracking(apt.patient.id)}
                        title="View Patient Health & Vitals Tracking Panel"
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        📊 Tracking
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
  );
};
