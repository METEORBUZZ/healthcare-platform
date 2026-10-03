import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  hospitalOperationsService,
  type DoctorRecord,
  type StaffRecord,
  type ScheduleEntryRecord,
} from '../utils/hospitalOperationsService';
import { DEPARTMENTS, WORKING_LOCATIONS, STAFF_TYPES, type Role } from '@healthcare/shared';
import {
  Users,
  UserCheck,
  UserX,
  PlusCircle,
  Clock,
  MapPin,
  Building,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Edit3,
  Sliders,
  X,
  Activity,
  Phone,
  Stethoscope,
  Radio,
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'SCHEDULE' | 'LOCATIONS'>('DIRECTORY');

  // Lists from operations service
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntryRecord[]>([]);
  const [overview, setOverview] = useState(hospitalOperationsService.getHospitalOverview());

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'LABORATORY_STAFF' | 'STAFF'>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');

  // Modals
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [selectedPersonForShift, setSelectedPersonForShift] = useState<{
    id: number;
    name: string;
    isDoctor: boolean;
    currentShift: string;
    currentHours: string;
    currentBreak: string;
    currentDays: string;
    currentLocation: string;
    currentRoom: string;
    department: string;
  } | null>(null);

  const [selectedPersonForEdit, setSelectedPersonForEdit] = useState<{
    id: number;
    name: string;
    isDoctor: boolean;
    phone: string;
    email: string;
    department: string;
    specialization?: string;
    qualification?: string;
    experience?: string;
    staffType?: string;
    status: 'ACTIVE' | 'INACTIVE';
  } | null>(null);

  // Form states - Add Doctor
  const [docName, setDocName] = useState('');
  const [docPhoto, _setDocPhoto] = useState('https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400');
  const [docEmpId, setDocEmpId] = useState('');
  const [docPhone, setDocPhone] = useState('+91 98200 ');
  const [docEmail, setDocEmail] = useState('');
  const [docDept, setDocDept] = useState<string>(DEPARTMENTS[0]);
  const [docSpec, setDocSpec] = useState('');
  const [docQual, setDocQual] = useState('MBBS, MD');
  const [docExp, setDocExp] = useState('8+ Years');
  const [docShiftPreset, setDocShiftPreset] = useState<'Morning' | 'Evening' | 'Night' | 'Custom'>('Morning');
  const [docShiftHours, setDocShiftHours] = useState('08:00 AM – 02:00 PM');
  const [docBreak, setDocBreak] = useState('12:30 PM - 01:00 PM');
  const [docDays, _setDocDays] = useState('Mon - Sat');
  const [docLoc, setDocLoc] = useState<string>(WORKING_LOCATIONS[0]);
  const [docRoom, setDocRoom] = useState('Consultation Room 05');
  const [docStatus, _setDocStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Form states - Add Staff
  const [stfName, setStfName] = useState('');
  const [stfEmpId, setStfEmpId] = useState('');
  const [stfPhone, setStfPhone] = useState('+91 98300 ');
  const [stfEmail, setStfEmail] = useState('');
  const [stfType, setStfType] = useState<typeof STAFF_TYPES[number]>('Nurse');
  const [stfDept, setStfDept] = useState<string>(DEPARTMENTS[0]);
  const [stfShiftPreset, setStfShiftPreset] = useState<'Morning' | 'Evening' | 'Night' | 'Custom'>('Morning');
  const [stfShiftHours, setStfShiftHours] = useState('08:00 AM – 04:00 PM');
  const [stfBreak, setStfBreak] = useState('01:00 PM - 01:30 PM');
  const [stfDays, _setStfDays] = useState('Mon - Fri');
  const [stfLoc, setStfLoc] = useState<string>(WORKING_LOCATIONS[0]);
  const [stfArea, setStfArea] = useState('Floor Station 2');
  const [stfStatus, _setStfStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Form states - Shift & Location Reassignment
  const [shiftNameInput, setShiftNameInput] = useState('Morning');
  const [shiftHoursInput, setShiftHoursInput] = useState('08:00 AM – 02:00 PM');
  const [breakTimeInput, setBreakTimeInput] = useState('12:30 PM - 01:00 PM');
  const [workingDaysInput, setWorkingDaysInput] = useState('Mon - Sat');
  const [workingLocInput, setWorkingLocInput] = useState<string>(WORKING_LOCATIONS[0]);
  const [roomAreaInput, setRoomAreaInput] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setDoctors(hospitalOperationsService.getDoctors());
    setStaff(hospitalOperationsService.getStaff());
    setSchedule(hospitalOperationsService.getSchedule());
    setOverview(hospitalOperationsService.getHospitalOverview());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('niramaya:hospital-operations-updated', handleUpdate);
    return () => window.removeEventListener('niramaya:hospital-operations-updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Preset handlers
  const handleDoctorPresetChange = (preset: 'Morning' | 'Evening' | 'Night' | 'Custom') => {
    setDocShiftPreset(preset);
    if (preset === 'Morning') {
      setDocShiftHours('08:00 AM – 02:00 PM');
      setDocBreak('12:30 PM - 01:00 PM');
    } else if (preset === 'Evening') {
      setDocShiftHours('02:00 PM – 08:00 PM');
      setDocBreak('05:30 PM - 06:00 PM');
    } else if (preset === 'Night') {
      setDocShiftHours('08:00 PM – 08:00 AM');
      setDocBreak('02:00 AM - 02:45 AM');
    }
  };

  const handleStaffPresetChange = (preset: 'Morning' | 'Evening' | 'Night' | 'Custom') => {
    setStfShiftPreset(preset);
    if (preset === 'Morning') {
      setStfShiftHours('08:00 AM – 04:00 PM');
      setStfBreak('01:00 PM - 01:30 PM');
    } else if (preset === 'Evening') {
      setStfShiftHours('04:00 PM – 12:00 AM');
      setStfBreak('08:00 PM - 08:30 PM');
    } else if (preset === 'Night') {
      setStfShiftHours('12:00 AM – 08:00 AM');
      setStfBreak('04:00 AM - 04:30 AM');
    }
  };

  const handleShiftModalPresetChange = (preset: string) => {
    setShiftNameInput(preset);
    if (preset === 'Morning') {
      setShiftHoursInput(selectedPersonForShift?.isDoctor ? '08:00 AM – 02:00 PM' : '08:00 AM – 04:00 PM');
      setBreakTimeInput('12:30 PM - 01:00 PM');
    } else if (preset === 'Evening') {
      setShiftHoursInput(selectedPersonForShift?.isDoctor ? '02:00 PM – 08:00 PM' : '04:00 PM – 12:00 AM');
      setBreakTimeInput('05:30 PM - 06:00 PM');
    } else if (preset === 'Night') {
      setShiftHoursInput(selectedPersonForShift?.isDoctor ? '08:00 PM – 08:00 AM' : '12:00 AM – 08:00 AM');
      setBreakTimeInput('02:00 AM - 02:45 AM');
    }
  };

  // Submit Add Doctor
  const handleCreateDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docEmail.trim()) {
      showToast('Please provide Doctor Name and Email.');
      return;
    }
    const empId = docEmpId.trim() || `DOC-00${doctors.length + 1}`;
    hospitalOperationsService.addDoctor({
      name: docName.trim(),
      avatarUrl: docPhoto,
      employeeId: empId,
      phone: docPhone.trim(),
      email: docEmail.trim(),
      department: docDept,
      specialization: docSpec.trim() || `${docDept} Specialist`,
      qualification: docQual.trim(),
      experience: docExp.trim(),
      todayShift: docShiftPreset === 'Custom' ? 'Custom Shift' : `${docShiftPreset} Shift`,
      shiftHours: docShiftHours,
      breakTime: docBreak,
      workingDays: docDays,
      workingLocation: docLoc,
      roomNumber: docRoom.trim(),
      nextShift: 'Tomorrow – Same Shift',
      status: docStatus,
    });
    showToast(`Doctor ${docName.trim()} created successfully.`);
    setShowAddDoctorModal(false);
    // Reset form
    setDocName('');
    setDocEmpId('');
    setDocEmail('');
    setDocSpec('');
    loadData();
  };

  // Submit Add Staff
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stfName.trim() || !stfEmail.trim()) {
      showToast('Please provide Staff Name and Email.');
      return;
    }
    const empId = stfEmpId.trim() || `STF-00${staff.length + 1}`;
    let roleVal: Role = 'STAFF';
    if (stfType === 'Nurse') roleVal = 'NURSE';
    else if (stfType === 'Receptionist') roleVal = 'RECEPTIONIST';
    else if (stfType === 'Pharmacist') roleVal = 'PHARMACIST';
    else if (stfType === 'Laboratory Staff') roleVal = 'LABORATORY_STAFF';

    hospitalOperationsService.addStaff({
      name: stfName.trim(),
      avatarUrl: null,
      employeeId: empId,
      phone: stfPhone.trim(),
      email: stfEmail.trim(),
      staffType: stfType,
      role: roleVal,
      department: stfDept,
      todayShift: stfShiftPreset === 'Custom' ? 'Custom Shift' : `${stfShiftPreset} Shift`,
      shiftHours: stfShiftHours,
      breakTime: stfBreak,
      workingDays: stfDays,
      workingLocation: stfLoc,
      assignedArea: stfArea.trim(),
      nextShift: 'Tomorrow – Same Shift',
      status: stfStatus,
    });
    showToast(`Staff member ${stfName.trim()} created successfully.`);
    setShowAddStaffModal(false);
    // Reset form
    setStfName('');
    setStfEmpId('');
    setStfEmail('');
    loadData();
  };

  // Submit Shift & Location Assignment
  const handleSaveShiftAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonForShift) return;
    hospitalOperationsService.assignShiftAndLocation(
      selectedPersonForShift.id,
      selectedPersonForShift.isDoctor,
      {
        shiftName: shiftNameInput.includes('Shift') ? shiftNameInput : `${shiftNameInput} Shift`,
        shiftHours: shiftHoursInput,
        breakTime: breakTimeInput,
        workingDays: workingDaysInput,
        workingLocation: workingLocInput,
        roomOrArea: roomAreaInput,
      }
    );

    showToast(`Shift & Location updated for ${selectedPersonForShift.name}. Device alert dispatched.`);
    setSelectedPersonForShift(null);
    loadData();
  };

  // Submit Profile Edit
  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonForEdit) return;
    if (selectedPersonForEdit.isDoctor) {
      hospitalOperationsService.updateDoctor(selectedPersonForEdit.id, {
        name: selectedPersonForEdit.name,
        phone: selectedPersonForEdit.phone,
        email: selectedPersonForEdit.email,
        department: selectedPersonForEdit.department,
        specialization: selectedPersonForEdit.specialization,
        qualification: selectedPersonForEdit.qualification,
        experience: selectedPersonForEdit.experience,
        status: selectedPersonForEdit.status,
      });
    } else {
      hospitalOperationsService.updateStaff(selectedPersonForEdit.id, {
        name: selectedPersonForEdit.name,
        phone: selectedPersonForEdit.phone,
        email: selectedPersonForEdit.email,
        department: selectedPersonForEdit.department,
        status: selectedPersonForEdit.status,
      });
    }
    showToast(`Profile details updated for ${selectedPersonForEdit.name}.`);
    setSelectedPersonForEdit(null);
    loadData();
  };

  // Toggle status
  const handleToggleStatus = (id: number, isDoctor: boolean, currentStatus: string, name: string) => {
    if (isDoctor) {
      hospitalOperationsService.toggleDoctorStatus(id);
    } else {
      hospitalOperationsService.toggleStaffStatus(id);
    }
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    showToast(`${name} is now ${newStatus}.`);
    loadData();
  };

  // Filter combined directory
  interface CombinedPerson {
    id: number;
    name: string;
    avatarUrl: string | null;
    employeeId: string;
    phone: string;
    email: string;
    role: Role;
    displayRole: string;
    department: string;
    todayShift: string;
    shiftHours: string;
    breakTime: string;
    workingDays: string;
    workingLocation: string;
    roomOrArea: string;
    status: 'ACTIVE' | 'INACTIVE';
    isDoctor: boolean;
    specialization?: string;
    qualification?: string;
    experience?: string;
    staffType?: string;
  }

  const combinedDirectory: CombinedPerson[] = [
    ...doctors.map((d) => ({
      id: d.id,
      name: d.name,
      avatarUrl: d.avatarUrl,
      employeeId: d.employeeId,
      phone: d.phone,
      email: d.email,
      role: 'DOCTOR' as Role,
      displayRole: 'Doctor',
      department: d.department,
      todayShift: d.todayShift,
      shiftHours: d.shiftHours,
      breakTime: d.breakTime,
      workingDays: d.workingDays,
      workingLocation: d.workingLocation,
      roomOrArea: d.roomNumber,
      status: d.status,
      isDoctor: true,
      specialization: d.specialization,
      qualification: d.qualification,
      experience: d.experience,
    })),
    ...staff.map((s) => ({
      id: s.id,
      name: s.name,
      avatarUrl: s.avatarUrl,
      employeeId: s.employeeId,
      phone: s.phone,
      email: s.email,
      role: s.role,
      displayRole: s.staffType,
      department: s.department,
      todayShift: s.todayShift,
      shiftHours: s.shiftHours,
      breakTime: s.breakTime,
      workingDays: s.workingDays,
      workingLocation: s.workingLocation,
      roomOrArea: s.assignedArea,
      status: s.status,
      isDoctor: false,
      staffType: s.staffType,
    })),
  ];

  const filteredDirectory = combinedDirectory.filter((person) => {
    const matchesSearch =
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.specialization && person.specialization.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'DOCTOR' && person.isDoctor) ||
      (roleFilter === 'NURSE' && person.role === 'NURSE') ||
      (roleFilter === 'RECEPTIONIST' && person.role === 'RECEPTIONIST') ||
      (roleFilter === 'PHARMACIST' && person.role === 'PHARMACIST') ||
      (roleFilter === 'LABORATORY_STAFF' && person.role === 'LABORATORY_STAFF') ||
      (roleFilter === 'STAFF' && !person.isDoctor);

    const matchesDept = deptFilter === 'ALL' || person.department === deptFilter;
    const matchesStatus = statusFilter === 'ALL' || person.status === statusFilter;
    const matchesLoc = locationFilter === 'ALL' || person.workingLocation === locationFilter;

    return matchesSearch && matchesRole && matchesDept && matchesStatus && matchesLoc;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {/* ─── Top Admin Header & Security Notice ────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
          color: '#ffffff',
          borderRadius: '1.25rem',
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.25rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Administrator Operations Center
          </h1>
          <p style={{ margin: '0.35rem 0 0', color: '#94a3b8', fontSize: '0.9rem', maxWidth: '780px' }}>
            Centralized role-based authority: manage all Doctor & Staff accounts, define working shifts, assign hospital locations, and monitor 24/7 institutional operations.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddDoctorModal(true)}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.15rem',
              borderRadius: '0.6rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <PlusCircle size={17} /> Add New Doctor
          </button>
          <button
            onClick={() => setShowAddStaffModal(true)}
            style={{
              background: '#0d9488',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1.15rem',
              borderRadius: '0.6rem',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <PlusCircle size={17} /> Add New Staff
          </button>
        </div>
      </div>

      {/* ─── Hospital Overview Metrics Cards ───────────────────────────────── */}
      <div
        className="kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div
          className="card"
          style={{
            padding: '1.15rem',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(2, 132, 199, 0.12)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Stethoscope size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Doctors
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {overview.totalDoctors}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
              All Board Certified
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1.15rem',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(13, 148, 136, 0.12)',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Staff
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {overview.totalStaff}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              Nurses, Reception, Lab, Rx
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1.15rem',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              On-Duty Personnel
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', lineHeight: 1.1 }}>
              {overview.onDutyStaff}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              Active on floor right now
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1.15rem',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.12)',
              color: '#6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Active Shifts
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {overview.currentShifts}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              Morning, Evening, Night
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1.15rem',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Depts & Locations
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {overview.departments} / {overview.workingLocations}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              Full facility coverage
            </div>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '1.15rem',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(236, 72, 153, 0.12)',
              color: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Today's Patients
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {overview.patientCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              {overview.todayAppointments} queue appointments
            </div>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs ──────────────────────────────────────────────── */}
      <div
        className="dash-tab-bar"
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem',
          WebkitOverflowScrolling: 'touch' as unknown as React.CSSProperties['WebkitOverflowScrolling'],
        } as React.CSSProperties}
      >
        <button
          onClick={() => setActiveTab('DIRECTORY')}
          style={{
            padding: '0.75rem 1.25rem',
            background: activeTab === 'DIRECTORY' ? 'var(--bg-card)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'DIRECTORY' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'DIRECTORY' ? '#0284c7' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={17} /> Doctor & Staff Management ({combinedDirectory.length})
        </button>

        <button
          onClick={() => setActiveTab('SCHEDULE')}
          style={{
            padding: '0.75rem 1.25rem',
            background: activeTab === 'SCHEDULE' ? 'var(--bg-card)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'SCHEDULE' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'SCHEDULE' ? '#0284c7' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Calendar size={17} /> Master Schedule Matrix ({schedule.length})
        </button>

        <button
          onClick={() => setActiveTab('LOCATIONS')}
          style={{
            padding: '0.75rem 1.25rem',
            background: activeTab === 'LOCATIONS' ? 'var(--bg-card)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'LOCATIONS' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'LOCATIONS' ? '#0284c7' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.92rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <MapPin size={17} /> Hospital Working Locations & Rooms ({WORKING_LOCATIONS.length})
        </button>
      </div>

      {/* ─── TAB 1: DOCTOR & STAFF MANAGEMENT ──────────────────────────────── */}
      {activeTab === 'DIRECTORY' && (
        <div>
          {/* Search & Filter Controls */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div className="admin-action-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="admin-search-field" style={{ flex: '1 1 280px', position: 'relative' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by name, employee ID, email, specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2.4rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input, var(--bg-card))',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              {/* Role filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} style={{ color: 'var(--text-muted)' }} />
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(
                      e.target.value as 'ALL' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'LABORATORY_STAFF' | 'STAFF'
                    )
                  }
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input, var(--bg-card))',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="DOCTOR">Doctors Only</option>
                  <option value="STAFF">All Staff Members</option>
                  <option value="NURSE">Nurses</option>
                  <option value="RECEPTIONIST">Receptionists</option>
                  <option value="PHARMACIST">Pharmacists</option>
                  <option value="LABORATORY_STAFF">Laboratory Staff</option>
                </select>
              </div>

              {/* Department filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input, var(--bg-card))',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              {/* Location filter */}
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input, var(--bg-card))',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <option value="ALL">All Working Locations</option>
                {WORKING_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-input, var(--bg-card))',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <option value="ALL">All Account Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
          <div
            className="card"
            style={{
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: 'rgba(0, 0, 0, 0.02)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      fontSize: '0.72rem',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <th style={{ padding: '0.9rem 1rem' }}>Employee & Contact</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Role & Dept</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Today's Shift</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Working Location & Room</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDirectory.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No personnel match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDirectory.map((person) => {
                      const isDoctor = person.isDoctor;
                      return (
                        <tr
                          key={`${isDoctor ? 'doc' : 'stf'}-${person.id}`}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          {/* Name & Photo */}
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {person.avatarUrl ? (
                                <img
                                  src={person.avatarUrl}
                                  alt={person.name}
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '10px',
                                    objectFit: 'cover',
                                    border: isDoctor ? '2px solid #0284c7' : '2px solid #0d9488',
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '10px',
                                    background: isDoctor ? 'rgba(2, 132, 199, 0.15)' : 'rgba(13, 148, 136, 0.15)',
                                    color: isDoctor ? '#0284c7' : '#0d9488',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                  }}
                                >
                                  {person.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                                  {person.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  ID: <strong style={{ color: 'var(--text-secondary)' }}>{person.employeeId}</strong> · {person.email}
                                </div>
                                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  <Phone size={11} style={{ display: 'inline', marginRight: '3px' }} />
                                  {person.phone}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role & Dept */}
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '3px' }}>
                              <span
                                style={{
                                  background: isDoctor ? 'rgba(2, 132, 199, 0.12)' : 'rgba(13, 148, 136, 0.12)',
                                  color: isDoctor ? '#0284c7' : '#0d9488',
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '6px',
                                  fontSize: '0.74rem',
                                  fontWeight: 700,
                                }}
                              >
                                {person.displayRole}
                              </span>
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                              {person.department}
                            </div>
                            {person.specialization && (
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                {person.specialization}
                              </div>
                            )}
                          </td>

                          {/* Shift */}
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              <Clock size={14} style={{ color: '#0284c7' }} />
                              {person.todayShift}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {person.shiftHours}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Break: {person.breakTime} · {person.workingDays}
                            </div>
                          </td>

                          {/* Location & Room */}
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              <MapPin size={14} style={{ color: '#e11d48' }} />
                              {person.workingLocation}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {person.roomOrArea}
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '1rem' }}>
                            <span
                              style={{
                                background: person.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                color: person.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                                padding: '0.2rem 0.65rem',
                                borderRadius: '999px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              {person.status === 'ACTIVE' ? <CheckCircle2 size={12} /> : <UserX size={12} />}
                              {person.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '1rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {/* Change Shift & Location */}
                              <button
                                onClick={() => {
                                  setSelectedPersonForShift({
                                    id: person.id,
                                    name: person.name,
                                    isDoctor: person.isDoctor,
                                    currentShift: person.todayShift,
                                    currentHours: person.shiftHours,
                                    currentBreak: person.breakTime,
                                    currentDays: person.workingDays,
                                    currentLocation: person.workingLocation,
                                    currentRoom: person.roomOrArea,
                                    department: person.department,
                                  });
                                  setShiftNameInput(person.todayShift.replace(' Shift', ''));
                                  setShiftHoursInput(person.shiftHours);
                                  setBreakTimeInput(person.breakTime);
                                  setWorkingDaysInput(person.workingDays);
                                  setWorkingLocInput(person.workingLocation);
                                  setRoomAreaInput(person.roomOrArea);
                                }}
                                title="Assign / Change Shift and Location"
                                style={{
                                  background: 'rgba(2, 132, 199, 0.08)',
                                  border: '1px solid rgba(2, 132, 199, 0.3)',
                                  color: '#0284c7',
                                  padding: '0.4rem 0.7rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <Sliders size={13} /> Shift & Location
                              </button>

                              {/* Edit Profile */}
                              <button
                                onClick={() => {
                                  setSelectedPersonForEdit({
                                    id: person.id,
                                    name: person.name,
                                    isDoctor: person.isDoctor,
                                    phone: person.phone,
                                    email: person.email,
                                    department: person.department,
                                    specialization: person.specialization,
                                    qualification: person.qualification,
                                    experience: person.experience,
                                    staffType: person.staffType,
                                    status: person.status,
                                  });
                                }}
                                title="Edit Profile Details"
                                style={{
                                  background: 'rgba(0, 0, 0, 0.04)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-secondary)',
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                  fontSize: '0.78rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <Edit3 size={13} /> Edit
                              </button>

                              {/* Toggle Status */}
                              <button
                                onClick={() => handleToggleStatus(person.id, person.isDoctor, person.status, person.name)}
                                title={person.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                                style={{
                                  background: person.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                  border: `1px solid ${person.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                                  color: person.status === 'ACTIVE' ? '#ef4444' : '#10b981',
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.78rem',
                                }}
                              >
                                {person.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SCHEDULE MATRIX CALENDAR VIEW ─────────────────────────── */}
      {activeTab === 'SCHEDULE' && (
        <div>
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Institutional Roster & Duty Shift Calendar
              </h2>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Complete visibility of clinical shifts and on-duty staffing matrix across all hospital departments.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: 'rgba(2, 132, 199, 0.12)',
                  color: '#0284c7',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                Morning: 08:00 AM – 02:00 PM
              </span>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  color: '#f59e0b',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                Evening: 02:00 PM – 08:00 PM
              </span>
              <span
                style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  color: '#6366f1',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                Night: 08:00 PM – 08:00 AM
              </span>
            </div>
          </div>

          <div
            className="card"
            style={{
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: 'rgba(0, 0, 0, 0.02)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      fontSize: '0.72rem',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <th style={{ padding: '0.9rem 1rem' }}>Staff / Doctor</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Role</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Schedule Date</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Duty Shift</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Working Hours</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Department</th>
                    <th style={{ padding: '0.9rem 1rem' }}>Working Location & Room</th>
                    <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Admin Control</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((entry) => {
                    const isDoctor = entry.role === 'DOCTOR';
                    return (
                      <tr
                        key={entry.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {entry.personName}
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <span
                            style={{
                              background: isDoctor ? 'rgba(2, 132, 199, 0.12)' : 'rgba(13, 148, 136, 0.12)',
                              color: isDoctor ? '#0284c7' : '#0d9488',
                              padding: '0.2rem 0.55rem',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                            }}
                          >
                            {entry.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {entry.date}
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: entry.shiftName.includes('Morning')
                                ? '#0284c7'
                                : entry.shiftName.includes('Evening')
                                  ? '#d97706'
                                  : '#4f46e5',
                            }}
                          >
                            {entry.shiftName}
                          </span>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)' }}>
                          {entry.shiftHours}
                        </td>
                        <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {entry.department}
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.workingLocation}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.roomArea}</div>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              setSelectedPersonForShift({
                                id: entry.personId,
                                name: entry.personName,
                                isDoctor: entry.role === 'DOCTOR',
                                currentShift: entry.shiftName,
                                currentHours: entry.shiftHours,
                                currentBreak: '12:30 PM - 01:00 PM',
                                currentDays: 'Mon - Sat',
                                currentLocation: entry.workingLocation,
                                currentRoom: entry.roomArea,
                                department: entry.department,
                              });
                              setShiftNameInput(entry.shiftName.replace(' Shift', ''));
                              setShiftHoursInput(entry.shiftHours);
                              setWorkingLocInput(entry.workingLocation);
                              setRoomAreaInput(entry.roomArea);
                            }}
                            style={{
                              background: 'rgba(2, 132, 199, 0.08)',
                              border: '1px solid rgba(2, 132, 199, 0.3)',
                              color: '#0284c7',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                            }}
                          >
                            Reassign Shift
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: WORKING LOCATIONS & ROOMS OVERVIEW ────────────────────── */}
      {activeTab === 'LOCATIONS' && (
        <div>
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              borderRadius: '1rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              marginBottom: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Hospital Working Locations & Department Coverage
            </h2>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Administrator oversight of physical hospital zones and currently deployed staff count in each area.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {WORKING_LOCATIONS.map((loc) => {
              const activeAtLoc = combinedDirectory.filter(
                (p) => p.workingLocation === loc && p.status === 'ACTIVE'
              );
              return (
                <div
                  key={loc}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    borderRadius: '1rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'rgba(2, 132, 199, 0.1)',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {loc}
                        </h3>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Hospital Zone
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        background: activeAtLoc.length > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: activeAtLoc.length > 0 ? '#10b981' : '#ef4444',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      {activeAtLoc.length} Active Assigned
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    Assigned Personnel:
                  </div>
                  {activeAtLoc.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No active personnel assigned to this zone today.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {activeAtLoc.map((p) => (
                        <div
                          key={`${p.role}-${p.id}`}
                          style={{
                            background: 'var(--bg-card-subtle, rgba(0, 0, 0, 0.02))',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '0.45rem 0.65rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.78rem',
                          }}
                        >
                          <div>
                            <strong style={{ color: 'var(--text-primary)' }}>{p.name}</strong> ({p.displayRole})
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.roomOrArea}</div>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600 }}>
                            {p.todayShift}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD NEW DOCTOR ────────────────────────────────────────── */}
      {showAddDoctorModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 9999,
          }}
        >
          <div
            className="card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '1.25rem',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(2, 132, 199, 0.12)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Add New Doctor
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Admin creates authorized physician record with assigned clinical shift
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddDoctorModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Doctor Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Verma"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DOC-009 (auto-generated if blank)"
                    value={docEmpId}
                    onChange={(e) => setDocEmpId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh.verma@niramaya.health"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98200 12345"
                    value={docPhone}
                    onChange={(e) => setDocPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Medical Department
                  </label>
                  <select
                    value={docDept}
                    onChange={(e) => setDocDept(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Interventional Cardiology"
                    value={docSpec}
                    onChange={(e) => setDocSpec(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MBBS, MD, DM"
                    value={docQual}
                    onChange={(e) => setDocQual(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Experience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10+ Years"
                    value={docExp}
                    onChange={(e) => setDocExp(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              {/* Shift Assignment Section */}
              <div
                style={{
                  background: 'var(--bg-card-subtle, rgba(0, 0, 0, 0.02))',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: '#0284c7' }}>
                  <Clock size={15} /> Shift Assignment (Admin Control)
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['Morning', 'Evening', 'Night', 'Custom'] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleDoctorPresetChange(preset)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: docShiftPreset === preset ? '2px solid #0284c7' : '1px solid var(--border)',
                        background: docShiftPreset === preset ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                        color: docShiftPreset === preset ? '#0284c7' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      {preset} {preset !== 'Custom' ? 'Shift' : ''}
                    </button>
                  ))}
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: 'var(--text-muted)' }}>
                      Shift Hours
                    </label>
                    <input
                      type="text"
                      value={docShiftHours}
                      onChange={(e) => setDocShiftHours(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '0.4rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input, var(--bg-card))',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: 'var(--text-muted)' }}>
                      Break Time
                    </label>
                    <input
                      type="text"
                      value={docBreak}
                      onChange={(e) => setDocBreak(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '0.4rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input, var(--bg-card))',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: 'var(--text-muted)' }}>
                      Working Location
                    </label>
                    <select
                      value={docLoc}
                      onChange={(e) => setDocLoc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '0.4rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input, var(--bg-card))',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    >
                      {WORKING_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: 'var(--text-muted)' }}>
                      Room / Consultation Room
                    </label>
                    <input
                      type="text"
                      value={docRoom}
                      onChange={(e) => setDocRoom(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '0.4rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input, var(--bg-card))',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddDoctorModal(false)}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.35rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                  }}
                >
                  Create Doctor Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD NEW STAFF ─────────────────────────────────────────── */}
      {showAddStaffModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 9999,
          }}
        >
          <div
            className="card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '1.25rem',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(13, 148, 136, 0.12)',
                    color: '#0d9488',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Add New Staff Member
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Admin creates Nurse, Receptionist, Pharmacist, or Lab Staff account
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Staff Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sunita Devi"
                    value={stfName}
                    onChange={(e) => setStfName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STF-015 (auto-generated if blank)"
                    value={stfEmpId}
                    onChange={(e) => setStfEmpId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Staff Type / Role *
                  </label>
                  <select
                    value={stfType}
                    onChange={(e) => setStfType(e.target.value as typeof STAFF_TYPES[number])}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                  >
                    {STAFF_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Department
                  </label>
                  <select
                    value={stfDept}
                    onChange={(e) => setStfDept(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sunita.devi@niramaya.health"
                    value={stfEmail}
                    onChange={(e) => setStfEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98300 12345"
                    value={stfPhone}
                    onChange={(e) => setStfPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              {/* Shift & Location Assignment */}
              <div
                style={{
                  background: 'var(--bg-card-subtle, rgba(0, 0, 0, 0.02))',
                  border: '1px solid var(--border)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: '#0d9488' }}>
                  <Clock size={15} /> Shift & Location Assignment (Admin Control)
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {(['Morning', 'Evening', 'Night', 'Custom'] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleStaffPresetChange(preset)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        border: stfShiftPreset === preset ? '2px solid #0d9488' : '1px solid var(--border)',
                        background: stfShiftPreset === preset ? 'rgba(13, 148, 136, 0.12)' : 'transparent',
                        color: stfShiftPreset === preset ? '#0d9488' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                      }}
                    >
                      {preset} {preset !== 'Custom' ? 'Shift' : ''}
                    </button>
                  ))}
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: 'var(--text-muted)' }}>
                      Shift Hours
                    </label>
                    <input
                      type="text"
                      value={stfShiftHours}
                      onChange={(e) => setStfShiftHours(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '0.4rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input, var(--bg-card))',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: 'var(--text-muted)' }}>
                      Break Time
                    </label>
                    <input
                      type="text"
                      value={stfBreak}
                      onChange={(e) => setStfBreak(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '0.4rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input, var(--bg-card))',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>
                </div>

                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: 'var(--text-muted)' }}>
                      Working Location
                    </label>
                    <select
                      value={stfLoc}
                      onChange={(e) => setStfLoc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '0.4rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input, var(--bg-card))',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    >
                      {WORKING_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, marginBottom: '3px', color: 'var(--text-muted)' }}>
                      Assigned Area / Station
                    </label>
                    <input
                      type="text"
                      value={stfArea}
                      onChange={(e) => setStfArea(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '0.4rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input, var(--bg-card))',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.35rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: '#0d9488',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)',
                  }}
                >
                  Create Staff Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REASSIGN SHIFT & LOCATION ─────────────────────────────── */}
      {selectedPersonForShift && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 9999,
          }}
        >
          <div
            className="card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '1.25rem',
              maxWidth: '600px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Assign Shift & Working Location
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                  {selectedPersonForShift.name} ({selectedPersonForShift.department})
                </div>
              </div>
              <button
                onClick={() => setSelectedPersonForShift(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveShiftAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Presets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Select Shift Template
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['Morning', 'Evening', 'Night', 'Custom'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleShiftModalPresetChange(preset)}
                      style={{
                        padding: '0.45rem 0.85rem',
                        borderRadius: '6px',
                        border: shiftNameInput.includes(preset) ? '2px solid #0284c7' : '1px solid var(--border)',
                        background: shiftNameInput.includes(preset) ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                        color: shiftNameInput.includes(preset) ? '#0284c7' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Shift Name
                  </label>
                  <input
                    type="text"
                    required
                    value={shiftNameInput}
                    onChange={(e) => setShiftNameInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Duty Hours
                  </label>
                  <input
                    type="text"
                    required
                    value={shiftHoursInput}
                    onChange={(e) => setShiftHoursInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Break Schedule
                  </label>
                  <input
                    type="text"
                    value={breakTimeInput}
                    onChange={(e) => setBreakTimeInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Working Days
                  </label>
                  <input
                    type="text"
                    value={workingDaysInput}
                    onChange={(e) => setWorkingDaysInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Working Location *
                  </label>
                  <select
                    value={workingLocInput}
                    onChange={(e) => setWorkingLocInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                    }}
                  >
                    {WORKING_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Room / Assigned Area *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Consultation Room 04 or Emergency Desk"
                    value={roomAreaInput}
                    onChange={(e) => setRoomAreaInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(2, 132, 199, 0.08)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  borderRadius: '0.65rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8rem',
                  color: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Radio size={16} /> Saving this assignment will automatically dispatch a real-time shift notice to the staff or doctor device.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPersonForShift(null)}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.35rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                  }}
                >
                  Save & Dispatch Shift Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT PROFILE ─────────────────────────────────────────── */}
      {selectedPersonForEdit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 9999,
          }}
        >
          <div
            className="card"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '1.25rem',
              maxWidth: '600px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Edit {selectedPersonForEdit.isDoctor ? 'Doctor' : 'Staff'} Profile
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Admin profile updates for {selectedPersonForEdit.name}
                </div>
              </div>
              <button
                onClick={() => setSelectedPersonForEdit(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfileEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={selectedPersonForEdit.name}
                  onChange={(e) =>
                    setSelectedPersonForEdit({ ...selectedPersonForEdit, name: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-input, var(--bg-card))',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={selectedPersonForEdit.email}
                    onChange={(e) =>
                      setSelectedPersonForEdit({ ...selectedPersonForEdit, email: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={selectedPersonForEdit.phone}
                    onChange={(e) =>
                      setSelectedPersonForEdit({ ...selectedPersonForEdit, phone: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Department
                  </label>
                  <select
                    value={selectedPersonForEdit.department}
                    onChange={(e) =>
                      setSelectedPersonForEdit({ ...selectedPersonForEdit, department: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Account Status
                  </label>
                  <select
                    value={selectedPersonForEdit.status}
                    onChange={(e) =>
                      setSelectedPersonForEdit({
                        ...selectedPersonForEdit,
                        status: e.target.value as 'ACTIVE' | 'INACTIVE',
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input, var(--bg-card))',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                    }}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {selectedPersonForEdit.isDoctor && (
                <div className="modal-form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={selectedPersonForEdit.specialization || ''}
                      onChange={(e) =>
                        setSelectedPersonForEdit({
                          ...selectedPersonForEdit,
                          specialization: e.target.value,
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input, var(--bg-card))',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Qualification
                    </label>
                    <input
                      type="text"
                      value={selectedPersonForEdit.qualification || ''}
                      onChange={(e) =>
                        setSelectedPersonForEdit({
                          ...selectedPersonForEdit,
                          qualification: e.target.value,
                        })
                      }
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-input, var(--bg-card))',
                        color: 'var(--text-primary)',
                        fontSize: '0.88rem',
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPersonForEdit(null)}
                  style={{
                    padding: '0.6rem 1.15rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.35rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                  }}
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── TOAST NOTIFICATION ───────────────────────────────────────────── */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '0.85rem 1.35rem',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            zIndex: 10000,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          {toastMessage}
        </div>
      )}
    </div>
  );
};
