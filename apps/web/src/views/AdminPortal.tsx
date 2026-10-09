import React, { useEffect, useState } from 'react';
import type {
  AdminAnalyticsDto,
  AdminAuditLogDto,
  AdminSettingsDto,
  AppointmentDto,
} from '@healthcare/shared';
import {
  ArrowRight,
  Building2,
  LogOut,
  ShieldCheck,
  LayoutGrid,
  Calendar,
  Users,
  BarChart2,
  HelpCircle,
  Settings,
  Search,
  MessageSquare,
  Bell,
  ChevronRight,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { AdminDashboardView } from './AdminDashboardView';
import { ChangePasswordView } from './ChangePasswordView';
import { BlockchainLedgerExplorerView } from './BlockchainLedgerExplorerView';
import { LifeCareAdminDashboard } from './LifeCareAdminDashboard';
import { CalendarAppointmentsView } from './CalendarAppointmentsView';
import { NiramayaLogo } from '../components/NiramayaLogo';

type AdminRoute =
  | 'dashboard'
  | 'users'
  | 'doctors'
  | 'staff'
  | 'appointments'
  | 'analytics'
  | 'blockchain'
  | 'audit-logs'
  | 'settings';

const ADMIN_ROUTES: { path: AdminRoute; label: string }[] = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'users', label: 'Users' },
  { path: 'doctors', label: 'Doctors' },
  { path: 'staff', label: 'Staff' },
  { path: 'appointments', label: 'Appointments' },
  { path: 'analytics', label: 'Analytics' },
  { path: 'blockchain', label: '🛡️ Blockchain Ledger' },
  { path: 'audit-logs', label: 'Audit Logs' },
  { path: 'settings', label: 'Settings' },
];

const routeFromPath = (pathname: string): AdminRoute | 'login' => {
  const segment = pathname.replace(/^\/+|\/+$/g, '') || 'dashboard';
  return segment === 'login' || ADMIN_ROUTES.some((route) => route.path === segment)
    ? (segment as AdminRoute | 'login')
    : 'dashboard';
};

const AdminLogin: React.FC = () => {
  const { loginAdmin, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginAdmin({ email: email.trim(), password });
      window.history.replaceState(null, '', '/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in with these credentials.');
    } finally {
      setSubmitting(false);
      setPassword('');
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <NiramayaLogo size="md" showSubtext />
        </div>
        <div className="admin-login-icon">
          <ShieldCheck size={24} />
        </div>
        <h1>Administrator sign in</h1>
        <p>Restricted access. Sign in with an active administrator account.</p>
        {user && user.role !== 'ADMIN' && (
          <div className="admin-login-error" role="alert">
            This session is not authorized for administrator access. Sign in with an administrator
            account.
          </div>
        )}
        {error && (
          <div className="admin-login-error" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="admin-login-form">
          <label htmlFor="admin-email">Email address</label>
          <input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={72}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Sign in securely'}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>
        <div className="admin-login-security">
          <ShieldCheck size={15} /> Credentials are verified by the server. Admin APIs enforce role
          authorization.
        </div>
      </section>
    </main>
  );
};

const AdminAuditLogView: React.FC = () => {
  const [rows, setRows] = useState<AdminAuditLogDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getAdminAuditLogs({ pageSize: 100 })
      .then((response) => {
        if (active) setRows(response.data);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load audit events.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="admin-content-card">
      <h1>Administrator audit log</h1>
      <p>
        Recent access and administrative API activity. Credentials and request bodies are never
        stored here.
      </p>
      {loading && <p>Loading audit events…</p>}
      {error && (
        <p className="admin-login-error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin user</th>
                <th>Action</th>
                <th>Target</th>
                <th>Outcome</th>
                <th>Request ID</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                  <td>{row.actorUserId ?? 'Unauthenticated'}</td>
                  <td>{row.action}</td>
                  <td>
                    {row.targetType}
                    {row.targetId ? ` · ${row.targetId}` : ''}
                  </td>
                  <td>
                    <span className={`admin-outcome admin-outcome-${row.outcome.toLowerCase()}`}>
                      {row.outcome}
                    </span>
                  </td>
                  <td>{row.requestId ?? '—'}</td>
                  <td>{row.ipAddress ?? '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7}>No audit records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const useAdminData = <T,>(load: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    load()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Could not load administrator data.');
      });
    return () => {
      active = false;
    };
  }, [load]);
  return { data, error };
};

const AdminAppointmentsView: React.FC = () => {
  const load = React.useCallback(
    async () => (await api.getAdminAppointments({ pageSize: 100 })).data,
    [],
  );
  const { data, error } = useAdminData<AppointmentDto[]>(load);
  return (
    <section className="admin-content-card">
      <h1>Appointments</h1>
      <p>Recent appointment records for authorized administrative review.</p>
      {error && (
        <p className="admin-login-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p>Loading appointments…</p>}
      {data && (
        <div className="admin-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Date & time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    {appointment.date} {appointment.time}
                  </td>
                  <td>{appointment.patient.name}</td>
                  <td>{appointment.doctor.name}</td>
                  <td>{appointment.reason}</td>
                  <td>{appointment.status}</td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={5}>No appointments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const AdminAnalyticsView: React.FC = () => {
  const load = React.useCallback(() => api.getAdminAnalytics(), []);
  const { data, error } = useAdminData<AdminAnalyticsDto>(load);
  return (
    <section className="admin-content-card">
      <h1>Hospital analytics</h1>
      <p>Operational counts from the application database.</p>
      {error && (
        <p className="admin-login-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p>Loading analytics…</p>}
      {data && (
        <div className="admin-metric-grid">
          {Object.entries(data).map(([label, value]) => (
            <article key={label}>
              <span>{label.replace(/[A-Z]/g, (letter) => ` ${letter}`).trim()}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

const AdminSettingsView: React.FC = () => {
  const load = React.useCallback(() => api.getAdminSettings(), []);
  const { data, error } = useAdminData<AdminSettingsDto>(load);
  return (
    <section className="admin-content-card">
      <h1>System settings</h1>
      <p>Runtime configuration is managed through deployment environment variables.</p>
      {error && (
        <p className="admin-login-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p>Loading settings…</p>}
      {data && (
        <dl className="admin-settings-list">
          <dt>Public application</dt>
          <dd>{data.publicAppUrl}</dd>
          <dt>Admin application</dt>
          <dd>{data.adminAppUrl}</dd>
          <dt>Clinic time zone</dt>
          <dd>{data.clinicTimezone}</dd>
          <dt>Booking window</dt>
          <dd>{data.bookingWindowDays} days</dd>
        </dl>
      )}
    </section>
  );
};

export const AdminPortal: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const [route, setRoute] = useState<AdminRoute | 'login'>(() =>
    routeFromPath(window.location.pathname),
  );
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Administrator Console | Niramaya Hospital';
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex, nofollow, noarchive';
    const syncRoute = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN') && route !== 'login') {
      window.history.replaceState(null, '', '/login');
      setRoute('login');
    } else if (!loading && user?.role === 'ADMIN' && route === 'login') {
      window.history.replaceState(null, '', '/dashboard');
      setRoute('dashboard');
    }
  }, [loading, route, user]);

  const navigate = (next: AdminRoute | 'login') => {
    window.history.pushState(null, '', `/${next}`);
    setRoute(next);
  };

  if (loading) return <main className="admin-loading">Verifying administrator session…</main>;
  if (!user || user.role !== 'ADMIN') return <AdminLogin />;
  if (user.mustChangePassword) {
    return (
      <ChangePasswordView
        onPasswordChanged={() => {
          setRoute('dashboard');
        }}
      />
    );
  }

  const renderRoute = () => {
    if (route === 'dashboard') {
      return <LifeCareAdminDashboard onNavigate={(r) => navigate(r as AdminRoute)} />;
    }
    if (route === 'blockchain') {
      return (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <BlockchainLedgerExplorerView />
        </div>
      );
    }
    if (route === 'audit-logs') {
      return (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <AdminAuditLogView />
        </div>
      );
    }
    if (route === 'appointments') {
      return (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <CalendarAppointmentsView />
        </div>
      );
    }
    if (route === 'analytics') {
      return (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <AdminAnalyticsView />
        </div>
      );
    }
    if (route === 'settings') {
      return (
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <AdminSettingsView />
        </div>
      );
    }
    const initialRoleFilter: 'ALL' | 'DOCTOR' | 'STAFF' =
      route === 'doctors' ? 'DOCTOR' : route === 'staff' ? 'STAFF' : 'ALL';
    return (
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <AdminDashboardView key={route} initialRoleFilter={initialRoleFilter} />
      </div>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#0f172a',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ─── Niramaya Left Sidebar ────────────────────────────────────────── */}
      <aside
        style={{
          width: '250px',
          minWidth: '250px',
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          boxSizing: 'border-box',
          padding: '1.25rem 1rem',
          userSelect: 'none',
        }}
      >
        {/* Brand */}
        <div
          onClick={() => navigate('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0.25rem 0.25rem 1.35rem',
            cursor: 'pointer',
          }}
          title="Niramaya Hospital"
        >
          <img
            src="/niramaya-hospital-logo.png"
            alt="Niramaya Hospital"
            style={{
              width: '100%',
              maxWidth: '218px',
              height: 'auto',
              maxHeight: '46px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* Navigation Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, overflowY: 'auto' }}>
          {/* GENERAL */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.65rem 0.5rem' }}>
              General
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button
                onClick={() => navigate('dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: route === 'dashboard' ? '#00d2c4' : 'transparent',
                  color: route === 'dashboard' ? '#0f172a' : '#64748b',
                  fontSize: '0.88rem',
                  fontWeight: route === 'dashboard' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <LayoutGrid size={18} color={route === 'dashboard' ? '#0f172a' : '#64748b'} />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => navigate('appointments')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: route === 'appointments' ? '#00d2c4' : 'transparent',
                  color: route === 'appointments' ? '#0f172a' : '#64748b',
                  fontSize: '0.88rem',
                  fontWeight: route === 'appointments' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={18} color={route === 'appointments' ? '#0f172a' : '#64748b'} />
                  <span>Appointment</span>
                </div>
                <span
                  style={{
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  6
                </span>
              </button>

              <button
                onClick={() => navigate('users')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: route === 'users' ? '#00d2c4' : 'transparent',
                  color: route === 'users' ? '#0f172a' : '#64748b',
                  fontSize: '0.88rem',
                  fontWeight: route === 'users' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={18} color={route === 'users' ? '#0f172a' : '#64748b'} />
                  <span>Patient</span>
                </div>
                <ChevronRight size={14} color="#94a3b8" />
              </button>

              <button
                onClick={() => navigate('staff')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: route === 'staff' || route === 'doctors' ? '#00d2c4' : 'transparent',
                  color: route === 'staff' || route === 'doctors' ? '#0f172a' : '#64748b',
                  fontSize: '0.88rem',
                  fontWeight: route === 'staff' || route === 'doctors' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Building2 size={18} color={route === 'staff' || route === 'doctors' ? '#0f172a' : '#64748b'} />
                  <span>Departments</span>
                </div>
                <ChevronRight size={14} color="#94a3b8" />
              </button>
            </div>
          </div>

          {/* REPORTS */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.65rem 0.5rem' }}>
              Reports
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button
                onClick={() => navigate('analytics')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: route === 'analytics' ? '#00d2c4' : 'transparent',
                  color: route === 'analytics' ? '#0f172a' : '#64748b',
                  fontSize: '0.88rem',
                  fontWeight: route === 'analytics' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <BarChart2 size={18} color={route === 'analytics' ? '#0f172a' : '#64748b'} />
                  <span>Analytics</span>
                </div>
                <ChevronRight size={14} color="#94a3b8" />
              </button>

              <button
                onClick={() => navigate('blockchain')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: route === 'blockchain' ? '#00d2c4' : 'transparent',
                  color: route === 'blockchain' ? '#0f172a' : '#64748b',
                  fontSize: '0.88rem',
                  fontWeight: route === 'blockchain' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck size={18} color={route === 'blockchain' ? '#0f172a' : '#64748b'} />
                  <span>Financial & Ledger</span>
                </div>
                <ChevronRight size={14} color="#94a3b8" />
              </button>
            </div>
          </div>

          {/* SETTINGS */}
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.65rem 0.5rem' }}>
              Settings
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <button
                onClick={() => navigate('audit-logs')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: route === 'audit-logs' ? '#00d2c4' : 'transparent',
                  color: route === 'audit-logs' ? '#0f172a' : '#64748b',
                  fontSize: '0.88rem',
                  fontWeight: route === 'audit-logs' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <HelpCircle size={18} color={route === 'audit-logs' ? '#0f172a' : '#64748b'} />
                <span>Help & Supports</span>
              </button>

              <button
                onClick={() => navigate('settings')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: route === 'settings' ? '#00d2c4' : 'transparent',
                  color: route === 'settings' ? '#0f172a' : '#64748b',
                  fontSize: '0.88rem',
                  fontWeight: route === 'settings' ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                <Settings size={18} color={route === 'settings' ? '#0f172a' : '#64748b'} />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Log Out */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: 'auto' }}>
          <button
            onClick={async () => {
              setLogoutError(null);
              try {
                await logout();
                navigate('login');
              } catch (err) {
                setLogoutError(err instanceof Error ? err.message : 'Could not end session.');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              border: 'none',
              background: 'transparent',
              color: '#ef4444',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <LogOut size={18} color="#ef4444" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Right Area ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 2rem',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Greeting */}
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Hello, {user.name ? user.name.split(' ')[0] : 'John Warker'} 👋
            </h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '3px 0 0' }}>
              Welcome to the Hospital Management Dashboard.
            </p>
          </div>

          {/* Search Bar + Actions + Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Search anything pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                background: '#f8fafc',
                borderRadius: '999px',
                padding: '0.55rem 1.15rem',
                border: '1px solid #e2e8f0',
                width: '240px',
              }}
            >
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search anything"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#0f172a',
                  fontSize: '0.82rem',
                  width: '100%',
                }}
              />
            </div>

            {/* Chat Icon */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <MessageSquare size={17} color="#64748b" />
            </div>

            {/* Bell Icon with Notification Badge */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              <Bell size={17} color="#64748b" />
              <span
                style={{
                  position: 'absolute',
                  top: '9px',
                  right: '9px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                }}
              />
            </div>

            {/* User Profile Pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                padding: '0.2rem 0.5rem',
              }}
            >
              <img
                src={
                  user.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
                }
                alt={user.name}
                style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a' }}>
                  {user.name || 'Name Here'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Admin</div>
              </div>
              <ChevronDown size={14} color="#94a3b8" />
            </div>
          </div>
        </header>

        {logoutError && (
          <div
            role="alert"
            style={{
              margin: '1rem 2rem 0',
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.85rem',
            }}
          >
            {logoutError}
          </div>
        )}

        {/* Main Content View */}
        <main style={{ padding: '1.75rem 2rem 3rem', flex: 1 }}>{renderRoute()}</main>
      </div>
    </div>
  );
};
