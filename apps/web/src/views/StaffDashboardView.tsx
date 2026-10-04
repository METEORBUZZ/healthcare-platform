import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useShiftAssignment } from '../hooks/useShiftAssignment';
import {
  hospitalOperationsService,
  type StaffRecord,
  type WardBedRecord,
  type ReceptionQueueRecord,
  type PrescriptionQueueRecord,
  type MedicineStockRecord,
  type LaboratoryTestRecord,
} from '../utils/hospitalOperationsService';
import {
  Clock,
  MapPin,
  Calendar,
  Building,
  HeartPulse,
  ClipboardList,
  Pill,
  Microscope,
  CheckCircle,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export const StaffDashboardView: React.FC = () => {
  const { user } = useAuth();
  const {
    assignment: shiftAssignment,
    error: shiftSyncError,
    refresh: refreshShift,
  } = useShiftAssignment(user?.id);
  const [staff, setStaff] = useState<StaffRecord | null>(null);

  // Nurse state
  const [wardBeds, setWardBeds] = useState<WardBedRecord[]>([]);
  const [selectedBed, setSelectedBed] = useState<WardBedRecord | null>(null);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showNursingNoteModal, setShowNursingNoteModal] = useState(false);
  const [vitalsBp, setVitalsBp] = useState('120/80 mmHg');
  const [vitalsPulse, setVitalsPulse] = useState(72);
  const [vitalsTemp, setVitalsTemp] = useState('98.6 °F');
  const [vitalsSpO2, setVitalsSpO2] = useState(98);
  const [nursingNoteText, setNursingNoteText] = useState('');

  // Receptionist state
  const [receptionQueue, setReceptionQueue] = useState<ReceptionQueueRecord[]>([]);
  const [showPatientRegModal, setShowPatientRegModal] = useState(false);
  const [newPtName, setNewPtName] = useState('');
  const [newPtPhone, setNewPtPhone] = useState('');
  const [newPtDept, setNewPtDept] = useState('Cardiology');
  const [newPtDoctor, setNewPtDoctor] = useState('Dr. Priya Sharma');
  const [newPtTime, setNewPtTime] = useState('10:00 AM');

  // Pharmacist state
  const [rxQueue, setRxQueue] = useState<PrescriptionQueueRecord[]>([]);
  const [medicineStock, setMedicineStock] = useState<MedicineStockRecord[]>([]);
  const [stockSearch, setStockSearch] = useState('');

  // Laboratory state
  const [labTests, setLabTests] = useState<LaboratoryTestRecord[]>([]);
  const [selectedLabTest, setSelectedLabTest] = useState<LaboratoryTestRecord | null>(null);
  const [showLabResultModal, setShowLabResultModal] = useState(false);
  const [labResultSummary, setLabResultSummary] = useState('');
  const [labFindings, setLabFindings] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const email = user?.email || 'nurse@demo.test';
    const matchingStaff = hospitalOperationsService.getStaffByEmail(email);
    const fallback = hospitalOperationsService.getStaff()[0];
    const role: StaffRecord['role'] =
      user?.role === 'NURSE'
        ? 'NURSE'
        : user?.role === 'RECEPTIONIST'
          ? 'RECEPTIONIST'
          : user?.role === 'PHARMACIST'
            ? 'PHARMACIST'
            : user?.role === 'LABORATORY_STAFF'
              ? 'LABORATORY_STAFF'
              : 'STAFF';
    const staffType: StaffRecord['staffType'] =
      role === 'NURSE'
        ? 'Nurse'
        : role === 'RECEPTIONIST'
          ? 'Receptionist'
          : role === 'PHARMACIST'
            ? 'Pharmacist'
            : role === 'LABORATORY_STAFF'
              ? 'Laboratory Staff'
              : 'Administrative Staff';
    const s =
      matchingStaff ??
      (fallback
        ? {
            ...fallback,
            userId: user?.id ?? fallback.userId,
            name: user?.name ?? fallback.name,
            email: user?.email ?? fallback.email,
            role,
            staffType,
          }
        : undefined);
    setStaff(s || null);

    setWardBeds(hospitalOperationsService.getWardBeds());
    setReceptionQueue(hospitalOperationsService.getReceptionQueue());
    setRxQueue(hospitalOperationsService.getPrescriptionQueue());
    setMedicineStock(hospitalOperationsService.getMedicineStock());
    setLabTests(hospitalOperationsService.getLaboratoryTests());
  }, [user]);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('niramaya:hospital-operations-updated', handleUpdate);
    return () => window.removeEventListener('niramaya:hospital-operations-updated', handleUpdate);
  }, [loadData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nurse Actions
  const handleOpenVitalsModal = (bed: WardBedRecord) => {
    setSelectedBed(bed);
    setVitalsBp(bed.vitals.bp);
    setVitalsPulse(bed.vitals.pulse);
    setVitalsTemp(bed.vitals.temp);
    setVitalsSpO2(bed.vitals.spO2);
    setShowVitalsModal(true);
  };

  const handleSaveVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed) return;
    hospitalOperationsService.updateBedVitals(selectedBed.id, {
      bp: vitalsBp,
      pulse: Number(vitalsPulse),
      temp: vitalsTemp,
      spO2: Number(vitalsSpO2),
    });
    showToast(`Vitals updated for ${selectedBed.patientName} (${selectedBed.bedNumber}).`);
    setShowVitalsModal(false);
    loadData();
  };

  const handleOpenNursingNoteModal = (bed: WardBedRecord) => {
    setSelectedBed(bed);
    setNursingNoteText('');
    setShowNursingNoteModal(true);
  };

  const handleSaveNursingNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBed || !nursingNoteText.trim()) return;
    hospitalOperationsService.addNursingNote(
      selectedBed.id,
      nursingNoteText.trim(),
      staff?.name || 'Sister Anjali Nair',
    );
    showToast(`Bedside care note recorded for ${selectedBed.bedNumber}.`);
    setShowNursingNoteModal(false);
    loadData();
  };

  // Receptionist Actions
  const handleCheckIn = (id: number) => {
    hospitalOperationsService.checkInPatient(id);
    showToast('Patient marked as Checked In.');
    loadData();
  };

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPtName.trim()) return;
    const item = hospitalOperationsService.registerInternalPatient({
      patientName: newPtName.trim(),
      phone: newPtPhone.trim(),
      department: newPtDept,
      doctorName: newPtDoctor,
      appointmentTime: newPtTime,
    });
    showToast(`Patient registered! Token Generated: ${item.tokenNumber}.`);
    setShowPatientRegModal(false);
    setNewPtName('');
    setNewPtPhone('');
    loadData();
  };

  // Pharmacist Actions
  const handleDispense = (id: number) => {
    hospitalOperationsService.dispensePrescription(id, staff?.name || 'Pooja Sundaram');
    showToast(`Prescription dispensed and logged in pharmacy register.`);
    loadData();
  };

  // Laboratory Staff Actions
  const handleOpenLabResultModal = (test: LaboratoryTestRecord) => {
    setSelectedLabTest(test);
    setLabResultSummary(test.resultSummary || '');
    setLabFindings(test.findings || '');
    setShowLabResultModal(true);
  };

  const handleSaveLabResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLabTest || !labResultSummary.trim()) return;
    hospitalOperationsService.updateLabResult(
      selectedLabTest.id,
      labResultSummary.trim(),
      labFindings.trim(),
    );
    showToast(
      `Diagnostic results uploaded for ${selectedLabTest.patientName} (${selectedLabTest.testName}).`,
    );
    setShowLabResultModal(false);
    loadData();
  };

  if (!staff) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Staff Operations Console...</p>
      </div>
    );
  }

  const staffRole = user?.role || staff.role;
  const currentStaff = shiftAssignment
    ? {
        ...staff,
        todayShift: shiftAssignment.shiftName,
        shiftHours: shiftAssignment.shiftHours,
        breakTime: shiftAssignment.breakTime,
        workingDays: shiftAssignment.workingDays,
        workingLocation: shiftAssignment.workingLocation,
        assignedArea: shiftAssignment.roomArea,
      }
    : staff;

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* ─── Top Staff Profile Bar ────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          background:
            'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(2, 132, 199, 0.05) 100%)',
          border: '1px solid rgba(5, 150, 105, 0.25)',
          borderRadius: '1.25rem',
          padding: '1.5rem 1.75rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img
            src={
              staff.avatarUrl ||
              'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400'
            }
            alt={staff.name}
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '16px',
              objectFit: 'cover',
              border: '2px solid #059669',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                {staff.name}
              </h1>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <CheckCircle size={12} /> {staff.status}
              </span>
              <span
                style={{
                  background: 'rgba(5, 150, 105, 0.15)',
                  color: '#059669',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {staff.employeeId}
              </span>
            </div>
            <div
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-secondary)',
                marginTop: '0.25rem',
                fontWeight: 600,
              }}
            >
              Staff Designation: <strong>{staff.staffType}</strong> ({staff.department})
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Working Location: {currentStaff.workingLocation} · Assigned Area:{' '}
              {currentStaff.assignedArea} · {staff.phone}
            </div>
          </div>
        </div>

        {/* Staff Role Badge */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '0.65rem 1.1rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
              {staff.staffType}
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              Active Assignment
            </div>
          </div>
        </div>
      </div>

      {/* ─── Dedicated "My Shift" Section (Read-Only for Staff, Admin Controls) ─── */}
      <div
        className="card"
        style={{
          background:
            'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(13, 148, 136, 0.05) 100%)',
          border: '2px solid rgba(5, 150, 105, 0.25)',
          borderRadius: '1.25rem',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(5, 150, 105, 0.15)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                Staff Shift & Station Roster
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Assigned by Hospital Administration · Read-Only Access
              </span>
            </div>
          </div>
          {shiftAssignment && (
            <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
              Auto-synced · updated {new Date(shiftAssignment.updatedAt).toLocaleTimeString()}
            </span>
          )}
          <span
            style={{
              background: 'rgba(5, 150, 105, 0.15)',
              color: '#059669',
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ShieldCheck size={14} /> Hospital Administration Enforced
          </span>
        </div>

        {shiftSyncError && (
          <div role="alert" style={{ marginBottom: '1rem', color: '#b91c1c', fontSize: '0.85rem' }}>
            Shift updates could not be synchronized: {shiftSyncError}{' '}
            <button
              type="button"
              onClick={() => void refreshShift()}
              style={{ color: 'inherit', fontWeight: 700 }}
            >
              Retry
            </button>
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Clock size={13} color="#059669" /> Today's Shift
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: '0.3rem',
              }}
            >
              {currentStaff.todayShift}
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: '#059669',
                fontWeight: 700,
                marginTop: '0.15rem',
              }}
            >
              {currentStaff.shiftHours}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <MapPin size={13} color="#0284c7" /> Working Location
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: '0.3rem',
              }}
            >
              {currentStaff.workingLocation}
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: '#0284c7',
                fontWeight: 700,
                marginTop: '0.15rem',
              }}
            >
              {staff.department}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Building size={13} color="#d97706" /> Assigned Area / Room
            </div>
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: '0.3rem',
              }}
            >
              {currentStaff.assignedArea}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Break: {currentStaff.breakTime}
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Calendar size={13} color="#7c3aed" /> Next Scheduled Shift
            </div>
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginTop: '0.3rem',
              }}
            >
              {staff.nextShift}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Roster: {currentStaff.workingDays}
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROLE-SPECIFIC WORK ASSIGNMENT MODULES ──────────────────────────── */}

      {/* 1. NURSE DASHBOARD WORKSPACE */}
      {(staffRole === 'NURSE' || staff.staffType === 'Nurse') && (
        <div className="card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={22} color="#059669" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Inpatient Ward & Bedside Care Management
                </h2>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {staff.assignedArea} · Bedside vitals, patient monitoring, and nursing progress
                notes.
              </div>
            </div>
            <span className="badge badge-info">{wardBeds.length} Active Inpatients</span>
          </div>

          <div
            className="ward-bed-grid"
            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.25rem' }}
          >
            {wardBeds.map((bed) => {
              const statusColor = {
                Stable: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
                'Needs Observation': { bg: 'rgba(245, 158, 11, 0.15)', text: '#d97706' },
                Critical: { bg: 'rgba(239, 68, 68, 0.15)', text: '#dc2626' },
              }[bed.status];

              return (
                <div
                  key={bed.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    background: 'var(--bg-card)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.65rem',
                    }}
                  >
                    <span
                      style={{
                        background: '#059669',
                        color: 'white',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                      }}
                    >
                      {bed.bedNumber}
                    </span>
                    <span
                      style={{
                        background: statusColor.bg,
                        color: statusColor.text,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      ● {bed.status}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      margin: '0 0 0.2rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {bed.patientName}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.65rem',
                    }}
                  >
                    {bed.patientId} · {bed.gender}, {bed.age} yrs · Dr: {bed.attendingDoctor}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-card-subtle)',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      marginBottom: '0.85rem',
                    }}
                  >
                    <strong>Diagnosis:</strong> {bed.diagnosis}
                  </div>

                  {/* Vitals Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.4rem',
                      textAlign: 'center',
                      marginBottom: '1rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(2, 132, 199, 0.08)',
                        padding: '0.4rem 0.2rem',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>BP</div>
                      <div style={{ fontWeight: 800, color: '#0284c7' }}>
                        {bed.vitals.bp.split(' ')[0]}
                      </div>
                    </div>
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        padding: '0.4rem 0.2rem',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Pulse</div>
                      <div style={{ fontWeight: 800, color: '#dc2626' }}>
                        {bed.vitals.pulse} bpm
                      </div>
                    </div>
                    <div
                      style={{
                        background: 'rgba(245, 158, 11, 0.08)',
                        padding: '0.4rem 0.2rem',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>Temp</div>
                      <div style={{ fontWeight: 800, color: '#d97706' }}>{bed.vitals.temp}</div>
                    </div>
                    <div
                      style={{
                        background: 'rgba(16, 185, 129, 0.08)',
                        padding: '0.4rem 0.2rem',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>SpO2</div>
                      <div style={{ fontWeight: 800, color: '#10b981' }}>{bed.vitals.spO2}%</div>
                    </div>
                  </div>

                  {/* Recent Nursing Notes snippet */}
                  {bed.nursingNotes.length > 0 && bed.nursingNotes[0] && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '1rem',
                        borderLeft: '2px solid #059669',
                        paddingLeft: '0.5rem',
                      }}
                    >
                      <strong>{bed.nursingNotes[0].time}:</strong> {bed.nursingNotes[0].note}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenVitalsModal(bed)}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, borderRadius: '8px', fontSize: '0.75rem' }}
                    >
                      <Activity size={13} /> Update Vitals
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenNursingNoteModal(bed)}
                      className="btn btn-primary btn-sm"
                      style={{
                        flex: 1,
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        background: '#059669',
                      }}
                    >
                      <PlusCircle size={13} /> Add Note
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. RECEPTIONIST DASHBOARD WORKSPACE */}
      {(staffRole === 'RECEPTIONIST' || staff.staffType === 'Receptionist') && (
        <div className="card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={22} color="#d97706" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Hospital Reception & Patient Check-In Counter
                </h2>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {staff.assignedArea} · Triage tokens, appointment check-in, and patient
                registration.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPatientRegModal(true)}
              className="btn btn-primary btn-sm"
              style={{
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                border: 'none',
                fontWeight: 700,
              }}
            >
              <PlusCircle size={15} /> + Register New Patient (Check-In)
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '0.75rem 0.6rem' }}>Token</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Patient Name & ID</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Contact</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Department & Doctor</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Appt. Time</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receptionQueue.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.85rem 0.6rem' }}>
                      <span
                        style={{
                          background: '#d97706',
                          color: '#fff',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: 800,
                        }}
                      >
                        {item.tokenNumber}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.6rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                        {item.patientName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#0284c7' }}>{item.patientId}</div>
                    </td>
                    <td style={{ padding: '0.85rem 0.6rem', color: 'var(--text-secondary)' }}>
                      {item.phone}
                    </td>
                    <td style={{ padding: '0.85rem 0.6rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.doctorName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {item.department}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.6rem' }}>{item.appointmentTime}</td>
                    <td style={{ padding: '0.85rem 0.6rem' }}>
                      <span
                        className={`badge ${
                          item.status === 'Checked In'
                            ? 'badge-success'
                            : item.status === 'In Consultation'
                              ? 'badge-info'
                              : 'badge-warning'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.6rem', textAlign: 'right' }}>
                      {item.status === 'Scheduled' && (
                        <button
                          type="button"
                          onClick={() => handleCheckIn(item.id)}
                          className="btn btn-primary btn-sm"
                          style={{
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            background: '#059669',
                          }}
                        >
                          <CheckCircle2 size={13} /> Check In
                        </button>
                      )}
                      {item.status === 'Checked In' && (
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                          ✓ At Waiting Area
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PHARMACIST DASHBOARD WORKSPACE */}
      {(staffRole === 'PHARMACIST' || staff.staffType === 'Pharmacist') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Prescription Queue */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Pill size={22} color="#2563eb" />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    Inpatient & OPD Prescription Dispensing Queue
                  </h2>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {staff.assignedArea} · Prescriptions transmitted by doctors for verification and
                  medicine dispensing.
                </div>
              </div>
              <span className="badge badge-warning">
                {rxQueue.filter((r) => r.status === 'Pending').length} Pending Prescriptions
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {rxQueue.map((rx) => (
                <div
                  key={rx.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '1.25rem',
                    background:
                      rx.status === 'Pending' ? 'rgba(37, 99, 235, 0.03)' : 'var(--bg-card)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2563eb' }}>
                      {rx.prescriptionId}
                    </span>
                    <span
                      style={{
                        background:
                          rx.status === 'Pending'
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                        color: rx.status === 'Pending' ? '#d97706' : '#10b981',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      ● {rx.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.2rem' }}>
                    {rx.patientName}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {rx.patientId} · Prescribed by: {rx.doctorName} ({rx.department}) at{' '}
                    {rx.prescribedTime}
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-card-subtle)',
                      borderRadius: '10px',
                      padding: '0.75rem',
                      marginBottom: '1rem',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Prescribed Formulary:
                    </div>
                    {rx.medicines.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          borderBottom:
                            i < rx.medicines.length - 1 ? '1px dashed var(--border)' : 'none',
                          padding: '0.3rem 0',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#2563eb' }}>
                          {m.name} ({m.dosage})
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Qty: {m.quantity} · {m.instructions}
                        </div>
                      </div>
                    ))}
                  </div>

                  {rx.status === 'Pending' ? (
                    <button
                      type="button"
                      onClick={() => handleDispense(rx.id)}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        borderRadius: '10px',
                        background: '#2563eb',
                        fontWeight: 700,
                      }}
                    >
                      <CheckCircle2 size={15} /> Dispense Medication & Log
                    </button>
                  ) : (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#10b981',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      ✓ Dispensed by {rx.dispensedBy} at {rx.dispensedAt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Medicine Stock Inventory */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  Hospital Formulary & Medicine Stock
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Stock levels and reorder alerts.
                </div>
              </div>
              <input
                type="text"
                placeholder="Search medication..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card-subtle)',
                  fontSize: '0.85rem',
                }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '2px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <th style={{ padding: '0.65rem' }}>Medication Name</th>
                    <th style={{ padding: '0.65rem' }}>Category</th>
                    <th style={{ padding: '0.65rem' }}>In Stock</th>
                    <th style={{ padding: '0.65rem' }}>Reorder Level</th>
                    <th style={{ padding: '0.65rem' }}>Expiry Date</th>
                    <th style={{ padding: '0.65rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {medicineStock
                    .filter((m) => m.name.toLowerCase().includes(stockSearch.toLowerCase()))
                    .map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td
                          style={{
                            padding: '0.65rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {item.name}
                        </td>
                        <td style={{ padding: '0.65rem', color: 'var(--text-secondary)' }}>
                          {item.category}
                        </td>
                        <td
                          style={{
                            padding: '0.65rem',
                            fontWeight: 800,
                            color:
                              item.stock <= item.reorderLevel ? '#dc2626' : 'var(--text-primary)',
                          }}
                        >
                          {item.stock} {item.unit}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          {item.reorderLevel} {item.unit}
                        </td>
                        <td style={{ padding: '0.65rem', color: 'var(--text-muted)' }}>
                          {item.expiryDate}
                        </td>
                        <td style={{ padding: '0.65rem' }}>
                          {item.stock <= item.reorderLevel ? (
                            <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                              Low Stock
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                              Sufficient
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. LABORATORY STAFF DASHBOARD WORKSPACE */}
      {(staffRole === 'LABORATORY_STAFF' || staff.staffType === 'Laboratory Staff') && (
        <div className="card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Microscope size={22} color="#db2777" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Diagnostic Pathology & Laboratory Testing Queue
                </h2>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {staff.assignedArea} · Sample collection, biochemical analysis, and reporting.
              </div>
            </div>
            <span className="badge badge-info">{labTests.length} Total Test Requests</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.76rem',
                    textTransform: 'uppercase',
                  }}
                >
                  <th style={{ padding: '0.75rem 0.6rem' }}>Test ID</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Patient Name & ID</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Test Name</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Sample Type</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Priority</th>
                  <th style={{ padding: '0.75rem 0.6rem' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {labTests.map((test) => (
                  <tr key={test.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.85rem 0.6rem', fontWeight: 800, color: '#db2777' }}>
                      {test.testId}
                    </td>
                    <td style={{ padding: '0.85rem 0.6rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                        {test.patientName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {test.patientId} · Ref: {test.doctorName}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '0.85rem 0.6rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {test.testName}
                    </td>
                    <td style={{ padding: '0.85rem 0.6rem', color: 'var(--text-secondary)' }}>
                      {test.sampleType}
                    </td>
                    <td style={{ padding: '0.85rem 0.6rem' }}>
                      <span
                        style={{
                          background:
                            test.priority === 'STAT Emergency'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(2, 132, 199, 0.12)',
                          color: test.priority === 'STAT Emergency' ? '#dc2626' : '#0284c7',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        {test.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.6rem' }}>
                      <span
                        className={`badge ${
                          test.status === 'Completed'
                            ? 'badge-success'
                            : test.status === 'In Analysis'
                              ? 'badge-info'
                              : 'badge-warning'
                        }`}
                      >
                        {test.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 0.6rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenLabResultModal(test)}
                        className="btn btn-primary btn-sm"
                        style={{
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          background: '#db2777',
                          border: 'none',
                        }}
                      >
                        {test.status === 'Completed' ? 'View / Edit Results' : 'Enter Results'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: UPDATE VITALS (NURSE) ─────────────────────────────────── */}
      {showVitalsModal && selectedBed && (
        <div
          className="modal-overlay"
          onClick={() => setShowVitalsModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.2rem', fontWeight: 800 }}>
              Update Vitals: {selectedBed.patientName} ({selectedBed.bedNumber})
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Real-time bedside vitals entry for patient monitoring telemetry.
            </p>

            <form onSubmit={handleSaveVitals}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                    }}
                  >
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    required
                    value={vitalsBp}
                    onChange={(e) => setVitalsBp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                    }}
                  >
                    Pulse Rate (BPM)
                  </label>
                  <input
                    type="number"
                    required
                    value={vitalsPulse}
                    onChange={(e) => setVitalsPulse(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                    }}
                  >
                    Temperature
                  </label>
                  <input
                    type="text"
                    required
                    value={vitalsTemp}
                    onChange={(e) => setVitalsTemp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                    }}
                  >
                    Oxygen SpO2 (%)
                  </label>
                  <input
                    type="number"
                    required
                    value={vitalsSpO2}
                    onChange={(e) => setVitalsSpO2(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="btn btn-secondary"
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: '10px', background: '#059669' }}
                >
                  Save Bedside Vitals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD NURSING NOTE (NURSE) ──────────────────────────────── */}
      {showNursingNoteModal && selectedBed && (
        <div
          className="modal-overlay"
          onClick={() => setShowNursingNoteModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px' }}
          >
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.2rem', fontWeight: 800 }}>
              Bedside Nursing Care Note: {selectedBed.bedNumber}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Patient: {selectedBed.patientName} ({selectedBed.diagnosis})
            </p>

            <form onSubmit={handleSaveNursingNote}>
              <div style={{ marginBottom: '1.2rem' }}>
                <textarea
                  rows={4}
                  required
                  placeholder="Record nursing intervention, catheter checks, infusion changes, or patient status..."
                  value={nursingNoteText}
                  onChange={(e) => setNursingNoteText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNursingNoteModal(false)}
                  className="btn btn-secondary"
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: '10px', background: '#059669' }}
                >
                  Log Nursing Care
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTER PATIENT (RECEPTIONIST) ───────────────────────── */}
      {showPatientRegModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPatientRegModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.25rem', fontWeight: 800 }}>
              Hospital Walk-in Registration & Token Issue
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Issue outpatient queue token and create hospital check-in record.
            </p>

            <form onSubmit={handleRegisterPatient}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '0.35rem',
                  }}
                >
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand K. Shrestha"
                  value={newPtName}
                  onChange={(e) => setNewPtName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                    }}
                  >
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98..."
                    value={newPtPhone}
                    onChange={(e) => setNewPtPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                    }}
                  >
                    Time Slot
                  </label>
                  <input
                    type="text"
                    required
                    value={newPtTime}
                    onChange={(e) => setNewPtTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                    }}
                  >
                    Department
                  </label>
                  <select
                    value={newPtDept}
                    onChange={(e) => setNewPtDept(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Emergency & Trauma">Emergency & Trauma</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                    }}
                  >
                    Attending Doctor
                  </label>
                  <select
                    value={newPtDoctor}
                    onChange={(e) => setNewPtDoctor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    <option value="Dr. Priya Sharma">Dr. Priya Sharma</option>
                    <option value="Dr. Rajesh Patel">Dr. Rajesh Patel</option>
                    <option value="Dr. Amit Singh">Dr. Amit Singh</option>
                    <option value="Dr. Sunita Deshmukh">Dr. Sunita Deshmukh</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPatientRegModal(false)}
                  className="btn btn-secondary"
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: '10px', background: '#d97706' }}
                >
                  Issue Token & Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ENTER LAB RESULT (LAB STAFF) ──────────────────────────── */}
      {showLabResultModal && selectedLabTest && (
        <div
          className="modal-overlay"
          onClick={() => setShowLabResultModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.25rem', fontWeight: 800 }}>
              Diagnostic Lab Report: {selectedLabTest.testName}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Patient: {selectedLabTest.patientName} ({selectedLabTest.patientId}) · Sample:{' '}
              {selectedLabTest.sampleType}
            </p>

            <form onSubmit={handleSaveLabResult}>
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '0.35rem',
                  }}
                >
                  Quantitative Results & Reference Ranges *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Hb: 13.8 g/dL (Normal: 12-16), WBC: 6,800/mcL (Normal: 4000-11000)..."
                  value={labResultSummary}
                  onChange={(e) => setLabResultSummary(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    marginBottom: '0.35rem',
                  }}
                >
                  Pathologist Findings & Impressions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mild normocytic anemia. No toxic granules detected."
                  value={labFindings}
                  onChange={(e) => setLabFindings(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowLabResultModal(false)}
                  className="btn btn-secondary"
                  style={{ borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: '10px', background: '#db2777' }}
                >
                  Upload & Sign Lab Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            zIndex: 9999,
          }}
        >
          <div
            style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}
          />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
