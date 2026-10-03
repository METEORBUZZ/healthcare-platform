import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BellRing,
  Moon,
  Sun,
  X,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  shiftRosterService,
  type ShiftNotification,
} from '../utils/shiftRosterService';

interface DeviceNotificationBannerProps {
  onOpenPortalTab?: (tab: 'CONSULTATIONS' | 'ANALYTICS' | 'DOCTORS' | 'USERS' | 'SHIFTS') => void;
}

export const DeviceNotificationBanner: React.FC<DeviceNotificationBannerProps> = ({
  onOpenPortalTab,
}) => {
  const { user } = useAuth();
  const [activeAlert, setActiveAlert] = useState<ShiftNotification | null>(null);

  // Listen for real-time shift notifications broadcasted across the window
  useEffect(() => {
    const handleShiftNotification = (e: Event) => {
      const customEvent = e as CustomEvent<ShiftNotification>;
      const notif = customEvent.detail;
      if (!notif) return;

      // If user is the recipient or admin who assigned it, show alert
      const userEmail = (user?.email || '').toLowerCase().trim();
      const userName = (user?.name || '').toLowerCase().trim();
      const isRecipient =
        notif.recipientEmail === userEmail ||
        notif.recipientName.toLowerCase().includes(userName) ||
        userName.includes(notif.recipientName.toLowerCase());

      if (isRecipient || user?.role === 'ADMIN') {
        setActiveAlert(notif);
      }
    };

    window.addEventListener('niramaya:device-notification', handleShiftNotification);
    return () => {
      window.removeEventListener('niramaya:device-notification', handleShiftNotification);
    };
  }, [user]);

  // On initial login as doctor or staff, check if there's a recent unread shift notification
  useEffect(() => {
    if (!user || user.role === 'PATIENT') return;

    const notifs = shiftRosterService.getShiftNotificationsForUser(user);
    const unread = notifs.find((n) => !n.isRead);
    if (unread) {
      setActiveAlert(unread);
    }
  }, [user]);

  if (!activeAlert) return null;

  const isNight = activeAlert.shiftType.includes('Night');

  const handleDismiss = () => {
    shiftRosterService.markShiftNotificationRead(activeAlert.id);
    setActiveAlert(null);
  };

  const handleViewSchedule = () => {
    shiftRosterService.markShiftNotificationRead(activeAlert.id);
    setActiveAlert(null);
    if (onOpenPortalTab) {
      onOpenPortalTab('SHIFTS');
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: '75px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '430px',
        width: 'calc(100% - 40px)',
        background: isNight
          ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
          : 'linear-gradient(135deg, #0f172a 0%, #0369a1 100%)',
        color: '#ffffff',
        borderRadius: '20px',
        border: isNight
          ? '1.5px solid rgba(165, 180, 252, 0.4)'
          : '1.5px solid rgba(56, 189, 248, 0.4)',
        boxShadow: isNight
          ? '0 20px 45px -10px rgba(79, 70, 229, 0.5), 0 0 0 1px rgba(255,255,255,0.1)'
          : '0 20px 45px -10px rgba(2, 132, 199, 0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        padding: '1.1rem 1.25rem',
        animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top Banner Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.65rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: isNight ? 'rgba(238, 242, 255, 0.18)' : 'rgba(224, 242, 254, 0.2)',
              color: isNight ? '#c7d2fe' : '#bae6fd',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <BellRing size={12} className="animate-pulse" />
            OFFICIAL DEVICE ALERT · HOSPITAL ADMIN
          </span>
        </div>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss alert"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Main Alert Body */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: isNight
              ? 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}
        >
          {isNight ? <Moon size={22} /> : <Sun size={22} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.98rem',
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: '0.25rem',
            }}
          >
            Duty Shift Scheduled: {activeAlert.shiftType}
          </div>

          <div
            style={{
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.88)',
              lineHeight: 1.45,
              marginBottom: '0.5rem',
            }}
          >
            Hi <strong>{activeAlert.recipientName}</strong>, Hospital Administration has rostered your duty schedule:
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '0.5rem 0.75rem',
              fontSize: '0.78rem',
              marginBottom: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={13} style={{ opacity: 0.8 }} />
              <span>
                <strong>Hours:</strong> {activeAlert.shiftHours}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={13} style={{ opacity: 0.8 }} />
              <span>
                <strong>Duty Days:</strong> {activeAlert.dutyDays}
              </span>
            </div>
            {activeAlert.reportingStation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={13} style={{ opacity: 0.8 }} />
                <span>
                  <strong>Station:</strong> {activeAlert.reportingStation}
                </span>
              </div>
            )}
          </div>

          {/* Alert Actions */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleViewSchedule}
              style={{
                flex: 1,
                padding: '0.45rem 0.8rem',
                borderRadius: '9px',
                border: 'none',
                background: '#ffffff',
                color: isNight ? '#312e81' : '#0369a1',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <span>View Shift Hub</span>
            </button>
            <button
              onClick={handleDismiss}
              style={{
                padding: '0.45rem 0.8rem',
                borderRadius: '9px',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                background: 'transparent',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <CheckCircle2 size={13} />
              <span>Acknowledge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
