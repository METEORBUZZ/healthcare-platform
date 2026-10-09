/**
 * Demo data for local development and staging. Refuses to run in production.
 *   npm run db:seed              -> only seeds an empty database
 *   npm run db:seed -- --reset   -> wipes all data first
 */
import bcrypt from 'bcryptjs';
import type { AppointmentStatus, Role } from '@healthcare/shared';
import { addDays, todayIn } from '../common/time';
import { env, isProd } from '../config/env';
import { pool, withTransaction } from './pool';
import { BlockchainService } from '../modules/blockchain/blockchain.service';

if (isProd) {
  console.error('Demo seeding is disabled in production. Create the initial administrator with the one-time db:create-admin command.');
  process.exit(1);
}

const DOCTORS = [
  { name: 'Dr. Priya Sharma', email: 'doctor@demo.test', spec: 'Cardiologist', years: 12, qual: 'MBBS, MD (Cardiology)', fee: 1200, langs: ['English', 'Hindi'], place: 'Metro Heart Institute', bio: 'Preventive cardiology and long-term heart-health management.' },
  { name: 'Dr. Rajesh Patel', email: 'rajesh@demo.test', spec: 'General Physician', years: 8, qual: 'MBBS, DNB (Internal Medicine)', fee: 600, langs: ['English', 'Hindi', 'Gujarati'], place: 'City Health Clinic', bio: 'Primary care for acute and chronic conditions.' },
  { name: 'Dr. Sneha Desai', email: 'sneha@demo.test', spec: 'Dermatologist', years: 10, qual: 'MBBS, MD (Dermatology)', fee: 900, langs: ['English', 'Hindi'], place: 'Skin & Laser Wellness Center', bio: 'Medical and cosmetic dermatology.' },
  { name: 'Dr. Amit Singh', email: 'amit@demo.test', spec: 'Orthopedic', years: 15, qual: 'MBBS, MS (Orthopedics)', fee: 1400, langs: ['English', 'Hindi', 'Punjabi'], place: 'Apex Bone & Joint Hospital', bio: 'Joint replacement, sports injuries and spine care.' },
  { name: 'Dr. Neha Kapoor', email: 'neha.doc@demo.test', spec: 'Pediatrician', years: 7, qual: 'MBBS, MD (Pediatrics)', fee: 700, langs: ['English', 'Hindi'], place: "Rainbow Children's Hospital", bio: 'Newborn care, vaccinations and child development.' },
  { name: 'Dr. Karan Malhotra', email: 'karan@demo.test', spec: 'ENT Specialist', years: 11, qual: 'MBBS, MS (ENT)', fee: 850, langs: ['English', 'Hindi'], place: 'Apollo Healthcare Center', bio: 'Ear, nose and throat care.' },
  { name: 'Dr. Rohan Mehta', email: 'rohan.doc@demo.test', spec: 'Neurologist', years: 12, qual: 'MBBS, DM (Neurology)', fee: 1500, langs: ['English', 'Hindi'], place: 'NeuroCare Specialist Clinic', bio: 'Migraine, epilepsy and neurological disorders.' },
  { name: 'Dr. Meera Iyer', email: 'meera@demo.test', spec: 'Psychiatrist', years: 9, qual: 'MBBS, MD (Psychiatry)', fee: 1000, langs: ['English', 'Hindi', 'Tamil'], place: 'Mind & Life Clinic', bio: 'Anxiety, stress and mood disorders.' },
];

const PATIENTS = [
  { name: 'Rohan Sharma', email: 'patient@demo.test', dob: '1992-05-14', gender: 'Male', phone: '+91 98765 43210', blood: 'O+', history: 'Mild seasonal allergies.' },
  { name: 'Neha Patel', email: 'neha@demo.test', dob: '1995-08-20', gender: 'Female', phone: '+91 98765 43211', blood: 'B+', history: 'Hypertension under management.' },
  { name: 'Amit Kumar', email: 'amit.k@demo.test', dob: '1988-11-03', gender: 'Male', phone: '+91 98765 43212', blood: 'A+', history: 'Asthma, controlled with inhaler.' },
  { name: 'Sneha Verma', email: 'sneha.v@demo.test', dob: '1990-02-18', gender: 'Female', phone: '+91 98765 43213', blood: 'AB+', history: null },
];

async function main() {
  if (!env.SEED_PASSWORD) {
    throw new Error('SEED_PASSWORD is required to seed demo data.');
  }
  const reset = process.argv.includes('--reset');
  const { rows } = await pool.query<{ count: number }>('SELECT COUNT(*) AS count FROM users');
  if ((rows[0]?.count ?? 0) > 0) {
    if (!reset) {
      console.log('Database already has data. Use --reset to wipe and reseed.');
      return;
    }
    await pool.query('TRUNCATE users, patients, doctors, doctor_availability, appointments, reviews, notifications, refresh_tokens, departments, staff, patient_assignments, tasks, medical_records, prescriptions, reports, blockchain_blocks, blockchain_transactions RESTART IDENTITY CASCADE');
  }

  const hash = await bcrypt.hash(env.SEED_PASSWORD, 12);
  const today = todayIn(env.CLINIC_TIMEZONE);
  let seededReports: Array<{
    id: string;
    patient_id: number;
    test_name: string;
    category: string;
    report_date: string;
    summary: string;
    file_name: string;
  }> = [];
  let seededLabUserId = 1;

  await withTransaction(async (tx) => {
    const addUser = async (name: string, email: string, role: Role): Promise<number> => {
      const r = await tx.query<{ id: number }>(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [name, email, hash, role],
      );
      return r.rows[0]!.id;
    };

    const adminId = await addUser('System Administrator', 'admin@demo.test', 'ADMIN');

    const doctorIds: number[] = [];
    const doctorUserIds: number[] = [];
    for (const d of DOCTORS) {
      const userId = await addUser(d.name, d.email, 'DOCTOR');
      const r = await tx.query<{ id: number }>(
        `INSERT INTO doctors (user_id, specialization, experience_years, qualification, consultation_fee, bio,
                              languages, hospital_affiliation, is_verified, verified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, now()) RETURNING id`,
        [userId, d.spec, d.years, d.qual, d.fee, d.bio, d.langs, d.place],
      );
      const id = r.rows[0]!.id;
      // Mon–Fri 09:00–17:00 in 30-minute slots
      await tx.query(
        `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_minutes, is_available)
         SELECT $1, d, '09:00', '17:00', 30, d BETWEEN 1 AND 5 FROM generate_series(0, 6) AS d`,
        [id],
      );
      doctorIds.push(id);
      doctorUserIds.push(userId);
    }

    // One unverified doctor so the admin verification queue has something in it.
    const pendingUser = await addUser('Dr. Kabir Anand', 'kabir@demo.test', 'DOCTOR');
    const pendingDoc = await tx.query<{ id: number }>(
      `INSERT INTO doctors (user_id, specialization, experience_years, qualification, consultation_fee)
       VALUES ($1, 'Gynecologist', 6, 'MBBS, MS (Obstetrics & Gynecology)', 1100) RETURNING id`,
      [pendingUser],
    );
    await tx.query(
      `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_minutes, is_available)
       SELECT $1, d, '10:00', '16:00', 30, d BETWEEN 1 AND 5 FROM generate_series(0, 6) AS d`,
      [pendingDoc.rows[0]!.id],
    );

    const patientIds: number[] = [];
    const patientUserIds: number[] = [];
    for (const p of PATIENTS) {
      const userId = await addUser(p.name, p.email, 'PATIENT');
      const r = await tx.query<{ id: number }>(
        `INSERT INTO patients (user_id, date_of_birth, gender, phone, blood_group, medical_history)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, p.dob, p.gender, p.phone, p.blood, p.history],
      );
      patientIds.push(r.rows[0]!.id);
      patientUserIds.push(userId);
    }

    // [patient, doctor, dayOffset, time, status, type, reason]
    const plan: [number, number, number, string, AppointmentStatus, string, string][] = [
      [0, 0, -14, '10:00', 'COMPLETED', 'Consultation', 'Chest tightness during exercise'],
      [0, 1, -7, '11:00', 'COMPLETED', 'General checkup', 'Annual health check and blood panel review'],
      [0, 2, -5, '14:30', 'CANCELLED', 'Consultation', 'Persistent skin rash'],
      [0, 0, 2, '10:00', 'CONFIRMED', 'Follow-up', 'Review ECG results'],
      [0, 3, 5, '15:00', 'PENDING', 'Consultation', 'Knee pain after running'],
      [1, 0, 0, '16:00', 'PENDING', 'Consultation', 'Blood pressure monitoring'],
      [2, 0, 1, '09:30', 'CONFIRMED', 'Follow-up', 'Post stress-test review'],
      [3, 0, 1, '11:00', 'PENDING', 'Consultation', 'Palpitations during workouts'],
      [1, 1, -3, '09:00', 'COMPLETED', 'Consultation', 'Persistent cough'],
      [2, 4, 3, '10:30', 'CONFIRMED', 'General checkup', 'Child vaccination schedule'],
    ];
    const completed: { apptId: number; patient: number; doctor: number }[] = [];
    for (const [p, d, offset, time, status, type, reason] of plan) {
      const r = await tx.query<{ id: number }>(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, start_time, appointment_type, reason,
                                   status, doctor_notes, cancelled_by, cancellation_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [
          patientIds[p], doctorIds[d], addDays(today, offset), time, type, reason, status,
          status === 'COMPLETED' ? 'Advised follow-up in 4 weeks. Continue current medication.' : null,
          status === 'CANCELLED' ? 'PATIENT' : null,
          status === 'CANCELLED' ? 'Schedule conflict' : null,
        ],
      );
      if (status === 'COMPLETED') completed.push({ apptId: r.rows[0]!.id, patient: p, doctor: d });
    }

    const reviews = [
      { rating: 5, comment: 'Took time to explain my results patiently.' },
      { rating: 4, comment: 'Thorough and on time.' },
      { rating: 5, comment: null },
    ];
    for (const [i, c] of completed.entries()) {
      const rv = reviews[i];
      if (!rv) break;
      await tx.query(
        'INSERT INTO reviews (appointment_id, doctor_id, patient_id, rating, comment) VALUES ($1, $2, $3, $4, $5)',
        [c.apptId, doctorIds[c.doctor], patientIds[c.patient], rv.rating, rv.comment],
      );
    }

    await tx.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES
         -- Patient notifications
         ($1, 'Appointment confirmed', 'Your follow-up with Dr. Priya Sharma is confirmed for tomorrow.', 'APPOINTMENT'),
         ($1, 'Welcome to HealthCare+', 'Complete your medical profile to speed up future bookings.', 'SYSTEM'),
         ($1, 'Prescription ready', 'Dr. Priya Sharma added medical notes and instructions for your visit.', 'APPOINTMENT'),
         
         -- Doctor notifications
         ($2, 'New appointment request', 'Neha Patel requested a consultation for today at 16:00.', 'APPOINTMENT'),
         ($2, 'Appointment confirmed', 'Consultation with Rohan Sharma confirmed for 10:00.', 'APPOINTMENT'),
         ($2, 'Profile verified', 'Your Cardiology practice profile is verified and listed publicly.', 'SYSTEM'),
         ($2, 'New patient review received', 'Rohan Sharma left a 5-star review: "Took time to explain results patiently."', 'SYSTEM'),
         
         -- Admin notifications
         ($3, 'Doctor awaiting verification', 'Dr. Kabir Anand registered as a Gynecologist and needs review.', 'SYSTEM'),
         ($3, 'New appointment booking', 'Neha Patel booked a consultation with Dr. Priya Sharma.', 'APPOINTMENT'),
         ($3, 'Clinic activity report', 'Weekly overview: 10 appointments scheduled across 4 specialties.', 'SYSTEM'),
         ($3, 'New user registered', 'Rohan Sharma joined HealthCare+ as a Patient.', 'SYSTEM')`,
      [patientUserIds[0], doctorUserIds[0], adminId],
    );

    // Departments
    const deptRows = await tx.query<{ id: number; name: string }>(
      `INSERT INTO departments (name, code, description, head_doctor_id) VALUES
       ('Cardiology', 'CARD', 'Comprehensive cardiovascular diagnostics and interventions', $1),
       ('Emergency Medicine', 'EMER', '24/7 acute trauma and critical care unit', null),
       ('Pediatrics', 'PED', 'Newborn, infant, and adolescent care', null),
       ('Orthopedics', 'ORTH', 'Musculoskeletal, bone, and joint care', null),
       ('General Medicine', 'GEN', 'Primary diagnostic and internal medicine', null),
       ('Laboratory & Diagnostics', 'LAB', 'Clinical pathology, biochemistry, and radiology', null),
       ('Pharmacy', 'PHARM', 'Hospital inpatient and outpatient medication dispensary', null)
       ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
       RETURNING id, name`,
      [doctorIds[0]],
    );
    const cardDeptId = deptRows.rows.find((d) => d.name === 'Cardiology')?.id || 1;
    const emerDeptId = deptRows.rows.find((d) => d.name === 'Emergency Medicine')?.id || 2;
    const labDeptId = deptRows.rows.find((d) => d.name === 'Laboratory & Diagnostics')?.id || 6;
    const pharmDeptId = deptRows.rows.find((d) => d.name === 'Pharmacy')?.id || 7;

    // Staff accounts
    const nurseUserId = await addUser('Nurse Elena Vance', 'nurse@demo.test', 'NURSE');
    const pharmUserId = await addUser('Marcus Brody', 'pharmacist@demo.test', 'PHARMACIST');
    const labUserId = await addUser('David Miller', 'lab@demo.test', 'LABORATORY_STAFF');
    const staffUserId = await addUser('Duty Staff Member', 'staff@demo.test', 'STAFF');
    const receptionistUserId = await addUser('Kavita Sundaram', 'receptionist@demo.test', 'RECEPTIONIST');

    await tx.query(
      `INSERT INTO staff (user_id, department_id, designation, employee_code, phone, assigned_area) VALUES
       ($1, $2, 'Senior Staff Nurse', 'STF-101', '+91 98765 00001', 'Ward 4B (Cardiology)'),
       ($3, $4, 'Chief Pharmacist', 'STF-102', '+91 98765 00002', 'Central Pharmacy Dispensary'),
       ($5, $6, 'Diagnostic Technician', 'STF-103', '+91 98765 00003', 'Pathology & Imaging Wing'),
       ($7, $8, 'Ward Coordinator', 'STF-104', '+91 98765 00004', 'Floor 3 Emergency Roster'),
       ($9, $10, 'OPD Reception Lead', 'STF-105', '+91 98765 00005', 'Main Hospital Entrance — Counter 02 (OPD Registration Desk)')`,
      [nurseUserId, cardDeptId, pharmUserId, pharmDeptId, labUserId, labDeptId, staffUserId, emerDeptId, receptionistUserId, emerDeptId],
    );

    await tx.query(
      `INSERT INTO staff_shift_assignments (target_email, shift_name, shift_hours, break_time, working_days, working_location, room_area, created_by_user_id, updated_by_user_id) VALUES
       ('nurse@demo.test', 'Morning Clinical Shift', '07:00 AM - 03:00 PM', '12:00 PM - 12:45 PM', 'Mon, Tue, Wed, Thu, Fri', 'Inpatient Tower Wing B', 'Ward 4B', $1, $1),
       ('pharmacist@demo.test', 'Day Dispensary Shift', '09:00 AM - 05:00 PM', '01:00 PM - 01:30 PM', 'Mon, Tue, Wed, Thu, Fri, Sat', 'Ground Floor Main Dispensary', 'Counter A', $1, $1),
       ('lab@demo.test', 'Diagnostic Imaging Shift', '08:00 AM - 04:00 PM', '12:30 PM - 01:00 PM', 'Mon, Tue, Wed, Thu, Fri', 'Diagnostic Imaging Lab', 'Station 2', $1, $1),
       ('staff@demo.test', 'Floor Support Shift', '08:00 AM - 04:00 PM', '01:00 PM - 02:00 PM', 'Mon, Tue, Wed, Thu, Fri', 'General Services', 'Emergency Desk', $1, $1),
       ('receptionist@demo.test', 'Morning Shift', '07:30 AM - 03:30 PM', '12:00 PM - 12:45 PM', 'Mon to Sat', 'Reception', 'Main Hospital Entrance — Counter 02 (OPD Registration Desk)', $1, $1)
       ON CONFLICT (target_email) DO NOTHING`,
      [adminId],
    );

    // Patient Assignments (Doctors to Patients - Rule 2)
    for (let pIdx = 0; pIdx < patientIds.length; pIdx++) {
      await tx.query(
        `INSERT INTO patient_assignments (doctor_id, patient_id, assigned_by, notes)
         VALUES ($1, $2, $3, 'Primary attending physician for clinical care')
         ON CONFLICT (doctor_id, patient_id) DO NOTHING`,
        [doctorIds[0], patientIds[pIdx], adminId],
      );
    }
    // Also assign second doctor to patient 1
    await tx.query(
      `INSERT INTO patient_assignments (doctor_id, patient_id, assigned_by, notes)
       VALUES ($1, $2, $3, 'Secondary attending physician')
       ON CONFLICT (doctor_id, patient_id) DO NOTHING`,
      [doctorIds[1], patientIds[1], adminId],
    );

    // Floor Tasks
    await tx.query(
      `INSERT INTO tasks (title, description, assigned_to_user_id, ward, status, priority, patient_id, created_by) VALUES
       ('Administer morning IV antibiotics', 'Administer 500mg Amoxicillin IV to patient in Bed 4B-12', $1, 'Ward 4B', 'PENDING', 'HIGH', $2, $3),
       ('Pre-operative vitals check', 'Log blood pressure, pulse, and SpO2 prior to cardiology consult', $1, 'Ward 4B', 'IN_PROGRESS', 'NORMAL', $4, $3),
       ('Medication restocking verification', 'Audit emergency resuscitation kit and central ward medicine cart', $5, 'Ward 4B', 'COMPLETED', 'NORMAL', null, $3)`,
      [nurseUserId, patientIds[0], adminId, patientIds[1], nurseUserId],
    );

    // Clinical Medical Records (SOAP Notes)
    await tx.query(
      `INSERT INTO medical_records (patient_id, doctor_id, record_type, chief_complaint, diagnosis, soap_notes, treatment_plan) VALUES
       ($1, $2, 'CLINICAL_NOTE', 'Chest discomfort on exertion', 'Mild coronary artery strain',
        'S: Patient reports mild chest tightness after climbing 2 flights of stairs. No radiation to jaw or left arm.
O: BP 128/82 mmHg, Pulse 74 bpm regular, SpO2 98% room air. Heart sounds S1 S2 normal, no murmurs.
A: Stable exertional angina symptoms, baseline ECG normal sinus rhythm.
P: Prescribed daily Atorvastatin 20mg and sublingual nitroglycerin PRN. Ordered diagnostic lipid panel and stress echocardiogram.',
        'Low-sodium Mediterranean diet, mild aerobic activity 30 mins/day, follow up in 3 weeks.')`,
      [patientIds[0], doctorIds[0]],
    );

    // Prescriptions
    await tx.query(
      `INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions, status) VALUES
       ($1, $2, 'Atorvastatin', '20mg', 'Once daily at bedtime', '30 days', 'Take with water after dinner', 'ACTIVE'),
       ($1, $2, 'Aspirin (Cardio)', '75mg', 'Once daily', '30 days', 'Take with breakfast', 'ACTIVE'),
       ($3, $2, 'Ciprofloxacin', '500mg', 'Twice daily', '7 days', 'Complete full course. Do not skip doses.', 'COMPLETED')`,
      [patientIds[0], doctorIds[0], patientIds[1]],
    );

    // Diagnostic Reports (with UUIDs)
    const reportRows = await tx.query<{
      id: string;
      patient_id: number;
      test_name: string;
      category: string;
      report_date: string;
      summary: string;
      file_name: string;
    }>(
      `INSERT INTO reports (patient_id, prescribing_doctor_id, uploaded_by_user_id, test_name, category, report_date, file_name, file_path, file_size, status, summary) VALUES
       ($1, $2, $3, 'Comprehensive Lipid Panel Profile', 'Biochemistry', CURRENT_DATE - 2, 'lipid_panel_profile.pdf', '/uploads/reports/lipid_panel.pdf', 245000, 'VERIFIED',
        'Total Cholesterol: 182 mg/dL (Normal: < 200). HDL: 48 mg/dL (Normal: > 40). LDL: 108 mg/dL (Desirable: < 100). Triglycerides: 130 mg/dL (Normal: < 150). Overall lipid balance within target limits with current therapy.'),
       ($1, $2, $3, '12-Lead Resting Electrocardiogram (ECG)', 'Cardiology', CURRENT_DATE - 7, 'resting_ecg_12lead.pdf', '/uploads/reports/resting_ecg.pdf', 312000, 'VERIFIED',
        'Normal sinus rhythm at 72 bpm. PR interval 150 ms, QRS duration 86 ms, QTc 410 ms. No ST-segment elevation or depression. Axis normal.'),
       ($4, $2, $3, 'Complete Blood Count (CBC) with Differential', 'Hematology', CURRENT_DATE - 5, 'cbc_differential.pdf', '/uploads/reports/cbc_diff.pdf', 188000, 'VERIFIED',
        'Hemoglobin: 14.2 g/dL. Platelets: 240,000 /uL. WBC count: 6,800 /uL with normal neutrophilic and lymphocytic proportions.')
       RETURNING id, patient_id, test_name, category, report_date, summary, file_name`,
      [patientIds[0], doctorIds[0], labUserId, patientIds[1]],
    );
    seededReports = reportRows.rows;
    seededLabUserId = labUserId;
  });

  // Initialise Genesis block & Anchor reports on the blockchain after outer transaction commits
  await BlockchainService.ensureGenesisBlock();
  for (const r of seededReports) {
    const hash = BlockchainService.calculateReportHash({
      id: r.id,
      patientId: r.patient_id,
      testName: r.test_name,
      category: r.category,
      reportDate: r.report_date,
      summary: r.summary,
      fileName: r.file_name,
    });
    await BlockchainService.anchorRecordOnChain({
      recordId: r.id,
      recordType: 'REPORT',
      sha256Hash: hash,
      eventType: 'REPORT_CREATED',
      actorUserId: seededLabUserId,
      metadata: { fileName: r.file_name },
    });
  }

  console.log(`Seeded demo data with cryptographic blockchain integrity ledger.`);
  console.log('  admin@demo.test · doctor@demo.test · patient@demo.test');
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
