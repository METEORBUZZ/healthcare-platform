# 🐞 Bug Tracking Register — Private Hospital Management Software

## 📌 Bug Report Schema & Standards

Every logged issue must include:
* **Bug ID**: Unique tracking identifier (e.g., `BUG-001`)
* **Title**: Concise summary of defect
* **Severity**: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW` | `COSMETIC`
* **Priority**: `P0` (Immediate) | `P1` (Pre-release) | `P2` (Next Sprint) | `P3` (Backlog)
* **Status**: `NEW` | `ASSIGNED` | `FIXED` | `VERIFIED` | `CLOSED` | `REOPENED`
* **Environment**: OS, Browser, Node.js version, Database version

---

## 📋 Tracked Defects & Verification Status

### BUG-001: Patient Accessing Cross-Patient Report (IDOR)
* **Severity**: `CRITICAL` | **Priority**: `P0`
* **Status**: **CLOSED (VERIFIED)**
* **Component**: Backend Reports Module (`reports.routes.ts`)
* **Description**: Patient A was able to access Patient B's report by manipulating UUID parameter in GET request.
* **Steps to Reproduce**:
  1. Authenticate as `patient@demo.test` (User ID: 101, Patient ID: 10).
  2. Send `GET /api/reports/22222222-3333-4444-5555-666666666666` (Belongs to Patient ID: 20).
* **Expected Result**: `403 Forbidden` safe denial.
* **Actual Result (Before Fix)**: Returned report data.
* **Fix Implemented**: Added patient ID ownership check in `reports.routes.ts`. If requester role is `PATIENT`, enforces `r.patient_id = req.user.patientId`.
* **Regression Verification**: Verified with automated test in `qa-specification.test.ts`. Returns `403 Forbidden`.

---

### BUG-002: Temporary Password Screen Bypass Attempt
* **Severity**: `HIGH` | **Priority**: `P0`
* **Status**: **CLOSED (VERIFIED)**
* **Component**: Frontend Route Guards & Backend Auth Tokens
* **Description**: Newly provisioned staff user could manipulate browser URL history to skip forced password change.
* **Expected Result**: User intercepted on every route and all clinical API requests blocked until password change completed.
* **Fix Implemented**: Enforced `mustChangePassword` check in backend JWT middleware and added React global interception in `App.tsx`.
* **Regression Verification**: Verified with `first-login-password-change.test.ts`. 19/19 tests passing.

---

### BUG-003: Redundant Profile Dropdown Cluttering Top Navbar
* **Severity**: `LOW` / `COSMETIC` | **Priority**: `P2`
* **Status**: **CLOSED (VERIFIED)**
* **Component**: Frontend Navbar (`Navbar.tsx`)
* **Description**: Legacy popup profile menu overlapped with new responsive hospital sidebar.
* **Expected Result**: Clean top navbar with single direct profile link; no redundant popup card.
* **Fix Implemented**: Removed `navbar-profile-menu` popup markup and chevron toggle. Made avatar directly link to `/profile`.
* **Regression Verification**: Verified on desktop and mobile viewports.

---

### BUG-004: Mobile Sidebar Layout Drawer Responsiveness
* **Severity**: `MEDIUM` | **Priority**: `P1`
* **Status**: **CLOSED (VERIFIED)**
* **Component**: Frontend Navigation Sidebar (`HospitalSidebar.tsx`)
* **Description**: On viewport widths `<768px`, desktop sidebar caused horizontal scroll.
* **Expected Result**: Clean floating action button (FAB) that opens an animated slide-out drawer with backdrop blur.
* **Fix Implemented**: Built responsive media queries with sliding drawer (`translateX(-100%) → translateX(0)`).
* **Regression Verification**: Verified across mobile and tablet viewports.
