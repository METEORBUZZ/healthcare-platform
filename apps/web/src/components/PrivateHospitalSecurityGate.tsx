import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Stethoscope,
  Users,
  AlertCircle,
  ArrowRight,
  Pill,
  Microscope,
  ClipboardList,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import { NiramayaLogo } from './NiramayaLogo';

interface PrivateHospitalSecurityGateProps {
  onSuccess?: () => void;
}

export const PrivateHospitalSecurityGate: React.FC<PrivateHospitalSecurityGateProps> = ({
  onSuccess,
}) => {
  const { login, quickLogin } = useAuth();
  const [activePortal, setActivePortal] = useState<'DOCTOR' | 'STAFF'>('DOCTOR');

  // Form states
  const [email, setEmail] = useState('doctor@demo.test');
  const [password, setPassword] = useState('Demo@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Switch portal tab and set appropriate default credentials
  const handleSwitchPortal = (portal: 'DOCTOR' | 'STAFF') => {
    setActivePortal(portal);
    setLocalError(null);
    if (portal === 'DOCTOR') {
      setEmail('doctor@demo.test');
      setPassword('Demo@12345');
    } else if (portal === 'STAFF') {
      setEmail('nurse@demo.test');
      setPassword('Demo@12345');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter your authorized email and password.');
      return;
    }
    setLocalError(null);
    setLoading(true);
    try {
      await login({ email: email.trim(), password: password.trim() });
      onSuccess?.();
    } catch (err: unknown) {
      setLocalError(
        (err as Error)?.message || 'Authentication failed. Please check your credentials.',
      );
    } finally {
      setLoading(false);
    }
  };

  const staffStations = [
    {
      id: 'nurse',
      role: 'NURSE' as const,
      name: 'Nursing Station',
      person: 'Sister Anjali Nair',
      email: 'nurse@demo.test',
      icon: <HeartPulse size={18} />,
      color: '#059669',
      bg: 'rgba(5, 150, 105, 0.1)',
    },
    {
      id: 'reception',
      role: 'RECEPTIONIST' as const,
      name: 'Reception & Queue',
      person: 'Kavita Sundaram',
      email: 'receptionist@demo.test',
      icon: <ClipboardList size={18} />,
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.1)',
    },
    {
      id: 'pharmacy',
      role: 'PHARMACIST' as const,
      name: 'Pharmacy Dispensing',
      person: 'Pooja Sundaram',
      email: 'pharmacist@demo.test',
      icon: <Pill size={18} />,
      color: '#2563eb',
      bg: 'rgba(37, 99, 235, 0.1)',
    },
    {
      id: 'laboratory',
      role: 'LABORATORY_STAFF' as const,
      name: 'Diagnostic Laboratory',
      person: 'Vikramaditya Rathore',
      email: 'lab@demo.test',
      icon: <Microscope size={18} />,
      color: '#db2777',
      bg: 'rgba(219, 39, 119, 0.1)',
    },
  ];

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
      }}
    >
      <div style={{ maxWidth: '880px', width: '100%' }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <NiramayaLogo size="lg" showSubtext={true} />
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              padding: '0.35rem 0.95rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              marginBottom: '0.75rem',
            }}
          >
            <Lock size={14} /> Private Internal Healthcare Portal
          </div>

          <h1
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 0.5rem',
            }}
          >
            Authorized Healthcare Personnel Login
          </h1>
          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
              maxWidth: '640px',
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Zero public patient access. Public patient registration is completely disabled.
            Attending Doctors and Medical Staff sign in below.
          </p>
        </div>

        {/* ─── Separated Login Portal Selector Tabs ───────────────────────── */}
        <div
          className="portal-tab-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.75rem',
          }}
        >
          {/* Doctor Tab */}
          <button
            type="button"
            onClick={() => handleSwitchPortal('DOCTOR')}
            style={{
              padding: '1rem 0.75rem',
              borderRadius: '1rem',
              border: activePortal === 'DOCTOR' ? '2px solid #0284c7' : '1px solid var(--border)',
              background: activePortal === 'DOCTOR' ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-card)',
              color: activePortal === 'DOCTOR' ? '#0284c7' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
              boxShadow: activePortal === 'DOCTOR' ? '0 4px 14px rgba(2, 132, 199, 0.25)' : 'none',
            }}
          >
            <div
              className="tab-icon-circle"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: activePortal === 'DOCTOR' ? '#0284c7' : 'rgba(2, 132, 199, 0.1)',
                color: activePortal === 'DOCTOR' ? '#ffffff' : '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Stethoscope size={20} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Doctor Login</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Physicians & Specialists
            </div>
          </button>

          {/* Staff Tab */}
          <button
            type="button"
            onClick={() => handleSwitchPortal('STAFF')}
            style={{
              padding: '1rem 0.75rem',
              borderRadius: '1rem',
              border: activePortal === 'STAFF' ? '2px solid #0d9488' : '1px solid var(--border)',
              background: activePortal === 'STAFF' ? 'rgba(13, 148, 136, 0.12)' : 'var(--bg-card)',
              color: activePortal === 'STAFF' ? '#0d9488' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
              boxShadow: activePortal === 'STAFF' ? '0 4px 14px rgba(13, 148, 136, 0.25)' : 'none',
            }}
          >
            <div
              className="tab-icon-circle"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: activePortal === 'STAFF' ? '#0d9488' : 'rgba(13, 148, 136, 0.1)',
                color: activePortal === 'STAFF' ? '#ffffff' : '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Staff Login</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Nurse, Reception, Rx, Lab
            </div>
          </button>
        </div>

        {/* ─── Main Portal Card (Doctor vs Staff) ─────────────────────────── */}
        <div
          className="card auth-card"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Header for Active Portal */}
          <div
            className="quick-login-row"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.25rem',
                }}
              >
                <span
                  style={{
                    background:
                      activePortal === 'DOCTOR'
                        ? 'rgba(2, 132, 199, 0.12)'
                        : activePortal === 'STAFF'
                          ? 'rgba(13, 148, 136, 0.12)'
                          : 'rgba(124, 58, 237, 0.12)',
                    color:
                      activePortal === 'DOCTOR'
                        ? '#0284c7'
                        : activePortal === 'STAFF'
                          ? '#0d9488'
                          : '#7c3aed',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                  }}
                >
                  {activePortal} CONSOLE
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {activePortal === 'DOCTOR' && 'Attending Physician Portal'}
                  {activePortal === 'STAFF' && 'Internal Hospital Operations'}
                </span>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                {activePortal === 'DOCTOR' && 'Doctor Clinical Portal Sign In'}
                {activePortal === 'STAFF' && 'Hospital Staff Station Sign In'}
              </h2>
            </div>

            {/* 1-Click Fast Verification Button */}
            {activePortal === 'DOCTOR' && (
              <button
                type="button"
                onClick={() => {
                  quickLogin('DOCTOR');
                  onSuccess?.();
                }}
                style={{
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  border: '1px solid rgba(2, 132, 199, 0.3)',
                  padding: '0.55rem 1rem',
                  borderRadius: '0.6rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Sparkles size={14} /> 1-Click Sign In as Dr. Priya Sharma
              </button>
            )}
          </div>

          {/* If STAFF Portal: Display Staff Station Selector Chips */}
          {activePortal === 'STAFF' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '0.6rem',
                }}
              >
                Select Staff Station for 1-Click Instant Login or auto-fill credentials:
              </div>
              <div
                className="staff-station-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.65rem',
                }}
              >
                {staffStations.map((station) => (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => {
                      setEmail(station.email);
                      setPassword('Demo@12345');
                      quickLogin(station.role);
                      onSuccess?.();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card-subtle, rgba(0, 0, 0, 0.02))',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = station.color;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: station.bg,
                        color: station.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {station.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                        }}
                      >
                        {station.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {station.person}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {localError && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.6rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{localError}</span>
            </div>
          )}

          {/* Credentials Form */}
          <form
            onSubmit={handleFormSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '5px',
                }}
              >
                {activePortal === 'DOCTOR' && 'Doctor Email Address'}
                {activePortal === 'STAFF' && 'Staff Member Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="email"
                  required
                  placeholder={
                    activePortal === 'DOCTOR'
                      ? 'doctor@demo.test'
                      : 'nurse@demo.test or staff@niramaya.health'
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem 0.7rem 2.4rem',
                    borderRadius: '0.6rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input, var(--bg-card))',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginBottom: '5px',
                }}
              >
                Security Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 2.5rem 0.7rem 2.4rem',
                    borderRadius: '0.6rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input, var(--bg-card))',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeyRound size={13} />
                Demo Credentials: Password is{' '}
                <code style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Demo@12345</code>
              </span>
              <span>Encrypted SSL 256-Bit</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: activePortal === 'DOCTOR' ? '#0284c7' : '#0d9488',
                color: '#ffffff',
                border: 'none',
                padding: '0.8rem',
                borderRadius: '0.65rem',
                fontWeight: 700,
                fontSize: '0.94rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow:
                  activePortal === 'DOCTOR'
                    ? '0 4px 14px rgba(2, 132, 199, 0.35)'
                    : '0 4px 14px rgba(13, 148, 136, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem',
                transition: 'all 0.15s ease',
              }}
            >
              <span>
                {loading
                  ? 'Authenticating...'
                  : activePortal === 'DOCTOR'
                    ? 'Sign In to Doctor Console'
                    : 'Sign In to Staff Station'}
              </span>
              <ArrowRight size={17} />
            </button>
          </form>

          {/* Admin Managed Account Notice */}
          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.85rem 1rem',
              borderRadius: '0.75rem',
              background: 'var(--bg-card-subtle, rgba(0, 0, 0, 0.02))',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
            }}
          >
            <ShieldCheck size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <div>
              <strong>Administrator-Managed System:</strong> Doctors and staff members do not
              self-register. Accounts and working shifts are created directly by the Hospital
              Administrator.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
