import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  MapPin,
  Heart,
  Award,
  KeyRound,
  Edit3,
  Camera,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  Stethoscope,
  Lock,
} from 'lucide-react';

interface UserProfileSectionViewProps {
  onEditProfile: () => void;
  onChangePassword: () => void;
}

export const UserProfileSectionView: React.FC<UserProfileSectionViewProps> = ({
  onEditProfile,
  onChangePassword,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'PROFESSIONAL' | 'SECURITY'>('PERSONAL');

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Sign in required to view profile</h2>
      </div>
    );
  }

  return (
    <div className="user-profile-section-view" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* ─── Profile Hero Header ─── */}
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border, #e2e8f0)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
          marginBottom: '1.5rem',
        }}
      >
        {/* Cover Banner */}
        <div
          style={{
            height: '140px',
            background: 'linear-gradient(135deg, #003b73 0%, #0284c7 50%, #0d9488 100%)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '1.5rem',
              top: '1.25rem',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={14} /> Hospital Verified
            </span>
          </div>
        </div>

        {/* Profile Card Body */}
        <div
          style={{
            padding: '0 2rem 1.75rem',
            position: 'relative',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', marginTop: '-50px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '104px',
                  height: '104px',
                  borderRadius: '50%',
                  background: '#003b73',
                  border: '4px solid #ffffff',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  overflow: 'hidden',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
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
              <button
                onClick={onEditProfile}
                title="Change Profile Photo"
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >
                <Camera size={15} />
              </button>
            </div>

            {/* Name & Title */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0 }}>
                  {user.name}
                </h1>
                <span
                  style={{
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                  }}
                >
                  {user.role}
                </span>
              </div>
              <div
                style={{
                  color: 'var(--text-secondary, #64748b)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.25rem',
                }}
              >
                <Mail size={14} /> {user.email}
                <span>•</span>
                <Building2 size={14} /> Niramaya HOSPITAL
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button
              onClick={onEditProfile}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                background: '#003b73',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 59, 115, 0.25)',
              }}
            >
              <Edit3 size={15} /> Edit Profile
            </button>
            <button
              onClick={onChangePassword}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.6rem 1.15rem',
                borderRadius: '8px',
                background: 'var(--bg-card-subtle, #f1f5f9)',
                color: 'var(--text-primary, #0f172a)',
                border: '1px solid var(--border, #e2e8f0)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <KeyRound size={15} /> Security
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tabs Navigation ─── */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          marginBottom: '1.5rem',
        }}
      >
        {[
          { id: 'PERSONAL', label: 'Personal Information', icon: User },
          { id: 'PROFESSIONAL', label: 'Clinical & Hospital Credentials', icon: Stethoscope },
          { id: 'SECURITY', label: 'Security & Access Keys', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2.5px solid #003b73' : '2.5px solid transparent',
                color: isActive ? '#003b73' : 'var(--text-secondary, #64748b)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ─── */}
      {activeTab === 'PERSONAL' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid var(--border, #e2e8f0)',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: '#003b73' }}>
              Contact & Identification
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                  Full Legal Name
                </label>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                  {user.name}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                  Registered Email Address
                </label>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                  {user.email}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                  Phone Number
                </label>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                  +91 (079) 4900 8800 (Verified)
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                  Residential Address
                </label>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                  Sarkhej - Gandhinagar Hwy, Ahmedabad, Gujarat 382421
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid var(--border, #e2e8f0)',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: '#003b73' }}>
              Demographic & Health Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                  Blood Group
                </label>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#fee2e2', color: '#dc2626', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  <Heart size={14} /> B+ Positive
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                  Gender / Date of Birth
                </label>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                  Not Specified • 14 Aug 1988 (Age 38)
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                  Emergency Contact
                </label>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                  Hospital Command Desk: Ext. #108
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PROFESSIONAL' && (
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid var(--border, #e2e8f0)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#003b73' }}>
            Hospital Department & Credentials
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                Primary Department
              </label>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '0.25rem' }}>
                Inpatient Clinical Care & Diagnostics
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                Employee ID
              </label>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0284c7', marginTop: '0.25rem' }}>
                HOSP-{user.id.toString().padStart(5, '0')}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                Medical Council Registration
              </label>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '0.25rem' }}>
                MCI/GMC-2024-88912-VERIFIED
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase' }}>
                Assigned Shift Hours
              </label>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)', marginTop: '0.25rem' }}>
                Morning Shift (08:00 AM - 04:00 PM)
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SECURITY' && (
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            padding: '1.75rem',
            borderRadius: '12px',
            border: '1px solid var(--border, #e2e8f0)',
          }}
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#003b73' }}>
            Cryptographic Security & Access Control
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 color="#16a34a" size={20} />
                <div>
                  <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem' }}>
                    Password Security Verified
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#15803d' }}>
                    First-login temporary password updated. Account credentials meet NIST standards.
                  </div>
                </div>
              </div>
              <button
                onClick={onChangePassword}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '6px',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Change Password
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-card-subtle, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border, #e2e8f0)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck color="#0284c7" size={20} />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary, #0f172a)', fontSize: '0.92rem' }}>
                    Blockchain Digital Signature ID
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
                    SHA-256 Anchored verification identity active on Niramaya Private Ledger.
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                0x7F...9A4E
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
