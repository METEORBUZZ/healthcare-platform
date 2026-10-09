# 🛡️ Security Test Cases & Negative Testing — Private Hospital Management Software

## 📌 Security Assurance Overview

The Private Hospital Management Software handles protected health information (PHI) and clinical operations. This document outlines the critical negative test cases, penetration tests, and vulnerability validations performed to ensure zero-trust security.

---

## 🚫 1. Critical Negative Testing Matrix

| ID | Attack Vector / Scenario | Negative Action Attempted | Expected Security Enforcement | Result |
|---|---|---|---|---|
| **SEC-001** | **IDOR / Patient Data Leak** | Patient A changes URL parameter from `/reports/101` to `/reports/102` (Patient B) | **403 Forbidden** — Access Denied immediately | **PASSED** |
| **SEC-002** | **Privilege Escalation** | Patient sends `POST /api/users` with admin payload | **403 Forbidden** — RBAC strictly denies non-admins | **PASSED** |
| **SEC-003** | **Clinical Tamper Attempt** | Staff member sends `PATCH /api/medical-records/5` to alter doctor diagnosis | **403 Forbidden** — Only attending physician permitted | **PASSED** |
| **SEC-004** | **Unauthenticated Access** | Anonymous request sent to `GET /api/patients` without session cookie / JWT | **401 Unauthorized** — Intercepted at authentication layer | **PASSED** |
| **SEC-005** | **Inactive Account Access** | User marked `status = 'INACTIVE'` attempts login with valid credentials | **403 Forbidden** — Deactivated account blocked | **PASSED** |
| **SEC-006** | **Temporary Password Bypass** | New user attempts accessing `/api/dashboard` while `mustChangePassword = true` | **403 Forbidden** — Intercepted until password updated | **PASSED** |
| **SEC-007** | **Doctor Boundary Violation** | Doctor attempts inspecting records of patient not in `patient_assignments` table | **403 Forbidden** — Assignment validation enforced | **PASSED** |
| **SEC-008** | **Token Tampering** | Client alters payload or signature in JWT accessToken | **401 Unauthorized** — Cryptographic signature check fails | **PASSED** |
| **SEC-009** | **SQL Injection (SQLi)** | Login request with `' OR '1'='1' --` in email field | **400 / 401** — Parameterized queries block injection | **PASSED** |
| **SEC-010** | **Cross-Site Scripting (XSS)** | Diagnosis notes populated with `<script>alert(1)</script>` | Payload safely escaped; stored and rendered without execution | **PASSED** |
| **SEC-011** | **Path Traversal Attack** | Requesting file download with `../../etc/passwd` | Sanitized to base filename; traversal blocked | **PASSED** |
| **SEC-012** | **Blockchain Tamper Detection** | Unauthorized DB modification of diagnostic summary text | Verification API flags `status: 'TAMPER_DETECTED'` against immutable SHA-256 block hash | **PASSED** |

---

## 🔒 2. Data Storage & Privacy Enforcement (Zero PII On-Chain)

QA verified that the blockchain integrity layer enforces strict privacy rules:

* **PostgreSQL / Encrypted Object Storage**:
  * Patient legal names, addresses, phone numbers, emails
  * Clinical diagnosis, treatment history, prescription dosage
  * Diagnostic imaging, PDF file payloads
* **Blockchain Ledger**:
  * SHA-256 cryptographic hashes only
  * Merkle root trees and block headers
  * Record identifiers (`record_id`, `record_type`)
  * Audit timestamps (`created_at`, `finalized_at`)
* **PII Leakage Audit**:
  * Scanned `blockchain_blocks` and `blockchain_transactions` tables.
  * Verified: **ZERO patient names, zero phone numbers, zero medical descriptions present on-chain**.

---

## 🛡️ 3. HTTP Security Headers Verification

All API responses are equipped with enterprise-grade defensive headers:

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 0
Cross-Origin-Opener-Policy: same-origin
Content-Security-Policy: default-src 'self'
RateLimit-Limit: 300
```
