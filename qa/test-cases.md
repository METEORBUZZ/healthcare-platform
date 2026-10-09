# 📋 QA Test Cases — Private Hospital Management Software

## 1. Authentication Test Cases (TC-AUTH)

| ID | Feature | Test Scenario | Preconditions | Steps | Expected Result | Status |
|---|---|---|---|---|---|---|
| **TC-AUTH-001** | Login | Valid Admin Login | Active admin user exists | 1. Enter `admin@demo.test`<br>2. Enter `Password123!`<br>3. Submit | Login successful; JWT cookie set; redirects to Admin Console | **PASS** |
| **TC-AUTH-002** | Login | Valid Doctor Login | Active doctor user exists | 1. Enter `doctor@demo.test`<br>2. Enter `Password123!`<br>3. Submit | Login successful; redirects to Doctor Clinical Dashboard | **PASS** |
| **TC-AUTH-003** | Login | Valid Staff/Nurse Login | Active nurse user exists | 1. Enter `nurse@demo.test`<br>2. Enter `Password123!`<br>3. Submit | Login successful; redirects to Nurse Ward Dashboard | **PASS** |
| **TC-AUTH-004** | Login | Valid Patient Login | Active patient user exists | 1. Enter `patient@demo.test`<br>2. Enter `Password123!`<br>3. Submit | Login successful; redirects to Patient Reports Portal | **PASS** |
| **TC-AUTH-005** | Login | Invalid Password Attempt | Registered user exists | 1. Enter registered email<br>2. Enter wrong password<br>3. Submit | `401 Unauthorized` response; error message "Invalid email or password" | **PASS** |
| **TC-AUTH-006** | Login | Empty Email / Password | User on login screen | 1. Leave fields blank<br>2. Click Submit | Form validation triggers; submission rejected (`400 Bad Request`) | **PASS** |
| **TC-AUTH-007** | Login | Inactive Account Login | Account marked `status = 'INACTIVE'` | 1. Attempt login with inactive credentials | Rejected with `403 Forbidden` / account inactive notice | **PASS** |
| **TC-AUTH-008** | Session | Secure Logout | Authenticated user | 1. Click "Sign Out"<br>2. Verify cookies cleared | Auth cookies destroyed; redirect to security gate; protected routes reject | **PASS** |
| **TC-AUTH-009** | Session | Token Expiration | Expired JWT token | 1. Send request with expired token | Returns `401 Unauthorized`; client prompts for re-authentication | **PASS** |
| **TC-AUTH-010** | Security | Brute Force Rate Limiting | Live API | 1. Send >10 failed logins within 60 seconds | `429 Too Many Requests` triggered by rate-limiter middleware | **PASS** |

---

## 2. First-Login Password Change Flow (TC-FL)

| ID | Feature | Test Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| **TC-FL-001** | First Login | Temporary Password Login | 1. Admin provisions new staff with temp password<br>2. Staff enters temp password | Login succeeds; payload contains `mustChangePassword = true` | **PASS** |
| **TC-FL-002** | Security Gate | Forced Password Change Screen | 1. Attempt to navigate to `/dashboard` with `mustChangePassword = true` | User intercepted and redirected to `/change-password` view | **PASS** |
| **TC-FL-003** | Security Gate | API Access Restriction | 1. Send API request to clinical endpoints before changing password | Backend rejects requests with `403 Password change required` | **PASS** |
| **TC-FL-004** | Validation | Weak Password Rejected | 1. Enter weak new password (e.g. `123456`) | Rejected with `400 Bad Request` (requires uppercase, lowercase, numbers) | **PASS** |
| **TC-FL-005** | Validation | Same As Current Password | 1. Enter new password identical to temporary password | Rejected with `400 Bad Request` ("New password must differ from current") | **PASS** |
| **TC-FL-006** | Invalidation | Temporary Password Cannot Be Reused | 1. Successfully change password<br>2. Logout<br>3. Attempt login with old temp password | `401 Unauthorized`; old temporary password permanently invalidated | **PASS** |

---

## 3. Role-Based Access Control (TC-RBAC)

| ID | Role | Boundary Tested | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| **TC-RBAC-001** | Admin | Full Management | Access users, staff, doctors, appointments, departments, settings | `200 OK`; all administrative modules fully accessible | **PASS** |
| **TC-RBAC-002** | Doctor | Clinical Operations | View assigned patients, create SOAP notes, write prescriptions | `200 OK`; permitted operations succeed | **PASS** |
| **TC-RBAC-003** | Doctor | Administrative Boundary | Doctor attempts to access `POST /api/users` or Admin Settings | `403 Forbidden`; access strictly denied | **PASS** |
| **TC-RBAC-004** | Staff | Task & Ward Execution | Nurse/Staff views assigned tasks and inpatient telemetry | `200 OK`; duties visible and updatable | **PASS** |
| **TC-RBAC-005** | Staff | Clinical Boundary | Staff attempts to modify doctor diagnoses or billing configs | `403 Forbidden`; administrative access blocked | **PASS** |
| **TC-RBAC-006** | Patient | Self-Service Only | Patient views own profile, reports, and doctor bookings | `200 OK`; own records accessible | **PASS** |
| **TC-RBAC-007** | Patient | Admin/Staff Bypass | Patient sends request to `GET /api/staff` or `GET /api/audit-logs` | `403 Forbidden`; safe denial response | **PASS** |

---

## 4. Patient Data Isolation (TC-ISO)

| ID | Feature | Test Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| **TC-ISO-001** | Data Isolation | Patient Opens Own Report | 1. Patient A logs in<br>2. Requests `GET /api/reports/:id_A` | `200 OK`; report data and verification status returned | **PASS** |
| **TC-ISO-002** | Data Isolation | Patient Manipulates ID to Access Other Report | 1. Patient A logs in<br>2. Requests `GET /api/reports/:id_B` (belonging to Patient B) | `403 Forbidden`; data isolation strictly enforced | **PASS** |
| **TC-ISO-003** | Data Isolation | Doctor Accesses Unassigned Patient Report | 1. Doctor logs in<br>2. Requests report of patient not in doctor's assignment table | `403 Forbidden` unless authorized department head | **PASS** |
| **TC-ISO-004** | Data Isolation | Anonymous Access Attempt | 1. Send request without Authorization header to `/api/reports/:id` | `401 Unauthorized` | **PASS** |

---

## 5. Shift Scheduling & Conflict Detection (TC-SHIFT)

| ID | Feature | Test Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| **TC-SHIFT-001** | Shifts | Assign Normal Shift | 1. Assign Doctor A to 08:00 - 16:00 on Date X | Shift created; status `ACTIVE` | **PASS** |
| **TC-SHIFT-002** | Shifts | Detect Overlapping Conflicting Shift | 1. Doctor A has shift 08:00 - 16:00<br>2. Attempt to assign shift 12:00 - 20:00 on same date | Validation warning / Conflict detected: overlapping hours flagged | **PASS** |
| **TC-SHIFT-003** | Shifts | Roster Filter by Department | 1. Filter staff schedule view by "Cardiology" | Only cardiology clinicians displayed | **PASS** |

---

## 6. Medical Records & Blockchain Tamper Detection (TC-MED)

| ID | Feature | Test Scenario | Steps | Expected Result | Status |
|---|---|---|---|---|---|
| **TC-MED-001** | Medical Record | Create Consultation Record | 1. Doctor submits SOAP note and diagnosis | Record created; SHA-256 hash generated; anchored on-chain | **PASS** |
| **TC-MED-002** | Blockchain | Verify Untampered Report | 1. Request verification on finalized report | Returns `status: 'VERIFIED'`, `matches: true`, block index matching anchor | **PASS** |
| **TC-MED-003** | Blockchain | Detect Tampered Diagnostic Data | 1. Alter summary or result text in PostgreSQL database<br>2. Request verification | Returns `status: 'TAMPER_DETECTED'`, `matches: false`, alerts hospital auditor | **PASS** |
| **TC-MED-004** | Blockchain | Cryptographic Chain Integrity | 1. Run `BlockchainService.verifyChainIntegrity()` | Genesis verified, Merkle roots match, previous block links valid | **PASS** |
