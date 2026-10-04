import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { NiramayaLogo } from '../components/NiramayaLogo';

interface ChangePasswordViewProps {
  onPasswordChanged?: () => void;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({ onPasswordChanged }) => {
  const { user, changePassword, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Requirements checks
  const isMinLength = newPassword.length >= 8 && newPassword.length <= 72;
  const hasLetterAndDigit = /[A-Za-z]/.test(newPassword) && /\d/.test(newPassword);
  const isDifferentFromCurrent =
    Boolean(newPassword) && Boolean(currentPassword) && newPassword !== currentPassword;
  const passwordsMatch = Boolean(newPassword) && newPassword === confirmPassword;

  const notEqualToEmailOrName = (() => {
    if (!newPassword) return true;
    const lower = newPassword.toLowerCase();
    if (user?.email && lower === user.email.toLowerCase()) return false;
    if (user?.email && lower === user.email.split('@')[0]?.toLowerCase()) return false;
    if (user?.name && user.name.length >= 3 && lower === user.name.toLowerCase()) return false;
    return true;
  })();

  const isFormValid =
    Boolean(currentPassword.trim()) &&
    isMinLength &&
    hasLetterAndDigit &&
    isDifferentFromCurrent &&
    passwordsMatch &&
    notEqualToEmailOrName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword.trim()) {
      setErrorMessage('Current password is required.');
      return;
    }
    if (!isMinLength || !hasLetterAndDigit || !notEqualToEmailOrName) {
      setErrorMessage(
        'New password does not meet complexity requirements. Please choose a stronger password.',
      );
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMessage('New password must be different from current temporary password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setSuccessMessage('Password changed successfully.');
      setTimeout(() => {
        onPasswordChanged?.();
      }, 1200);
    } catch (err: unknown) {
      const msg =
        (err as Error)?.message ||
        'Failed to update password. Please verify your current temporary password.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'var(--bg-main, #f8fafc)',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '1rem',
          padding: '2.25rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
            <NiramayaLogo size="md" showSubtext={true} />
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginTop: '0.5rem',
              border: '1px solid #fecaca',
            }}
          >
            <ShieldAlert size={14} />
            First Login: Force Password Change Required
          </div>
          <h2
            style={{
              margin: '0.85rem 0 0.25rem',
              fontSize: '1.4rem',
              fontWeight: 800,
              color: 'var(--text-primary, #0f172a)',
            }}
          >
            Set Your Permanent Password
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '0.85rem',
              color: 'var(--text-secondary, #64748b)',
              lineHeight: 1.5,
            }}
          >
            Welcome, <strong>{user?.name || user?.email || 'User'}</strong>. An administrator created your account with a temporary password. For HIPAA compliance and hospital security, you must create a new secure password before accessing clinical or administrative records.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              color: '#991b1b',
              fontSize: '0.82rem',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '0.5rem',
              padding: '0.85rem 1rem',
              marginBottom: '1.25rem',
              color: '#166534',
              fontSize: '0.88rem',
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={20} />
            <div>{successMessage} Redirecting to your dashboard…</div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Current Temporary Password */}
          <div>
            <label
              htmlFor="currentPassword"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                marginBottom: '0.35rem',
              }}
            >
              Current Temporary Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter the temporary password provided by Admin"
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border, #cbd5e1)',
                  background: 'var(--bg-input, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                title={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                marginBottom: '0.35rem',
              }}
            >
              New Secure Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a new permanent password"
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border, #cbd5e1)',
                  background: 'var(--bg-input, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                title={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                marginBottom: '0.35rem',
              }}
            >
              Confirm New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new permanent password"
                style={{
                  width: '100%',
                  padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border, #cbd5e1)',
                  background: 'var(--bg-input, #ffffff)',
                  color: 'var(--text-primary, #0f172a)',
                  fontSize: '0.9rem',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Requirements Checklist */}
          <div
            style={{
              background: 'var(--bg-card-subtle, #f8fafc)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: '0.5rem',
              padding: '0.85rem 1rem',
              fontSize: '0.78rem',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-secondary, #475569)', marginBottom: '0.4rem' }}>
              Password Requirements:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.3rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: isMinLength ? '#16a34a' : 'var(--text-muted, #94a3b8)',
                }}
              >
                {isMinLength ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>At least 8 characters (max 72)</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: hasLetterAndDigit ? '#16a34a' : 'var(--text-muted, #94a3b8)',
                }}
              >
                {hasLetterAndDigit ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>Includes at least one letter and one number</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: isDifferentFromCurrent ? '#16a34a' : 'var(--text-muted, #94a3b8)',
                }}
              >
                {isDifferentFromCurrent ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>Different from current temporary password</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: passwordsMatch ? '#16a34a' : 'var(--text-muted, #94a3b8)',
                }}
              >
                {passwordsMatch ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                <span>New password and confirmation match</span>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.8rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: isFormValid && !loading ? '#0284c7' : '#94a3b8',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: isFormValid && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              boxShadow: isFormValid ? '0 4px 12px rgba(2, 132, 199, 0.3)' : 'none',
            }}
          >
            {loading ? (
              'Securing Account & Updating Password…'
            ) : (
              <>
                <span>Change Password & Proceed to Application</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Sign Out Option */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <LogOut size={14} />
            <span>Sign out and change password later</span>
          </button>
        </div>
      </div>
    </div>
  );
};
