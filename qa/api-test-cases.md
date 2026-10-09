# 🔌 API Test Cases — Private Hospital Management Software

## 📌 Endpoint Test Matrix

The backend REST API is tested across all endpoints for correct status codes, payload schemas, authorization boundaries, and error handling.

| Method | Endpoint | Allowed Roles | Valid Test Payload | Expected Status | Negative / Edge Case | Expected Error |
|---|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | `{ email, password }` | `200 OK` | Incorrect password / Inactive user | `401 Unauthorized` / `403 Forbidden` |
| `POST` | `/api/v1/auth/logout` | Authenticated | Empty | `200 OK` | Unauthenticated invocation | `200 OK` (idempotent cookie wipe) |
| `POST` | `/api/v1/auth/change-password` | Authenticated | `{ currentPassword, newPassword }` | `200 OK` | Weak password / identical password | `400 Bad Request` |
| `GET` | `/api/v1/auth/me` | Authenticated | Empty | `200 OK` | Expired / missing token | `401 Unauthorized` |
| `GET` | `/api/v1/admin/analytics` | Admin | Query params | `200 OK` | Doctor or Patient access | `403 Forbidden` |
| `GET` | `/api/v1/admin/audit-logs` | Admin | `{ limit, offset }` | `200 OK` | Staff access | `403 Forbidden` |
| `POST` | `/api/reports` | Doctor, Staff, Admin | `{ patientId, testName, category, date, summary }` | `201 Created` | Missing required `testName` | `400 Bad Request` |
| `GET` | `/api/reports/:id` | Patient (owner), Doctor, Admin | URL UUID param | `200 OK` | Patient A requesting Patient B's report | `403 Forbidden` |
| `GET` | `/api/reports/:id/verify` | Patient (owner), Doctor, Admin | URL UUID param | `200 OK` (`VERIFIED`) | Modified DB record | `200 OK` (`TAMPER_DETECTED`) |
| `POST` | `/api/medical-records` | Doctor, Admin | `{ patientId, soapNotes, diagnosis }` | `201 Created` | Patient creating own record | `403 Forbidden` |
| `GET` | `/api/medical-records/:id` | Doctor (assigned), Admin | URL param | `200 OK` | Unassigned doctor requesting | `403 Forbidden` |
| `POST` | `/api/prescriptions` | Doctor, Admin | `{ patientId, medication, dosage, frequency }` | `201 Created` | Missing `dosage` | `400 Bad Request` |
| `GET` | `/api/blockchain/chain-status` | Authenticated | Empty | `200 OK` | Non-authenticated request | `401 Unauthorized` |
| `GET` | `/api/blockchain/blocks` | Authenticated | `{ limit, offset }` | `200 OK` | Negative offset | `400 Bad Request` |

---

## ⚡ Input Validation & Fuzz Testing

| Input Type | Test Values | Expected Behavior |
|---|---|---|
| **Empty Strings** | `""`, `"   "` in required fields | Rejected with `400 Bad Request` validation message |
| **Very Long Strings** | >255 chars in name, >10,000 chars in notes | Truncated safely or rejected according to schema bounds |
| **Invalid Email** | `user@`, `user@domain`, `notanemail` | Rejected with `400 Bad Request` |
| **Special Characters** | `!@#$%^&*()_+{}:"<>?~` in search inputs | Sanitized safely without query syntax error |
| **Malformed UUIDs** | `/reports/invalid-uuid-1234` | Handled gracefully with `400 Bad Request` or `404 Not Found` |
| **Unexpected Types** | Boolean passed where string expected | Zod validator catches and rejects before DB execution |
