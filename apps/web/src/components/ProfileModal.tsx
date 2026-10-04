import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  X,
  Camera,
  Check,
  User,
  AlertCircle,
  Home,
} from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

// Curated high quality avatars matching real clinic and patient portraits
const PRESET_AVATARS = [
  {
    label: 'Maria Waston (Patient)',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
  },
  {
    label: 'Rohan Mehra (Patient)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  },
  {
    label: 'Dr. Richa Linda (Doctor)',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80',
  },
  {
    label: 'Dr. Priya Sharma (Doctor)',
    url: 'https://images.unsplash.com/photo-1594824813565-d6a9d20c57c4?auto=format&fit=crop&w=256&q=80',
  },
  {
    label: 'Administrator',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  },
  {
    label: 'Senior Executive',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  },
];

const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_PROFILE_AVATAR_DATA_URL_LENGTH = 72 * 1024;
const MAX_PROFILE_AVATAR_DIMENSION = 512;

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, onSuccess }) => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [bloodGroup, setBloodGroup] = useState<'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'>('A+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [address, setAddress] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  // Doctor-specific
  const [specialization, setSpecialization] = useState('Cardiology');
  const [bio, setBio] = useState('');
  const [qualification, setQualification] = useState('');
  const [consultationFee, setConsultationFee] = useState<number>(1000);
  const [hospitalAffiliation, setHospitalAffiliation] = useState('');

  const [saving, setSaving] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setError('Please choose an image under 2MB');
      return;
    }

    setProcessingPhoto(true);
    setError(null);
    const imageUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('We could not read this photo. Please choose a different image.'));
        image.src = imageUrl;
      });

      const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
      if (!longestSide) {
        throw new Error('We could not read this photo. Please choose a different image.');
      }
      let scale = Math.min(1, MAX_PROFILE_AVATAR_DIMENSION / longestSide);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Your browser could not prepare this photo. Please try another image.');
      }

      let avatarDataUrl = '';
      for (let attempt = 0; attempt < 9; attempt += 1) {
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        avatarDataUrl = canvas.toDataURL('image/jpeg', [0.84, 0.72, 0.6][attempt % 3]);
        if (avatarDataUrl.length <= MAX_PROFILE_AVATAR_DATA_URL_LENGTH) break;
        if (attempt % 3 === 2) scale *= 0.8;
      }

      if (avatarDataUrl.length > MAX_PROFILE_AVATAR_DATA_URL_LENGTH) {
        throw new Error('This photo could not be resized enough. Please choose a different image.');
      }
      setAvatarUrl(avatarDataUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'We could not prepare this photo. Please try again.');
    } finally {
      URL.revokeObjectURL(imageUrl);
      setProcessingPhoto(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.updateMe({
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
        phone: phone || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        bloodGroup: bloodGroup || undefined,
        emergencyContact: emergencyContact || undefined,
        address: address || undefined,
        medicalHistory: medicalHistory || undefined,
        specialization: specialization || undefined,
        bio: bio || undefined,
        qualification: qualification || undefined,
        consultationFee: consultationFee || undefined,
        hospitalAffiliation: hospitalAffiliation || undefined,
      });

      await refreshUser();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
        }}
      >
        {/* Header */}
        <div
          aria-busy={processingPhoto}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h3 id="profile-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              Edit Profile & Photo
            </h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Update your personal details and avatar for {user?.role} account
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close profile modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '0.3rem',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '0.65rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: '#fef2f2',
              color: '#ef4444',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Avatar Section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.85rem',
              padding: '1rem',
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 800,
                  boxShadow: 'var(--shadow-md)',
                  overflow: 'hidden',
                  border: '3px solid white',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setAvatarUrl('')}
                  />
                ) : (
                  name.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                title="Choose a profile photo"
                aria-label="Choose a profile photo"
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  right: '0px',
                  background: 'var(--primary)',
                  color: 'white',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                <Camera size={14} />
              </label>
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              aria-label="Choose a profile photo from your device"
              style={{ display: 'none' }}
            />

            {/* Quick Preset Selector */}
            <div style={{ textAlign: 'center', width: '100%' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Choose a preset or upload a photo from your gallery
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    title={preset.label}
                    aria-label={`Select avatar ${preset.label}`}
                    onClick={() => setAvatarUrl(preset.url)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      padding: 0,
                      border: avatarUrl === preset.url ? '2px solid var(--primary)' : '2px solid transparent',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      transform: avatarUrl === preset.url ? 'scale(1.1)' : 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: avatarUrl === preset.url ? '0 0 0 2px var(--primary-light)' : 'none',
                    }}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>

              <label className="btn btn-secondary btn-sm profile-gallery-button" htmlFor="avatar-upload">
                <Camera size={15} />
                {processingPhoto ? 'Preparing photo…' : avatarUrl ? 'Choose a different photo' : 'Choose from gallery'}
              </label>
              <div className="profile-gallery-hint">JPG, PNG, or WebP · Up to 2 MB</div>

            </div>
          </div>

          {/* Name & Account Details */}
          <div className="form-group">
            <label htmlFor="profile-name" className="form-label" style={{ fontWeight: 700 }}>
              Full Name *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="profile-name"
                type="text"
                className="form-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                style={{ paddingLeft: '2.2rem' }}
              />
              <User
                size={16}
                color="var(--text-muted)"
                aria-hidden="true"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Patient Details */}
          {user?.role === 'PATIENT' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group">
                  <label htmlFor="profile-phone" className="form-label">Phone Number</label>
                  <input
                    id="profile-phone"
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-gender" className="form-label">Gender</label>
                  <select
                    id="profile-gender"
                    className="form-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group">
                  <label htmlFor="profile-dob" className="form-label">Date of Birth</label>
                  <input
                    id="profile-dob"
                    type="date"
                    className="form-input"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-bloodgroup" className="form-label">Blood Group</label>
                  <select
                    id="profile-bloodgroup"
                    className="form-select"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-')}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="profile-emergency" className="form-label">Emergency Contact</label>
                <input
                  id="profile-emergency"
                  type="text"
                  className="form-input"
                  placeholder="Contact person & phone number"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-address" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Home size={14} color="var(--primary)" />
                  Residential Address
                </label>
                <input
                  id="profile-address"
                  type="text"
                  className="form-input"
                  placeholder="Street, City, State, PIN"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="profile-history" className="form-label">Medical History / Allergies</label>
                <textarea
                  id="profile-history"
                  className="form-textarea"
                  rows={2}
                  placeholder="Any allergies, chronic conditions or previous surgeries"
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Doctor Details */}
          {user?.role === 'DOCTOR' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                <div className="form-group">
                  <label htmlFor="doc-specialization" className="form-label">Specialization</label>
                  <input
                    id="doc-specialization"
                    type="text"
                    className="form-input"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Cardiologist"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="doc-fee" className="form-label">Consultation Fee (₹)</label>
                  <input
                    id="doc-fee"
                    type="number"
                    className="form-input"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="doc-qual" className="form-label">Qualifications</label>
                <input
                  id="doc-qual"
                  type="text"
                  className="form-input"
                  placeholder="e.g. MBBS, MD (Cardiology)"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="doc-hospital" className="form-label">Hospital Affiliation</label>
                <input
                  id="doc-hospital"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Metro Heart Institute"
                  value={hospitalAffiliation}
                  onChange={(e) => setHospitalAffiliation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="doc-bio" className="form-label">Bio / Profile Summary</label>
                <textarea
                  id="doc-bio"
                  className="form-textarea"
                  rows={2}
                  placeholder="Brief summary of your clinical experience"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Submit */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Check size={16} />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
