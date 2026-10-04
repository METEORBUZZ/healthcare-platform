import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AdminDashboardView } from './views/AdminDashboardView';
import { DoctorDashboardView } from './views/DoctorDashboardView';
import { StaffDashboardView } from './views/StaffDashboardView';
import { PatientTrackingView } from './views/PatientTrackingView';
import { PrivateHospitalSecurityGate } from './components/PrivateHospitalSecurityGate';
import { AuthModal } from './components/AuthModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ProfileModal } from './components/ProfileModal';
import { DeviceNotificationBanner } from './components/DeviceNotificationBanner';
import { NiramayaLogo } from './components/NiramayaLogo';
import { AdminPortal } from './views/AdminPortal';
import { ChangePasswordView } from './views/ChangePasswordView';
import { ADMIN_APP_URL, isAdminOrigin } from './config/appUrls';
import { MapPin, AlertTriangle } from 'lucide-react';

// ─── Error Boundary ──────────────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  override render() {
    if (this.state.hasError) {
      return (
        <div
          className="hospital-footer-content"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem',
            padding: '2rem',
            background: '#f8fafc',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Something went wrong
          </h2>
          <pre
            style={{
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.8rem',
              maxWidth: '600px',
              overflowX: 'auto',
              color: '#ef4444',
            }}
          >
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack?.split('\n').slice(0, 6).join('\n')}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#0284c7',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main App ────────────────────────────────────────────────────────────────
const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });

  // Modal & Selection states
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [selectedTrackingPatientId, setSelectedTrackingPatientId] = useState<number | null>(null);

  // Sync theme
  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
      }
    } catch {
      // ignore storage errors
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/change-password') {
        setCurrentView('change-password');
      }
    };
    window.addEventListener('popstate', handlePopState);
    if (window.location.pathname === '/change-password') {
      setCurrentView('change-password');
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Reset view to dashboard when user changes, or force change-password if required
  useEffect(() => {
    if (user?.mustChangePassword) {
      if (window.location.pathname !== '/change-password') {
        window.history.pushState(null, '', '/change-password');
      }
      setCurrentView('change-password');
    } else {
      if (currentView === 'change-password' && window.location.pathname !== '/change-password') {
        setCurrentView('dashboard');
      }
    }
  }, [user?.mustChangePassword, user?.role, user?.id]);

  useEffect(() => {
    if (user?.role === 'ADMIN' && !isAdminOrigin) {
      window.location.replace(`${ADMIN_APP_URL}/login`);
    }
  }, [user?.role]);

  const handleNavigate = (view: string) => {
    if (user?.mustChangePassword) {
      setCurrentView('change-password');
      return;
    }
    if (view === 'change-password') {
      window.history.pushState(null, '', '/change-password');
    } else if (window.location.pathname === '/change-password') {
      window.history.pushState(null, '', '/');
    }
    setCurrentView(view);
  };

  // Render role-specific dashboard content
  const renderDashboardContent = () => {
    if (!user) {
      if (currentView === 'change-password' || window.location.pathname === '/change-password') {
        return (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <h2>Sign in required</h2>
            <p>Please sign in with your credentials to change your password.</p>
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                marginTop: '1rem',
                padding: '0.65rem 1.25rem',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sign In
            </button>
          </div>
        );
      }
      return <PrivateHospitalSecurityGate onSuccess={() => setCurrentView('dashboard')} />;
    }

    if (
      user.mustChangePassword ||
      currentView === 'change-password' ||
      window.location.pathname === '/change-password'
    ) {
      return (
        <ChangePasswordView
          onPasswordChanged={() => {
            setCurrentView('dashboard');
            if (window.location.pathname === '/change-password') {
              window.history.pushState(null, '', '/');
            }
          }}
        />
      );
    }

    if (currentView === 'tracking') {
      return (
        <PatientTrackingView
          initialPatientId={selectedTrackingPatientId}
          onOpenEditProfile={() => setShowProfileModal(true)}
          onNavigateBack={() => {
            setSelectedTrackingPatientId(null);
            setCurrentView('dashboard');
          }}
        />
      );
    }

    // Role-based routing
    if (user.role === 'ADMIN') {
      return <AdminDashboardView />;
    }

    if (user.role === 'DOCTOR') {
      return <DoctorDashboardView />;
    }

    if (
      user.role === 'NURSE' ||
      user.role === 'RECEPTIONIST' ||
      user.role === 'PHARMACIST' ||
      user.role === 'LABORATORY_STAFF' ||
      user.role === 'STAFF'
    ) {
      return <StaffDashboardView />;
    }

    // Default fallback to Doctor view
    return <DoctorDashboardView />;
  };

  if (isAdminOrigin) return <AdminPortal />;
  if (user?.role === 'ADMIN') {
    return <main className="admin-loading">Opening the separate administrator console…</main>;
  }

  return (
    <div className="app-container">
      <DeviceNotificationBanner onOpenPortalTab={() => setCurrentView('dashboard')} />
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={() => setShowAuthModal(true)}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      <main className="main-content">{renderDashboardContent()}</main>

      {/* Hospital Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-card)',
          padding: '2rem 1.5rem',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1360px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div
            className="hospital-footer-brand"
            style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <NiramayaLogo size="sm" showSubtext={true} />
            <span
              className="hospital-footer-version"
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                paddingLeft: '1rem',
                borderLeft: '1px solid var(--border)',
              }}
            >
              🔒 Internal Healthcare Operations System · Version 3.4.0
            </span>
          </div>

          {/* Hospital Address */}
          <a
            href="https://maps.google.com/?q=01,301+Sai+Enclave,+Above+Sai+Furniture,+Opposite+Laxmi+Petrol+Pump,+Sarigam+Bhilad+road,+Sarigam,+Umargam,+Gujarat,+India+396155"
            target="_blank"
            rel="noreferrer"
            title="View Niramaya Hospital on Google Maps"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              maxWidth: '540px',
              width: '100%',
              flex: '1 1 320px',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border)',
              padding: '0.65rem 0.95rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'rgba(0, 194, 203, 0.12)',
                color: '#00C2CB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px',
              }}
            >
              <MapPin size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <span>Hospital Address</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: '#00C2CB',
                    fontWeight: 600,
                  }}
                >
                  • Open in Maps ↗
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                01,301 Sai Enclave, Above Sai Furniture, Opposite Laxmi Petrol Pump, Sarigam Bhilad
                road, Sarigam, Umargam, Gujarat, India 396155
              </div>
            </div>
          </a>
        </div>
      </footer>

      {/* Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}

      {showProfileModal && <ProfileModal onClose={() => setShowProfileModal(false)} />}
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
};
