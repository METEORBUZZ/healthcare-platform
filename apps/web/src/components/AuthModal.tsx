import React, { useState, useEffect } from 'react';
import type { Role } from '@healthcare/shared';
import { useAuth } from '../context/AuthContext';
import {
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  HeartPulse,
  ClipboardList,
  Pill,
  Microscope,
  Users,
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  initialRole?: Role;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, initialRole = 'DOCTOR' }) => {
  const { login } = useAuth();

  // Public portal sign-in is limited to clinical roles; administrators use the configured admin origin.
  const [activeTab, setActiveTab] = useState<'DOCTOR' | 'STAFF'>(() => {
    if (
      initialRole === 'NURSE' ||
      initialRole === 'RECEPTIONIST' ||
      initialRole === 'PHARMACIST' ||
      initialRole === 'LABORATORY_STAFF' ||
      initialRole === 'STAFF'
    ) {
      return 'STAFF';
    }
    return 'DOCTOR';
  });

  // Login form state
  const [email, setEmail] = useState('doctor@demo.test');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  // Sync tab with initialRole if provided
  useEffect(() => {
    if (initialRole === 'DOCTOR') {
      setActiveTab('DOCTOR');
      setEmail('doctor@demo.test');
      setPassword('');
    } else if (
      initialRole === 'NURSE' ||
      initialRole === 'RECEPTIONIST' ||
      initialRole === 'PHARMACIST' ||
      initialRole === 'LABORATORY_STAFF' ||
      initialRole === 'STAFF'
    ) {
      setActiveTab('STAFF');
      if (initialRole === 'RECEPTIONIST') setEmail('receptionist@demo.test');
      else if (initialRole === 'PHARMACIST') setEmail('pharmacist@demo.test');
      else if (initialRole === 'LABORATORY_STAFF') setEmail('lab@demo.test');
      else setEmail('nurse@demo.test');
      setPassword('');
    }
  }, [initialRole]);

  const handleTabChange = (tab: 'DOCTOR' | 'STAFF') => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'DOCTOR') {
      setEmail('doctor@demo.test');
      setPassword('');
    } else if (tab === 'STAFF') {
      setEmail('nurse@demo.test');
      setPassword('');
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login({ email: email.trim(), password });
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please verify your authorized email and password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      style={{
        zIndex: 1000,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
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
          maxWidth: '490px',
          width: '100%',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          background: 'var(--bg-card)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.4rem 1.6rem 1rem 1.6rem',
            background:
              activeTab === 'DOCTOR'
                ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(13, 148, 136, 0.06) 100%)'
                : activeTab === 'STAFF'
                  ? 'linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(5, 150, 105, 0.06) 100%)'
                  : 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(147, 51, 234, 0.06) 100%)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background:
                    activeTab === 'DOCTOR'
                      ? '#0284c7'
                      : activeTab === 'STAFF'
                        ? '#0d9488'
                        : '#0d9488',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                  flexShrink: 0,
                }}
              >
                {activeTab === 'DOCTOR' && <Stethoscope size={22} />}
                {activeTab === 'STAFF' && <Users size={22} />}
              </div>
              <div>
                <h3
                  id="auth-modal-title"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {activeTab === 'DOCTOR' && 'Doctor Clinical Login'}
                  {activeTab === 'STAFF' && 'Hospital Staff Login'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Restricted Internal Portal · Private System
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close authentication modal"
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

          {/* ─── Separated Doctor and Staff Tabs ─────────────────────────── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.4rem',
              marginTop: '1.25rem',
              background: 'var(--bg-card)',
              padding: '0.3rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => handleTabChange('DOCTOR')}
              style={{
                padding: '0.55rem 0.5rem',
                borderRadius: '9px',
                border: 'none',
                background: activeTab === 'DOCTOR' ? '#0284c7' : 'transparent',
                color: activeTab === 'DOCTOR' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Stethoscope size={14} /> Doctor
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('STAFF')}
              style={{
                padding: '0.55rem 0.5rem',
                borderRadius: '9px',
                border: 'none',
                background: activeTab === 'STAFF' ? '#0d9488' : 'transparent',
                color: activeTab === 'STAFF' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.15s ease',
              }}
            >
              <Users size={14} /> Staff
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.4rem 1.6rem', maxHeight: '75vh', overflowY: 'auto' }}>
          {error && (
            <div
              role="alert"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#dc2626',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 700 }}>Authentication Error</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{error}</div>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
          >
            <div>
              <label
                htmlFor="auth-email"
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem',
                }}
              >
                {activeTab === 'DOCTOR' && 'Doctor Email Address'}
                {activeTab === 'STAFF' && 'Staff Member Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                >
                  <Mail size={16} />
                </div>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="form-input"
                  placeholder={activeTab === 'DOCTOR' ? 'doctor@demo.test' : 'nurse@demo.test'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.5rem', borderRadius: '10px' }}
                />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.35rem',
                }}
              >
                <label
                  htmlFor="auth-password"
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotHelp((prev) => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '0.72rem',
                    color: '#0284c7',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Credentials Help
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                >
                  <Lock size={16} />
                </div>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', borderRadius: '10px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: '0.2rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password helper info */}
            {showForgotHelp && (
              <div
                style={{
                  background: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                }}
              >
                <Info size={15} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div
                    style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}
                  >
                    Demo Credentials
                  </div>
                  <div>
                    All hospital accounts use password:{' '}
                    <code style={{ fontWeight: 700, color: '#0284c7' }}>Demo@12345</code>.
                  </div>
                </div>
              </div>
            )}

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                id="auth-remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  width: '15px',
                  height: '15px',
                  accentColor: '#0284c7',
                  cursor: 'pointer',
                }}
              />
              <label
                htmlFor="auth-remember"
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                Remember this terminal station
              </label>
            </div>

            {/* Submit Action */}
            <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1, borderRadius: '10px', padding: '0.65rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  borderRadius: '10px',
                  padding: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: activeTab === 'DOCTOR' ? '#0284c7' : '#0d9488',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  fontWeight: 700,
                }}
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>
                      {activeTab === 'DOCTOR' && 'Sign In as Doctor'}
                      {activeTab === 'STAFF' && 'Sign In as Staff'}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Admin Managed Onboarding Notice */}
          <div
            style={{
              marginTop: '1.2rem',
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'rgba(13, 148, 136, 0.06)',
              border: '1px solid rgba(13, 148, 136, 0.2)',
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'flex-start',
            }}
          >
            <ShieldCheck size={16} color="#0d9488" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '2px',
                }}
              >
                Private Hospital Security Policy
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Public self-registration is permanently disabled. Doctors and staff are onboarded
                and managed directly by the <strong>Hospital Administrator</strong>.
              </div>
            </div>
          </div>

          {/* Security & Compliance Footer */}
          <div
            style={{
              marginTop: '1rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            <CheckCircle2 size={13} color="#10b981" />
            <span>256-Bit SSL Encrypted Healthcare Portal · NABH & HIPAA Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
