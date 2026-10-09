import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { DoctorDto } from '@healthcare/shared';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { DoctorCard } from '../components/DoctorCard';
import { StaffCard, type StaffMember } from '../components/StaffCard';
import {
  Search,
  ShieldCheck,
  Stethoscope,
  Filter,
  XCircle,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Users,
  Lock,
  ShieldAlert,
  Sun,
  Moon,
} from 'lucide-react';

interface DoctorDirectoryViewProps {
  onBookDoctor: (doctor: DoctorDto) => void;
  onOpenAuth?: (role?: 'PATIENT' | 'DOCTOR' | 'ADMIN') => void;
}

const SPECIALIZATION_FILTERS = [
  'All Specialists',
  'Interventional Radiology',
  'General Surgery',
  'Orthopedic',
  'Cardiologist',
  'Gynecologist',
  'Obstetrics & Gynecology',
  'General Physician',
  'Pediatrician',
  'Dermatologist',
  'Neurologist',
  'Psychiatrist',
  'ENT Specialist',
  'Anaesthesiologist',
  'Ayurvedic Specialist',
];

const FALLBACK_DOCTORS: DoctorDto[] = [
  {
    id: 1,
    userId: 101,
    name: 'Dr Aakash Patel',
    email: 'aakash.patel@demo.test',
    specialization: 'Interventional Radiology',
    experienceYears: 14,
    qualification: 'MBBS | DNB (Radiodiagnosis) Fellowship in Interventional Radiology',
    consultationFee: 1500,
    languages: ['English', 'Hindi', 'Gujarati'],
    hospitalAffiliation: 'Niramaya HOSPITAL',
    bio: 'Advanced image-guided minimally invasive vascular and neuro-interventional procedures, diagnostic radiodiagnosis, and therapeutic embolization.',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    rating: 4.9,
    reviewCount: 168,
  },
  {
    id: 2,
    userId: 102,
    name: 'Dr Aanand M. Desai',
    email: 'aanand.desai@demo.test',
    specialization: 'General Surgery',
    experienceYears: 18,
    qualification: 'MBBS | MS (General Surgery)',
    consultationFee: 1400,
    languages: ['English', 'Hindi', 'Gujarati'],
    hospitalAffiliation: 'Niramaya HOSPITAL',
    bio: 'Specialist in minimally invasive laparoscopic surgery, emergency trauma surgery, hernia repairs, GI surgery, and surgical oncology.',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
    rating: 5.0,
    reviewCount: 224,
  },
  {
    id: 3,
    userId: 103,
    name: 'Dr. Amit Singh',
    email: 'amit@demo.test',
    specialization: 'Orthopedic',
    experienceYears: 15,
    qualification: 'MBBS, MS (Orthopedics)',
    consultationFee: 1400,
    languages: ['English', 'Hindi', 'Punjabi'],
    hospitalAffiliation: 'Apex Bone & Joint Hospital',
    bio: 'Joint replacement, sports injuries, fracture management, and advanced spine and musculoskeletal rehabilitation.',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    rating: 5.0,
    reviewCount: 210,
  },
  {
    id: 4,
    userId: 104,
    name: 'Dr. Priya Sharma',
    email: 'doctor@demo.test',
    specialization: 'Cardiologist',
    experienceYears: 12,
    qualification: 'MBBS, MD (Cardiology)',
    consultationFee: 1200,
    languages: ['English', 'Hindi'],
    hospitalAffiliation: 'Metro Heart Institute',
    bio: 'Preventive cardiology, hypertension management, and long-term heart-health care with over a decade of clinical experience.',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813589-3286ff00eeae?auto=format&fit=crop&q=80&w=400',
    rating: 4.9,
    reviewCount: 128,
  },
  {
    id: 5,
    userId: 105,
    name: 'Dr. Sunita Rao',
    email: 'sunita.rao@demo.test',
    specialization: 'Gynecologist',
    experienceYears: 14,
    qualification: 'MBBS, MS (Obstetrics & Gynecology)',
    consultationFee: 1100,
    languages: ['English', 'Hindi', 'Marathi'],
    hospitalAffiliation: 'Niramaya Laparoscopy & Fertility Centre',
    bio: 'High-risk obstetrics, laparoscopic gynecological surgery, PCOS management, and fertility guidance.',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400',
    rating: 4.9,
    reviewCount: 184,
  },
  {
    id: 6,
    userId: 106,
    name: 'Dr. Rajesh Patel',
    email: 'rajesh@demo.test',
    specialization: 'General Physician',
    experienceYears: 8,
    qualification: 'MBBS, DNB (Internal Medicine)',
    consultationFee: 600,
    languages: ['English', 'Hindi', 'Gujarati'],
    hospitalAffiliation: 'City Health Clinic',
    bio: 'Comprehensive primary care for acute and chronic conditions, lifestyle disorders, and preventive health screenings.',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?auto=format&fit=crop&q=80&w=400',
    rating: 4.8,
    reviewCount: 94,
  },
  {
    id: 7,
    userId: 107,
    name: 'Dr. Sneha Desai',
    email: 'sneha@demo.test',
    specialization: 'Dermatologist',
    experienceYears: 10,
    qualification: 'MBBS, MD (Dermatology)',
    consultationFee: 900,
    languages: ['English', 'Hindi'],
    hospitalAffiliation: 'Skin & Laser Wellness Center',
    bio: 'Specialist in medical and cosmetic dermatology, acne therapy, allergic skin disorders, and laser treatments.',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    rating: 4.9,
    reviewCount: 156,
  },
  {
    id: 8,
    userId: 108,
    name: 'Dr. Neha Kapoor',
    email: 'neha.doc@demo.test',
    specialization: 'Pediatrician',
    experienceYears: 7,
    qualification: 'MBBS, MD (Pediatrics)',
    consultationFee: 700,
    languages: ['English', 'Hindi'],
    hospitalAffiliation: "Rainbow Children's Hospital",
    bio: 'Compassionate newborn care, immunization scheduling, adolescent medicine, and developmental growth tracking.',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813589-3286ff00eeae?auto=format&fit=crop&q=80&w=400',
    rating: 4.9,
    reviewCount: 112,
  },
  {
    id: 9,
    userId: 109,
    name: 'Dr. Karan Malhotra',
    email: 'karan@demo.test',
    specialization: 'ENT Specialist',
    experienceYears: 11,
    qualification: 'MBBS, MS (ENT)',
    consultationFee: 850,
    languages: ['English', 'Hindi'],
    hospitalAffiliation: 'Apollo Healthcare Center',
    bio: 'Comprehensive diagnosis and microsurgery for ear, nose, throat conditions, sinus problems, and hearing health.',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    rating: 4.7,
    reviewCount: 79,
  },
  {
    id: 10,
    userId: 110,
    name: 'Dr. Deepak Joshi',
    email: 'deepak.joshi@demo.test',
    specialization: 'Ayurvedic Specialist',
    experienceYears: 13,
    qualification: 'BAMS, MD (Ayurveda)',
    consultationFee: 750,
    languages: ['English', 'Hindi', 'Sanskrit'],
    hospitalAffiliation: 'Sanjeevani Holistic Wellness Centre',
    bio: 'Panchakarma treatments, chronic lifestyle disorder management, immunity enhancement, and holistic herbal therapy.',
    isVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    rating: 4.8,
    reviewCount: 105,
  },
];

const STAFF_DEPARTMENT_FILTERS = [
  'All Care Team',
  'Critical Care & Nursing',
  'Diagnostics & Pathology',
  'Pharmacy Services',
  'Emergency Care',
  'Radiology & Imaging',
  'Patient Coordination',
];

const STAFF_SHIFT_FILTERS = [
  'All Duty Shifts',
  '☀️ Day Shift',
  '🌙 Night Shift',
  '🌆 Evening Shift',
];

const HOSPITAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 101,
    name: 'Sister Anjali Nair',
    role: 'Chief Nursing Officer & ICU In-charge',
    department: 'Critical Care & Nursing',
    qualifications: 'B.Sc Nursing | M.Sc Critical Care Nursing',
    experienceYears: 16,
    shiftType: 'Day Shift',
    shiftHours: '07:00 AM - 03:30 PM',
    dutyDays: 'Mon, Tue, Wed, Thu, Fri',
    shift: 'Morning & ICU On-Call (07:00 - 15:30)',
    languages: ['English', 'Hindi', 'Malayalam'],
    bio: 'Oversees 24×7 inpatient intensive nursing, ventilator protocols, post-operative surgical ICU monitoring, and compassionate patient rehabilitation.',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813589-3286ff00eeae?auto=format&fit=crop&q=80&w=400',
    isAvailableOnDuty: true,
    phone: '+91 79 4005 8101',
    email: 'anjali.nair@niramaya.health',
  },
  {
    id: 102,
    name: 'Vikramaditya Rathore',
    role: 'Chief Medical Lab Technologist',
    department: 'Diagnostics & Pathology',
    qualifications: 'BMLT | M.Sc Medical Laboratory Technology',
    experienceYears: 12,
    shiftType: 'Night Shift',
    shiftHours: '08:00 PM - 08:00 AM',
    dutyDays: 'Mon, Wed, Fri, Sat (Night Roster)',
    shift: 'Night Duty (20:00 - 08:00)',
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Expert in clinical biochemistry, automated hematology, microbiological cultures, and emergency 24×7 cross-matching blood bank protocols.',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    isAvailableOnDuty: true,
    phone: '+91 79 4005 8102',
    email: 'vikram.rathore@niramaya.health',
  },
  {
    id: 103,
    name: 'Pooja Sundaram',
    role: 'Head Clinical Pharmacist',
    department: 'Pharmacy Services',
    qualifications: 'B.Pharm | Pharm.D (Clinical Pharmacy)',
    experienceYears: 9,
    shiftType: 'Day Shift',
    shiftHours: '09:00 AM - 06:00 PM',
    dutyDays: 'Mon to Sat',
    shift: 'Day Shift (09:00 - 18:00)',
    languages: ['English', 'Hindi', 'Tamil'],
    bio: 'Oversees formulary management, drug-drug interaction safety checks, sterile IV reconstitution, and patient discharge medication counseling.',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    isAvailableOnDuty: true,
    phone: '+91 79 4005 8103',
    email: 'pooja.sundaram@niramaya.health',
  },
  {
    id: 104,
    name: 'Rajeshwari Kulkarni',
    role: 'Lead Emergency & Triage Nurse',
    department: 'Emergency Care',
    qualifications: 'GNM | Post-Basic B.Sc (Emergency Nursing)',
    experienceYears: 11,
    shiftType: 'Night Shift',
    shiftHours: '08:00 PM - 08:00 AM',
    dutyDays: 'Tue, Thu, Sat, Sun (Emergency Rotation)',
    shift: 'Night Emergency Shift (20:00 - 08:00)',
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'Rapid emergency triage assessment, acute cardiac life support, trauma response protocols, and emergency resuscitation management.',
    avatarUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400',
    isAvailableOnDuty: true,
    phone: '+91 79 4005 8104',
    email: 'rajeshwari.k@niramaya.health',
  },
  {
    id: 105,
    name: 'Manish Verma',
    role: 'Senior Radiographer & MRI Specialist',
    department: 'Radiology & Imaging',
    qualifications: 'B.Sc Medical Radiologic Technology (BMRT)',
    experienceYears: 14,
    shiftType: 'Evening Shift',
    shiftHours: '03:00 PM - 11:30 PM',
    dutyDays: 'Mon, Tue, Wed, Thu, Fri',
    shift: 'Evening Shift (15:00 - 23:30)',
    languages: ['English', 'Hindi'],
    bio: 'High-precision 3T MRI, 128-slice CT angiography scanning, digital mammography, and interventional fluoroscopic imaging assistance.',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=400',
    isAvailableOnDuty: true,
    phone: '+91 79 4005 8105',
    email: 'manish.verma@niramaya.health',
  },
  {
    id: 106,
    name: 'Kavita Chawla',
    role: 'Patient Care & Admissions Coordinator',
    department: 'Patient Coordination',
    qualifications: 'MSW (Medical Social Work) | PGDHM',
    experienceYears: 10,
    shiftType: 'Day Shift',
    shiftHours: '08:00 AM - 04:30 PM',
    dutyDays: 'Mon to Sat',
    shift: 'Day Shift (08:00 - 16:30)',
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'Smooth inpatient admissions, cashless insurance/TPA documentation desk, patient guidance, and post-discharge support coordination.',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813589-3286ff00eeae?auto=format&fit=crop&q=80&w=400',
    isAvailableOnDuty: true,
    phone: '+91 79 4005 8106',
    email: 'kavita.chawla@niramaya.health',
  },
  {
    id: 107,
    name: 'Deepak Nambiar',
    role: 'ICU Senior Staff Nurse',
    department: 'Critical Care & Nursing',
    qualifications: 'B.Sc Nursing | ACLS & BLS Certified',
    experienceYears: 8,
    shiftType: 'Night Shift',
    shiftHours: '08:00 PM - 08:00 AM',
    dutyDays: 'Wed, Thu, Fri, Sat',
    shift: 'Night Duty (20:00 - 08:00)',
    languages: ['English', 'Hindi', 'Malayalam'],
    bio: 'Specialized in post-cardiac surgery recovery, arterial line monitoring, central venous pressures, and critical nocturnal care protocols.',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    isAvailableOnDuty: true,
    phone: '+91 79 4005 8107',
    email: 'deepak.nambiar@niramaya.health',
  },
  {
    id: 108,
    name: 'Dr. Sunita Deshmukh',
    role: 'Night Medical Officer (Emergency)',
    department: 'Emergency Care',
    qualifications: 'MBBS | Fellowship in Critical Care & Emergency Medicine',
    experienceYears: 10,
    shiftType: 'Night Shift',
    shiftHours: '08:00 PM - 08:00 AM',
    dutyDays: 'Mon, Tue, Thu, Sun',
    shift: 'Nocturnal Emergency Duty (20:00 - 08:00)',
    languages: ['English', 'Hindi', 'Marathi'],
    bio: 'First-line nocturnal emergency responder, acute triage leader, and hospital nocturnal emergency code coordinator.',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    isAvailableOnDuty: true,
    phone: '+91 79 4005 8108',
    email: 'sunita.deshmukh@niramaya.health',
  },
];

export const DoctorDirectoryView: React.FC<DoctorDirectoryViewProps> = ({ onBookDoctor, onOpenAuth }) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const directoryRef = useRef<HTMLDivElement>(null);
  const staffRef = useRef<HTMLDivElement>(null);

  const [doctors, setDoctors] = useState<DoctorDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All Specialists');

  const [staffDept, setStaffDept] = useState<string>('All Care Team');
  const [staffShiftFilter, setStaffShiftFilter] = useState<string>('All Duty Shifts');
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');

  // Privacy rule: Only Admin, Doctor, or Staff roles have permission to view staff duty rosters & contact lines
  const isStaffAuthorized = Boolean(
    user && (user.role === 'ADMIN' || user.role === 'DOCTOR' || (user as { role?: string }).role === 'STAFF')
  );

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.2;
    }
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDoctors({ pageSize: 50 });
      if (res.data && res.data.length > 0) {
        setDoctors(res.data);
      } else {
        setDoctors(FALLBACK_DOCTORS);
      }
    } catch {
      // If API server is starting up or disconnected, gracefully render verified specialist directory
      setDoctors(FALLBACK_DOCTORS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Filtered doctors list based on search and selected specialty
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesSpecialty =
        selectedSpecialty === 'All Specialists' ||
        doc.specialization.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
        selectedSpecialty.toLowerCase().includes(doc.specialization.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        doc.name.toLowerCase().includes(query) ||
        doc.specialization.toLowerCase().includes(query) ||
        doc.qualification.toLowerCase().includes(query) ||
        (doc.hospitalAffiliation && doc.hospitalAffiliation.toLowerCase().includes(query)) ||
        (doc.languages && doc.languages.some((l) => l.toLowerCase().includes(query))) ||
        (doc.bio && doc.bio.toLowerCase().includes(query));

      return matchesSpecialty && matchesSearch;
    });
  }, [doctors, selectedSpecialty, searchQuery]);

  // Filtered staff list based on department, shift type, and search query
  const filteredStaff = useMemo(() => {
    return HOSPITAL_STAFF_MEMBERS.filter((member) => {
      const matchesDept =
        staffDept === 'All Care Team' ||
        member.department.toLowerCase().includes(staffDept.toLowerCase()) ||
        staffDept.toLowerCase().includes(member.department.toLowerCase());

      const matchesShift =
        staffShiftFilter === 'All Duty Shifts' ||
        (staffShiftFilter.includes('Day') && member.shiftType === 'Day Shift') ||
        (staffShiftFilter.includes('Night') && member.shiftType === 'Night Shift') ||
        (staffShiftFilter.includes('Evening') && member.shiftType === 'Evening Shift');

      const query = staffSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query) ||
        member.department.toLowerCase().includes(query) ||
        member.qualifications.toLowerCase().includes(query) ||
        member.shiftHours.toLowerCase().includes(query) ||
        member.dutyDays.toLowerCase().includes(query) ||
        member.languages.some((l) => l.toLowerCase().includes(query)) ||
        member.bio.toLowerCase().includes(query);

      return matchesDept && matchesShift && matchesSearch;
    });
  }, [staffDept, staffShiftFilter, staffSearchQuery]);

  const scrollToDirectory = () => {
    if (directoryRef.current) {
      directoryRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToStaff = () => {
    if (staffRef.current) {
      staffRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scrollToDirectory();
  };

  const handleServiceSelect = (serviceTitle: string) => {
    // Map service to closest doctor specialty if applicable
    if (serviceTitle.includes('Gynecology') || serviceTitle.includes('Maternity') || serviceTitle.includes('Delivery') || serviceTitle.includes('PCOS') || serviceTitle.includes('Fertility')) {
      setSelectedSpecialty('Gynecologist');
    } else if (serviceTitle.includes('General Physician')) {
      setSelectedSpecialty('General Physician');
    } else if (serviceTitle.includes('Emergency Care')) {
      setSelectedSpecialty('All Specialists');
    }
    scrollToDirectory();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSpecialty('All Specialists');
  };

  return (
    <div>
      {/* Hero Section with Video Background & Apple Mac Control Center Glass UI */}
      <div
        style={{
          borderRadius: '28px',
          minHeight: '480px',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          marginBottom: '2.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          backgroundColor: '#0a0f1d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem 1.5rem',
        }}
      >
        {/* Full-bleed Background Video */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        >
          <source src="/main-nirmay.mp4" type="video/mp4" />
        </video>

        {/* Ambient Dark Neutral Tint allowing moving video to remain clearly visible */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.25) 0%, rgba(10, 15, 26, 0.55) 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Apple Mac Glass Pod */}
        <div
          className="apple-glass-card"
          style={{
            position: 'relative',
            zIndex: 2,
            maxWidth: '780px',
            width: '100%',
            margin: '0 auto',
            textAlign: 'center',
            padding: '2.5rem 2rem',
          }}
        >
          {/* Status Badge */}
          <div
            className="apple-glass-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.38rem 1rem',
              marginBottom: '1.25rem',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
            }}
          >
            <span className="live-indicator-dot" />
            <ShieldCheck size={15} color="#38bdf8" />
            <span>Niramaya Certified Hospital Network</span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              marginBottom: '0.75rem',
              lineHeight: 1.15,
              color: '#ffffff',
              textShadow: '0 2px 16px rgba(0, 0, 0, 0.5)',
            }}
          >
            Find & Book Niramaya Medical Specialists
          </h1>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'rgba(255, 255, 255, 0.92)',
              marginBottom: '1.85rem',
              lineHeight: 1.55,
              maxWidth: '620px',
              margin: '0 auto 1.85rem auto',
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
            }}
          >
            Connect with verified doctors across Multispeciality, Laparoscopy, and Fertility departments with real-time consultation scheduling.
          </p>

          {/* Apple Spotlight Search Bar */}
          <form
            onSubmit={handleHeroSearchSubmit}
            className="apple-glass-search"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              maxWidth: '560px',
              margin: '0 auto 1.85rem auto',
              padding: '0.45rem 0.5rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
                paddingLeft: '0.75rem',
                gap: '0.6rem',
              }}
            >
              <Search size={18} color="#64748b" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by doctor name, specialty, condition..."
                aria-label="Search doctors by name or specialty"
                style={{
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  outline: 'none',
                  fontSize: '0.94rem',
                  color: '#0f172a',
                  fontWeight: 500,
                }}
              />
            </div>
            <button
              type="submit"
              aria-label="Search and explore doctors"
              style={{
                background: 'linear-gradient(135deg, #FF2A85 0%, #00C2CB 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.62rem 1.45rem',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255, 42, 133, 0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              Explore
            </button>
          </form>

          {/* Mac Modular Feature Tiles */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.85rem',
              maxWidth: '740px',
              margin: '0 auto',
            }}
          >
            {[
              { title: 'Verified Doctors', sub: `${doctors.length || '10+'} Specialists`, icon: '🩺', onClick: scrollToDirectory },
              { title: 'Clinical Staff', sub: `${HOSPITAL_STAFF_MEMBERS.length} On-Duty Team`, icon: '👥', onClick: scrollToStaff },
              { title: 'Instant Booking', sub: 'Real-Time OPD Slots', icon: '⚡', onClick: scrollToDirectory },
              { title: 'Top Rated Care', sub: '4.9 / 5 Patient Rating', icon: '⭐', onClick: scrollToDirectory },
            ].map((widget) => (
              <div
                key={widget.title}
                onClick={widget.onClick}
                className="apple-glass-widget"
                style={{
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, background 0.15s ease',
                }}
              >
                <div className="apple-icon-circle">
                  <span style={{ fontSize: '1rem' }}>{widget.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                    {widget.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.72)', marginTop: '2px' }}>
                    {widget.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Verified Doctors Directory Section */}
      <div ref={directoryRef} id="doctors-section" style={{ marginBottom: '3.5rem', scrollMarginTop: '80px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                }}
              >
                <Sparkles size={12} />
                AVAILABLE TODAY
              </span>
            </div>
            <h2
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Certified Medical Specialists
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>
              Select a doctor, view verified credentials, and book an immediate appointment slot
            </p>
          </div>

          {/* Quick Doctor Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.75rem',
                minWidth: '240px',
              }}
            >
              <Search size={16} color="var(--text-muted)" aria-hidden="true" />
              <input
                type="text"
                placeholder="Filter doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Filter doctors by name or keyword"
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear doctor filter search"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <XCircle size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Specialization Filter Pills */}
        <div
          role="region"
          aria-label="Filter by specialization"
          style={{
            display: 'flex',
            gap: '0.45rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            marginBottom: '1.75rem',
            scrollbarWidth: 'thin',
          }}
        >
          {SPECIALIZATION_FILTERS.map((spec) => {
            const isSelected = selectedSpecialty === spec;
            return (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                aria-pressed={isSelected}
                style={{
                  padding: '0.45rem 0.95rem',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? 'var(--shadow-primary)' : 'none',
                }}
              >
                {spec}
              </button>
            );
          })}
        </div>

        {/* Error State */}
        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{error}</span>
            </div>
            <button
              onClick={fetchDoctors}
              className="btn btn-sm btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RotateCcw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Doctors Grid / Loading / Empty */}
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="card pulse"
                style={{
                  height: '220px',
                  borderRadius: '10px',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border)',
                }}
              />
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div
            className="card"
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '520px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Stethoscope size={28} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
              No Doctors Found
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              No medical specialists match your current filter{' '}
              {searchQuery ? `"${searchQuery}"` : `in ${selectedSpecialty}`}.
            </p>
            <button
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Filter size={14} /> Reset Filters
            </button>
          </div>
        ) : (
          <div
            className="doctor-cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {filteredDoctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} onBook={onBookDoctor} />
            ))}
          </div>
        )}
      </div>

      {/* Hospital Staff & Clinical Care Team Section */}
      <div ref={staffRef} id="staff-section" style={{ marginBottom: '3.5rem', scrollMarginTop: '80px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'rgba(2, 132, 199, 0.12)',
                  color: '#0284c7',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                }}
              >
                <Users size={12} />
                24×7 ON-DUTY CARE TEAM
              </span>
              {isStaffAuthorized ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(13, 148, 136, 0.12)',
                    color: '#0d9488',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                  }}
                >
                  <ShieldCheck size={12} />
                  STAFF PORTAL UNLOCKED ({user?.role})
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                  }}
                >
                  <Lock size={12} />
                  CONFIDENTIAL ROSTER · RESTRICTED ACCESS
                </span>
              )}
            </div>
            <h2
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Clinical & Hospital Support Staff
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>
              {isStaffAuthorized
                ? 'Internal duty rosters, day/night shift schedules, and direct handover contact points'
                : 'Duty shift schedules, night rosters, and staff contact lines are restricted to Hospital Staff, Doctors, and Administrators'}
            </p>
          </div>

          {/* Quick Staff Search Box (Only displayed when authorized) */}
          {isStaffAuthorized && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.45rem 0.75rem',
                  minWidth: '240px',
                }}
              >
                <Search size={16} color="var(--text-muted)" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Filter staff by name, role, or shift..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  aria-label="Filter staff members"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    width: '100%',
                  }}
                />
                {staffSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStaffSearchQuery('')}
                    aria-label="Clear staff search"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      padding: 0,
                    }}
                  >
                    <XCircle size={15} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {!isStaffAuthorized ? (
          /* Privacy Shield Gate for Patients & Non-authenticated Visitors */
          <div
            className="card"
            style={{
              padding: '2.8rem 2rem',
              borderRadius: '24px',
              border: '1.5px solid rgba(2, 132, 199, 0.25)',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.04) 0%, rgba(13, 148, 136, 0.06) 100%)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                boxShadow: '0 6px 18px rgba(2, 132, 199, 0.35)',
              }}
            >
              <Lock size={30} />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
                padding: '0.25rem 0.8rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              <ShieldAlert size={14} />
              STAFF PRIVACY POLICY · AUTHORIZED ACCESS ONLY
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.6rem' }}>
              Confidential Staff Duty Roster & Shift Schedules
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '580px', margin: '0 auto 1.5rem auto' }}>
              To safeguard employee privacy and adhere to clinical safety regulations, individual staff contact numbers, duty hours, night shift allocations, and handover messaging channels are restricted to verified <strong>Doctors</strong>, <strong>Hospital Staff</strong>, and <strong>Administrators</strong>.
            </p>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '1.2rem',
                maxWidth: '540px',
                margin: '0 auto 1.75rem auto',
                textAlign: 'left',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
              }}
            >
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
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Users size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                  {user ? `Signed in as Patient (${user.name})` : 'Are you a Doctor, Nurse, or Hospital Staff?'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {user
                    ? 'Patients have full access to Doctor consultations, appointments, and hospital services. Staff shift rosters require Doctor or Administrator privileges.'
                    : 'Sign in with your verified hospital credentials to unlock on-duty nurse rosters, laboratory shifts, emergency rotations, and direct staff paging.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => onOpenAuth('DOCTOR')}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.4rem',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <Lock size={16} /> Sign In with Staff / Doctor Account
                </button>
              )}
              <button
                type="button"
                onClick={scrollToDirectory}
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                }}
              >
                <Stethoscope size={16} /> Browse Consulting Doctors
              </button>
            </div>
          </div>
        ) : (
          /* Authorized View: Duty Shifts, Department Filters & Staff Roster */
          <>
            {/* Shift Filter Buttons (Day vs Night vs Evening) */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Filter by Duty Shift Schedule:
              </div>
              <div
                role="region"
                aria-label="Staff shift filters"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  overflowX: 'auto',
                  paddingBottom: '0.35rem',
                  scrollbarWidth: 'none',
                }}
              >
                {STAFF_SHIFT_FILTERS.map((shiftLabel) => {
                  const isSelected = staffShiftFilter === shiftLabel;
                  const isNight = shiftLabel.includes('Night');
                  const isDay = shiftLabel.includes('Day');
                  return (
                    <button
                      key={shiftLabel}
                      onClick={() => setStaffShiftFilter(shiftLabel)}
                      aria-pressed={isSelected}
                      style={{
                        padding: '0.45rem 1rem',
                        borderRadius: '999px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        border: isSelected
                          ? isNight
                            ? '1px solid #6366f1'
                            : '1px solid #0284c7'
                          : '1px solid var(--border)',
                        background: isSelected
                          ? isNight
                            ? 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)'
                            : 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)'
                          : 'var(--bg-card)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected
                          ? isNight
                            ? '0 4px 12px rgba(99, 102, 241, 0.35)'
                            : '0 4px 12px rgba(2, 132, 199, 0.25)'
                          : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      {isDay && <Sun size={13} />}
                      {isNight && <Moon size={13} />}
                      <span>{shiftLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Staff Department Filter Pills */}
            <div
              role="region"
              aria-label="Staff department filters"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                overflowX: 'auto',
                paddingBottom: '0.75rem',
                marginBottom: '1.5rem',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {STAFF_DEPARTMENT_FILTERS.map((dept) => {
                const isSelected = staffDept === dept;
                return (
                  <button
                    key={dept}
                    onClick={() => setStaffDept(dept)}
                    aria-pressed={isSelected}
                    style={{
                      padding: '0.4rem 0.9rem',
                      borderRadius: '999px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid #0284c7' : '1px solid var(--border)',
                      background: isSelected ? '#0284c7' : 'var(--bg-card)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',
                    }}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>

            {/* Staff Cards Grid / Empty State */}
            {filteredStaff.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  borderRadius: 'var(--radius-lg)',
                  maxWidth: '520px',
                  margin: '0 auto',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(2, 132, 199, 0.12)',
                    color: '#0284c7',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <Users size={28} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  No Staff Found
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  No hospital staff match your current filter {staffSearchQuery ? `"${staffSearchQuery}"` : `in ${staffDept} (${staffShiftFilter})`}.
                </p>
                <button
                  onClick={() => {
                    setStaffSearchQuery('');
                    setStaffDept('All Care Team');
                    setStaffShiftFilter('All Duty Shifts');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Filter size={14} /> Reset Filters
                </button>
              </div>
            ) : (
              <div
                className="doctor-cards-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
                  gap: '1.5rem',
                }}
              >
                {filteredStaff.map((staff) => (
                  <StaffCard key={staff.id} staff={staff} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Hospital Services Section */}
      <div>
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #00C2CB 0%, #FF2A85 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              boxShadow: '0 4px 14px rgba(0, 194, 203, 0.4)',
              flexShrink: 0,
            }}
          >
            🏥
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              Hospital Services & Clinical Departments
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
              Niramaya Multispeciality · Laparoscopy · Fertility Centre
            </p>
          </div>
        </div>

        {/* Services Grid — Rich Content Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {[
            {
              icon: '🚨',
              title: '24×7 Emergency Care',
              desc: 'Round-the-clock emergency medical services with trained staff, advanced equipment, and rapid response to handle all critical and life-threatening conditions.',
              color: '#ef4444',
              bg: 'rgba(239,68,68,0.08)',
              border: 'rgba(239,68,68,0.18)',
            },
            {
              icon: '🩺',
              title: 'Obstetrics & Gynecology',
              desc: "Comprehensive OB-GYN care covering routine check-ups, hormonal disorders, menstrual issues, and complete women's reproductive health management.",
              color: '#ec4899',
              bg: 'rgba(236,72,153,0.08)',
              border: 'rgba(236,72,153,0.18)',
            },
            {
              icon: '🤰',
              title: 'Maternity & Pregnancy Care',
              desc: 'Expert prenatal and postnatal care to ensure a healthy pregnancy journey — from first trimester to post-delivery recovery for mother and baby.',
              color: '#f97316',
              bg: 'rgba(249,115,22,0.08)',
              border: 'rgba(249,115,22,0.18)',
            },
            {
              icon: '👶',
              title: 'Normal & Cesarean Delivery',
              desc: 'Skilled team offering safe vaginal and cesarean deliveries in a fully-equipped OT, ensuring the highest safety standards for mother and newborn.',
              color: '#22c55e',
              bg: 'rgba(34,197,94,0.08)',
              border: 'rgba(34,197,94,0.18)',
            },
            {
              icon: '🔬',
              title: 'Infertility / IVF Treatment',
              desc: 'Advanced assisted reproductive technology including IVF, ICSI, IUI, and embryo freezing — offering hope and solutions for couples facing infertility.',
              color: '#8b5cf6',
              bg: 'rgba(139,92,246,0.08)',
              border: 'rgba(139,92,246,0.18)',
            },
            {
              icon: '💊',
              title: 'PCOS & Fertility Care',
              desc: 'Specialized treatment for Polycystic Ovarian Syndrome with tailored hormonal therapy, lifestyle guidance, and fertility enhancement protocols.',
              color: '#FF2A85',
              bg: 'rgba(255,42,133,0.08)',
              border: 'rgba(255,42,133,0.18)',
            },
            {
              icon: '❤️',
              title: "Women's Health Check-ups",
              desc: 'Preventive health screenings for women of all ages — mammography, pap smear, bone density, thyroid, and complete wellness packages.',
              color: '#e11d48',
              bg: 'rgba(225,29,72,0.08)',
              border: 'rgba(225,29,72,0.18)',
            },
            {
              icon: '🩻',
              title: 'General Physician Consultation',
              desc: 'Expert consultation for common illnesses, chronic disease management, fever, infections, and general health concerns by experienced physicians.',
              color: '#0284c7',
              bg: 'rgba(2,132,199,0.08)',
              border: 'rgba(2,132,199,0.18)',
            },
            {
              icon: '🔍',
              title: 'Diagnostic & Laboratory Services',
              desc: 'State-of-the-art in-house diagnostic lab offering blood tests, urine analysis, hormonal assays, and rapid pathology reports for accurate diagnosis.',
              color: '#0d9488',
              bg: 'rgba(13,148,136,0.08)',
              border: 'rgba(13,148,136,0.18)',
            },
            {
              icon: '📡',
              title: 'Ultrasound / Sonography',
              desc: 'High-resolution 2D, 3D & 4D ultrasound services for fetal monitoring, abdominal scans, pelvic imaging, and guided procedures with instant reports.',
              color: '#00C2CB',
              bg: 'rgba(0,194,203,0.08)',
              border: 'rgba(0,194,203,0.18)',
            },
            {
              icon: '🌸',
              title: 'Pre & Post-Natal Care',
              desc: 'Holistic care programs covering antenatal classes, nutritional guidance, postpartum monitoring, lactation support, and newborn care education.',
              color: '#db2777',
              bg: 'rgba(219,39,119,0.08)',
              border: 'rgba(219,39,119,0.18)',
            },
            {
              icon: '👨‍👩‍👧',
              title: 'Family Planning & Counseling',
              desc: 'Confidential counseling and services for birth control, spacing pregnancies, reproductive choices, and long-term family planning solutions.',
              color: '#7c3aed',
              bg: 'rgba(124,58,237,0.08)',
              border: 'rgba(124,58,237,0.18)',
            },
            {
              icon: '🏨',
              title: 'Inpatient & Outpatient Care',
              desc: 'Well-equipped inpatient wards and smooth OPD services ensuring comfortable stays, attentive nursing, and seamless patient experience at every step.',
              color: '#2563eb',
              bg: 'rgba(37,99,235,0.08)',
              border: 'rgba(37,99,235,0.18)',
            },
            {
              icon: '💉',
              title: 'Pharmacy / Medicine Support',
              desc: 'In-house pharmacy stocked with all prescribed medications, fertility drugs, supplements, and medical supplies — available 24×7 for patient convenience.',
              color: '#16a34a',
              bg: 'rgba(22,163,74,0.08)',
              border: 'rgba(22,163,74,0.18)',
            },
            {
              icon: '🧪',
              title: 'Health Check-up Packages',
              desc: 'Affordable and comprehensive health check-up packages for individuals, couples, and corporate groups — covering all key parameters for preventive care.',
              color: '#ca8a04',
              bg: 'rgba(202,138,4,0.08)',
              border: 'rgba(202,138,4,0.18)',
            },
          ].map((service) => (
            <div
              key={service.title}
              onClick={() => handleServiceSelect(service.title)}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${service.border}`,
                borderRadius: '20px',
                padding: '1.5rem 1.4rem',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.2, 0.8, 0.2, 1)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${service.bg}, 0 0 0 1.5px ${service.border}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
              }}
            >
              {/* Top accent glow */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${service.color}, transparent)`,
                  borderRadius: '20px 20px 0 0',
                }}
              />

              {/* Icon */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: service.bg,
                  border: `1.5px solid ${service.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.55rem',
                  marginBottom: '1rem',
                  flexShrink: 0,
                }}
              >
                {service.icon}
              </div>

              {/* Title */}
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.25,
                  letterSpacing: '-0.015em',
                  marginBottom: '0.6rem',
                }}
              >
                {service.title}
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                  flex: 1,
                  marginBottom: '1.1rem',
                }}
              >
                {service.desc}
              </p>

              {/* View Specialists */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: service.color,
                  userSelect: 'none',
                }}
              >
                <span>→</span>
                <span>Find Doctors</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
