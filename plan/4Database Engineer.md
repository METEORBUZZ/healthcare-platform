# 🗄️ Database Engineer — Private Hospital Management Software

## 📌 Overview

The Database Engineer is responsible for designing, maintaining, securing, and optimizing the database for the Private Hospital Management Software.

The database must provide:

* Reliable data storage
* Strong relationships between entities
* Data consistency
* Fast query performance
* Secure access
* Scalable structure
* Backup and recovery support

---

## 🛠️ Technology

* **Database:** PostgreSQL
* **Query Layer / ORM:** Selected by Backend Engineer
* **Database Migrations:** Migration-based schema management
* **Environment:** Development / Testing / Production

---

## 👥 Application Users

The system supports four main user types:

| Role    | Database-related data                                      |
| ------- | ---------------------------------------------------------- |
| Admin   | Hospital, users, doctors, staff, patients, shifts          |
| Doctor  | Assigned patients, medical records, prescriptions, reports |
| Staff   | Assigned tasks, patients, shifts, locations                |
| Patient | Own profile and own medical reports                        |

---

# 🏗️ Database Structure

## Core Tables

```text
users
roles
doctors
staff
patients
departments
shifts
patient_assignments
tasks
medical_records
prescriptions
reports
audit_logs
```

---

# 🔗 Main Relationships

```text
Users
 ├── Doctors
 ├── Staff
 └── Patients

Doctors
 └── Patient Assignments

Staff
 └── Patient / Task Assignments

Patients
 ├── Medical Records
 ├── Prescriptions
 └── Reports

Users
 └── Audit Logs
```

---

# 🔑 Primary Keys

Each major entity must have a unique primary key.

Examples:

```text
users.id
doctors.id
staff.id
patients.id
reports.id
medical_records.id
```

UUID or another secure unique identifier strategy should be selected according to the application architecture.

---

# 🔗 Foreign Keys

Important relationships include:

```text
doctors.user_id → users.id

staff.user_id → users.id

patients.user_id → users.id

medical_records.patient_id → patients.id

medical_records.doctor_id → doctors.id

reports.patient_id → patients.id

shifts.user_id → users.id
```

Foreign keys must be used to maintain referential integrity.

---

# 🔐 Data Integrity

The database should enforce:

* `PRIMARY KEY`
* `FOREIGN KEY`
* `NOT NULL`
* `UNIQUE`
* `CHECK`
* Appropriate data types

Example:

```text
Email → UNIQUE
Employee Code → UNIQUE
Patient Code → UNIQUE
Patient ID → Required
Doctor ID → Required where applicable
```

---

# ⚡ Database Optimization

The Database Engineer must optimize frequently used queries.

Important techniques:

* Proper indexing
* Query optimization
* Pagination
* Efficient JOINs
* Selective column retrieval
* Connection management
* Query analysis

Use PostgreSQL tools such as:

```sql
EXPLAIN
EXPLAIN ANALYZE
```

---

# 📊 Indexing

Indexes should be created based on real query patterns.

Potential indexes:

```text
users.email
users.username
patients.patient_code
doctors.employee_code
staff.employee_code
reports.patient_id
medical_records.patient_id
shifts.user_id
audit_logs.user_id
```

Indexes should not be added unnecessarily because excessive indexes can slow down writes.

---

# 📄 Pagination

Large datasets must not be loaded at once.

Example:

```http
GET /api/patients?page=1&limit=20
```

Pagination should be implemented for:

* Patients
* Doctors
* Staff
* Medical records
* Reports
* Audit logs

---

# 🔄 Transactions

Critical multi-step operations should use database transactions.

Example:

```text
Create Doctor
     ↓
Create User
     ↓
Create Doctor Profile
     ↓
Assign Department
     ↓
COMMIT
```

If any critical step fails:

```text
ROLLBACK
```

This prevents incomplete database records.

---

# 🛡️ Database Security

The database must:

* Not be publicly exposed
* Use strong credentials
* Use least-privilege database accounts
* Restrict network access
* Use encrypted connections where required
* Protect backups
* Never store plain-text passwords
* Separate development and production databases

---

# 🏥 Patient Data Protection

Patient information is highly sensitive.

The database design must support secure relationships between:

```text
Patient
   ↓
Medical Record
   ↓
Doctor
```

and:

```text
Patient
   ↓
Report
```

The database should provide the structure required for the Backend Engineer to enforce authorization.

> Database relationships alone do not replace backend authorization.

---

# 📁 Medical Reports

Medical report metadata can be stored in PostgreSQL:

```text
reports
-------------------------
id
patient_id
uploaded_by
report_type
file_name
storage_path
file_size
mime_type
created_at
```

The actual file should preferably be stored in secure file/object storage.

PostgreSQL stores the metadata and secure reference.

---

# 📝 Audit Logs

Important actions should be recorded:

```text
LOGIN
LOGIN_FAILED
PASSWORD_CHANGED
USER_CREATED
USER_UPDATED
PATIENT_VIEWED
REPORT_VIEWED
REPORT_DOWNLOADED
REPORT_UPLOADED
ACCESS_DENIED
SHIFT_ASSIGNED
```

Example structure:

```text
audit_logs
-------------------------
id
user_id
action
resource_type
resource_id
ip_address
user_agent
created_at
```

Sensitive values such as passwords and authentication tokens must never be logged.

---

# 🔄 Database Migrations

All database structure changes should be managed through migrations.

Example:

```text
001_create_users
002_create_roles
003_create_doctors
004_create_staff
005_create_patients
006_create_departments
007_create_shifts
008_create_medical_records
009_create_prescriptions
010_create_reports
011_create_audit_logs
```

Production schema changes must be controlled and reproducible.

---

# 💾 Backup & Recovery

The database strategy must define:

* Backup frequency
* Backup retention
* Backup encryption
* Backup storage
* Restore procedure
* Recovery testing

A backup must be periodically restored in a controlled environment to verify that it is usable.

---

# 📈 Performance Monitoring

Monitor:

```text
Query execution time
Slow queries
Database connections
CPU usage
Memory usage
Table size
Index usage
Locks
Transactions
Database growth
```

Performance problems should be investigated before they affect hospital users.

---

# 🧪 Database Testing

Test:

* Table relationships
* Foreign keys
* Constraints
* Unique values
* Transactions
* Migrations
* Query performance
* Data consistency
* Backup restoration

Important test:

```text
Delete Patient
      ↓
Check related medical records
      ↓
Check reports
      ↓
Check prescriptions
      ↓
Verify configured deletion rules
```

Patient data must not be accidentally deleted or orphaned.

---

# 📂 Recommended Database Documentation

```text
database/
├── README.md
├── schema/
│   ├── users.md
│   ├── doctors.md
│   ├── staff.md
│   ├── patients.md
│   ├── medical-records.md
│   └── reports.md
│
├── migrations/
└── diagrams/
    └── er-diagram.png
```

---

# 🔄 Database Engineer Workflow

```text
Requirements
     ↓
ER Diagram
     ↓
Schema Design
     ↓
Relationships
     ↓
Constraints
     ↓
Migrations
     ↓
Indexes
     ↓
Backend Integration
     ↓
Testing
     ↓
Optimization
     ↓
Security Review
```

---

# ✅ Definition of Done

The database is ready when:

* [ ] PostgreSQL is configured
* [ ] Database schema is documented
* [ ] All core tables are created
* [ ] Primary keys are implemented
* [ ] Foreign keys are implemented
* [ ] Data constraints are implemented
* [ ] Required indexes are created
* [ ] Queries are optimized
* [ ] Pagination is supported
* [ ] Transactions are implemented
* [ ] Migrations are available
* [ ] Patient data relationships are correct
* [ ] Medical report metadata is protected
* [ ] Audit logging structure exists
* [ ] Backup strategy is documented
* [ ] Restore process is tested
* [ ] Production database is not publicly exposed

---

# 🎯 Final Responsibility

The Database Engineer ensures that hospital data is:

```text
CORRECT
   ↓
CONSISTENT
   ↓
SECURE
   ↓
FAST
   ↓
SCALABLE
   ↓
RECOVERABLE
```

The Database Engineer works closely with the **Backend Engineer**, while the **Frontend Engineer** consumes the APIs and the **DevOps/Cloud Engineer** manages the production infrastructure.
