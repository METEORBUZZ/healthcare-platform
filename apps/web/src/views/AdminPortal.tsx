import React, { useEffect, useState } from 'react';
import type {
  AdminAnalyticsDto,
  AdminAuditLogDto,
  AdminSettingsDto,
  AppointmentDto,
} from '@healthcare/shared';
import { ArrowRight, Building2, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { AdminDashboardView } from './AdminDashboardView';
import { ChangePasswordView } from './ChangePasswordView';
import { NiramayaLogo } from '../components/NiramayaLogo';

type AdminRoute =
  | 'dashboard'
  | 'users'
  | 'doctors'
  | 'staff'
  | 'appointments'
  | 'analytics'
  | 'audit-logs'
  | 'settings';

const ADMIN_ROUTES: { path: AdminRoute; label: string }[] = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'users', label: 'Users' },
  { path: 'doctors', label: 'Doctors' },
  { path: 'staff', label: 'Staff' },
  { path: 'appointments', label: 'Appointments' },
  { path: 'analytics', label: 'Analytics' },
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
    if (route === 'audit-logs') return <AdminAuditLogView />;
    if (route === 'appointments') return <AdminAppointmentsView />;
    if (route === 'analytics') return <AdminAnalyticsView />;
    if (route === 'settings') return <AdminSettingsView />;
    const initialRoleFilter: 'ALL' | 'DOCTOR' | 'STAFF' =
      route === 'doctors' ? 'DOCTOR' : route === 'staff' ? 'STAFF' : 'ALL';
    return <AdminDashboardView key={route} initialRoleFilter={initialRoleFilter} />;
  };

  return (
    <div className="admin-app">
      <header className="admin-app-header">
        <button
          className="admin-app-brand"
          onClick={() => navigate('dashboard')}
          aria-label="Admin dashboard"
        >
          <NiramayaLogo size="sm" showSubtext={false} />
          <span>
            <Building2 size={16} /> Admin Console
          </span>
        </button>
        <div className="admin-app-user">
          <span>{user.name}</span>
          <button
            onClick={async () => {
              setLogoutError(null);
              try {
                await logout();
                navigate('login');
              } catch (err) {
                setLogoutError(err instanceof Error ? err.message : 'Could not end the session.');
              }
            }}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>
      <nav className="admin-app-nav" aria-label="Administrator navigation">
        {ADMIN_ROUTES.map(({ path, label }) => (
          <button
            key={path}
            aria-current={route === path ? 'page' : undefined}
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
      </nav>
      {logoutError && (
        <div className="admin-login-error" role="alert">
          {logoutError}
        </div>
      )}
      <main className="admin-app-main">{renderRoute()}</main>
    </div>
  );
};
