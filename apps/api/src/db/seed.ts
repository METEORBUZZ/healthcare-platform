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

if (isProd) {
  console.error('Refusing to seed a production database.');
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
  const reset = process.argv.includes('--reset');
  const { rows } = await pool.query<{ count: number }>('SELECT COUNT(*) AS count FROM users');
  if ((rows[0]?.count ?? 0) > 0) {
    if (!reset) {
      console.log('Database already has data. Use --reset to wipe and reseed.');
      return;
    }
    await pool.query('TRUNCATE users, patients, doctors, doctor_availability, appointments, reviews, notifications, refresh_tokens RESTART IDENTITY CASCADE');
  }

  const hash = await bcrypt.hash(env.SEED_PASSWORD, 12);
  const today = todayIn(env.CLINIC_TIMEZONE);

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
  });

  console.log(`Seeded demo data. All demo accounts use the password from SEED_PASSWORD.`);
  console.log('  admin@demo.test · doctor@demo.test · patient@demo.test');
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
