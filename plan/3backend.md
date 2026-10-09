# ⚙️ Backend Engineer — Private Hospital Management Software

## 1. Role

The Backend Engineer is responsible for building the secure server-side system of the Private Hospital Management Software.

The backend is responsible for:

* REST APIs
* Authentication
* Authorization
* Role-Based Access Control
* Business logic
* Database integration
* Patient data protection
* Medical records
* Medical reports
* Doctor management
* Staff management
* Patient management
* Shift management
* Audit logging
* Backend security

> **Important:** Frontend restrictions are not security. The backend must enforce all permissions.

---

# 2. Recommended Technology

```text
Node.js
Express.js
TypeScript
PostgreSQL
REST API
Argon2id / bcrypt
JWT or Secure Session
```

Recommended supporting tools:

```text
Zod / Joi       → Request validation
ORM / Query Layer → Database access
Jest / Vitest   → Unit testing
Supertest       → API testing
Helmet          → Security headers
Rate Limiter    → Abuse protection
```

---

# 3. Application Users

## Admin

Admin can:

* Create Doctors
* Create Staff
* Manage Patients
* Manage Departments
* Assign Doctors
* Assign Staff
* Assign shifts
* Assign work locations
* Manage reports
* Manage users
* Activate/deactivate accounts
* View audit logs

---

## Doctor

Doctor can:

* View assigned patients
* View authorized patient information
* View medical history
* Add permitted medical information
* Create prescriptions
* View permitted reports
* Upload permitted reports
* View own shift

---

## Staff

Staff can:

* View assigned patients
* View assigned tasks
* Update assigned tasks
* View own shift
* View working location
* Access only permitted operational information

---

## Patient

Patient can:

* View own profile
* View own medical reports
* Preview own reports
* Download own reports

Patient must **never** be able to access another patient's data.

---

# 4. Authentication

Backend must implement secure authentication.

Required functionality:

* Login
* Logout
* Password hashing
* Session/token management
* Password change
* First-login password change
* Password reset
* Account activation/deactivation
* Session expiration
* Failed-login protection

Passwords must never be stored as plain text.

---

# 5. First Login Flow

For a newly created Doctor or Staff account:

```text
Admin creates account
        ↓
Temporary / one-time credentials
        ↓
User logs in
        ↓
System detects first login
        ↓
Password change required
        ↓
Temporary password becomes invalid
        ↓
Normal dashboard access
```

The backend must enforce the password change.

The frontend must not be trusted to enforce this rule.

---

# 6. Role-Based Access Control

Every protected request must follow:

```text
Request
   ↓
Authentication
   ↓
Identify User
   ↓
Identify Role
   ↓
Check Resource
   ↓
Check Permission
   ↓
Allow / Deny
```

Example:

```text
Patient A → Patient A Report       ✅ ALLOWED

Patient A → Patient B Report       ❌ DENIED

Doctor A → Assigned Patient        ✅ ALLOWED

Doctor A → Unauthorized Patient    ❌ DENIED

Staff → Assigned Task              ✅ ALLOWED

Staff → Admin Settings             ❌ DENIED
```

---

# 7. API Architecture

```text
React Frontend
      ↓
HTTPS
      ↓
API Routes
      ↓
Authentication Middleware
      ↓
Authorization Middleware
      ↓
Controller
      ↓
Service / Business Logic
      ↓
Repository / Data Access
      ↓
PostgreSQL
```

---

# 8. API Modules

Recommended API structure:

```text
/api/auth
/api/users
/api/doctors
/api/staff
/api/patients
/api/departments
/api/shifts
/api/assignments
/api/medical-records
/api/prescriptions
/api/reports
/api/audit-logs
```

---

# 9. Authentication APIs

Example:

```http
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

---

# 10. User APIs

Example:

```http
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
PATCH  /api/users/:id/status
```

Only authorized Admin users should be able to perform administrative user-management operations.

---

# 11. Doctor APIs

```http
GET    /api/doctors
POST   /api/doctors
GET    /api/doctors/:id
PATCH  /api/doctors/:id
```

Doctor-related functionality includes:

* Department
* Patient assignments
* Shift assignments
* Status
* Profile information

---

# 12. Staff APIs

```http
GET    /api/staff
POST   /api/staff
GET    /api/staff/:id
PATCH  /api/staff/:id
```

Staff functionality includes:

* Assignment
* Shift
* Working location
* Tasks
* Status

---

# 13. Patient APIs

```http
GET    /api/patients
POST   /api/patients
GET    /api/patients/:id
PATCH  /api/patients/:id
```

Patient data must always be protected using server-side authorization.

---

# 14. Medical Record APIs

Example:

```http
GET  /api/patients/:id/medical-records
POST /api/patients/:id/medical-records
GET  /api/medical-records/:id
PATCH /api/medical-records/:id
```

The backend must verify that the requesting user has permission to access the requested patient.

---

# 15. Prescription APIs

```http
GET  /api/patients/:id/prescriptions
POST /api/patients/:id/prescriptions
GET  /api/prescriptions/:id
```

Only authorized medical users should be able to create or modify prescriptions.

---

# 16. Medical Report Security

Report workflow:

```text
Upload Report
      ↓
Authentication
      ↓
Authorization
      ↓
File Validation
      ↓
File Size Validation
      ↓
Malware / Content Scan
      ↓
Secure Storage
      ↓
Database Metadata
      ↓
Audit Log
```

For downloading:

```text
Request Report
      ↓
Authenticate User
      ↓
Check Role
      ↓
Check Patient Ownership / Assignment
      ↓
Check Report Permission
      ↓
Allow Download
```

---

# 17. Patient Report Isolation

Example request:

```http
GET /api/reports/123
```

The backend must not simply return report `123`.

It must check:

```text
Authenticated User
        ↓
User Role
        ↓
Report 123
        ↓
Report's Patient
        ↓
Patient Ownership / Assignment
        ↓
Permission
        ↓
Allow / Deny
```

This prevents unauthorized report access even when someone changes the report ID.

---

# 18. Database Entities

Recommended core entities:

```text
Users
Roles
Doctors
Staff
Patients
Departments
Shifts
PatientAssignments
Tasks
MedicalRecords
Prescriptions
Reports
AuditLogs
```

Possible relationships:

```text
Doctor
   ↓
PatientAssignment
   ↓
Patient
   ├── MedicalRecords
   ├── Prescriptions
   └── Reports
```

---

# 19. Database Requirements

Use:

* Foreign keys
* Unique constraints
* NOT NULL constraints
* Indexes
* Transactions
* Database migrations
* Parameterized queries
* Least-privilege database credentials

Database should not be publicly exposed.

---

# 20. Shift Management

Backend should support:

* Create shift
* Update shift
* Assign Doctor
* Assign Staff
* Set date
* Set start time
* Set end time
* Set working location
* Validate conflicting assignments
* Display authorized shift information

Example:

```text
Doctor
   ↓
Monday
   ↓
09:00 - 17:00
   ↓
Emergency Department
```

---

# 21. Business Rules

Backend must enforce:

1. Only authorized Admin users can create Doctors and Staff.
2. Inactive users cannot log in.
3. New users must change temporary passwords.
4. Doctors can access only authorized patients.
5. Staff can access only assigned operational data.
6. Patients can access only their own reports.
7. Reports require authorization before viewing/downloading.
8. Sensitive actions must be audited.
9. Client-provided IDs must never automatically grant access.
10. Frontend permissions must never replace backend authorization.

---

# 22. Audit Logs

Important events should be recorded:

```text
Login success
Login failure
Password change
Account lock
User creation
User activation
User deactivation
Role change
Patient record access
Report upload
Report view
Report download
Permission denied
Shift assignment
Important Admin actions
```

Never log:

```text
Passwords
Access tokens
Refresh tokens
API secrets
Database passwords
Unnecessary medical information
```

---

# 23. Error Handling

Production API responses must not expose:

```text
SQL queries
Database credentials
Stack traces
Internal file paths
Environment variables
Secrets
Tokens
```

Use safe error responses:

```json
{
  "success": false,
  "message": "Access denied"
}
```

Detailed technical information should remain in protected server-side logs.

---

# 24. Backend Testing

Test:

* Authentication
* Authorization
* RBAC
* Patient isolation
* Report permissions
* API validation
* File uploads
* Shift rules
* User activation/deactivation
* Error handling
* Database operations

Critical tests:

```text
Patient A → Patient B report
❌ MUST FAIL

Staff → Admin API
❌ MUST FAIL

Doctor → Unauthorized patient
❌ MUST FAIL

Anonymous → Patient report
❌ MUST FAIL

Inactive user → Login
❌ MUST FAIL
```

---

# 25. Backend Folder Structure

```text
backend/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── validators/
│   ├── utils/
│   ├── config/
│   └── app.ts
│
├── migrations/
├── tests/
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

---

# 26. Backend Development Workflow

```text
Database Design
      ↓
Authentication
      ↓
RBAC
      ↓
API Structure
      ↓
User Management
      ↓
Doctor Management
      ↓
Staff Management
      ↓
Patient Management
      ↓
Medical Records
      ↓
Prescriptions
      ↓
Medical Reports
      ↓
Shift Management
      ↓
Audit Logs
      ↓
Security Testing
      ↓
API Testing
```

---

# 27. Definition of Done

Backend is complete when:

* Authentication works securely.
* First-login password change works.
* RBAC is enforced server-side.
* APIs are implemented.
* Database is integrated.
* Patient data isolation works.
* Medical reports are protected.
* Doctor management works.
* Staff management works.
* Patient management works.
* Shift management works.
* Audit logs work.
* Input validation is implemented.
* Error handling is secure.
* Security tests pass.
* No secrets are committed to Git.

---

# 28. Responsibility Boundary

## Backend Engineer

```text
API
Authentication
Authorization
Business Logic
Database
Patient Data Security
Medical Reports
Audit Logs
Backend Testing
```

## Frontend Engineer

```text
React UI
Responsive Design
API Integration
Client-side Validation
Frontend Testing
```

## DevOps / Cloud Engineer

```text
CI/CD
Docker
Cloud Infrastructure
Deployment
Monitoring
Backup
Infrastructure Security
```

> **Important:** Backend Engineer builds the security enforcement inside the application. DevOps/Cloud Engineer protects the infrastructure and deployment environment.
