# 🔄 Regression Checklist — Private Hospital Management Software

## 📌 Release Regression Protocol

This checklist must be executed prior to any release build or production deployment. All items must be checked **PASS** for release sign-off.

---

## 1. Authentication & Session Management
- [x] Admin login with valid credentials succeeds and redirects to Admin Console.
- [x] Doctor login succeeds and redirects to Doctor Clinical Dashboard.
- [x] Nurse / Staff login succeeds and redirects to Staff Dashboard.
- [x] Patient login succeeds and redirects to Patient Reports Portal.
- [x] Invalid password attempts return `401 Unauthorized`.
- [x] Inactive accounts are blocked with `403 Forbidden`.
- [x] Sign Out clears session cookies and revokes refresh tokens.
- [x] Expired tokens trigger graceful re-authentication prompt.
- [x] Rate limiting triggers `429 Too Many Requests` upon repeated brute force.

## 2. First-Login Security Flow
- [x] Admin provisions user with temporary password.
- [x] First login flags `mustChangePassword = true`.
- [x] User cannot navigate away from `/change-password` view.
- [x] Direct API requests to clinical endpoints return `403 Password change required`.
- [x] Weak passwords (short, numeric only) are rejected by validation schema.
- [x] New password identical to temporary password is rejected.
- [x] Successful password change updates hash and resets `mustChangePassword = false`.
- [x] Old temporary password cannot be reused for subsequent logins.

## 3. Patient Data Isolation (Zero-Trust)
- [x] Patient A can view and download their own diagnostic report.
- [x] Patient A modifying URL ID to access Patient B report receives `403 Forbidden`.
- [x] Unassigned doctor attempting to read patient consultation records receives `403 Forbidden`.
- [x] Non-authenticated users accessing report endpoints receive `401 Unauthorized`.

## 4. Clinical Medical Records & Prescriptions
- [x] Attending doctor can create SOAP consultation notes.
- [x] Medical records link accurately to the correct `patient_id`.
- [x] Prescriptions store medication name, dosage, frequency, and instructions correctly.
- [x] Non-doctor roles attempting prescription authoring receive `403 Forbidden`.

## 5. Blockchain Integrity & Tamper Detection
- [x] Finalized diagnostic reports generate deterministic SHA-256 hashes.
- [x] SHA-256 hash and transaction reference stored on blockchain ledger.
- [x] Zero PII (names, phone numbers, medical text) stored on blockchain.
- [x] Unmodified reports return `status: 'VERIFIED'` and `matches: true`.
- [x] Altered report summary in database returns `status: 'TAMPER_DETECTED'`.
- [x] `verifyChainIntegrity()` validates Genesis block and Merkle roots across all blocks.

## 6. Staff Shifts & Department Governance
- [x] Admin can provision departments and assign staff rosters.
- [x] Overlapping shift conflicts trigger visual and validation alerts.
- [x] Clinicians can filter duty roster by department and shift timing.

## 7. UI & Responsive Design
- [x] Desktop (`>1024px`): Full sticky left sidebar with profile card and menu items.
- [x] Tablet (`768px - 1024px`): Responsive grid adapts to 2-column cards.
- [x] Mobile (`<768px`): Desktop sidebar hidden; floating action button (FAB) opens slide-out drawer with backdrop blur.
- [x] No horizontal text overflow or truncated modal buttons on mobile screens.

## 8. Cross-Browser Compatibility
- [x] **Google Chrome** (v120+): Core workflows validated.
- [x] **Safari / WebKit** (v17+): CSS backdrop filters and cookie persistence validated.
- [x] **Mozilla Firefox** (v120+): Layout and table rendering validated.
- [x] **Microsoft Edge** (v120+): Role dashboards validated.
