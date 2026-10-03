import React, { useState, useEffect } from 'react';
import type { AdminDashboardDto, DoctorDto, UserDto } from '@healthcare/shared';
import { api } from '../api/client';
import {
  Users,
  ShieldAlert,
  Calendar,
  CheckCircle,
  XCircle,
  Stethoscope,
} from 'lucide-react';

interface AdminPortalViewProps {
  onOpenTracking?: (patientId: number) => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({ onOpenTracking }) => {
  const [dashboard, setDashboard] = useState<AdminDashboardDto | null>(null);
  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingDoctorId, setUpdatingDoctorId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOCTORS' | 'USERS'>('OVERVIEW');

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, docs, usr] = await Promise.all([
        api.getDashboard() as Promise<AdminDashboardDto>,
        api.getDoctors({ pageSize: 50 }),
        api.getAdminUsers({ pageSize: 50 }),
      ]);
      setDashboard(dash);
      setDoctors(docs.data);
      setUsers(usr.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleVerification = async (doctor: DoctorDto) => {
    try {
      setUpdatingDoctorId(doctor.id);
      await api.verifyDoctor(doctor.id, !doctor.isVerified);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update verification status';
      console.error(message);
    } finally {
      setUpdatingDoctorId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Platform Administration</h1>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Overview of platform users, doctor credentials, and consultation analytics.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'OVERVIEW' ? 'var(--primary)' : 'var(--bg-card-subtle)',
            color: activeTab === 'OVERVIEW' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          Overview & Metrics
        </button>
        <button
          onClick={() => setActiveTab('DOCTORS')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'DOCTORS' ? 'var(--primary)' : 'var(--bg-card-subtle)',
            color: activeTab === 'DOCTORS' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          Doctor Verification ({doctors.length})
        </button>
        <button
          onClick={() => setActiveTab('USERS')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'USERS' ? 'var(--primary)' : 'var(--bg-card-subtle)',
            color: activeTab === 'USERS' ? 'white' : 'var(--text-secondary)',
            border: '1px solid var(--border)',
          }}
        >
          Platform Users ({users.length})
        </button>

        {onOpenTracking && (
          <button
            onClick={() => onOpenTracking(1)}
            className="btn btn-sm"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid #ef4444',
              fontWeight: 700,
            }}
          >
            📊 Patient Tracking Panel
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading administration metrics...
        </div>
      ) : activeTab === 'OVERVIEW' && dashboard ? (
        <div>
          {/* KPI Metrics */}
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
                <Users size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Users</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.users}</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctors</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.doctors}</div>
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
                <ShieldAlert size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting Verification</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.doctorsAwaitingVerification}</div>
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
                <Calendar size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Appointments</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard.counts.appointments}</div>
              </div>
            </div>
          </div>

          {/* Status Breakdown & 7-Day Trend */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Status Breakdown */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                Appointments by Status
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(dashboard.byStatus).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{status}</span>
                    <span className="badge badge-primary">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7-Day Trend */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                7-Day Activity Trends
              </h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', height: '140px', gap: '0.75rem', paddingTop: '1rem' }}>
                {dashboard.last7Days.map((day) => {
                  const maxCount = Math.max(...dashboard.last7Days.map((d) => d.count), 1);
                  const heightPercent = Math.max((day.count / maxCount) * 100, 15);
                  return (
                    <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{day.count}</span>
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          background: 'linear-gradient(180deg, var(--primary) 0%, #0369a1 100%)',
                          borderRadius: '4px',
                        }}
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'DOCTORS' ? (
        /* Doctor Verification Table */
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Doctor</th>
                <th style={{ padding: '0.75rem' }}>Specialization</th>
                <th style={{ padding: '0.75rem' }}>Experience</th>
                <th style={{ padding: '0.75rem' }}>Fee</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{doc.name}</td>
                  <td style={{ padding: '0.75rem', color: 'var(--primary)' }}>{doc.specialization}</td>
                  <td style={{ padding: '0.75rem' }}>{doc.experienceYears} yrs</td>
                  <td style={{ padding: '0.75rem' }}>₹{doc.consultationFee}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {doc.isVerified ? (
                      <span className="badge badge-success">
                        <CheckCircle size={12} /> Verified
                      </span>
                    ) : (
                      <span className="badge badge-warning">
                        <XCircle size={12} /> Unverified
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleToggleVerification(doc)}
                      disabled={updatingDoctorId === doc.id}
                      className={`btn btn-sm ${doc.isVerified ? 'btn-secondary' : 'btn-primary'}`}
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
      ) : (
        /* Users Table */
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>ID</th>
                <th style={{ padding: '0.75rem' }}>Name</th>
                <th style={{ padding: '0.75rem' }}>Email</th>
                <th style={{ padding: '0.75rem' }}>Role</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
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
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
