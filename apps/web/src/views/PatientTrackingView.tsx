import React, { useState, useEffect, useCallback } from 'react';
import type { PatientTrackingDto, VitalsInput } from '@healthcare/shared';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Heart,
  Activity,
  Calendar,
  User,
  Download,
  Plus,
  Check,
  X,
  ChevronRight,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';

interface PatientTrackingViewProps {
  initialPatientId?: number | null;
  onOpenEditProfile: () => void;
  onNavigateBack?: () => void;
}

export const PatientTrackingView: React.FC<PatientTrackingViewProps> = ({
  initialPatientId,
  onOpenEditProfile,
  onNavigateBack,
}) => {
  const { user } = useAuth();
  const [trackingData, setTrackingData] = useState<PatientTrackingDto | null>(null);
  const [allPatients, setAllPatients] = useState<PatientTrackingDto[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    initialPatientId ?? (user?.role === 'PATIENT' ? null : null),
  );
  const [loading, setLoading] = useState(true);
  const [showVitalsModal, setShowVitalsModal] = useState(false);

  // New vitals form state
  const [bp, setBp] = useState('120/80');
  const [hr, setHr] = useState(76);
  const [glucose, setGlucose] = useState(95);
  const [cholesterol, setCholesterol] = useState(85);
  const [vitalsNotes, setVitalsNotes] = useState('');
  const [recordingVitals, setRecordingVitals] = useState(false);
  const [activeTab, setActiveTab] = useState<'patient' | 'dashboard' | 'schedule' | 'statistics'>('patient');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (user?.role === 'DOCTOR' || user?.role === 'ADMIN') {
        const list = await api.getAllPatientTracking();
        setAllPatients(list || []);
        const targetId = selectedPatientId ?? list?.[0]?.patient?.id ?? undefined;
        const res = await api.getPatientTracking(targetId);
        setTrackingData(res);
      } else {
        const res = await api.getPatientTracking();
        setTrackingData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.role, selectedPatientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Escape key to close vitals modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showVitalsModal) {
        setShowVitalsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showVitalsModal]);

  const handleSelectPatient = async (pId: number) => {
    setSelectedPatientId(pId);
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRecordingVitals(true);
      const input: VitalsInput = {
        bloodPressure: bp,
        heartRate: hr,
        glucose,
        cholesterol,
        notes: vitalsNotes,
      };
      await api.recordVitals(input, trackingData?.patient?.id);
      setShowVitalsModal(false);
      await loadData();
    } catch (err) {
      console.error('Failed to record vitals:', err);
    } finally {
      setRecordingVitals(false);
    }
  };

  const handleDownloadReport = (historyItem: NonNullable<PatientTrackingDto['history']>[number]) => {
    const reportText = `
CLINICAL VISIT SUMMARY - NIRAMAYA HOSPITAL
(Multispeciality | Laparoscopy | Fertility)
Patient: ${trackingData?.patient?.name}
Date: ${historyItem.date}
Doctor: ${historyItem.doctorName} (${historyItem.department})
Diagnosis: ${historyItem.diagnosis}
Severity: ${historyItem.severity}
Status: ${historyItem.status}
Notes: ${historyItem.doctorNotes || 'No additional notes'}

Current Vitals at time of record:
- Blood Pressure: ${trackingData?.vitals?.current?.bloodPressure || '120/80'} mm/hg
- Heart Rate: ${trackingData?.vitals?.current?.heartRate || 75} BPM
- Glucose: ${trackingData?.vitals?.current?.glucose || 95} mg/dl
- Cholesterol: ${trackingData?.vitals?.current?.cholesterol || 85} mg/dl
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Medical_Report_${trackingData?.patient?.name?.replace(/\s+/g, '_')}_${historyItem.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !trackingData) {
    return (
      <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Health Tracking Panel...
      </div>
    );
  }

  const patient = trackingData?.patient;
  const currentVitals = trackingData?.vitals?.current;
  const history = trackingData?.history || [];

  // Vitals norm assessment
  const isHrAboveNorm = (currentVitals?.heartRate || 75) > 100;
  const isBpAboveNorm = (() => {
    const sys = parseInt((currentVitals?.bloodPressure || '120/80').split('/')[0] || '120', 10);
    return sys > 130;
  })();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.6rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginRight: '0.5rem',
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <span style={{ color: 'var(--text-muted)' }}>Patient</span>
          <ChevronRight size={14} color="var(--text-muted)" />
          <span style={{ color: 'var(--text-muted)' }}>Patient Details</span>
          <ChevronRight size={14} color="var(--text-muted)" />
          <strong style={{ color: 'var(--text-primary)' }}>{patient?.name}</strong>
        </div>

        {/* Doctor / Admin patient selector */}
        {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && allPatients.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Select Patient:
            </span>
            <select
              value={selectedPatientId ?? patient?.id}
              onChange={(e) => handleSelectPatient(Number(e.target.value))}
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.4rem 0.75rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {allPatients.map((p) => (
                <option key={p.patient.id} value={p.patient.id}>
                  {p.patient.name} ({p.patient.bloodGroup || 'Blood A+'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Grid: Left Sidebar + Right Content */}
      <div
        className="patient-tracking-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Sidebar Menu */}
        <aside
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: '1.5rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Logo & Tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              className="tracking-summary-grid"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Heart size={18} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Health Care<span style={{ color: 'var(--primary)' }}>_</span>
            </span>
          </div>

          {/* Attending Doctor Profile Widget */}
          <div
            className="tracking-vitals-grid"
            style={{
              background: 'var(--bg-card-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: '1rem',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                margin: '0 auto 0.75rem',
                overflow: 'hidden',
                border: '2px solid var(--primary)',
                position: 'relative',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80"
                alt="Dr. Richa Linda"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: '52px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#f59e0b',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              }}
            >
              <span>4.5</span>
              <span>★</span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', marginTop: '0.5rem' }}>
              Dr. Richa Linda
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              MD, DM (Cardiology)
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'dashboard' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Activity size={17} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('patient')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'patient' ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                color: activeTab === 'patient' ? '#ef4444' : 'var(--text-secondary)',
                borderLeft: activeTab === 'patient' ? '3px solid #ef4444' : '3px solid transparent',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <User size={17} />
              <span>Patient Tracking</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'schedule' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'schedule' ? 'var(--primary)' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Calendar size={17} />
              <span>Schedule</span>
            </button>

            <button
              onClick={() => setActiveTab('statistics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === 'statistics' ? 'var(--primary-light)' : 'transparent',
                color: activeTab === 'statistics' ? 'var(--primary)' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <TrendingUp size={17} />
              <span>Statistics</span>
            </button>
          </nav>

          {/* Membership Card Widget */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem',
              marginTop: 'auto',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>20 Days Left</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Extend your clinical plan
            </div>
            <button
              onClick={() => alert('Clinical Plan Active: Premium Hospital Care Protocol.')}
              style={{
                marginTop: '0.85rem',
                background: 'white',
                color: '#0f172a',
                border: 'none',
                borderRadius: '999px',
                padding: '0.4rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Check Now
            </button>
          </div>
        </aside>

        {/* Right Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Patient Details Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '2rem',
              alignItems: 'center',
            }}
          >
            {/* Left Avatar & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  boxShadow: 'var(--shadow-md)',
                  flexShrink: 0,
                }}
              >
                {patient?.avatarUrl ? (
                  <img
                    src={patient.avatarUrl}
                    alt={patient.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80"
                    alt={patient?.name || 'Patient'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                  {patient?.name}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {patient?.email}
                </div>
                <button
                  onClick={onOpenEditProfile}
                  style={{
                    marginTop: '0.65rem',
                    background: 'transparent',
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    borderRadius: '999px',
                    padding: '0.35rem 0.9rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Right Meta Data Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.25rem 1.5rem',
                borderLeft: '1px solid var(--border)',
                paddingLeft: '2rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sex</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{patient?.gender || 'Female'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Age</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{patient?.age || 28}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Blood</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{patient?.bloodGroup || 'A+'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px', color: '#10b981' }}>{patient?.status || 'Active'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Department</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{patient?.department || 'Cardiology'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Registered Date</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{patient?.registeredDate || '20 Jan, 2023'}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Appointment</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{patient?.totalAppointments || 35}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bed Number</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{patient?.bedNumber || '#0365'}</div>
              </div>
            </div>
          </div>

          {/* Patient Current Vitals Section */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.9rem',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Patient Current Vitals
              </h3>
              <button
                onClick={() => setShowVitalsModal(true)}
                style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Plus size={15} />
                Record Vitals
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
              }}
            >
              {/* Blood Pressure */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Blood Pressure
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                    {currentVitals?.bloodPressure || '120/89'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>mm/hg</span>
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginTop: '0.4rem',
                    color: isBpAboveNorm ? '#ef4444' : '#10b981',
                  }}
                >
                  {isBpAboveNorm ? 'Above the norm' : 'In the norm'}
                </div>
              </div>

              {/* Heart rate */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Heart rate
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                    {currentVitals?.heartRate || 120}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>BPM</span>
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginTop: '0.4rem',
                    color: isHrAboveNorm ? '#ef4444' : '#10b981',
                  }}
                >
                  {isHrAboveNorm ? 'Above the norm' : 'In the norm'}
                </div>
              </div>

              {/* Glucose */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Glucose
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                    {currentVitals?.glucose || 97}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>mg/dl</span>
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginTop: '0.4rem',
                    color: '#10b981',
                  }}
                >
                  In the norm
                </div>
              </div>

              {/* Cholesterol */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Cholesterol
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.4rem' }}>
                  <span style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                    {currentVitals?.cholesterol || 85}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>mg/dl</span>
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginTop: '0.4rem',
                    color: '#10b981',
                  }}
                >
                  In the norm
                </div>
              </div>
            </div>
          </div>

          {/* Patient History Section */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                Patient History
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Total {patient?.totalAppointments || 35} Visits
              </span>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Date Of Visit</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Diagnosis</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Severity</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Total Visits</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                        {item.date}
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>
                        {item.diagnosis}
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            background:
                              item.severity === 'High'
                                ? 'rgba(239, 68, 68, 0.1)'
                                : item.severity === 'Medium'
                                ? 'rgba(245, 158, 11, 0.1)'
                                : 'rgba(16, 185, 129, 0.1)',
                            color:
                              item.severity === 'High'
                                ? '#ef4444'
                                : item.severity === 'Medium'
                                ? '#f59e0b'
                                : '#10b981',
                            borderLeft: `3px solid ${
                              item.severity === 'High'
                                ? '#ef4444'
                                : item.severity === 'Medium'
                                ? '#f59e0b'
                                : '#10b981'
                            }`,
                          }}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {item.totalVisits || (idx + 1)}
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.65rem',
                            borderRadius: '999px',
                            background:
                              item.status === 'Cured'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(239, 68, 68, 0.12)',
                            color: item.status === 'Cured' ? '#10b981' : '#ef4444',
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDownloadReport(item)}
                          title="Download Visit Summary"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <Download size={14} color="var(--primary)" />
                          <span>Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Record Vitals Modal */}
      {showVitalsModal && (
        <div className="modal-overlay" onClick={() => setShowVitalsModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Record Patient Vitals
              </h3>
              <button
                onClick={() => setShowVitalsModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Blood Pressure (mm/hg)</label>
                <input
                  type="text"
                  className="form-input"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  placeholder="e.g. 120/80"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={hr}
                    onChange={(e) => setHr(Number(e.target.value))}
                    min={30}
                    max={250}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Glucose (mg/dl)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={glucose}
                    onChange={(e) => setGlucose(Number(e.target.value))}
                    min={20}
                    max={600}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Cholesterol (mg/dl)</label>
                <input
                  type="number"
                  className="form-input"
                  value={cholesterol}
                  onChange={(e) => setCholesterol(Number(e.target.value))}
                  min={20}
                  max={600}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={vitalsNotes}
                  onChange={(e) => setVitalsNotes(e.target.value)}
                  placeholder="e.g. After treadmill test or morning routine check"
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="btn btn-secondary"
                  disabled={recordingVitals}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={recordingVitals}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Check size={16} />
                  <span>{recordingVitals ? 'Saving...' : 'Save Vitals'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
