export interface DoctorRecord {
  id: number;
  userId: number;
  name: string;
  avatarUrl: string | null;
  employeeId: string;
  phone: string;
  email: string;
  department: string;
  specialization: string;
  qualification: string;
  experience: string;
  todayShift: string;
  shiftHours: string;
  breakTime: string;
  workingDays: string;
  workingLocation: string;
  roomNumber: string;
  nextShift: string;
  status: 'ACTIVE' | 'INACTIVE';
  assignedPatientCount: number;
}

export interface StaffRecord {
  id: number;
  userId: number;
  name: string;
  avatarUrl: string | null;
  employeeId: string;
  phone: string;
  email: string;
  staffType: 'Nurse' | 'Receptionist' | 'Pharmacist' | 'Laboratory Staff' | 'Administrative Staff';
  role: 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'LABORATORY_STAFF' | 'STAFF';
  department: string;
  todayShift: string;
  shiftHours: string;
  breakTime: string;
  workingDays: string;
  workingLocation: string;
  assignedArea: string;
  nextShift: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AssignedPatientRecord {
  id: number;
  patientId: string; // e.g. "PT-10029"
  name: string;
  age: number;
  gender: string;
  phone: string;
  appointmentTime: string;
  appointmentStatus: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  department: string;
  lastVisit: string;
  medicalRecordStatus: 'Up to Date' | 'Pending Review' | 'Critical Review';
  priority: 'Routine' | 'Urgent' | 'STAT Emergency';
  doctorId: number;
  doctorName: string;
  diagnosis?: string;
  prescriptions?: Array<{ id: string; medication: string; dosage: string; frequency: string; duration: string; instructions: string }>;
  medicalNotes?: Array<{ id: string; date: string; author: string; note: string }>;
  labReports?: Array<{ id: string; testName: string; status: 'Normal' | 'Abnormal' | 'Pending'; date: string; resultSummary: string }>;
  history?: Array<{ id: string; date: string; title: string; doctor: string; notes: string }>;
}

export interface WardBedRecord {
  id: string;
  bedNumber: string;
  ward: string;
  patientName: string;
  patientId: string;
  age: number;
  gender: string;
  admittedDate: string;
  attendingDoctor: string;
  diagnosis: string;
  vitals: { bp: string; pulse: number; temp: string; spO2: number };
  nursingNotes: Array<{ id: string; time: string; note: string; nurse: string }>;
  status: 'Stable' | 'Needs Observation' | 'Critical';
}

export interface ReceptionQueueRecord {
  id: number;
  tokenNumber: string;
  patientName: string;
  patientId: string;
  phone: string;
  department: string;
  doctorName: string;
  appointmentTime: string;
  checkInTime: string;
  status: 'Scheduled' | 'Checked In' | 'In Consultation' | 'Completed' | 'Cancelled';
  roomNumber: string;
}

export interface PrescriptionQueueRecord {
  id: number;
  prescriptionId: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  department: string;
  prescribedTime: string;
  medicines: Array<{ name: string; dosage: string; quantity: number; instructions: string }>;
  status: 'Pending' | 'Dispensed' | 'Out of Stock';
  dispensedBy?: string;
  dispensedAt?: string;
}

export interface MedicineStockRecord {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  expiryDate: string;
}

export interface LaboratoryTestRecord {
  id: string;
  testId: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  testName: string;
  sampleType: string;
  priority: 'Routine' | 'Urgent' | 'STAT Emergency';
  requestedTime: string;
  status: 'Pending Collection' | 'Sample Received' | 'In Analysis' | 'Completed';
  resultSummary?: string;
  findings?: string;
  completedAt?: string;
}

export interface ScheduleEntryRecord {
  id: string;
  personId: number;
  personName: string;
  role: 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PHARMACIST' | 'LABORATORY_STAFF' | 'STAFF';
  date: string;
  shiftName: string;
  shiftHours: string;
  department: string;
  workingLocation: string;
  roomArea: string;
}

const STORAGE_KEY_DOCTORS = 'niramaya_hospital_doctors_v3';
const STORAGE_KEY_STAFF = 'niramaya_hospital_staff_v3';
const STORAGE_KEY_PATIENTS = 'niramaya_hospital_patients_v3';
const STORAGE_KEY_BEDS = 'niramaya_hospital_beds_v3';
const STORAGE_KEY_RECEPTION = 'niramaya_hospital_reception_v3';
const STORAGE_KEY_PRESCRIPTIONS = 'niramaya_hospital_prescriptions_v3';
const STORAGE_KEY_MEDICINES = 'niramaya_hospital_medicines_v3';
const STORAGE_KEY_LAB = 'niramaya_hospital_lab_v3';
const STORAGE_KEY_SCHEDULE = 'niramaya_hospital_schedule_v3';

// ─── Initial Seed Data ────────────────────────────────────────────────────────

const INITIAL_DOCTORS: DoctorRecord[] = [
  {
    id: 1,
    userId: 2,
    name: 'Dr. Priya Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813589-3286ff00eeae?auto=format&fit=crop&q=80&w=400',
    employeeId: 'DOC-CRD-01',
    phone: '+91 98201 44521',
    email: 'doctor@demo.test',
    department: 'Cardiology',
    specialization: 'Interventional Cardiology & Cardiac Electrophysiology',
    qualification: 'MBBS, MD (General Medicine), DM (Cardiology), FACC',
    experience: '12 Years',
    todayShift: 'Morning Shift',
    shiftHours: '08:00 AM – 02:00 PM',
    breakTime: '12:00 PM – 12:30 PM',
    workingDays: 'Mon, Tue, Wed, Thu, Fri',
    workingLocation: 'OPD',
    roomNumber: 'Consultation Room 04',
    nextShift: 'Tomorrow – 08:00 AM – 02:00 PM',
    status: 'ACTIVE',
    assignedPatientCount: 4,
  },
  {
    id: 2,
    userId: 102,
    name: 'Dr. Rajesh Patel',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    employeeId: 'DOC-MED-02',
    phone: '+91 98450 11234',
    email: 'rajesh.patel@niramaya.health',
    department: 'General Medicine',
    specialization: 'Internal Medicine & Infectious Diseases',
    qualification: 'MBBS, MD (Medicine)',
    experience: '15 Years',
    todayShift: 'Evening Shift',
    shiftHours: '02:00 PM – 08:00 PM',
    breakTime: '05:00 PM – 05:30 PM',
    workingDays: 'Mon to Sat',
    workingLocation: 'OPD',
    roomNumber: 'Consultation Room 02',
    nextShift: 'Tomorrow – 02:00 PM – 08:00 PM',
    status: 'ACTIVE',
    assignedPatientCount: 3,
  },
  {
    id: 3,
    userId: 103,
    name: 'Dr. Amit Singh',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    employeeId: 'DOC-ORT-03',
    phone: '+91 98765 43210',
    email: 'amit.singh@niramaya.health',
    department: 'Orthopedics',
    specialization: 'Joint Replacement & Arthroscopic Surgery',
    qualification: 'MBBS, MS (Orthopedics), M.Ch (Ortho)',
    experience: '10 Years',
    todayShift: 'Morning Shift',
    shiftHours: '08:00 AM – 02:00 PM',
    breakTime: '11:30 AM – 12:00 PM',
    workingDays: 'Mon, Wed, Fri (OT Days)',
    workingLocation: 'Operation Theatre',
    roomNumber: 'Major OT 02',
    nextShift: 'Wed – 08:00 AM – 02:00 PM',
    status: 'ACTIVE',
    assignedPatientCount: 2,
  },
  {
    id: 4,
    userId: 104,
    name: 'Dr. Sunita Deshmukh',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    employeeId: 'DOC-EMG-04',
    phone: '+91 99302 88471',
    email: 'sunita.deshmukh@niramaya.health',
    department: 'Emergency & Trauma',
    specialization: 'Trauma Care & Critical Life Support (ACLS/ATLS)',
    qualification: 'MBBS, MEM (Emergency Medicine)',
    experience: '8 Years',
    todayShift: 'Night Shift',
    shiftHours: '08:00 PM – 08:00 AM',
    breakTime: '01:00 AM – 01:45 AM',
    workingDays: 'Mon, Tue, Thu, Sun',
    workingLocation: 'Emergency',
    roomNumber: 'Emergency Trauma Triage Bay 1',
    nextShift: 'Tomorrow – 08:00 PM – 08:00 AM',
    status: 'ACTIVE',
    assignedPatientCount: 3,
  },
];

const INITIAL_STAFF: StaffRecord[] = [
  {
    id: 101,
    userId: 201,
    name: 'Sister Anjali Nair',
    avatarUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    employeeId: 'STF-NUR-101',
    phone: '+91 98110 33421',
    email: 'nurse@demo.test',
    staffType: 'Nurse',
    role: 'NURSE',
    department: 'Intensive Care Unit (ICU)',
    todayShift: 'Morning Shift',
    shiftHours: '08:00 AM – 04:00 PM',
    breakTime: '12:30 PM – 01:15 PM',
    workingDays: 'Mon, Tue, Wed, Thu, Fri',
    workingLocation: 'ICU',
    assignedArea: 'ICU Ward 3A — Beds 101 to 106',
    nextShift: 'Tomorrow – 08:00 AM – 04:00 PM',
    status: 'ACTIVE',
  },
  {
    id: 102,
    userId: 202,
    name: 'Kavita Sundaram',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    employeeId: 'STF-REC-102',
    phone: '+91 98205 11982',
    email: 'receptionist@demo.test',
    staffType: 'Receptionist',
    role: 'RECEPTIONIST',
    department: 'General Medicine',
    todayShift: 'Morning Shift',
    shiftHours: '07:30 AM – 03:30 PM',
    breakTime: '12:00 PM – 12:45 PM',
    workingDays: 'Mon to Sat',
    workingLocation: 'Reception',
    assignedArea: 'Main Hospital Entrance — Counter 02 (OPD Registration Desk)',
    nextShift: 'Tomorrow – 07:30 AM – 03:30 PM',
    status: 'ACTIVE',
  },
  {
    id: 103,
    userId: 203,
    name: 'Pooja Sundaram',
    avatarUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400',
    employeeId: 'STF-PHR-103',
    phone: '+91 98334 77123',
    email: 'pharmacist@demo.test',
    staffType: 'Pharmacist',
    role: 'PHARMACIST',
    department: 'Pharmacy Services',
    todayShift: 'Morning Shift',
    shiftHours: '08:30 AM – 04:30 PM',
    breakTime: '01:00 PM – 01:45 PM',
    workingDays: 'Mon to Sat',
    workingLocation: 'Pharmacy',
    assignedArea: 'Central Inpatient Hospital Pharmacy — Dispensing Counter 01',
    nextShift: 'Tomorrow – 08:30 AM – 04:30 PM',
    status: 'ACTIVE',
  },
  {
    id: 104,
    userId: 204,
    name: 'Vikramaditya Rathore',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    employeeId: 'STF-LAB-104',
    phone: '+91 98670 99411',
    email: 'lab@demo.test',
    staffType: 'Laboratory Staff',
    role: 'LABORATORY_STAFF',
    department: 'Pathology & Laboratory',
    todayShift: 'Morning Shift',
    shiftHours: '08:00 AM – 04:00 PM',
    breakTime: '12:30 PM – 01:15 PM',
    workingDays: 'Mon, Tue, Wed, Thu, Fri, Sat',
    workingLocation: 'Laboratory',
    assignedArea: '2nd Floor Diagnostic Pathology & Biochemistry Lab Suite',
    nextShift: 'Tomorrow – 08:00 AM – 04:00 PM',
    status: 'ACTIVE',
  },
  {
    id: 105,
    userId: 205,
    name: 'Manish Verma',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    employeeId: 'STF-RAD-105',
    phone: '+91 99201 33411',
    email: 'manish.verma@niramaya.health',
    staffType: 'Laboratory Staff',
    role: 'LABORATORY_STAFF',
    department: 'Radiology & Imaging',
    todayShift: 'Evening Shift',
    shiftHours: '02:00 PM – 10:00 PM',
    breakTime: '06:00 PM – 06:45 PM',
    workingDays: 'Mon to Fri',
    workingLocation: 'Radiology',
    assignedArea: 'Basement Imaging Wing — 3T MRI & 128-Slice CT Suite',
    nextShift: 'Tomorrow – 02:00 PM – 10:00 PM',
    status: 'ACTIVE',
  },
];

const INITIAL_ASSIGNED_PATIENTS: AssignedPatientRecord[] = [
  {
    id: 1,
    patientId: 'PT-10021',
    name: 'Ramesh Verma',
    age: 58,
    gender: 'Male',
    phone: '+91 98201 99482',
    appointmentTime: '09:15 AM',
    appointmentStatus: 'CONFIRMED',
    department: 'Cardiology',
    lastVisit: '14 days ago',
    medicalRecordStatus: 'Critical Review',
    priority: 'Urgent',
    doctorId: 1,
    doctorName: 'Dr. Priya Sharma',
    diagnosis: 'Hypertensive Heart Disease with Grade II Left Ventricular Diastolic Dysfunction',
    prescriptions: [
      { id: 'rx-1', medication: 'Telmisartan + Amlodipine', dosage: '40mg / 5mg', frequency: 'Once daily (morning)', duration: '30 days', instructions: 'Take post-breakfast with water.' },
      { id: 'rx-2', medication: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily (bedtime)', duration: '30 days', instructions: 'Take after dinner.' },
    ],
    medicalNotes: [
      { id: 'mn-1', date: '2026-09-19', author: 'Dr. Priya Sharma', note: 'Resting BP 148/92 mmHg. Advised 2D Echocardiogram and 24-hr Holter ambulatory ECG.' },
      { id: 'mn-2', date: '2026-10-02', author: 'Dr. Priya Sharma', note: 'Reports reviewed. Symptoms improving. Continue lifestyle sodium restriction <2g/day.' },
    ],
    labReports: [
      { id: 'lr-1', testName: 'Serum Lipid Profile', status: 'Abnormal', date: '2026-09-28', resultSummary: 'Total Cholesterol: 232 mg/dL (Elevated), LDL: 154 mg/dL' },
      { id: 'lr-2', testName: 'Serum Creatinine & eGFR', status: 'Normal', date: '2026-09-28', resultSummary: 'Creatinine: 0.98 mg/dL, eGFR: 88 mL/min/1.73m²' },
      { id: 'lr-3', testName: '12-Lead Resting ECG', status: 'Abnormal', date: '2026-10-01', resultSummary: 'Sinus rhythm with Left Ventricular Strain Pattern in V5-V6' },
    ],
    history: [
      { id: 'h-1', date: '2026-06-12', title: 'Annual Cardiac Assessment', doctor: 'Dr. Priya Sharma', notes: 'Routine checkup. Moderate dyspnea on brisk walking.' },
      { id: 'h-2', date: '2026-09-19', title: 'Hypertension Follow-up', doctor: 'Dr. Priya Sharma', notes: 'Dose adjustment of antihypertensives.' },
    ],
  },
  {
    id: 2,
    patientId: 'PT-10034',
    name: 'Sunita Rao',
    age: 46,
    gender: 'Female',
    phone: '+91 98451 88301',
    appointmentTime: '10:30 AM',
    appointmentStatus: 'CONFIRMED',
    department: 'Cardiology',
    lastVisit: '1 month ago',
    medicalRecordStatus: 'Up to Date',
    priority: 'Routine',
    doctorId: 1,
    doctorName: 'Dr. Priya Sharma',
    diagnosis: 'Supraventricular Paroxysmal Tachycardia (Resolved episode)',
    prescriptions: [
      { id: 'rx-3', medication: 'Metoprolol Succinate ER', dosage: '25mg', frequency: 'Once daily (morning)', duration: '60 days', instructions: 'Monitor resting pulse rate weekly.' },
    ],
    medicalNotes: [
      { id: 'mn-3', date: '2026-09-02', author: 'Dr. Priya Sharma', note: 'Holter showed occasional premature ventricular contractions (<1%). No sustained runs.' },
    ],
    labReports: [
      { id: 'lr-4', testName: 'Serum Electrolytes (Na/K/Cl)', status: 'Normal', date: '2026-09-02', resultSummary: 'Potassium: 4.2 mEq/L, Sodium: 140 mEq/L' },
      { id: 'lr-5', testName: 'Thyroid Stimulating Hormone (TSH)', status: 'Normal', date: '2026-09-02', resultSummary: 'TSH: 2.15 uIU/mL' },
    ],
    history: [
      { id: 'h-3', date: '2026-09-02', title: 'Palpitations Evaluation', doctor: 'Dr. Priya Sharma', notes: 'Holter monitor placed for 48 hours.' },
    ],
  },
  {
    id: 3,
    patientId: 'PT-10048',
    name: 'Meera Joshi',
    age: 64,
    gender: 'Female',
    phone: '+91 97120 44102',
    appointmentTime: '11:45 AM',
    appointmentStatus: 'PENDING',
    department: 'Cardiology',
    lastVisit: '3 days ago',
    medicalRecordStatus: 'Pending Review',
    priority: 'STAT Emergency',
    doctorId: 1,
    doctorName: 'Dr. Priya Sharma',
    diagnosis: 'Angina Pectoris (Canadian Cardiovascular Society Class II)',
    prescriptions: [
      { id: 'rx-4', medication: 'Sorbitrate (Isosorbide Dinitrate)', dosage: '5mg', frequency: 'Sublingual STAT for chest pain', duration: 'SOS', instructions: 'Dissolve under tongue if chest pain persists >3 mins.' },
      { id: 'rx-5', medication: 'Aspirin 75mg + Clopidogrel 75mg', dosage: '1 Tab', frequency: 'Once daily post-lunch', duration: '30 days', instructions: 'Strict post-meal consumption.' },
    ],
    medicalNotes: [
      { id: 'mn-4', date: '2026-09-30', author: 'Dr. Priya Sharma', note: 'Emergency admission due to retrosternal tightness. Troponin-T negative. Schedule stress echocardiogram.' },
    ],
    labReports: [
      { id: 'lr-6', testName: 'High Sensitivity Troponin-I', status: 'Normal', date: '2026-09-30', resultSummary: '0.012 ng/mL (Baseline within normal reference limits)' },
      { id: 'lr-7', testName: 'HbA1c & Glycated Hemoglobin', status: 'Abnormal', date: '2026-09-30', resultSummary: 'HbA1c: 7.8% (Sub-optimal glycemic control)' },
    ],
    history: [
      { id: 'h-4', date: '2026-09-30', title: 'Emergency Casualty Evaluation', doctor: 'Dr. Sunita Deshmukh', notes: 'Referred to Cardiology OPD for elective coronary evaluation.' },
    ],
  },
  {
    id: 4,
    patientId: 'PT-10052',
    name: 'Anita Desai',
    age: 39,
    gender: 'Female',
    phone: '+91 98200 11983',
    appointmentTime: '01:15 PM',
    appointmentStatus: 'CONFIRMED',
    department: 'Cardiology',
    lastVisit: '3 weeks ago',
    medicalRecordStatus: 'Up to Date',
    priority: 'Routine',
    doctorId: 1,
    doctorName: 'Dr. Priya Sharma',
    diagnosis: 'Mitral Valve Prolapse with Mild Regurgitation (Asymptomatic)',
    prescriptions: [
      { id: 'rx-6', medication: 'Magnesium Orotate', dosage: '500mg', frequency: 'Once daily', duration: '30 days', instructions: 'Nutritional cardiovascular support.' },
    ],
    medicalNotes: [
      { id: 'mn-5', date: '2026-09-12', author: 'Dr. Priya Sharma', note: 'Echocardiogram indicates benign MVP. Reassured patient; no competitive sports restriction needed.' },
    ],
    labReports: [
      { id: 'lr-8', testName: 'Color Doppler Echocardiogram', status: 'Normal', date: '2026-09-12', resultSummary: 'Ejection fraction 62%, mild posterior mitral leaflet prolapse.' },
    ],
    history: [
      { id: 'h-5', date: '2026-09-12', title: 'Initial Cardiology Triage', doctor: 'Dr. Priya Sharma', notes: 'Routine cardiac screening.' },
    ],
  },
];

const INITIAL_BEDS: WardBedRecord[] = [
  {
    id: 'bed-101',
    bedNumber: 'Bed 101',
    ward: 'ICU Ward 3A',
    patientName: 'Kishore Trivedi',
    patientId: 'PT-10088',
    age: 67,
    gender: 'Male',
    admittedDate: '2026-10-01',
    attendingDoctor: 'Dr. Priya Sharma',
    diagnosis: 'Acute Coronary Syndrome post-PCI stent (LAD)',
    vitals: { bp: '124/78 mmHg', pulse: 74, temp: '98.4 °F', spO2: 98 },
    nursingNotes: [
      { id: 'nn-1', time: '08:30 AM', note: 'Radial sheath removed. Good hemostasis achieved with compression dressing. No hematoma.', nurse: 'Sister Anjali Nair' },
      { id: 'nn-2', time: '11:15 AM', note: 'Urine output 180ml over last 3 hrs. Vitals stable. Patient resting comfortably.', nurse: 'Sister Anjali Nair' },
    ],
    status: 'Stable',
  },
  {
    id: 'bed-102',
    bedNumber: 'Bed 102',
    ward: 'ICU Ward 3A',
    patientName: 'Bhavna Ben Dave',
    patientId: 'PT-10091',
    age: 52,
    gender: 'Female',
    admittedDate: '2026-10-02',
    attendingDoctor: 'Dr. Rajesh Patel',
    diagnosis: 'Severe Bilateral Community-Acquired Pneumonia with Hypoxia',
    vitals: { bp: '118/72 mmHg', pulse: 92, temp: '100.2 °F', spO2: 94 },
    nursingNotes: [
      { id: 'nn-3', time: '09:00 AM', note: 'High flow nasal cannula oxygen at 4 L/min. Nebulized with Levolin and Budecort.', nurse: 'Sister Anjali Nair' },
      { id: 'nn-4', time: '12:30 PM', note: 'Temperature 100.2 °F. Administered IV Paracetamol 1g as prescribed.', nurse: 'Sister Anjali Nair' },
    ],
    status: 'Needs Observation',
  },
  {
    id: 'bed-104',
    bedNumber: 'Bed 104',
    ward: 'ICU Ward 3A',
    patientName: 'Devang Joshi',
    patientId: 'PT-10095',
    age: 44,
    gender: 'Male',
    admittedDate: '2026-10-02',
    attendingDoctor: 'Dr. Sunita Deshmukh',
    diagnosis: 'Polytrauma with Blunt Abdominal Trauma (Post-Surgical Laparotomy)',
    vitals: { bp: '110/68 mmHg', pulse: 88, temp: '98.8 °F', spO2: 99 },
    nursingNotes: [
      { id: 'nn-5', time: '08:00 AM', note: 'Abdominal drain output 40ml serosanguinous. Infusion analgesia ongoing.', nurse: 'Sister Anjali Nair' },
    ],
    status: 'Stable',
  },
  {
    id: 'bed-106',
    bedNumber: 'Bed 106',
    ward: 'ICU Ward 3A',
    patientName: 'Harish Mehta',
    patientId: 'PT-10099',
    age: 71,
    gender: 'Male',
    admittedDate: '2026-10-03',
    attendingDoctor: 'Dr. Priya Sharma',
    diagnosis: 'Acute Decompensated Heart Failure (NYHA Class IV)',
    vitals: { bp: '142/90 mmHg', pulse: 104, temp: '98.6 °F', spO2: 91 },
    nursingNotes: [
      { id: 'nn-6', time: '06:15 AM', note: 'Tachypneic on room air. Started on Non-Invasive BiPAP ventilation and IV Furosemide.', nurse: 'Sister Anjali Nair' },
    ],
    status: 'Critical',
  },
];

const INITIAL_RECEPTION_QUEUE: ReceptionQueueRecord[] = [
  {
    id: 1,
    tokenNumber: 'TK-01',
    patientName: 'Ramesh Verma',
    patientId: 'PT-10021',
    phone: '+91 98201 99482',
    department: 'Cardiology',
    doctorName: 'Dr. Priya Sharma',
    appointmentTime: '09:15 AM',
    checkInTime: '08:52 AM',
    status: 'In Consultation',
    roomNumber: 'Consultation Room 04',
  },
  {
    id: 2,
    tokenNumber: 'TK-02',
    patientName: 'Sunita Rao',
    patientId: 'PT-10034',
    phone: '+91 98451 88301',
    department: 'Cardiology',
    doctorName: 'Dr. Priya Sharma',
    appointmentTime: '10:30 AM',
    checkInTime: '10:14 AM',
    status: 'Checked In',
    roomNumber: 'Consultation Room 04',
  },
  {
    id: 3,
    tokenNumber: 'TK-03',
    patientName: 'Meera Joshi',
    patientId: 'PT-10048',
    phone: '+91 97120 44102',
    department: 'Cardiology',
    doctorName: 'Dr. Priya Sharma',
    appointmentTime: '11:45 AM',
    checkInTime: '-',
    status: 'Scheduled',
    roomNumber: 'Consultation Room 04',
  },
  {
    id: 4,
    tokenNumber: 'TK-04',
    patientName: 'Girish Solanki',
    patientId: 'PT-10072',
    phone: '+91 98251 77209',
    department: 'General Medicine',
    doctorName: 'Dr. Rajesh Patel',
    appointmentTime: '02:30 PM',
    checkInTime: '-',
    status: 'Scheduled',
    roomNumber: 'Consultation Room 02',
  },
];

const INITIAL_PRESCRIPTION_QUEUE: PrescriptionQueueRecord[] = [
  {
    id: 1,
    prescriptionId: 'RX-7701',
    patientName: 'Ramesh Verma',
    patientId: 'PT-10021',
    doctorName: 'Dr. Priya Sharma',
    department: 'Cardiology',
    prescribedTime: '09:40 AM',
    medicines: [
      { name: 'Telmisartan 40mg + Amlodipine 5mg', dosage: '40/5 mg', quantity: 30, instructions: '1 tablet once daily morning post-breakfast' },
      { name: 'Atorvastatin 20mg', dosage: '20 mg', quantity: 30, instructions: '1 tablet once daily at bedtime' },
    ],
    status: 'Pending',
  },
  {
    id: 2,
    prescriptionId: 'RX-7702',
    patientName: 'Kishore Trivedi',
    patientId: 'PT-10088',
    doctorName: 'Dr. Priya Sharma',
    department: 'Cardiology / ICU',
    prescribedTime: '08:50 AM',
    medicines: [
      { name: 'Ticagrelor 90mg', dosage: '90 mg', quantity: 60, instructions: '1 tablet twice daily' },
      { name: 'Aspirin Gastro-resistant 75mg', dosage: '75 mg', quantity: 30, instructions: '1 tablet once daily post lunch' },
      { name: 'Rosuvastatin 40mg', dosage: '40 mg', quantity: 30, instructions: '1 tablet at night' },
    ],
    status: 'Dispensed',
    dispensedBy: 'Pooja Sundaram (Pharmacist)',
    dispensedAt: '09:12 AM',
  },
  {
    id: 3,
    prescriptionId: 'RX-7703',
    patientName: 'Bhavna Ben Dave',
    patientId: 'PT-10091',
    doctorName: 'Dr. Rajesh Patel',
    department: 'General Medicine / ICU',
    prescribedTime: '09:15 AM',
    medicines: [
      { name: 'Ceftriaxone IV Injection 1g', dosage: '1 g', quantity: 6, instructions: 'IV twice daily via infusion' },
      { name: 'Levofloxacin Infusion 500mg', dosage: '500 mg', quantity: 5, instructions: 'IV once daily slow drip' },
    ],
    status: 'Pending',
  },
];

const INITIAL_MEDICINE_STOCK: MedicineStockRecord[] = [
  { id: 'med-1', name: 'Telmisartan 40mg', category: 'Antihypertensive', stock: 450, unit: 'Tablets', reorderLevel: 100, expiryDate: '2027-11-30' },
  { id: 'med-2', name: 'Atorvastatin 20mg', category: 'Lipid Lowering', stock: 620, unit: 'Tablets', reorderLevel: 150, expiryDate: '2028-02-28' },
  { id: 'med-3', name: 'Amlodipine 5mg', category: 'Calcium Channel Blocker', stock: 380, unit: 'Tablets', reorderLevel: 100, expiryDate: '2027-09-30' },
  { id: 'med-4', name: 'Metformin ER 500mg', category: 'Antidiabetic', stock: 890, unit: 'Tablets', reorderLevel: 200, expiryDate: '2028-05-31' },
  { id: 'med-5', name: 'Ceftriaxone 1g IV Vial', category: 'Antibiotic Injection', stock: 48, unit: 'Vials', reorderLevel: 50, expiryDate: '2027-06-30' },
  { id: 'med-6', name: 'Paracetamol IV 100ml (10mg/ml)', category: 'Analgesic / Antipyretic', stock: 120, unit: 'Bottles', reorderLevel: 30, expiryDate: '2027-12-31' },
  { id: 'med-7', name: 'Furosemide Injection 20mg/2ml', category: 'Diuretic', stock: 85, unit: 'Ampoules', reorderLevel: 40, expiryDate: '2028-01-31' },
];

const INITIAL_LAB_TESTS: LaboratoryTestRecord[] = [
  {
    id: 'lab-1',
    testId: 'LAB-9011',
    patientName: 'Ramesh Verma',
    patientId: 'PT-10021',
    doctorName: 'Dr. Priya Sharma',
    testName: 'Complete Blood Count (CBC) with Platelets',
    sampleType: 'Whole Blood (EDTA)',
    priority: 'Routine',
    requestedTime: '08:45 AM',
    status: 'Completed',
    resultSummary: 'Hb: 14.2 g/dL, WBC: 7,400 /mcL, Platelets: 2.4 Lakh/mcL (All parameters normal)',
    findings: 'Normocytic normochromic blood picture. No immature leukocytes.',
    completedAt: '09:30 AM',
  },
  {
    id: 'lab-2',
    testId: 'LAB-9012',
    patientName: 'Harish Mehta',
    patientId: 'PT-10099',
    doctorName: 'Dr. Priya Sharma',
    testName: 'NT-proBNP & Cardiac Troponin-I',
    sampleType: 'Serum',
    priority: 'STAT Emergency',
    requestedTime: '06:30 AM',
    status: 'Completed',
    resultSummary: 'NT-proBNP: 3,450 pg/mL (Markedly Elevated), Trop-I: 0.045 ng/mL (Borderline)',
    findings: 'Consistent with acute heart failure exacerbation.',
    completedAt: '07:15 AM',
  },
  {
    id: 'lab-3',
    testId: 'LAB-9013',
    patientName: 'Meera Joshi',
    patientId: 'PT-10048',
    doctorName: 'Dr. Priya Sharma',
    testName: 'Lipid Profile & Serum Electrolytes',
    sampleType: 'Serum Gel Vacutainer',
    priority: 'Urgent',
    requestedTime: '09:15 AM',
    status: 'In Analysis',
  },
  {
    id: 'lab-4',
    testId: 'LAB-9014',
    patientName: 'Bhavna Ben Dave',
    patientId: 'PT-10091',
    doctorName: 'Dr. Rajesh Patel',
    testName: 'Sputum for Gram Stain & Culture Sensitivity',
    sampleType: 'Respiratory Sputum',
    priority: 'Urgent',
    requestedTime: '08:00 AM',
    status: 'Sample Received',
  },
];

const INITIAL_SCHEDULE: ScheduleEntryRecord[] = [
  { id: 'sch-1', personId: 1, personName: 'Dr. Priya Sharma', role: 'DOCTOR', date: 'Today', shiftName: 'Morning Shift', shiftHours: '08:00 AM – 02:00 PM', department: 'Cardiology', workingLocation: 'OPD', roomArea: 'Consultation Room 04' },
  { id: 'sch-2', personId: 2, personName: 'Dr. Rajesh Patel', role: 'DOCTOR', date: 'Today', shiftName: 'Evening Shift', shiftHours: '02:00 PM – 08:00 PM', department: 'General Medicine', workingLocation: 'OPD', roomArea: 'Consultation Room 02' },
  { id: 'sch-3', personId: 3, personName: 'Dr. Amit Singh', role: 'DOCTOR', date: 'Today', shiftName: 'Morning Shift', shiftHours: '08:00 AM – 02:00 PM', department: 'Orthopedics', workingLocation: 'Operation Theatre', roomArea: 'Major OT 02' },
  { id: 'sch-4', personId: 4, personName: 'Dr. Sunita Deshmukh', role: 'DOCTOR', date: 'Today', shiftName: 'Night Shift', shiftHours: '08:00 PM – 08:00 AM', department: 'Emergency & Trauma', workingLocation: 'Emergency', roomArea: 'Trauma Bay 1' },
  { id: 'sch-5', personId: 101, personName: 'Sister Anjali Nair', role: 'NURSE', date: 'Today', shiftName: 'Morning Shift', shiftHours: '08:00 AM – 04:00 PM', department: 'Intensive Care Unit (ICU)', workingLocation: 'ICU', roomArea: 'ICU Ward 3A' },
  { id: 'sch-6', personId: 102, personName: 'Kavita Sundaram', role: 'RECEPTIONIST', date: 'Today', shiftName: 'Morning Shift', shiftHours: '07:30 AM – 03:30 PM', department: 'General Medicine', workingLocation: 'Reception', roomArea: 'Counter 02 (OPD)' },
  { id: 'sch-7', personId: 103, personName: 'Pooja Sundaram', role: 'PHARMACIST', date: 'Today', shiftName: 'Morning Shift', shiftHours: '08:30 AM – 04:30 PM', department: 'Pharmacy Services', workingLocation: 'Pharmacy', roomArea: 'Dispensing Desk' },
  { id: 'sch-8', personId: 104, personName: 'Vikramaditya Rathore', role: 'LABORATORY_STAFF', date: 'Today', shiftName: 'Morning Shift', shiftHours: '08:00 AM – 04:00 PM', department: 'Pathology & Laboratory', workingLocation: 'Laboratory', roomArea: 'Biochemistry Suite' },
];

// ─── Service Class ────────────────────────────────────────────────────────────

class HospitalOperationsService {
  private getStorage<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('niramaya:hospital-operations-updated'));
    } catch (e) {
      console.error('Failed to save to storage', e);
    }
  }

  // ── Doctors Management ──────────────────────────────────────────────────────
  getDoctors(): DoctorRecord[] {
    return this.getStorage<DoctorRecord[]>(STORAGE_KEY_DOCTORS, INITIAL_DOCTORS);
  }

  getDoctorById(id: number): DoctorRecord | undefined {
    return this.getDoctors().find((d) => d.id === id);
  }

  getDoctorByEmail(email: string): DoctorRecord | undefined {
    const clean = email.toLowerCase().trim();
    return this.getDoctors().find((d) => d.email.toLowerCase().trim() === clean);
  }

  addDoctor(data: Omit<DoctorRecord, 'id' | 'userId' | 'assignedPatientCount'>): DoctorRecord {
    const list = this.getDoctors();
    const newId = Math.max(...list.map((d) => d.id), 0) + 1;
    const newDoctor: DoctorRecord = {
      ...data,
      id: newId,
      userId: 1000 + newId,
      assignedPatientCount: 0,
    };
    list.push(newDoctor);
    this.setStorage(STORAGE_KEY_DOCTORS, list);

    // Also add to schedule
    this.addScheduleEntry({
      personId: newDoctor.id,
      personName: newDoctor.name,
      role: 'DOCTOR',
      date: 'Today',
      shiftName: newDoctor.todayShift,
      shiftHours: newDoctor.shiftHours,
      department: newDoctor.department,
      workingLocation: newDoctor.workingLocation,
      roomArea: newDoctor.roomNumber,
    });

    return newDoctor;
  }

  updateDoctor(id: number, updates: Partial<DoctorRecord>): DoctorRecord | undefined {
    const list = this.getDoctors();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return undefined;
    const existing = list[idx]!;
    list[idx] = { ...existing, ...updates, id: existing.id, userId: existing.userId };
    this.setStorage(STORAGE_KEY_DOCTORS, list);
    return list[idx];
  }

  toggleDoctorStatus(id: number): DoctorRecord | undefined {
    const list = this.getDoctors();
    const doc = list.find((d) => d.id === id);
    if (!doc) return undefined;
    doc.status = doc.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.setStorage(STORAGE_KEY_DOCTORS, list);
    return doc;
  }

  // ── Staff Management ────────────────────────────────────────────────────────
  getStaff(): StaffRecord[] {
    return this.getStorage<StaffRecord[]>(STORAGE_KEY_STAFF, INITIAL_STAFF);
  }

  getStaffById(id: number): StaffRecord | undefined {
    return this.getStaff().find((s) => s.id === id);
  }

  getStaffByEmail(email: string): StaffRecord | undefined {
    const clean = email.toLowerCase().trim();
    return this.getStaff().find((s) => s.email.toLowerCase().trim() === clean);
  }

  addStaff(data: Omit<StaffRecord, 'id' | 'userId'>): StaffRecord {
    const list = this.getStaff();
    const newId = Math.max(...list.map((s) => s.id), 100) + 1;
    const newStaff: StaffRecord = {
      ...data,
      id: newId,
      userId: 2000 + newId,
    };
    list.push(newStaff);
    this.setStorage(STORAGE_KEY_STAFF, list);

    // Also add to schedule
    this.addScheduleEntry({
      personId: newStaff.id,
      personName: newStaff.name,
      role: newStaff.role,
      date: 'Today',
      shiftName: newStaff.todayShift,
      shiftHours: newStaff.shiftHours,
      department: newStaff.department,
      workingLocation: newStaff.workingLocation,
      roomArea: newStaff.assignedArea,
    });

    return newStaff;
  }

  updateStaff(id: number, updates: Partial<StaffRecord>): StaffRecord | undefined {
    const list = this.getStaff();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    const existing = list[idx]!;
    list[idx] = { ...existing, ...updates, id: existing.id, userId: existing.userId };
    this.setStorage(STORAGE_KEY_STAFF, list);
    return list[idx];
  }

  toggleStaffStatus(id: number): StaffRecord | undefined {
    const list = this.getStaff();
    const stf = list.find((s) => s.id === id);
    if (!stf) return undefined;
    stf.status = stf.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.setStorage(STORAGE_KEY_STAFF, list);
    return stf;
  }

  // ── Shift & Location Assignment (Admin Only) ────────────────────────────────
  assignShiftAndLocation(
    personId: number,
    isDoctor: boolean,
    shiftData: {
      shiftName: string;
      shiftHours: string;
      breakTime: string;
      workingDays: string;
      workingLocation: string;
      roomOrArea: string;
    }
  ): void {
    if (isDoctor) {
      this.updateDoctor(personId, {
        todayShift: shiftData.shiftName,
        shiftHours: shiftData.shiftHours,
        breakTime: shiftData.breakTime,
        workingDays: shiftData.workingDays,
        workingLocation: shiftData.workingLocation,
        roomNumber: shiftData.roomOrArea,
      });
    } else {
      this.updateStaff(personId, {
        todayShift: shiftData.shiftName,
        shiftHours: shiftData.shiftHours,
        breakTime: shiftData.breakTime,
        workingDays: shiftData.workingDays,
        workingLocation: shiftData.workingLocation,
        assignedArea: shiftData.roomOrArea,
      });
    }

    // Update schedule
    const schedules = this.getSchedule();
    const entry = schedules.find((s) => s.personId === personId);
    if (entry) {
      entry.shiftName = shiftData.shiftName;
      entry.shiftHours = shiftData.shiftHours;
      entry.workingLocation = shiftData.workingLocation;
      entry.roomArea = shiftData.roomOrArea;
      this.setStorage(STORAGE_KEY_SCHEDULE, schedules);
    }
  }

  // ── Assigned Patients (Doctor Workspace) ────────────────────────────────────
  getAssignedPatients(): AssignedPatientRecord[] {
    return this.getStorage<AssignedPatientRecord[]>(STORAGE_KEY_PATIENTS, INITIAL_ASSIGNED_PATIENTS);
  }

  getDoctorPatients(doctorId: number): AssignedPatientRecord[] {
    return this.getAssignedPatients().filter((p) => p.doctorId === doctorId);
  }

  getPatientById(patientId: number): AssignedPatientRecord | undefined {
    return this.getAssignedPatients().find((p) => p.id === patientId);
  }

  addDiagnosis(patientId: number, diagnosis: string): void {
    const list = this.getAssignedPatients();
    const patient = list.find((p) => p.id === patientId);
    if (!patient) return;
    patient.diagnosis = diagnosis;
    patient.medicalRecordStatus = 'Up to Date';
    this.setStorage(STORAGE_KEY_PATIENTS, list);
  }

  addPrescription(
    patientId: number,
    rx: { medication: string; dosage: string; frequency: string; duration: string; instructions: string }
  ): void {
    const list = this.getAssignedPatients();
    const patient = list.find((p) => p.id === patientId);
    if (!patient) return;
    if (!patient.prescriptions) patient.prescriptions = [];
    patient.prescriptions.push({ id: `rx-${Date.now()}`, ...rx });
    this.setStorage(STORAGE_KEY_PATIENTS, list);

    // Also forward to Pharmacist queue!
    this.addPrescriptionQueueItem({
      prescriptionId: `RX-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName: patient.name,
      patientId: patient.patientId,
      doctorName: patient.doctorName,
      department: patient.department,
      prescribedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      medicines: [{ name: rx.medication, dosage: rx.dosage, quantity: 30, instructions: rx.instructions }],
      status: 'Pending',
    });
  }

  addMedicalNote(patientId: number, noteText: string, authorName: string): void {
    const list = this.getAssignedPatients();
    const patient = list.find((p) => p.id === patientId);
    if (!patient) return;
    if (!patient.medicalNotes) patient.medicalNotes = [];
    patient.medicalNotes.push({
      id: `mn-${Date.now()}`,
      date: new Date().toISOString().split('T')[0] ?? '',
      author: authorName,
      note: noteText,
    });
    this.setStorage(STORAGE_KEY_PATIENTS, list);
  }

  updateAppointmentStatus(patientId: number, status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'): void {
    const list = this.getAssignedPatients();
    const patient = list.find((p) => p.id === patientId);
    if (!patient) return;
    patient.appointmentStatus = status;
    this.setStorage(STORAGE_KEY_PATIENTS, list);
  }

  // ── Ward Beds (Nurse Workspace) ─────────────────────────────────────────────
  getWardBeds(): WardBedRecord[] {
    return this.getStorage<WardBedRecord[]>(STORAGE_KEY_BEDS, INITIAL_BEDS);
  }

  updateBedVitals(bedId: string, vitals: { bp: string; pulse: number; temp: string; spO2: number }): void {
    const list = this.getWardBeds();
    const bed = list.find((b) => b.id === bedId);
    if (!bed) return;
    bed.vitals = vitals;
    this.setStorage(STORAGE_KEY_BEDS, list);
  }

  addNursingNote(bedId: string, note: string, nurseName: string): void {
    const list = this.getWardBeds();
    const bed = list.find((b) => b.id === bedId);
    if (!bed) return;
    bed.nursingNotes.unshift({
      id: `nn-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note,
      nurse: nurseName,
    });
    this.setStorage(STORAGE_KEY_BEDS, list);
  }

  // ── Reception Queue (Receptionist Workspace) ────────────────────────────────
  getReceptionQueue(): ReceptionQueueRecord[] {
    return this.getStorage<ReceptionQueueRecord[]>(STORAGE_KEY_RECEPTION, INITIAL_RECEPTION_QUEUE);
  }

  checkInPatient(id: number): void {
    const list = this.getReceptionQueue();
    const item = list.find((q) => q.id === id);
    if (!item) return;
    item.status = 'Checked In';
    item.checkInTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.setStorage(STORAGE_KEY_RECEPTION, list);
  }

  registerInternalPatient(data: {
    patientName: string;
    phone: string;
    department: string;
    doctorName: string;
    appointmentTime: string;
  }): ReceptionQueueRecord {
    const list = this.getReceptionQueue();
    const newId = Math.max(...list.map((q) => q.id), 0) + 1;
    const newToken = `TK-${String(newId).padStart(2, '0')}`;
    const newRecord: ReceptionQueueRecord = {
      id: newId,
      tokenNumber: newToken,
      patientName: data.patientName,
      patientId: `PT-${10000 + newId}`,
      phone: data.phone,
      department: data.department,
      doctorName: data.doctorName,
      appointmentTime: data.appointmentTime,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Checked In',
      roomNumber: 'OPD Desk',
    };
    list.unshift(newRecord);
    this.setStorage(STORAGE_KEY_RECEPTION, list);
    return newRecord;
  }

  // ── Pharmacy Operations (Pharmacist Workspace) ──────────────────────────────
  getPrescriptionQueue(): PrescriptionQueueRecord[] {
    return this.getStorage<PrescriptionQueueRecord[]>(STORAGE_KEY_PRESCRIPTIONS, INITIAL_PRESCRIPTION_QUEUE);
  }

  addPrescriptionQueueItem(data: Omit<PrescriptionQueueRecord, 'id'>): void {
    const list = this.getPrescriptionQueue();
    const newId = Math.max(...list.map((p) => p.id), 0) + 1;
    list.unshift({ ...data, id: newId });
    this.setStorage(STORAGE_KEY_PRESCRIPTIONS, list);
  }

  dispensePrescription(id: number, pharmacistName: string): void {
    const list = this.getPrescriptionQueue();
    const item = list.find((p) => p.id === id);
    if (!item) return;
    item.status = 'Dispensed';
    item.dispensedBy = pharmacistName;
    item.dispensedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.setStorage(STORAGE_KEY_PRESCRIPTIONS, list);
  }

  getMedicineStock(): MedicineStockRecord[] {
    return this.getStorage<MedicineStockRecord[]>(STORAGE_KEY_MEDICINES, INITIAL_MEDICINE_STOCK);
  }

  // ── Laboratory Operations (Laboratory Staff Workspace) ──────────────────────
  getLaboratoryTests(): LaboratoryTestRecord[] {
    return this.getStorage<LaboratoryTestRecord[]>(STORAGE_KEY_LAB, INITIAL_LAB_TESTS);
  }

  updateLabResult(id: string, resultSummary: string, findings: string): void {
    const list = this.getLaboratoryTests();
    const item = list.find((t) => t.id === id);
    if (!item) return;
    item.status = 'Completed';
    item.resultSummary = resultSummary;
    item.findings = findings;
    item.completedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.setStorage(STORAGE_KEY_LAB, list);
  }

  // ── Schedule Management (Admin Calendar View) ───────────────────────────────
  getSchedule(): ScheduleEntryRecord[] {
    return this.getStorage<ScheduleEntryRecord[]>(STORAGE_KEY_SCHEDULE, INITIAL_SCHEDULE);
  }

  addScheduleEntry(entry: Omit<ScheduleEntryRecord, 'id'>): void {
    const list = this.getSchedule();
    const newEntry: ScheduleEntryRecord = { ...entry, id: `sch-${Date.now()}-${Math.random()}` };
    list.push(newEntry);
    this.setStorage(STORAGE_KEY_SCHEDULE, list);
  }

  // ── Hospital Overview Metrics (Admin Dashboard) ─────────────────────────────
  getHospitalOverview() {
    const docs = this.getDoctors();
    const stf = this.getStaff();
    const activeDocs = docs.filter((d) => d.status === 'ACTIVE');
    const activeStaff = stf.filter((s) => s.status === 'ACTIVE');
    const patients = this.getAssignedPatients();
    const reception = this.getReceptionQueue();
    const pendingRx = this.getPrescriptionQueue().filter((p) => p.status === 'Pending').length;
    const pendingLab = this.getLaboratoryTests().filter((l) => l.status !== 'Completed').length;

    const depts = new Set([...docs.map((d) => d.department), ...stf.map((s) => s.department)]);
    const locs = new Set([...docs.map((d) => d.workingLocation), ...stf.map((s) => s.workingLocation)]);

    return {
      totalDoctors: docs.length,
      totalStaff: stf.length,
      activeStaff: activeStaff.length + activeDocs.length,
      onDutyStaff: Math.round((activeStaff.length + activeDocs.length) * 0.75),
      currentShifts: 3, // Morning, Evening, Night
      departments: depts.size,
      workingLocations: locs.size,
      todayAppointments: reception.length + patients.length,
      patientCount: patients.length + this.getWardBeds().length,
      pendingTasks: pendingRx + pendingLab,
    };
  }
}

export const hospitalOperationsService = new HospitalOperationsService();
