import React from 'react';
import {
  Building2,
  Users,
  Activity,
  Bed,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

const DEPARTMENTS_DATA = [
  {
    name: 'Cardiology & Vascular Sciences',
    head: 'Dr. Sarah Jenkins',
    location: 'Tower A, 3rd Floor',
    bedsTotal: 40,
    bedsOccupied: 34,
    staffCount: 18,
    status: 'ACTIVE',
    color: '#0284c7',
  },
  {
    name: 'Emergency & Trauma Care',
    head: 'Dr. Vikram Malhotra',
    location: 'Ground Floor, Critical Wing',
    bedsTotal: 25,
    bedsOccupied: 22,
    staffCount: 24,
    status: 'HIGH_LOAD',
    color: '#ef4444',
  },
  {
    name: 'Interventional Radiology & Imaging',
    head: 'Dr. Aakash Patel',
    location: 'Basement 1, Diagnostic Core',
    bedsTotal: 15,
    bedsOccupied: 8,
    staffCount: 12,
    status: 'ACTIVE',
    color: '#8b5cf6',
  },
  {
    name: 'General & Laparoscopic Surgery',
    head: 'Dr. Priya Sharma',
    location: 'Tower B, 4th Floor',
    bedsTotal: 30,
    bedsOccupied: 21,
    staffCount: 16,
    status: 'ACTIVE',
    color: '#10b981',
  },
  {
    name: 'Pediatrics & Neonatal Care',
    head: 'Dr. Sneha Verma',
    location: 'Tower A, 2nd Floor',
    bedsTotal: 20,
    bedsOccupied: 14,
    staffCount: 15,
    status: 'ACTIVE',
    color: '#f59e0b',
  },
  {
    name: 'Neurology & Neurosurgery',
    head: 'Dr. Arjun Rampal',
    location: 'Tower B, 5th Floor',
    bedsTotal: 25,
    bedsOccupied: 19,
    staffCount: 14,
    status: 'ACTIVE',
    color: '#06b6d4',
  },
];

export const HospitalDepartmentsView: React.FC = () => {
  return (
    <div className="hospital-departments-view" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
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
          <Building2 size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Hospital Departments & Wards
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, marginTop: '0.2rem' }}>
            Clinical divisions, departmental heads, bed capacities, and staffing rosters.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {DEPARTMENTS_DATA.map((dept) => {
          const occupancyPct = Math.round((dept.bedsOccupied / dept.bedsTotal) * 100);
          return (
            <div
              key={dept.name}
              style={{
                background: 'var(--bg-card, #ffffff)',
                borderRadius: '12px',
                border: '1px solid var(--border, #e2e8f0)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  {dept.name}
                </h3>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    background: dept.status === 'HIGH_LOAD' ? '#fef2f2' : '#f0fdf4',
                    color: dept.status === 'HIGH_LOAD' ? '#dc2626' : '#16a34a',
                  }}
                >
                  {dept.status === 'HIGH_LOAD' ? 'High Occupancy' : 'Normal Operations'}
                </span>
              </div>

              <div style={{ fontSize: '0.86rem', color: '#64748b', marginBottom: '1.25rem' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>Head:</span> {dept.head} • {dept.location}
              </div>

              {/* Occupancy bar */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  <span>Bed Occupancy: {dept.bedsOccupied} / {dept.bedsTotal}</span>
                  <span>{occupancyPct}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${occupancyPct}%`,
                      height: '100%',
                      background: occupancyPct > 85 ? '#ef4444' : '#003b73',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                <span>Staff on Duty: <strong>{dept.staffCount} clinicians</strong></span>
                <span style={{ color: '#0284c7', fontWeight: 600, cursor: 'pointer' }}>View Roster →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
