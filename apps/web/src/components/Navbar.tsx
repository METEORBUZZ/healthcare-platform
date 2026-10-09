import React, { useState, useRef, useEffect } from 'react';
import type { Role } from '@healthcare/shared';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Stethoscope,
  LogOut,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LayoutDashboard,
  CheckCircle2,
  Activity,
  Edit3,
  Menu,
  X,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { NiramayaLogo } from './NiramayaLogo';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  darkMode,
  onToggleDarkMode,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { user, logout, unreadNotifications } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const userPortalView = 'dashboard';

  const userPortalLabel =
    user?.role === 'ADMIN'
      ? 'Admin Operations Center'
      : user?.role === 'DOCTOR'
        ? 'Doctor Clinical Dashboard'
        : user?.role === 'NURSE'
          ? 'Nurse Ward Dashboard'
          : user?.role === 'RECEPTIONIST'
            ? 'Reception & Appointments Desk'
            : user?.role === 'PHARMACIST'
              ? 'Pharmacy Dispensing Queue'
              : user?.role === 'LABORATORY_STAFF'
                ? 'Diagnostic Laboratory Queue'
                : 'Hospital Staff Dashboard';

  const isCurrentOnPortal = currentView === 'dashboard';
  const isCurrentOnTracking = currentView === 'tracking';
  const isCurrentOnBlockchain = currentView === 'blockchain';

  const roleColorsMap: Record<Role, { bg: string; gradient: string; accent: string }> = {
    ADMIN: {
      bg: '#7c3aed',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
      accent: '#7c3aed',
    },
    DOCTOR: {
      bg: '#0284c7',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
      accent: '#0284c7',
    },
    NURSE: {
      bg: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
      accent: '#059669',
    },
    RECEPTIONIST: {
      bg: '#d97706',
      gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      accent: '#d97706',
    },
    PHARMACIST: {
      bg: '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      accent: '#2563eb',
    },
    LABORATORY_STAFF: {
      bg: '#db2777',
      gradient: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)',
      accent: '#db2777',
    },
    STAFF: {
      bg: '#4f46e5',
      gradient: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
      accent: '#4f46e5',
    },
    PATIENT: {
      bg: '#0284c7',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
      accent: '#0284c7',
    },
  };
  const roleColors = roleColorsMap[user?.role || 'DOCTOR'];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: 'var(--bg-glass)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Hospital Services Scrolling Ticker */}
      <div
        style={{
          borderBottom: '1px solid rgba(0, 194, 203, 0.18)',
          background:
            'linear-gradient(90deg, rgba(0, 194, 203, 0.07) 0%, rgba(255, 42, 133, 0.05) 100%)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          padding: '0.3rem 0',
        }}
      >
        <div className="services-ticker">
          {[
            '🏥 Hospital Services',
            '🚨 24×7 Emergency Care',
            '🩺 Obstetrics & Gynecology',
            '🤰 Maternity & Pregnancy Care',
            '👶 Normal & Cesarean Delivery',
            '🔬 Infertility / IVF Treatment',
            '💊 PCOS & Fertility Care',
            "❤️ Women's Health Check-ups",
            '🩻 General Physician Consultation',
            '🔍 Diagnostic & Laboratory Services',
            '📡 Ultrasound / Sonography',
            '🌸 Pre & Post-Natal Care',
            '👨‍👩‍👧 Family Planning & Counseling',
            '🏨 Inpatient & Outpatient Care',
            '💉 Pharmacy / Medicine Support',
            '🧪 Health Check-up Packages',
            '🏥 Hospital Services',
            '🚨 24×7 Emergency Care',
            '🩺 Obstetrics & Gynecology',
            '🤰 Maternity & Pregnancy Care',
            '👶 Normal & Cesarean Delivery',
            '🔬 Infertility / IVF Treatment',
            '💊 PCOS & Fertility Care',
            "❤️ Women's Health Check-ups",
            '🩻 General Physician Consultation',
            '🔍 Diagnostic & Laboratory Services',
            '📡 Ultrasound / Sonography',
            '🌸 Pre & Post-Natal Care',
            '👨‍👩‍👧 Family Planning & Counseling',
            '🏨 Inpatient & Outpatient Care',
            '💉 Pharmacy / Medicine Support',
            '🧪 Health Check-up Packages',
          ].map((service, i) => (
            <span key={i} className="services-ticker-item">
              {service}
              <span className="services-ticker-dot">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Navbar */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        className="navbar-inner"
      >
        {/* Brand */}
        <div
          className="navbar-brand"
          onClick={() => onNavigate('dashboard')}
          title="Niramaya Hospital - Console"
          style={{
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <NiramayaLogo size="md" showSubtext={true} />
        </div>

        {/* Navigation items - sidebar handles all navigation for logged-in users */}
        <nav
          className="desktop-nav"
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
        >
          {!user && (
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Lock size={14} color="#ef4444" />
              <span>Restricted Healthcare Network · Authorized Medical Personnel Only</span>
            </div>
          )}
        </nav>

        {/* Right side controls */}
        <div
          className="navbar-actions"
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
        >
          {/* Dark mode toggle */}
          <button
            className="navbar-theme-toggle"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.5rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {user ? (
            <>
              {/* Notification icon */}
              <button
                onClick={onOpenNotifications}
                title="Notifications"
                aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
                style={{
                  position: 'relative',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={17} />
                {unreadNotifications > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--danger)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* User profile button - directly navigates to profile, no dropdown menu */}
              <div className="navbar-profile-control">
                <button
                  type="button"
                  className="navbar-profile-portal-button"
                  aria-label="View Profile"
                  onClick={() => onNavigate('profile')}
                  title="View Profile Section"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.35rem 0.75rem 0.35rem 0.45rem',
                    background: currentView === 'profile'
                      ? 'var(--primary-light)'
                      : 'var(--bg-card-subtle)',
                    borderRadius: 'var(--radius-full)',
                    border: currentView === 'profile'
                      ? '1.5px solid var(--primary)'
                      : '1px solid var(--border)',
                    boxShadow: currentView === 'profile' ? '0 0 0 2px rgba(2, 132, 199, 0.15)' : 'none',
                    userSelect: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      background: roleColors.gradient,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div
                    className="user-badge-text"
                    style={{ textAlign: 'left', lineHeight: 1.15 }}
                  >
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: currentView === 'profile' ? 'var(--primary)' : 'var(--text-primary)',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.67rem',
                        fontWeight: 600,
                        color: currentView === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {user.role}
                    </div>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <button onClick={onOpenAuth} className="btn btn-primary btn-sm desktop-auth-button">
              <User size={15} />
              Sign In
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="mobile-nav-toggle btn btn-secondary btn-sm"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            style={{
              padding: '0.45rem',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="navigation" aria-label="Mobile Navigation">
          {/* Navigation handled by sidebar - mobile drawer shows account actions only */}

          {user ? (
            <>
              <button
                type="button"
                className="mobile-nav-item"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile();
                }}
              >
                <Edit3 size={18} />
                <span>Edit Profile &amp; Photo</span>
              </button>

              <button
                type="button"
                className="mobile-nav-item"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                style={{ color: 'var(--danger)' }}
              >
                <LogOut size={18} />
                <span>Sign Out ({user.name})</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="mobile-nav-item"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth();
              }}
              style={{ color: 'var(--primary)' }}
            >
              <User size={18} />
              <span>Hospital Sign In</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
