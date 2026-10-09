import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutGrid,
  Calendar,
  Users,
  Clock,
  UserCheck,
  Building2,
  Package,
  Settings,
  HelpCircle,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

export interface HospitalSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenProfile: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'staff-schedule', label: 'Staff schedule', icon: Clock },
  { id: 'doctors', label: 'Doctors', icon: UserCheck },
  { id: 'departments', label: 'Departments', icon: Building2 },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'blockchain', label: 'Blockchain ledger', icon: ShieldCheck },
];

const BOTTOM_ITEMS = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help-center', label: 'Help Center', icon: HelpCircle },
  { id: 'logout', label: 'Log out', icon: LogOut, isAction: true },
];

// ─── Shared Sidebar Content ────────────────────────────────────────────────
interface SidebarContentProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onClose?: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ currentView, onNavigate, onClose }) => {
  const { user, logout } = useAuth();

  const handleItemClick = (id: string, isAction?: boolean) => {
    if (isAction && id === 'logout') {
      logout();
    } else {
      onNavigate(id);
    }
    onClose?.();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '1.25rem 1rem',
        boxSizing: 'border-box',
      }}
    >
      {/* ─── Profile Card ─── */}
      <div
        onClick={() => { onNavigate('profile'); onClose?.(); }}
        title="View Profile"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.75rem 0.85rem',
          marginBottom: '1.5rem',
          borderRadius: '12px',
          background: currentView === 'profile'
            ? 'rgba(0, 59, 115, 0.08)'
            : 'var(--bg-card-subtle, #f8fafc)',
          border: currentView === 'profile'
            ? '1.5px solid #003b73'
            : '1px solid var(--border, #e2e8f0)',
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          userSelect: 'none',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#003b73',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.05rem',
              overflow: 'hidden',
              boxShadow: '0 2px 6px rgba(0, 59, 115, 0.2)',
            }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <span
            style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid var(--bg-card, #ffffff)',
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-primary, #0f172a)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.name || 'Authorized User'}
          </div>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '0.1rem 0.45rem',
              borderRadius: '6px',
              background: '#e0f2fe',
              color: '#0369a1',
              display: 'inline-block',
              marginTop: '0.18rem',
            }}
          >
            {user?.role || 'CLINICIAN'}
          </span>
        </div>
        <ChevronRight size={16} color="var(--text-muted, #94a3b8)" />
      </div>

      {/* ─── Main Nav ─── */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                width: '100%',
                padding: '0.65rem 0.95rem',
                borderRadius: '9px',
                border: 'none',
                background: isActive ? '#003b73' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary, #52606d)',
                fontSize: '0.94rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease, color 0.15s ease',
                boxShadow: isActive ? '0 4px 12px rgba(0, 59, 115, 0.28)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-card-subtle, #f1f5f9)';
                  e.currentTarget.style.color = 'var(--text-primary, #0f172a)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary, #52606d)';
                }
              }}
            >
              <Icon
                size={18}
                color={isActive ? '#ffffff' : 'var(--text-secondary, #6b7a90)'}
                strokeWidth={isActive ? 2.3 : 1.9}
              />
              <span style={{ letterSpacing: '0.01em' }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ─── Bottom Items ─── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
          paddingTop: '1.25rem',
          marginTop: 'auto',
          borderTop: '1px solid var(--border, #f1f5f9)',
        }}
      >
        {BOTTOM_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isLogout = item.id === 'logout';
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id, item.isAction)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                width: '100%',
                padding: '0.62rem 0.95rem',
                borderRadius: '9px',
                border: 'none',
                background: isActive ? '#003b73' : 'transparent',
                color: isActive ? '#ffffff' : isLogout ? '#ef4444' : 'var(--text-secondary, #52606d)',
                fontSize: '0.94rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease, color 0.15s ease',
                boxShadow: isActive ? '0 4px 12px rgba(0, 59, 115, 0.28)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = isLogout
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'var(--bg-card-subtle, #f1f5f9)';
                  if (!isLogout) e.currentTarget.style.color = 'var(--text-primary, #0f172a)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = isLogout ? '#ef4444' : 'var(--text-secondary, #52606d)';
                }
              }}
            >
              <Icon
                size={18}
                color={isActive ? '#ffffff' : isLogout ? '#ef4444' : 'var(--text-secondary, #6b7a90)'}
                strokeWidth={isActive ? 2.3 : 1.9}
              />
              <span style={{ letterSpacing: '0.01em' }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Responsive Sidebar Wrapper ────────────────────────────────────────────
export const HospitalSidebar: React.FC<HospitalSidebarProps> = ({
  currentView,
  onNavigate,
  onOpenProfile,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [currentView]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      {/* ─── Inject responsive styles ─── */}
      <style>{`
        .hospital-sidebar-desktop {
          width: 260px;
          min-width: 260px;
          height: 100%;
          min-height: calc(100vh - 70px);
          background: var(--bg-card, #ffffff);
          border-right: 1px solid var(--border, #e2e8f0);
          position: sticky;
          top: 70px;
          align-self: flex-start;
          max-height: calc(100vh - 70px);
          overflow-y: auto;
          overflow-x: hidden;
          flex-shrink: 0;
        }

        .hospital-sidebar-mobile-toggle {
          display: none;
        }

        .hospital-sidebar-backdrop {
          display: none;
        }

        .hospital-sidebar-drawer {
          display: none;
        }

        @media (max-width: 768px) {
          .hospital-sidebar-desktop {
            display: none !important;
          }

          .hospital-sidebar-mobile-toggle {
            display: flex;
            position: fixed;
            bottom: 1.25rem;
            left: 1.25rem;
            z-index: 1200;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: #003b73;
            color: #ffffff;
            border: none;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 59, 115, 0.45);
            transition: transform 0.2s ease, background 0.2s ease;
          }

          .hospital-sidebar-mobile-toggle:active {
            transform: scale(0.93);
          }

          .hospital-sidebar-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 1299;
            background: rgba(0, 0, 0, 0.45);
            backdrop-filter: blur(3px);
            animation: sidebarFadeIn 0.2s ease;
          }

          .hospital-sidebar-drawer {
            display: flex;
            flex-direction: column;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 1300;
            width: min(82vw, 300px);
            background: var(--bg-card, #ffffff);
            border-right: 1px solid var(--border, #e2e8f0);
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
            overflow-y: auto;
            overflow-x: hidden;
            animation: sidebarSlideIn 0.22s cubic-bezier(0.22, 1, 0.36, 1);
          }

          @keyframes sidebarFadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }

          @keyframes sidebarSlideIn {
            from { transform: translateX(-100%); }
            to   { transform: translateX(0); }
          }
        }
      `}</style>

      {/* ─── Desktop Sidebar ─── */}
      <aside className="hospital-sidebar-desktop">
        <SidebarContent
          currentView={currentView}
          onNavigate={onNavigate}
        />
      </aside>

      {/* ─── Mobile: FAB Toggle Button ─── */}
      <button
        className="hospital-sidebar-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu size={24} />
      </button>

      {/* ─── Mobile: Backdrop ─── */}
      {mobileOpen && (
        <div
          className="hospital-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* ─── Mobile: Slide-out Drawer ─── */}
      {mobileOpen && (
        <aside className="hospital-sidebar-drawer" aria-label="Hospital Navigation">
          {/* Drawer header with close button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1rem 0.5rem',
              borderBottom: '1px solid var(--border, #e2e8f0)',
            }}
          >
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#003b73', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Navigation Menu
            </span>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--bg-card-subtle, #f1f5f9)',
                color: 'var(--text-secondary, #64748b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <SidebarContent
              currentView={currentView}
              onNavigate={onNavigate}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </aside>
      )}
    </>
  );
};
