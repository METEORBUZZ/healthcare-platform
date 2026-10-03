import React, { useState } from 'react';
import { Clock, Phone, Mail, X, CheckCircle2, ShieldCheck, HeartPulse, Moon, Sun } from 'lucide-react';

export interface StaffMember {
  id: number;
  name: string;
  role: string;
  department: string;
  qualifications: string;
  experienceYears: number;
  shiftType: 'Day Shift' | 'Night Shift' | 'Evening Shift' | '24x7 Emergency';
  shiftHours: string;
  dutyDays: string;
  shift: string;
  languages: string[];
  bio: string;
  avatarUrl: string;
  isAvailableOnDuty: boolean;
  phone?: string;
  email?: string;
}

interface StaffCardProps {
  staff: StaffMember;
  onContact?: (staff: StaffMember) => void;
}

export const StaffCard: React.FC<StaffCardProps> = ({ staff, onContact }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Normalize display name to uppercase format: "NAME SURNAME"
  const formattedName = staff.name.toUpperCase();

  const fallbackPhoto =
    staff.id % 2 === 0
      ? 'https://images.unsplash.com/photo-1594824813589-3286ff00eeae?auto=format&fit=crop&q=80&w=400'
      : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400';

  const photoSrc = !imgError && staff.avatarUrl ? staff.avatarUrl : fallbackPhoto;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setMessageSent(true);
    setTimeout(() => {
      setMessageSent(false);
      setContactMessage('');
      setShowContactModal(false);
    }, 1800);
  };

  const isNightShift = staff.shiftType === 'Night Shift';

  return (
    <>
      <div
        className="doctor-hospital-card staff-hospital-card"
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--border, #e2e8f0)',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = isNightShift
            ? '0 8px 24px rgba(109, 40, 217, 0.15), 0 2px 6px rgba(0,0,0,0.04)'
            : '0 8px 24px rgba(13, 148, 136, 0.15), 0 2px 6px rgba(0,0,0,0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 23, 42, 0.06)';
        }}
      >
        {/* Top Header Bar — Dynamic Header Theme depending on Day / Night Duty */}
        <div
          style={{
            background: isNightShift
              ? 'linear-gradient(90deg, #4338ca 0%, #6366f1 100%)'
              : 'linear-gradient(90deg, #0d9488 0%, #0284c7 100%)',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {isNightShift ? (
              <Moon size={16} color="#ffffff" style={{ opacity: 0.9, flexShrink: 0 }} />
            ) : (
              <Sun size={16} color="#ffffff" style={{ opacity: 0.9, flexShrink: 0 }} />
            )}
            <h3
              style={{
                color: '#ffffff',
                fontSize: '0.96rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                margin: 0,
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
              title={formattedName}
            >
              {formattedName}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.22)',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              {isNightShift ? '🌙 NIGHT DUTY' : '☀️ DAY DUTY'}
            </span>
          </div>
        </div>

        {/* Card Body — Clean 2-Column Balanced Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '115px 1fr',
            gap: '16px',
            padding: '16px',
            flex: 1,
            alignItems: 'stretch',
          }}
        >
          {/* Left Column: Portrait Photo & View Profile Button */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            {/* Photo Box */}
            <div
              style={{
                width: '115px',
                height: '125px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={photoSrc}
                alt={staff.name}
                onError={() => setImgError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'top center',
                  display: 'block',
                }}
              />
            </div>

            {/* View Profile Action Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              style={{
                marginTop: '10px',
                width: '115px',
                height: '34px',
                background: isNightShift
                  ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)'
                  : 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.8rem',
                letterSpacing: '0.01em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isNightShift
                  ? '0 2px 8px rgba(79, 70, 229, 0.28)'
                  : '0 2px 8px rgba(13, 148, 136, 0.28)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
              }}
              aria-label={`View full profile of ${staff.name}`}
            >
              View Profile
            </button>
          </div>

          {/* Right Column: Key-Value Staff Credentials & Duty Schedule */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            {/* Staff Info Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {/* Designation Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '115px 1fr',
                  gap: '8px',
                  alignItems: 'baseline',
                  fontSize: '0.88rem',
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    color: 'var(--text-primary, #0f172a)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Designation:
                </span>
                <span
                  style={{
                    color: isNightShift ? '#4f46e5' : '#0d9488',
                    fontWeight: 700,
                    lineHeight: 1.45,
                    wordBreak: 'normal',
                  }}
                >
                  {staff.role}
                </span>
              </div>

              {/* Department Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '115px 1fr',
                  gap: '8px',
                  alignItems: 'baseline',
                  fontSize: '0.88rem',
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    color: 'var(--text-primary, #0f172a)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Department:
                </span>
                <span
                  style={{
                    color: 'var(--text-secondary, #334155)',
                    fontWeight: 600,
                    lineHeight: 1.45,
                    wordBreak: 'normal',
                  }}
                >
                  {staff.department}
                </span>
              </div>

              {/* Duty Shift & Hours (Prominent) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '115px 1fr',
                  gap: '8px',
                  alignItems: 'center',
                  fontSize: '0.88rem',
                }}
              >
                <span
                  style={{
                    fontWeight: 800,
                    color: 'var(--text-primary, #0f172a)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Duty Shift:
                </span>
                <div>
                  {isNightShift ? (
                    <span
                      style={{
                        background: '#ede9fe',
                        color: '#6d28d9',
                        border: '1px solid #ddd6fe',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Moon size={11} color="#6d28d9" /> Night Shift ({staff.shiftHours})
                    </span>
                  ) : staff.shiftType === 'Day Shift' ? (
                    <span
                      style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Sun size={11} color="#0284c7" /> Day Shift ({staff.shiftHours})
                    </span>
                  ) : (
                    <span
                      style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={11} color="#d97706" /> {staff.shiftType} ({staff.shiftHours})
                    </span>
                  )}
                </div>
              </div>

              {/* Qualifications Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '115px 1fr',
                  gap: '8px',
                  alignItems: 'baseline',
                  fontSize: '0.84rem',
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--text-muted, #64748b)',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Qualifications:
                </span>
                <span
                  style={{
                    color: 'var(--text-secondary, #475569)',
                    fontWeight: 500,
                    lineHeight: 1.4,
                    wordBreak: 'normal',
                  }}
                >
                  {staff.qualifications}
                </span>
              </div>
            </div>

            {/* Bottom Action Strip: Schedule Roster & Connect Staff Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border-light, #f1f5f9)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)', display: 'block', fontWeight: 600 }}>
                  WEEKLY ROSTER
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary, #0f172a)' }}>
                  {staff.dutyDays}
                </span>
              </div>

              <button
                onClick={() => {
                  if (onContact) {
                    onContact(staff);
                  } else {
                    setShowContactModal(true);
                  }
                }}
                className="btn btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                  padding: '0.42rem 0.95rem',
                  borderRadius: '6px',
                  background: isNightShift ? '#4f46e5' : '#0d9488',
                  borderColor: isNightShift ? '#4f46e5' : '#0d9488',
                  color: '#ffffff',
                  fontWeight: 700,
                  boxShadow: isNightShift
                    ? '0 2px 6px rgba(79, 70, 229, 0.25)'
                    : '0 2px 6px rgba(13, 148, 136, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                aria-label={`Contact staff member ${staff.name}`}
              >
                <Phone size={14} />
                Connect Staff
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Profile Modal */}
      {showProfileModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-profile-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProfileModal(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '560px',
              borderRadius: '16px',
              overflow: 'hidden',
              padding: 0,
              border: '1px solid #cbd5e1',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              background: '#ffffff',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: isNightShift
                  ? 'linear-gradient(90deg, #4338ca 0%, #6366f1 100%)'
                  : 'linear-gradient(90deg, #0d9488 0%, #0284c7 100%)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={20} />
                <h3 id="staff-profile-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Hospital Staff Duty Profile
                </h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                aria-label="Close staff profile"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '100px',
                    height: '115px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={photoSrc}
                    alt={staff.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      {staff.name}
                    </h2>
                    <ShieldCheck size={18} color={isNightShift ? '#4f46e5' : '#0d9488'} />
                  </div>

                  <div style={{ color: isNightShift ? '#4f46e5' : '#0d9488', fontWeight: 700, fontSize: '0.95rem', marginTop: '3px' }}>
                    {staff.role}
                  </div>

                  <div style={{ color: '#475569', fontSize: '0.85rem', marginTop: '2px' }}>
                    {staff.department}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                      {staff.experienceYears} Years Clinical Experience
                    </div>
                  </div>
                </div>
              </div>

              {/* Duty Time Block */}
              <div
                style={{
                  background: isNightShift ? '#f5f3ff' : '#f0fdfa',
                  border: isNightShift ? '1px solid #ddd6fe' : '1px solid #99f6e4',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  {isNightShift ? <Moon size={16} color="#6d28d9" /> : <Sun size={16} color="#0d9488" />}
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: isNightShift ? '#5b21b6' : '#115e59' }}>
                    {staff.shiftType} Schedule ({staff.shiftHours})
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: isNightShift ? '#6d28d9' : '#0f766e' }}>
                  <strong>Duty Roster:</strong> {staff.dutyDays} · <strong>Current Status:</strong> {staff.isAvailableOnDuty ? 'Active on Roster' : 'Off Duty'}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Clinical Background & Responsibilities
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                  {staff.bio}
                </p>
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#334155' }}>
                <strong>Qualifications:</strong> {staff.qualifications}
              </div>

              <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#334155' }}>
                <strong>Languages:</strong> {staff.languages.join(', ')}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Assigned Shift</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    {staff.shiftHours}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowContactModal(true);
                  }}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: isNightShift
                      ? 'linear-gradient(90deg, #4338ca 0%, #6366f1 100%)'
                      : 'linear-gradient(90deg, #0d9488 0%, #0284c7 100%)',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  <Phone size={16} /> Contact Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact Staff Direct Message Modal */}
      {showContactModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-staff-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowContactModal(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              borderRadius: '16px',
              overflow: 'hidden',
              padding: 0,
              border: '1px solid #cbd5e1',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              background: '#ffffff',
            }}
          >
            <div
              style={{
                background: isNightShift
                  ? 'linear-gradient(90deg, #4338ca 0%, #6366f1 100%)'
                  : 'linear-gradient(90deg, #0d9488 0%, #0284c7 100%)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={18} />
                <h3 id="contact-staff-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                  Contact {staff.name}
                </h3>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                aria-label="Close contact dialog"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem' }}>
              {messageSent ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <CheckCircle2 size={42} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.4rem', color: '#0f172a', fontWeight: 800 }}>
                    Message Transmitted
                  </h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                    {staff.name} ({staff.role}) has been notified via the internal hospital staff alert system.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendMessage}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#475569' }}>
                      <strong>Department:</strong> {staff.department} · <strong>Duty:</strong> {staff.shiftHours} ({staff.shiftType})
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="staff-msg" className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      Clinical Message / Shift Handover Note
                    </label>
                    <textarea
                      id="staff-msg"
                      rows={3}
                      className="form-textarea"
                      placeholder={`e.g. Inpatient vitals update, medicine requisition, or emergency handover note...`}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      required
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowContactModal(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      style={{ background: isNightShift ? '#4f46e5' : '#0d9488', borderColor: isNightShift ? '#4f46e5' : '#0d9488' }}
                    >
                      <Mail size={14} /> Send Note
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
