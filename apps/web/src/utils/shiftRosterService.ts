import type { SessionUser } from '@healthcare/shared';

export interface DutyShiftRecord {
  id: string; // unique identifier
  personId: number; // doctorId, userId, or staffId
  personName: string;
  role: 'DOCTOR' | 'STAFF';
  department: string;
  email: string;
  shiftType: 'Day Shift' | 'Night Shift' | 'Evening Shift' | '24x7 Emergency Rotation';
  shiftHours: string;
  dutyDays: string;
  reportingStation: string;
  dutyNotes: string;
  assignedByAdmin: string;
  assignedAt: string;
}

export interface ShiftNotification {
  id: number;
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  shiftType: string;
  shiftHours: string;
  dutyDays: string;
  reportingStation: string;
  dutyNotes: string;
  isRead: boolean;
  createdAt: string;
  assignedBy: string;
}

const STORAGE_KEY_ROSTER = 'niramaya_duty_shift_roster_v2';
const STORAGE_KEY_NOTIFS = 'niramaya_shift_notifications_v2';

const INITIAL_ROSTER: DutyShiftRecord[] = [
  {
    id: 'doc-1',
    personId: 4,
    personName: 'Dr. Priya Sharma',
    role: 'DOCTOR',
    department: 'Cardiologist',
    email: 'doctor@demo.test',
    shiftType: 'Day Shift',
    shiftHours: '08:00 AM - 04:30 PM',
    dutyDays: 'Mon, Tue, Wed, Thu, Fri',
    reportingStation: 'Cardiac Care Unit (CCU) & OPD Room 102',
    dutyNotes: 'Attending consultant rounds at 08:30 AM. Outpatient ECG & 2D Echo review.',
    assignedByAdmin: 'System Administrator',
    assignedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'doc-2',
    personId: 2,
    personName: 'Dr. Rajesh Patel',
    role: 'DOCTOR',
    department: 'General Physician',
    email: 'rajesh@demo.test',
    shiftType: 'Day Shift',
    shiftHours: '09:00 AM - 05:00 PM',
    dutyDays: 'Mon to Sat',
    reportingStation: 'General Medicine OPD Clinic 3',
    dutyNotes: 'Primary OPD triage and chronic disease routine reviews.',
    assignedByAdmin: 'System Administrator',
    assignedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'doc-3',
    personId: 3,
    personName: 'Dr. Amit Singh',
    role: 'DOCTOR',
    department: 'Orthopedic',
    email: 'amit@demo.test',
    shiftType: 'Day Shift',
    shiftHours: '08:30 AM - 04:30 PM',
    dutyDays: 'Mon, Wed, Fri (OT Days)',
    reportingStation: 'Orthopedic OT & Joint Replacement Wing',
    dutyNotes: 'Scheduled joint arthroplasty procedures from 09:00 AM.',
    assignedByAdmin: 'System Administrator',
    assignedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'doc-4',
    personId: 108,
    personName: 'Dr. Sunita Deshmukh',
    role: 'DOCTOR',
    department: 'Emergency Care',
    email: 'sunita.deshmukh@niramaya.health',
    shiftType: 'Night Shift',
    shiftHours: '08:00 PM - 08:00 AM',
    dutyDays: 'Mon, Tue, Thu, Sun',
    reportingStation: 'Nocturnal Trauma & Emergency Casualty Desk',
    dutyNotes: 'In charge of acute nocturnal admissions and emergency code team.',
    assignedByAdmin: 'System Administrator',
    assignedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'staff-101',
    personId: 101,
    personName: 'Sister Anjali Nair',
    role: 'STAFF',
    department: 'Critical Care & Nursing',
    email: 'anjali.nair@niramaya.health',
    shiftType: 'Day Shift',
    shiftHours: '07:00 AM - 03:30 PM',
    dutyDays: 'Mon, Tue, Wed, Thu, Fri',
    reportingStation: 'Intensive Care Unit (ICU) Floor 2',
    dutyNotes: 'ICU ventilator rounds and post-surgical patient monitoring.',
    assignedByAdmin: 'System Administrator',
    assignedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'staff-102',
    personId: 102,
    personName: 'Vikramaditya Rathore',
    role: 'STAFF',
    department: 'Diagnostics & Pathology',
    email: 'vikram.rathore@niramaya.health',
    shiftType: 'Night Shift',
    shiftHours: '08:00 PM - 08:00 AM',
    dutyDays: 'Mon, Wed, Fri, Sat (Night Roster)',
    reportingStation: '24×7 Diagnostic Pathology & Blood Bank Desk',
    dutyNotes: 'Emergency cross-match blood bank and stat troponin/hematology panels.',
    assignedByAdmin: 'System Administrator',
    assignedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'staff-103',
    personId: 103,
    personName: 'Pooja Sundaram',
    role: 'STAFF',
    department: 'Pharmacy Services',
    email: 'pooja.sundaram@niramaya.health',
    shiftType: 'Day Shift',
    shiftHours: '09:00 AM - 06:00 PM',
    dutyDays: 'Mon to Sat',
    reportingStation: 'Central Inpatient Hospital Pharmacy',
    dutyNotes: 'Formulary dispensing and ICU sterile IV preparation.',
    assignedByAdmin: 'System Administrator',
    assignedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'staff-104',
    personId: 104,
    personName: 'Rajeshwari Kulkarni',
    role: 'STAFF',
    department: 'Emergency Care',
    email: 'rajeshwari.k@niramaya.health',
    shiftType: 'Night Shift',
    shiftHours: '08:00 PM - 08:00 AM',
    dutyDays: 'Tue, Thu, Sat, Sun (Emergency Roster)',
    reportingStation: 'Ground Floor Emergency Triage Desk',
    dutyNotes: 'Rapid triage assessment and emergency cardiac life support desk.',
    assignedByAdmin: 'System Administrator',
    assignedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'staff-105',
    personId: 105,
    personName: 'Manish Verma',
    role: 'STAFF',
    department: 'Radiology & Imaging',
    email: 'manish.verma@niramaya.health',
    shiftType: 'Evening Shift',
    shiftHours: '03:00 PM - 11:30 PM',
    dutyDays: 'Mon, Tue, Wed, Thu, Fri',
    reportingStation: '3T MRI & 128-Slice CT Imaging Suite',
    dutyNotes: 'Stat emergency neuro CT and cross-sectional diagnostic imaging.',
    assignedByAdmin: 'System Administrator',
    assignedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'staff-107',
    personId: 107,
    personName: 'Deepak Nambiar',
    role: 'STAFF',
    department: 'Critical Care & Nursing',
    email: 'deepak.nambiar@niramaya.health',
    shiftType: 'Night Shift',
    shiftHours: '08:00 PM - 08:00 AM',
    dutyDays: 'Wed, Thu, Fri, Sat',
    reportingStation: 'Cardiac Surgery ICU Bed 1-6',
    dutyNotes: 'Arterial line management and post-op nocturnal telemetry.',
    assignedByAdmin: 'System Administrator',
    assignedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const shiftRosterService = {
  /**
   * Get all duty shift entries
   */
  getDutyRoster(): DutyShiftRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ROSTER);
      if (stored) {
        return JSON.parse(stored) as DutyShiftRecord[];
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_ROSTER;
  },

  /**
   * Find active duty shift for a specific doctor or staff member
   */
  getDutyShiftForUser(user: SessionUser | null): DutyShiftRecord | null {
    if (!user) return null;
    const roster = this.getDutyRoster();
    const userEmail = (user.email || '').toLowerCase().trim();
    const userName = (user.name || '').toLowerCase().trim();

    // Match by email or name
    const found = roster.find((item) => {
      const itemEmail = item.email.toLowerCase().trim();
      const itemName = item.personName.toLowerCase().trim();
      return (
        itemEmail === userEmail ||
        itemName.includes(userName) ||
        userName.includes(itemName)
      );
    });

    return found || null;
  },

  /**
   * Only ADMIN can assign duty shifts.
   * Throws an error if any non-admin attempts to assign.
   */
  assignDutyShift(
    adminUser: SessionUser,
    target: {
      personId: number;
      personName: string;
      role: 'DOCTOR' | 'STAFF';
      department: string;
      email: string;
    },
    shiftDetails: {
      shiftType: 'Day Shift' | 'Night Shift' | 'Evening Shift' | '24x7 Emergency Rotation';
      shiftHours: string;
      dutyDays: string;
      reportingStation: string;
      dutyNotes: string;
    },
  ): { record: DutyShiftRecord; notification: ShiftNotification } {
    if (adminUser.role !== 'ADMIN') {
      throw new Error('Unauthorized: Only Hospital Administration is authorized to assign or modify duty shifts.');
    }

    const currentRoster = this.getDutyRoster();
    const existingIndex = currentRoster.findIndex(
      (r) =>
        r.personId === target.personId ||
        r.email.toLowerCase() === target.email.toLowerCase(),
    );

    const existingItem = existingIndex >= 0 ? currentRoster[existingIndex] : undefined;
    const record: DutyShiftRecord = {
      id: existingItem ? existingItem.id : `shift-${Date.now()}`,
      personId: target.personId,
      personName: target.personName,
      role: target.role,
      department: target.department,
      email: target.email,
      shiftType: shiftDetails.shiftType,
      shiftHours: shiftDetails.shiftHours,
      dutyDays: shiftDetails.dutyDays,
      reportingStation: shiftDetails.reportingStation,
      dutyNotes: shiftDetails.dutyNotes,
      assignedByAdmin: adminUser.name,
      assignedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      currentRoster[existingIndex] = record;
    } else {
      currentRoster.push(record);
    }

    try {
      localStorage.setItem(STORAGE_KEY_ROSTER, JSON.stringify(currentRoster));
    } catch (e) {
      console.error('Failed to persist duty shift roster:', e);
    }

    // ── Generate Device Notification ──────────────────────────────────────────
    const shiftIcon = shiftDetails.shiftType.includes('Night') ? '🌙' : '☀️';
    const notification: ShiftNotification = {
      id: Date.now(),
      recipientEmail: target.email.toLowerCase(),
      recipientName: target.personName,
      title: `${shiftIcon} Duty Shift Scheduled: ${shiftDetails.shiftType}`,
      message: `Hospital Administration (${adminUser.name}) scheduled you for ${shiftDetails.shiftType} (${shiftDetails.shiftHours}) on ${shiftDetails.dutyDays}. Station: ${shiftDetails.reportingStation}. Duty Instructions: ${shiftDetails.dutyNotes || 'Report to Duty Lead on time.'}`,
      shiftType: shiftDetails.shiftType,
      shiftHours: shiftDetails.shiftHours,
      dutyDays: shiftDetails.dutyDays,
      reportingStation: shiftDetails.reportingStation,
      dutyNotes: shiftDetails.dutyNotes,
      isRead: false,
      createdAt: new Date().toISOString(),
      assignedBy: adminUser.name,
    };

    this.saveNotification(notification);

    // ── Trigger Native Browser Push Notification if supported & granted ──────
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(`${shiftIcon} Hospital Duty Notification`, {
            body: `${target.personName}: Scheduled for ${shiftDetails.shiftType} (${shiftDetails.shiftHours}) on ${shiftDetails.dutyDays}. Assigned by Admin.`,
            icon: '/favicon.ico',
          });
        } catch {
          // ignore notification api restrictions
        }
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    // ── Broadcast Event to Active Devices / Tabs ──────────────────────────────
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('niramaya:shift-updated', {
          detail: { record, notification },
        }),
      );
      window.dispatchEvent(
        new CustomEvent('niramaya:device-notification', {
          detail: notification,
        }),
      );
    }

    return { record, notification };
  },

  /**
   * Save a shift notification to persistent store
   */
  saveNotification(notification: ShiftNotification) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFS);
      const list: ShiftNotification[] = stored ? JSON.parse(stored) : [];
      list.unshift(notification);
      // Keep up to 50 recent notifications
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save shift notification:', e);
    }
  },

  /**
   * Retrieve shift notifications for a given user
   */
  getShiftNotificationsForUser(user: SessionUser | null): ShiftNotification[] {
    if (!user) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (!stored) return [];
      const list: ShiftNotification[] = JSON.parse(stored);
      const userEmail = (user.email || '').toLowerCase().trim();
      const userName = (user.name || '').toLowerCase().trim();

      return list.filter((n) => {
        const notifEmail = n.recipientEmail.toLowerCase().trim();
        const notifName = n.recipientName.toLowerCase().trim();
        return (
          notifEmail === userEmail ||
          notifName.includes(userName) ||
          userName.includes(notifName)
        );
      });
    } catch {
      return [];
    }
  },

  /**
   * Mark a shift notification as read
   */
  markShiftNotificationRead(id: number) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (!stored) return;
      const list: ShiftNotification[] = JSON.parse(stored);
      const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  },

  /**
   * Mark all shift notifications as read for a user
   */
  markAllShiftNotificationsRead(user: SessionUser | null) {
    if (!user) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (!stored) return;
      const list: ShiftNotification[] = JSON.parse(stored);
      const userEmail = (user.email || '').toLowerCase().trim();
      const updated = list.map((n) =>
        n.recipientEmail.toLowerCase().trim() === userEmail ? { ...n, isRead: true } : n,
      );
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to mark all notifications read:', e);
    }
  },
};
