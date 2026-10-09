# 🧪 QA Engineering Documentation — Private Hospital Management Software

## 📌 Quality Assurance Architecture & Overview

This directory contains the formal QA testing documentation, test matrices, security checklists, bug tracking registers, and quality gate sign-offs for the **Private Hospital Management Software (Niramaya Hospital Platform)**.

### QA Objectives

```text
Correct Functionality ──► Secure Access ──► Reliable Data ──► Good User Experience ──► Production-Ready Software
```

---

## 👥 Application Roles Under Test

| Role | Responsibility & Main Testing Scope | Isolation Boundary |
|---|---|---|
| **Admin** | Hospital-wide administration, user management, staff/doctor provisioning, departments, shift allocation, audit logs. | Unrestricted administrative domain; strictly prohibited from patient data leaks. |
| **Doctor** | Clinical operations, assigned patient tracking, consultation notes, diagnoses, prescription authoring, lab review. | Bound strictly to assigned patients via `patient_assignments`; blocked from unassigned patient records. |
| **Staff** | Task execution (Nurses, Receptionists, Pharmacists, Lab Techs), shift rosters, ward bed telemetry. | Bound strictly to assigned tasks and shifts; blocked from user management and system settings. |
| **Patient** | Personal health telemetry, diagnostic reports, appointment bookings, profile updates. | **Absolute Zero-Trust Data Isolation**: Only own profile and own medical reports (`403 Forbidden` on foreign IDs). |

---

## 📂 QA Documentation Structure

```text
qa/
├── README.md                 # QA Overview, Architecture, Strategy & Testing Levels
├── test-cases.md             # Functional & RBAC Test Cases (TC-001 to TC-050+)
├── security-test-cases.md    # Critical Negative Security, Patient Isolation & Tamper Detection
├── api-test-cases.md         # Backend API Endpoint Test Matrix & Status Codes
├── regression-checklist.md   # Release Quality Gate & Regression Checklist
├── bug-report.md             # Bug Tracking Register & Severity Matrix
└── test-summary.md           # Executive Test Execution Summary & Sign-off
```

---

## 🔄 QA Lifecycle & Workflow

```text
Product Requirements
        ↓
Test Planning & Test Case Authoring
        ↓
Development & Migration Builds
        ↓
Automated Unit & Integration Testing (Vitest)
        ↓
API Security & Negative Testing
        ↓
UI, Responsiveness & Usability Validation
        ↓
Regression Testing
        ↓
Bug Tracking & Retesting
        ↓
Release Quality Gate Verification
        ↓
Production Approval
```

---

## 🚦 Quality Gate Criteria

Release to production is blocked if:
* ❌ Any Critical or High severity security vulnerability exists.
* ❌ Patient data isolation can be breached (IDOR / Foreign report access).
* ❌ RBAC boundary can be bypassed by lower roles.
* ❌ Medical report hashes diverge from the blockchain ledger without raising `TAMPER_DETECTED`.
* ❌ Temporary passwords can bypass the force-password-change security gate.
