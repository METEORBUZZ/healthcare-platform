import React, { useState } from 'react';
import type { DoctorDto } from '@healthcare/shared';
import { Calendar, Star, Building2, Globe, Award, X, Stethoscope, CheckCircle } from 'lucide-react';

interface DoctorCardProps {
  doctor: DoctorDto;
  onBook: (doctor: DoctorDto) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Normalize display name to uppercase format: "DR FIRST LAST"
  const formattedName = doctor.name.toUpperCase().startsWith('DR')
    ? doctor.name.toUpperCase()
    : `DR ${doctor.name.toUpperCase()}`;

  // Default doctor photo if avatarUrl is missing or fails to load
  const fallbackPhoto =
    doctor.id % 2 === 0
      ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'
      : 'https://images.unsplash.com/photo-1594824813589-3286ff00eeae?auto=format&fit=crop&q=80&w=400';

  const photoSrc = !imgError && doctor.avatarUrl ? doctor.avatarUrl : fallbackPhoto;

  return (
    <>
      <div
        className="doctor-hospital-card"
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
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 132, 199, 0.12), 0 2px 6px rgba(0,0,0,0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 2px 10px rgba(15, 23, 42, 0.06)';
        }}
      >
        {/* Top Header Bar — Styled to match UI Brand Primary (Ocean Blue / Cyan gradient) */}
        <div
          style={{
            background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <Stethoscope size={16} color="#ffffff" style={{ opacity: 0.9, flexShrink: 0 }} />
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

          {doctor.isVerified && (
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
              }}
            >
              <CheckCircle size={11} color="#ffffff" /> VERIFIED
            </span>
          )}
        </div>

        {/* Card Body — Clean 2-Column Balanced Grid (Left: Photo + View Profile, Right: Credentials & Booking) */}
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
            {/* Photo Box — Neatly Framed Inside Card */}
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
                alt={doctor.name}
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

            {/* View Profile Action Button — Matching UI Primary Brand Gradient */}
            <button
              onClick={() => setShowProfileModal(true)}
              style={{
                marginTop: '10px',
                width: '115px',
                height: '34px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
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
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.28)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(2, 132, 199, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(2, 132, 199, 0.28)';
              }}
              aria-label={`View full profile of ${doctor.name}`}
            >
              View Profile
            </button>
          </div>

          {/* Right Column: Key-Value Medical Credentials & Slot Booking Action */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minWidth: 0,
            }}
          >
            {/* Medical Info Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Qualifications Row */}
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
                  Qualifications:
                </span>
                <span
                  style={{
                    color: 'var(--text-secondary, #334155)',
                    fontWeight: 500,
                    lineHeight: 1.45,
                    wordBreak: 'normal',
                  }}
                >
                  {doctor.qualification}
                </span>
              </div>

              {/* Specialization Row */}
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
                  Specialization:
                </span>
                <span
                  style={{
                    color: '#0284c7',
                    fontWeight: 700,
                    lineHeight: 1.45,
                    wordBreak: 'normal',
                  }}
                >
                  {doctor.specialization}
                </span>
              </div>

              {/* Experience and Rating Badges */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  marginTop: '4px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.74rem',
                    color: '#0369a1',
                    background: '#e0f2fe',
                    border: '1px solid #bae6fd',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  <Award size={13} color="#0284c7" />
                  <span>{doctor.experienceYears} Years Exp</span>
                </div>

                {doctor.rating && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.74rem',
                      color: '#b45309',
                      background: '#fef3c7',
                      border: '1px solid #fde68a',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    <Star size={12} fill="#d97706" color="#d97706" />
                    <span>{doctor.rating.toFixed(1)}</span>
                    <span style={{ color: '#92400e', fontWeight: 500 }}>({doctor.reviewCount})</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Strip: Consultation Fee & Quick Book Slot */}
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
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748b)', display: 'block', fontWeight: 600 }}>
                  CONSULTATION FEE
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                  ₹{doctor.consultationFee}
                </span>
              </div>

              <button
                onClick={() => onBook(doctor)}
                className="btn btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.82rem',
                  padding: '0.42rem 0.95rem',
                  borderRadius: '6px',
                  background: 'var(--primary, #0284c7)',
                  borderColor: 'var(--primary, #0284c7)',
                  color: '#ffffff',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0369a1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#0284c7';
                }}
                aria-label={`Book slot with ${doctor.name}`}
              >
                <Calendar size={14} />
                Book Slot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Profile Modal (Triggered by 'View Profile') */}
      {showProfileModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="doctor-profile-title"
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
                background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={20} />
                <h3 id="doctor-profile-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Doctor Profile
                </h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                aria-label="Close doctor profile"
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
                    alt={doctor.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      {doctor.name}
                    </h2>
                    {doctor.isVerified && <CheckCircle size={18} fill="#0284c7" color="white" />}
                  </div>

                  <div style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.95rem', marginTop: '3px' }}>
                    {doctor.specialization}
                  </div>

                  <div style={{ color: '#475569', fontSize: '0.85rem', marginTop: '2px' }}>
                    {doctor.qualification}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.6rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>
                      {doctor.experienceYears} Years Practice
                    </div>
                    {doctor.rating && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          fontSize: '0.8rem',
                          color: '#d97706',
                          fontWeight: 700,
                        }}
                      >
                        <Star size={13} fill="#d97706" color="#d97706" />
                        <span>{doctor.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {doctor.bio && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
                    About Doctor
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                    {doctor.bio}
                  </p>
                </div>
              )}

              {doctor.hospitalAffiliation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#334155' }}>
                  <Building2 size={16} color="#0284c7" />
                  <span><strong>Hospital Affiliation:</strong> {doctor.hospitalAffiliation}</span>
                </div>
              )}

              {doctor.languages && doctor.languages.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#334155' }}>
                  <Globe size={16} color="#0284c7" />
                  <span><strong>Languages:</strong> {doctor.languages.join(', ')}</span>
                </div>
              )}

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
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Consultation Fee</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                    ₹{doctor.consultationFee}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    onBook(doctor);
                  }}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(90deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  <Calendar size={16} /> Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
