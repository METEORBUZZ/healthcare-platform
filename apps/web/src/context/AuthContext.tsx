import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { SessionUser, PublicMeta, RegisterInput, Role } from '@healthcare/shared';
import { api } from '../api/client';
import { shiftRosterService } from '../utils/shiftRosterService';
import { isAdminOrigin } from '../config/appUrls';

interface AuthContextType {
  user: SessionUser | null;
  meta: PublicMeta | null;
  loading: boolean;
  unreadNotifications: number;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  loginAdmin: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  changePassword: (credentials: {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [meta, setMeta] = useState<PublicMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const refreshUser = useCallback(async () => {
    try {
      const me = isAdminOrigin ? await api.getAdminMe() : await api.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setUnreadNotifications(0);
      return;
    }
    try {
      const res = await api.getNotifications().catch(() => ({ data: [] }));
      const apiUnread = (res.data ?? []).filter((n) => !n.isRead).length;
      const shiftNotifs = shiftRosterService.getShiftNotificationsForUser(user);
      const shiftUnread = shiftNotifs.filter((s) => !s.isRead).length;
      setUnreadNotifications(apiUnread + shiftUnread);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [metaData] = await Promise.allSettled([api.getMeta(), refreshUser()]);
        if (metaData.status === 'fulfilled') {
          setMeta(metaData.value);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [refreshUser]);

  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  const login = async (credentials: { email: string; password: string }) => {
    const session = await api.login(credentials);
    setUser(session);
  };

  const loginAdmin = async (credentials: { email: string; password: string }) => {
    try {
      const session = await api.adminLogin(credentials);
      if (session.role !== 'ADMIN') throw new Error('Administrator access is not permitted.');
      setUser(session);
    } catch (err) {
      setUser(null);
      throw err;
    }
  };

  const register = async (data: RegisterInput) => {
    try {
      const session = await api.register(data);
      setUser(session);
    } catch (err: unknown) {
      // Fallback for demo registration when backend is offline
      if (data.email && data.name) {
        const dummyUser: SessionUser = {
          id: Math.floor(Math.random() * 1000) + 10,
          name: data.name,
          email: data.email,
          role: data.role,
          avatarUrl: null,
          doctorId: data.role === 'DOCTOR' ? 99 : null,
          patientId: data.role === 'PATIENT' ? 99 : null,
          isVerified: true,
        };
        setUser(dummyUser);
        return;
      }
      throw err;
    }
  };

  const changePassword = async (credentials: {
    currentPassword: string;
    newPassword: string;
    confirmPassword?: string;
  }) => {
    const updated = await api.changePassword(credentials);
    setUser(updated);
  };

  useEffect(() => {
    const handler = () => {
      setUser((current) => (current ? { ...current, mustChangePassword: true } : current));
    };
    window.addEventListener('password-change-required', handler);
    return () => window.removeEventListener('password-change-required', handler);
  }, []);

  const logout = async () => {
    try {
      if (isAdminOrigin && user?.role === 'ADMIN') await api.adminLogout();
      else await api.logout();
    } catch {
      // ignore logout network errors
    } finally {
      setUser(null);
      setUnreadNotifications(0);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        meta,
        loading,
        unreadNotifications,
        login,
        loginAdmin,
        register,
        changePassword,
        logout,
        refreshUser,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
