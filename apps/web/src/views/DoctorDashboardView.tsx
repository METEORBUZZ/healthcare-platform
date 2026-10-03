import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  hospitalOperationsService,
  type DoctorRecord,
  type AssignedPatientRecord,
} from '../utils/hospitalOperationsService';
import {
  Clock,
  MapPin,
  Calendar,
  User,
  CheckCircle,
  FileText,
  Pill,
  Activity,
  History,
  PlusCircle,
  Search,
  X,
  ShieldCheck,
  Coffee,
  CheckCircle2,
} from 'lucide-react';

export const DoctorDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<DoctorRecord | null>(null);
  const [patients, setPatients] = useState<AssignedPatientRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'Routine' | 'Urgent' | 'STAT Emergency'>('ALL');

  // Active Modals
  const [selectedPatient, setSelectedPatient] = useState<AssignedPatientRecord | null>(null);
  const [activeModal, setActiveModal] = useState<
    'VIEW_PATIENT' | 'VIEW_HISTORY' | 'VIEW_RECORDS' | 'ADD_DIAGNOSIS' | 'ADD_PRESCRIPTION' | 'VIEW_LABS' | 'ADD_NOTES' | 'UPDATE_TREATMENT' | 'VIEW_APPT_HISTORY' | null
  >(null);

  // Form states for modals
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [treatmentInput, setTreatmentInput] = useState('');
  const [rxMedication, setRxMedication] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxFrequency, setRxFrequency] = useState('Once daily');
  const [rxDuration, setRxDuration] = useState('30 days');
  const [rxInstructions, setRxInstructions] = useState('Take post-meals with water.');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const email = user?.email || 'doctor@demo.test';
    const doc = hospitalOperationsService.getDoctorByEmail(email) || hospitalOperationsService.getDoctors()[0];
    setDoctor(doc || null);

    if (doc) {
      const assigned = hospitalOperationsService.getDoctorPatients(doc.id);
      setPatients(assigned);
    }
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

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenModal = (
    patient: AssignedPatientRecord,
    modalType: 'VIEW_PATIENT' | 'VIEW_HISTORY' | 'VIEW_RECORDS' | 'ADD_DIAGNOSIS' | 'ADD_PRESCRIPTION' | 'VIEW_LABS' | 'ADD_NOTES' | 'UPDATE_TREATMENT' | 'VIEW_APPT_HISTORY'
  ) => {
    setSelectedPatient(patient);
    setActiveModal(modalType);
    if (modalType === 'ADD_DIAGNOSIS') setDiagnosisInput(patient.diagnosis || '');
    if (modalType === 'ADD_NOTES') setNoteInput('');
    if (modalType === 'UPDATE_TREATMENT') setTreatmentInput(patient.diagnosis ? `Continue therapy for ${patient.diagnosis}.` : '');
    if (modalType === 'ADD_PRESCRIPTION') {
      setRxMedication('');
      setRxDosage('');
      setRxFrequency('Once daily (morning)');
      setRxDuration('30 days');
      setRxInstructions('Take post-meals with water.');
    }
  };

  const handleSaveDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !diagnosisInput.trim()) return;
    hospitalOperationsService.addDiagnosis(selectedPatient.id, diagnosisInput.trim());
    showToast(`Diagnosis successfully updated for ${selectedPatient.name}.`);
    setActiveModal(null);
    loadData();
  };

  const handleSavePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !rxMedication.trim() || !rxDosage.trim()) return;
    hospitalOperationsService.addPrescription(selectedPatient.id, {
      medication: rxMedication.trim(),
      dosage: rxDosage.trim(),
      frequency: rxFrequency,
      duration: rxDuration,
      instructions: rxInstructions.trim(),
    });
    showToast(`Prescription saved and transmitted to Central Pharmacy queue.`);
    setActiveModal(null);
    loadData();
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !noteInput.trim()) return;
    hospitalOperationsService.addMedicalNote(selectedPatient.id, noteInput.trim(), doctor?.name || 'Dr. Priya Sharma');
    showToast(`Clinical note saved to patient record.`);
    setActiveModal(null);
    loadData();
  };

  const handleSaveTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !treatmentInput.trim()) return;
    hospitalOperationsService.addMedicalNote(selectedPatient.id, `[TREATMENT UPDATE]: ${treatmentInput.trim()}`, doctor?.name || 'Dr. Priya Sharma');
    showToast(`Treatment plan updated for ${selectedPatient.name}.`);
    setActiveModal(null);
    loadData();
  };

  const handleStatusChange = (patientId: number, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    hospitalOperationsService.updateAppointmentStatus(patientId, status);
    showToast(`Appointment status updated to ${status}.`);
    loadData();
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);
    const matchesPriority = priorityFilter === 'ALL' || p.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  if (!doctor) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Doctor Clinical Dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* ─── Top Doctor Profile Bar ────────────────────────────────────────── */}
      <div
        className="card dash-profile-header"
        style={{
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(13, 148, 136, 0.05) 100%)',
          border: '1px solid rgba(2, 132, 199, 0.25)',
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
            src={doctor.avatarUrl || 'https://images.unsplash.com/photo-1594824813589-3286ff00eeae?auto=format&fit=crop&q=80&w=400'}
            alt={doctor.name}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '16px',
              objectFit: 'cover',
              border: '2px solid #0284c7',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {doctor.name}
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
                <CheckCircle size={12} /> {doctor.status}
              </span>
              <span
                style={{
                  background: 'rgba(2, 132, 199, 0.15)',
                  color: '#0284c7',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {doctor.employeeId}
              </span>
            </div>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '0.25rem', fontWeight: 600 }}>
              {doctor.specialization} · <strong>{doctor.department}</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {doctor.qualification} · {doctor.experience} Experience · {doctor.phone}
            </div>
          </div>
        </div>

        {/* Doctor Summary Counts */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '0.65rem 1.1rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0284c7' }}>{patients.length}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Assigned Patients
            </div>
          </div>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '0.65rem 1.1rem',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
              {patients.filter((p) => p.appointmentStatus === 'CONFIRMED').length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Queue
            </div>
          </div>
        </div>
      </div>

      {/* ─── Dedicated "My Shift" Section (Read-Only for Doctor, Admin Controls) ─── */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.08) 0%, rgba(2, 132, 199, 0.06) 100%)',
          border: '2px solid rgba(13, 148, 136, 0.3)',
          borderRadius: '1.25rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)',
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
                background: 'rgba(13, 148, 136, 0.2)',
                color: '#0d9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                My Shift & Operational Assignment
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Official Hospital Roster · Assigned by Administration (Read-Only)
              </span>
            </div>
          </div>
          <span
            style={{
              background: 'rgba(13, 148, 136, 0.15)',
              color: '#0d9488',
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.76rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <ShieldCheck size={14} /> Hospital Roster Compliant
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={13} color="#0284c7" /> Today's Shift
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
              {doctor.todayShift}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 700, marginTop: '0.15rem' }}>
              {doctor.shiftHours}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={13} color="#0d9488" /> Working Location
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
              {doctor.workingLocation}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#0d9488', fontWeight: 700, marginTop: '0.15rem' }}>
              {doctor.roomNumber}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Coffee size={13} color="#f59e0b" /> Break Time & Days
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
              {doctor.breakTime}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Days: {doctor.workingDays}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} color="#7c3aed" /> Next Scheduled Shift
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
              {doctor.nextShift}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              Department: {doctor.department}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Doctor's Assigned Patients Workspace ───────────────────────────── */}
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
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              My Assigned Patients & Clinical Queue
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Authorized patients assigned to {doctor.name}. Only your patients are displayed.
            </div>
          </div>

          {/* Search & Priority Filters */}
          <div className="doctor-filter-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              className="doctor-patient-search"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '0.35rem 0.75rem',
                gap: '0.4rem',
                width: '240px',
              }}
            >
              <Search size={15} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search patient, ID, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  width: '100%',
                }}
              />
            </div>

            <div className="doctor-priority-filters" style={{ display: 'flex', gap: '0.35rem' }}>
              {(['ALL', 'Routine', 'Urgent', 'STAT Emergency'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(p)}
                  className="btn btn-sm"
                  style={{
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: priorityFilter === p ? '#0284c7' : 'var(--bg-card-subtle)',
                    color: priorityFilter === p ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="doctor-patient-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="doctor-patient-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem 0.6rem' }}>Patient Name & ID</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Age / Gender</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Appt. Time</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Status</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Department</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Priority</th>
                <th style={{ padding: '0.75rem 0.6rem' }}>Medical Record</th>
                <th style={{ padding: '0.75rem 0.6rem', textAlign: 'right' }}>Clinical Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPatients.map((patient) => {
                const priorityBadge = {
                  Routine: { bg: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' },
                  Urgent: { bg: 'rgba(245, 158, 11, 0.15)', color: '#d97706' },
                  'STAT Emergency': { bg: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' },
                }[patient.priority];

                return (
                  <tr key={patient.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}>
                    <td data-label="Patient" style={{ padding: '0.85rem 0.6rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{patient.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 700 }}>{patient.patientId}</div>
                    </td>
                    <td data-label="Age / Gender" style={{ padding: '0.85rem 0.6rem' }}>
                      <div>{patient.age} yrs</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{patient.gender}</div>
                    </td>
                    <td data-label="Appointment" style={{ padding: '0.85rem 0.6rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{patient.appointmentTime}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last: {patient.lastVisit}</div>
                    </td>
                    <td data-label="Status" style={{ padding: '0.85rem 0.6rem' }}>
                      <span
                        className={`badge ${
                          patient.appointmentStatus === 'CONFIRMED'
                            ? 'badge-success'
                            : patient.appointmentStatus === 'COMPLETED'
                            ? 'badge-info'
                            : 'badge-warning'
                        }`}
                      >
                        {patient.appointmentStatus}
                      </span>
                    </td>
                    <td data-label="Department" style={{ padding: '0.85rem 0.6rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {patient.department}
                    </td>
                    <td data-label="Priority" style={{ padding: '0.85rem 0.6rem' }}>
                      <span
                        style={{
                          background: priorityBadge.bg,
                          color: priorityBadge.color,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        {patient.priority}
                      </span>
                    </td>
                    <td data-label="Medical Record" style={{ padding: '0.85rem 0.6rem' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color:
                            patient.medicalRecordStatus === 'Critical Review'
                              ? '#dc2626'
                              : patient.medicalRecordStatus === 'Pending Review'
                              ? '#d97706'
                              : '#10b981',
                        }}
                      >
                        ● {patient.medicalRecordStatus}
                      </span>
                    </td>
                    <td data-label="Clinical Actions" className="doctor-clinical-actions-cell" style={{ padding: '0.85rem 0.6rem', textAlign: 'right' }}>
                      <div className="doctor-clinical-actions" style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(patient, 'VIEW_PATIENT')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem' }}
                          title="View Patient Details & Profile"
                        >
                          <User size={13} /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(patient, 'ADD_DIAGNOSIS')}
                          className="btn btn-primary btn-sm clinical-action-primary"
                          style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', background: '#0284c7' }}
                          title="Add / Update Clinical Diagnosis"
                        >
                          <Activity size={13} /> Diagnosis
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(patient, 'ADD_PRESCRIPTION')}
                          className="btn btn-primary btn-sm clinical-action-primary"
                          style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', background: '#0d9488' }}
                          title="Add Prescription (Sent to Pharmacy)"
                        >
                          <Pill size={13} /> Rx
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(patient, 'VIEW_LABS')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem' }}
                          title="View Lab Reports"
                        >
                          <FileText size={13} /> Labs
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(patient, 'ADD_NOTES')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem' }}
                          title="Add Medical Notes"
                        >
                          <PlusCircle size={13} /> Notes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(patient, 'VIEW_HISTORY')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem' }}
                          title="View Medical History & Past Consultations"
                        >
                          <History size={13} /> History
                        </button>
                        {patient.appointmentStatus !== 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(patient.id, 'COMPLETED')}
                            className="btn btn-sm"
                            style={{ padding: '0.3rem 0.55rem', borderRadius: '6px', fontSize: '0.75rem', background: '#10b981', color: '#fff', border: 'none' }}
                            title="Mark Consultation Complete"
                          >
                            <CheckCircle2 size={13} /> Done
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL 1: VIEW PATIENT PROFILE & RECORDS ────────────────────────── */}
      {(activeModal === 'VIEW_PATIENT' || activeModal === 'VIEW_RECORDS') && selectedPatient && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Patient Clinical Profile: {selectedPatient.name}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>
                  Hospital ID: {selectedPatient.patientId} · {selectedPatient.gender}, {selectedPatient.age} yrs
                </span>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
              <div style={{ background: 'var(--bg-card-subtle)', padding: '1rem', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>Primary Clinical Diagnosis</div>
                <div style={{ color: 'var(--text-secondary)' }}>{selectedPatient.diagnosis || 'No primary diagnosis recorded yet.'}</div>
              </div>

              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Current Active Prescriptions</div>
                {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedPatient.prescriptions.map((rx) => (
                      <div key={rx.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontWeight: 800, color: '#0284c7' }}>{rx.medication} ({rx.dosage})</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{rx.frequency} · {rx.duration} · {rx.instructions}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No active prescriptions on file.</p>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Attending Doctor's Progress Notes</div>
                {selectedPatient.medicalNotes && selectedPatient.medicalNotes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedPatient.medicalNotes.map((mn) => (
                      <div key={mn.id} style={{ background: 'var(--bg-card-subtle)', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{mn.date} — {mn.author}</div>
                        <div style={{ marginTop: '0.2rem', color: 'var(--text-primary)' }}>{mn.note}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No medical notes added yet.</p>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ borderRadius: '10px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD DIAGNOSIS ────────────────────────────────────────── */}
      {activeModal === 'ADD_DIAGNOSIS' && selectedPatient && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800 }}>
              Add / Update Diagnosis for {selectedPatient.name}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Record formal clinical findings, ICD impression, and diagnostic assessment.
            </p>

            <form onSubmit={handleSaveDiagnosis}>
              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Clinical Diagnosis & Assessment
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Coronary Artery Disease with chronic stable angina (Class II)..."
                  value={diagnosisInput}
                  onChange={(e) => setDiagnosisInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ borderRadius: '10px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px', background: '#0284c7' }}>
                  Save Diagnosis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: ADD PRESCRIPTION ──────────────────────────────────────── */}
      {activeModal === 'ADD_PRESCRIPTION' && selectedPatient && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.25rem', fontWeight: 800 }}>
              Write Prescription: {selectedPatient.name}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Prescriptions written here are immediately dispatched to the Hospital Pharmacist dispensing queue.
            </p>

            <form onSubmit={handleSavePrescription}>
              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Medication / Drug Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Telmisartan 40mg"
                    value={rxMedication}
                    onChange={(e) => setRxMedication(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Dosage / Strength *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 40mg or 1 Tab"
                    value={rxDosage}
                    onChange={(e) => setRxDosage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Frequency
                  </label>
                  <select
                    value={rxFrequency}
                    onChange={(e) => setRxFrequency(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="Once daily (morning)">Once daily (morning)</option>
                    <option value="Twice daily (morning/night)">Twice daily (morning/night)</option>
                    <option value="Thrice daily (post-meals)">Thrice daily (post-meals)</option>
                    <option value="Bedtime (HS)">Bedtime (HS)</option>
                    <option value="STAT (Emergency SOS)">STAT (Emergency SOS)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Duration
                  </label>
                  <input
                    type="text"
                    value={rxDuration}
                    onChange={(e) => setRxDuration(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Patient Instructions & Precautions
                </label>
                <input
                  type="text"
                  value={rxInstructions}
                  onChange={(e) => setRxInstructions(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ borderRadius: '10px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px', background: '#0d9488' }}>
                  Save & Forward to Pharmacy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: VIEW LAB REPORTS ──────────────────────────────────────── */}
      {activeModal === 'VIEW_LABS' && selectedPatient && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Laboratory Test Reports: {selectedPatient.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Diagnostics & Pathology Wing · {selectedPatient.patientId}
                </span>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedPatient.labReports && selectedPatient.labReports.length > 0 ? (
                selectedPatient.labReports.map((report) => (
                  <div
                    key={report.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      background: report.status === 'Abnormal' ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-card)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{report.testName}</div>
                      <span
                        style={{
                          background: report.status === 'Abnormal' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: report.status === 'Abnormal' ? '#dc2626' : '#10b981',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '999px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                        }}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{report.resultSummary}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Date: {report.date}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
                  No diagnostic laboratory reports available for this patient.
                </p>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ borderRadius: '10px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: ADD MEDICAL NOTES ────────────────────────────────────── */}
      {activeModal === 'ADD_NOTES' && selectedPatient && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800 }}>
              Add Medical Note for {selectedPatient.name}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Progress observations, patient complaints, and clinical instructions.
            </p>

            <form onSubmit={handleSaveNote}>
              <div style={{ marginBottom: '1.2rem' }}>
                <textarea
                  rows={4}
                  required
                  placeholder="Record clinical observations, vitals assessment, or follow-up instructions..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ borderRadius: '10px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px' }}>
                  Append Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: UPDATE TREATMENT ────────────────────────────────────────── */}
      {activeModal === 'UPDATE_TREATMENT' && selectedPatient && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 800 }}>
              Update Treatment Plan for {selectedPatient.name}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Modify therapy protocols, outpatient recommendations, or rehabilitation guidelines.
            </p>

            <form onSubmit={handleSaveTreatment}>
              <div style={{ marginBottom: '1.2rem' }}>
                <textarea
                  rows={4}
                  required
                  placeholder="Outline the updated therapeutic treatment plan..."
                  value={treatmentInput}
                  onChange={(e) => setTreatmentInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ borderRadius: '10px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ borderRadius: '10px' }}>
                  Save Treatment Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: VIEW MEDICAL & APPOINTMENT HISTORY ────────────────────── */}
      {(activeModal === 'VIEW_HISTORY' || activeModal === 'VIEW_APPT_HISTORY') && selectedPatient && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  Consultation & Appointment History
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700 }}>
                  {selectedPatient.name} ({selectedPatient.patientId})
                </span>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedPatient.history && selectedPatient.history.length > 0 ? (
                selectedPatient.history.map((h) => (
                  <div key={h.id} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{h.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.date}</div>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 600 }}>Attending: {h.doctor}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>{h.notes}</div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No prior appointment records found.</p>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ borderRadius: '10px' }}>
                Close
              </button>
            </div>
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
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
