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
  const { user, logout, unreadNotifications, quickLogin } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileMenuOpen(false);
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

  const handleCardClick = () => {
    onNavigate(userPortalView);
    setProfileMenuOpen(false);
  };

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

        {/* Navigation items */}
        <nav
          className="desktop-nav"
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
        >
          {user ? (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                style={{
                  background: isCurrentOnPortal ? 'var(--primary-light)' : 'transparent',
                  color: isCurrentOnPortal ? 'var(--primary)' : 'var(--text-secondary)',
                  border: isCurrentOnPortal
                    ? '1px solid rgba(2, 132, 199, 0.25)'
                    : '1px solid transparent',
                  padding: '0.5rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <LayoutDashboard size={16} />
                <span>{userPortalLabel}</span>
              </button>

              <button
                onClick={() => onNavigate('tracking')}
                title="Inpatient Vitals & Telemetry Tracking"
                style={{
                  background: isCurrentOnTracking ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  color: isCurrentOnTracking ? '#ef4444' : 'var(--text-secondary)',
                  border: isCurrentOnTracking
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : '1px solid transparent',
                  padding: '0.5rem 0.95rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Activity size={16} color={isCurrentOnTracking ? '#ef4444' : 'var(--primary)'} />
                <span>Health Telemetry</span>
              </button>
            </>
          ) : (
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

              {/* User badge card & dropdown container */}
              <div className="navbar-profile-control" ref={menuRef}>
                <div
                  className="navbar-profile-trigger"
                  title={`Open ${userPortalLabel}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: isCurrentOnPortal
                      ? 'var(--primary-light)'
                      : 'var(--bg-card-subtle)',
                    borderRadius: 'var(--radius-full)',
                    border: isCurrentOnPortal
                      ? '1.5px solid var(--primary)'
                      : '1px solid var(--border)',
                    boxShadow: isCurrentOnPortal ? '0 0 0 2px rgba(2, 132, 199, 0.15)' : 'none',
                    userSelect: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {/* Left Clickable Area (Navigates directly to user's portal) */}
                  <button
                    type="button"
                    className="navbar-profile-portal-button"
                    aria-label={`Open ${userPortalLabel}`}
                    onClick={handleCardClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.35rem 0.5rem 0.35rem 0.65rem',
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
                          color: isCurrentOnPortal ? 'var(--primary)' : 'var(--text-primary)',
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
                          color: isCurrentOnPortal ? 'var(--primary)' : 'var(--text-muted)',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {user.role}
                      </div>
                    </div>
                  </button>

                  {/* Right Chevron Button (Toggles profile menu) */}
                  <button
                    type="button"
                    className="navbar-profile-menu-toggle"
                    aria-label={profileMenuOpen ? 'Close profile menu' : 'Open profile menu'}
                    aria-expanded={profileMenuOpen}
                    aria-controls="navbar-profile-menu"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileMenuOpen((prev) => !prev);
                    }}
                    title="Profile menu"
                    style={{
                      padding: '0.35rem 0.55rem 0.35rem 0.2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      borderLeft: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    <ChevronDown
                      size={14}
                      style={{
                        transform: profileMenuOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {profileMenuOpen && (
                  <div
                    id="navbar-profile-menu"
                    className="navbar-profile-menu"
                    role="region"
                    aria-label="Profile and account menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: 'min(360px, calc(100vw - 1.5rem))',
                      maxHeight: 'min(75vh, 600px)',
                      overflowY: 'auto',
                      overscrollBehavior: 'contain',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '0.5rem',
                      zIndex: 100,
                      animation: 'slideUp 0.18s ease-out',
                    }}
                  >
                    {/* Header info with Avatar */}
                    <div
                      className="navbar-profile-menu-header"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.6rem 0.75rem',
                        borderBottom: '1px solid var(--border)',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <div
                        className="navbar-profile-menu-avatar"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: roleColors.gradient,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 800,
                          overflow: 'hidden',
                          flexShrink: 0,
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.88rem',
                            fontWeight: 800,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {user.name}
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginTop: '1px',
                          }}
                        >
                          {user.email}
                        </div>
                        <div style={{ marginTop: '0.35rem' }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '0.12rem 0.45rem',
                              borderRadius: '999px',
                              background: `${roleColors.accent}18`,
                              color: roleColors.accent,
                              border: `1px solid ${roleColors.accent}40`,
                            }}
                          >
                            {user.role} ACCOUNT
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Edit Profile & Photo Button */}
                    <button
                      className="navbar-profile-menu-featured"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenProfile();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(2, 132, 199, 0.08)',
                        color: 'var(--primary)',
                        border: '1px dashed var(--primary)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <Edit3 size={15} />
                      <span>Edit Profile & Photo</span>
                    </button>

                    {/* Portal Link */}
                    <button
                      className={`navbar-profile-menu-link ${isCurrentOnPortal ? 'is-active' : ''}`}
                      aria-current={isCurrentOnPortal ? 'page' : undefined}
                      onClick={handleCardClick}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isCurrentOnPortal ? 'var(--primary-light)' : 'transparent',
                        color: isCurrentOnPortal ? 'var(--primary)' : 'var(--text-primary)',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <LayoutDashboard size={15} color="var(--primary)" />
                        <span>{userPortalLabel}</span>
                      </div>
                      {isCurrentOnPortal && <CheckCircle2 size={14} color="var(--primary)" />}
                    </button>

                    {/* Health Tracking Panel Link */}
                    <button
                      className={`navbar-profile-menu-link ${isCurrentOnTracking ? 'is-active is-tracking' : ''}`}
                      aria-current={isCurrentOnTracking ? 'page' : undefined}
                      onClick={() => {
                        onNavigate('tracking');
                        setProfileMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isCurrentOnTracking ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                        color: isCurrentOnTracking ? '#ef4444' : 'var(--text-primary)',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={15} color="#ef4444" />
                        <span>Health Tracking Panel</span>
                      </div>
                      {isCurrentOnTracking && <CheckCircle2 size={14} color="#ef4444" />}
                    </button>

                    {/* Directory Link */}
                    <button
                      className="navbar-profile-menu-link"
                      onClick={() => {
                        onNavigate('directory');
                        setProfileMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Stethoscope size={15} color="var(--text-secondary)" />
                      <span>Find Doctors</span>
                    </button>

                    {/* Notifications Link */}
                    <button
                      className="navbar-profile-menu-link"
                      onClick={() => {
                        onOpenNotifications();
                        setProfileMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={15} color="var(--text-secondary)" />
                        <span>Notifications</span>
                      </div>
                      {unreadNotifications > 0 && (
                        <span
                          style={{
                            background: 'var(--danger)',
                            color: 'white',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '999px',
                          }}
                        >
                          {unreadNotifications}
                        </span>
                      )}
                    </button>

                    <div className="navbar-profile-menu-divider" />

                    {/* Switch Station */}
                    <div className="navbar-role-section">
                      <div className="navbar-role-section-title">Switch Station</div>
                      <div className="navbar-role-switcher">
                        {(
                          [
                            {
                              role: 'DOCTOR' as Role,
                              label: 'Doctor',
                              emoji: '🩺',
                              color: '#0284c7',
                            },
                            {
                              role: 'NURSE' as Role,
                              label: 'Nurse',
                              emoji: '👩‍⚕️',
                              color: '#059669',
                            },
                            {
                              role: 'RECEPTIONIST' as Role,
                              label: 'Reception',
                              emoji: '📋',
                              color: '#d97706',
                            },
                            {
                              role: 'PHARMACIST' as Role,
                              label: 'Pharmacy',
                              emoji: '💊',
                              color: '#2563eb',
                            },
                            {
                              role: 'LABORATORY_STAFF' as Role,
                              label: 'Lab',
                              emoji: '🔬',
                              color: '#db2777',
                            },
                          ] as { role: Role; label: string; emoji: string; color: string }[]
                        ).map(({ role, label, emoji, color }) => {
                          const isActive = user.role === role;
                          return (
                            <button
                              key={role}
                              className={`navbar-role-chip ${isActive ? 'is-active' : ''}`}
                              aria-pressed={isActive}
                              onClick={() => {
                                setProfileMenuOpen(false);
                                quickLogin(role);
                                onNavigate('dashboard');
                              }}
                              title={`Switch to ${label} station`}
                              style={{
                                padding: '0.28rem 0.6rem',
                                borderRadius: '999px',
                                fontSize: '0.73rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: isActive
                                  ? `1.5px solid ${color}`
                                  : '1.5px solid transparent',
                                background: isActive ? `${color}18` : 'var(--bg-card-subtle)',
                                color: isActive ? color : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                transition: 'all 0.15s ease',
                                outline: 'none',
                              }}
                            >
                              <span>{emoji}</span>
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="navbar-profile-menu-divider" />

                    {/* Logout */}
                    <button
                      className="navbar-profile-signout"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'transparent',
                        color: 'var(--danger)',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
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
          <button
            type="button"
            className={`mobile-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              onNavigate('dashboard');
              setMobileMenuOpen(false);
            }}
          >
            <LayoutDashboard size={18} color="var(--primary)" />
            <span>{user ? userPortalLabel : 'Hospital Management Portal'}</span>
          </button>

          {user && (
            <button
              type="button"
              className={`mobile-nav-item ${currentView === 'tracking' ? 'active' : ''}`}
              onClick={() => {
                onNavigate('tracking');
                setMobileMenuOpen(false);
              }}
            >
              <Activity size={18} color="#ef4444" />
              <span>Inpatient Health Telemetry</span>
            </button>
          )}

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

              {/* Switch Station (mobile) */}
              <div style={{ padding: '0.5rem 1rem' }}>
                <div
                  style={{
                    fontSize: '0.67rem',
                    fontWeight: 800,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: '0.5rem',
                  }}
                >
                  Switch Station
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {(
                    [
                      { role: 'DOCTOR' as Role, label: 'Doctor', emoji: '🩺', color: '#0284c7' },
                      { role: 'NURSE' as Role, label: 'Nurse', emoji: '👩‍⚕️', color: '#059669' },
                      {
                        role: 'RECEPTIONIST' as Role,
                        label: 'Reception',
                        emoji: '📋',
                        color: '#d97706',
                      },
                      {
                        role: 'PHARMACIST' as Role,
                        label: 'Pharmacy',
                        emoji: '💊',
                        color: '#2563eb',
                      },
                      {
                        role: 'LABORATORY_STAFF' as Role,
                        label: 'Lab',
                        emoji: '🔬',
                        color: '#db2777',
                      },
                    ] as { role: Role; label: string; emoji: string; color: string }[]
                  ).map(({ role, label, emoji, color }) => {
                    const isActive = user.role === role;
                    return (
                      <button
                        key={role}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          quickLogin(role);
                          onNavigate('dashboard');
                        }}
                        style={{
                          padding: '0.32rem 0.65rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isActive ? `1.5px solid ${color}` : '1.5px solid var(--border)',
                          background: isActive ? `${color}18` : 'var(--bg-card-subtle)',
                          color: isActive ? color : 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          outline: 'none',
                        }}
                      >
                        <span>{emoji}</span>
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

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
