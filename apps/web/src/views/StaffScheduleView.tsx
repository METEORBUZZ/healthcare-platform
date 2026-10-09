import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Filter,
  UserCheck,
} from 'lucide-react';
import { hospitalOperationsService } from '../utils/hospitalOperationsService';

export const StaffScheduleView: React.FC = () => {
  const doctors = hospitalOperationsService.getDoctors();
  const staffMembers = hospitalOperationsService.getStaff();
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterShift, setFilterShift] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const combinedStaff = [
    ...doctors.map((d) => ({
      id: `doc-${d.id}`,
      name: d.name,
      role: 'Doctor',
      department: d.department,
      shift: d.todayShift,
      hours: d.shiftHours,
      location: d.workingLocation,
      room: d.roomNumber,
      status: d.status,
      avatarUrl: d.avatarUrl,
    })),
    ...staffMembers.map((s) => ({
      id: `stf-${s.id}`,
      name: s.name,
      role: s.staffType,
      department: s.department,
      shift: s.todayShift,
      hours: s.shiftHours,
      location: s.workingLocation,
      room: s.assignedArea,
      status: s.status,
      avatarUrl: s.avatarUrl,
    })),
  ];

  const filteredStaff = combinedStaff.filter((person) => {
    if (filterDept !== 'ALL' && person.department !== filterDept) return false;
    if (filterShift !== 'ALL' && !person.shift.toLowerCase().includes(filterShift.toLowerCase())) return false;
    if (
      search &&
      !person.name.toLowerCase().includes(search.toLowerCase()) &&
      !person.department.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const departments = ['ALL', ...Array.from(new Set(combinedStaff.map((s) => s.department)))];

  return (
    <div className="staff-schedule-view" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: '#003b73',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={20} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Hospital Staff Schedule
            </h1>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Live clinical shift assignments, duty rosters, and ward allocations.
          </p>
        </div>

        {/* Quick Shift Badges */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
            ● Morning (08:00 - 16:00): Active
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#1e40af' }}>
            ● Evening (16:00 - 00:00): Next
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'var(--bg-card, #ffffff)',
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border, #e2e8f0)',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search clinician by name or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.75rem 0.55rem 2.25rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e1)',
              fontSize: '0.88rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Filter size={15} color="#64748b" />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e1)',
              fontSize: '0.88rem',
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
            }}
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'ALL' ? 'All Departments' : dept}
              </option>
            ))}
          </select>

          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            style={{
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border, #cbd5e1)',
              fontSize: '0.88rem',
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
            }}
          >
            <option value="ALL">All Shifts</option>
            <option value="Morning">Morning Shift</option>
            <option value="Evening">Evening Shift</option>
            <option value="Night">Night Shift</option>
          </select>
        </div>
      </div>

      {/* Roster Table */}
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-subtle, #f8fafc)', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Clinician / Staff</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Department</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Today Shift</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Location / Ward</th>
              <th style={{ padding: '0.85rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((staff, idx) => (
              <tr
                key={staff.id}
                style={{
                  borderBottom: idx < filteredStaff.length - 1 ? '1px solid var(--border, #f1f5f9)' : 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#003b73',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        overflow: 'hidden',
                      }}
                    >
                      {staff.avatarUrl ? (
                        <img src={staff.avatarUrl} alt={staff.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        staff.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{staff.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{staff.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: staff.role === 'Doctor' ? '#e0f2fe' : '#f1f5f9',
                      color: staff.role === 'Doctor' ? '#0369a1' : '#475569',
                    }}
                  >
                    {staff.role}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.25rem', fontSize: '0.88rem', color: '#334155', fontWeight: 500 }}>
                  {staff.department}
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>{staff.shift}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{staff.hours}</div>
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 500 }}>{staff.location}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Room: {staff.room}</div>
                </td>
                <td style={{ padding: '1rem 1.25rem' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: staff.status === 'ACTIVE' ? '#16a34a' : '#94a3b8',
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: staff.status === 'ACTIVE' ? '#16a34a' : '#94a3b8' }} />
                    {staff.status === 'ACTIVE' ? 'On Duty' : 'Off Duty'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
