import React, { useEffect, useState } from 'react';
import type { NotificationDto, Role } from '@healthcare/shared';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { X, Bell, Check, CheckCheck, Calendar, Shield, Info, Moon, Sun } from 'lucide-react';
import { shiftRosterService } from '../utils/shiftRosterService';

interface NotificationsModalProps {
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ onClose }) => {
  const { user, refreshNotifications } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.getNotifications().catch(() => ({ data: [] }));
      const shiftNotifs: NotificationDto[] = shiftRosterService
        .getShiftNotificationsForUser(user)
        .map((s) => ({
          id: s.id,
          title: s.title,
          message: s.message,
          type: 'SYSTEM' as const,
          isRead: s.isRead,
          createdAt: s.createdAt,
        }));

      // Combine shift notifications with standard API notifications
      const combined = [...shiftNotifs, ...(res.data || [])];
      setNotifications(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id).catch(() => {});
      shiftRosterService.markShiftNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      refreshNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await api.markAllNotificationsAsRead().catch(() => {});
      shiftRosterService.markAllShiftNotificationsRead(user);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const roleBadgeColorMap: Record<Role, string> = {
    ADMIN: '#7c3aed',
    DOCTOR: '#0284c7',
    NURSE: '#059669',
    RECEPTIONIST: '#d97706',
    PHARMACIST: '#2563eb',
    LABORATORY_STAFF: '#db2777',
    STAFF: '#4f46e5',
    PATIENT: '#0284c7',
  };
  const roleBadgeColor = roleBadgeColorMap[user?.role || 'DOCTOR'];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notifications-modal-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', borderRadius: 'var(--radius-lg)' }}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 id="notifications-modal-title" style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  Notifications
                </h3>
                {user && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: `${roleBadgeColor}18`,
                      color: roleBadgeColor,
                      border: `1px solid ${roleBadgeColor}40`,
                    }}
                  >
                    {user.role}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {user?.name} · {unreadCount} unread
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--primary)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close notifications modal"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '0.3rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0.6rem 1rem 0.2rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <button
            onClick={() => setFilter('all')}
            style={{
              background: filter === 'all' ? 'var(--primary-light)' : 'transparent',
              color: filter === 'all' ? 'var(--primary)' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            style={{
              background: filter === 'unread' ? 'var(--primary-light)' : 'transparent',
              color: filter === 'unread' ? 'var(--primary)' : 'var(--text-secondary)',
              border: 'none',
              padding: '0.3rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div
          className="modal-body"
          style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem' }}
        >
          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <Bell size={36} style={{ opacity: 0.25, marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {filter === 'unread'
                  ? 'All caught up! Check back later.'
                  : `Notifications for your ${user?.role.toLowerCase()} account will appear here.`}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredNotifications.map((n) => {
                const isAppointment = n.type === 'APPOINTMENT';
                const isShift = n.title.includes('Duty') || n.title.includes('Shift') || n.message.includes('shift');
                const isNight = n.title.includes('Night') || n.message.includes('Night');
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '0.75rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      background: n.isRead ? 'var(--bg-card)' : 'var(--primary-light)',
                      border: n.isRead
                        ? '1px solid var(--border)'
                        : '1px solid var(--primary-border, var(--primary))',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      transition: 'background 0.2s',
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isShift
                          ? isNight
                            ? 'rgba(99, 102, 241, 0.15)'
                            : 'rgba(2, 132, 199, 0.15)'
                          : isAppointment
                          ? 'rgba(2, 132, 199, 0.12)'
                          : 'rgba(124, 58, 237, 0.12)',
                        color: isShift
                          ? isNight
                            ? '#6366f1'
                            : '#0284c7'
                          : isAppointment
                          ? '#0284c7'
                          : '#7c3aed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {isShift ? (
                        isNight ? <Moon size={16} /> : <Sun size={16} />
                      ) : isAppointment ? (
                        <Calendar size={16} />
                      ) : user?.role === 'ADMIN' ? (
                        <Shield size={16} />
                      ) : (
                        <Info size={16} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          marginBottom: '0.2rem',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {n.title}
                        </div>
                        {!n.isRead && (
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary)',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {n.message}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.35rem',
                        }}
                      >
                        {new Date(n.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        title="Mark as read"
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          color: 'var(--primary)',
                          padding: '0.3rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
