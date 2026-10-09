# 🔐 Security Requirements — Private Hospital Management Software

## 1. Security Objective

The Private Hospital Management Software handles sensitive hospital and patient information.

The security objective is to protect:

* Patient personal information
* Medical records
* Medical reports
* Prescriptions
* Doctor information
* Staff information
* Authentication credentials
* Hospital operational data

> **Important:** No software can honestly be guaranteed to be 100% “unhackable”. The goal is to build a strongly hardened system that prevents unauthorized access, detects suspicious activity and minimizes security impact.

---

# 2. Security Principles

The application should follow:

* Defense in Depth
* Least Privilege
* Secure by Design
* Zero Trust
* Server-side Authorization
* Secure Defaults
* Data Minimization
* Continuous Security Testing

---

# 3. Authentication Security

Implement:

* Strong password hashing
* Argon2id or bcrypt
* Secure token/session management
* Short-lived access tokens where JWT is used
* Secure refresh-token handling
* Mandatory first-login password change
* Password reset
* Session expiration
* Secure logout
* Failed-login protection
* Account activation/deactivation

Never store:

```text
Plain-text passwords
Password logs
Passwords in source code
Passwords in Git
```

---

# 4. First Login Security

For new Doctors and Staff:

```text
Admin creates user
       ↓
Temporary credentials
       ↓
First login
       ↓
Password change required
       ↓
Temporary credential invalidated
       ↓
Normal account access
```

The backend must enforce this flow.

---

# 5. Role-Based Security

## Admin

```text
Hospital management
User management
Doctor management
Staff management
Patient management
Reports
Shifts
Audit logs
```

## Doctor

```text
Authorized patient data
Medical records
Prescriptions
Authorized reports
Own shift
```

## Staff

```text
Assigned patients
Assigned tasks
Own shift
Working location
Permitted operational information
```

## Patient

```text
Own profile
Own medical reports
Own report downloads
```

---

# 6. Server-Side Authorization

Every protected API must verify authorization.

```text
Request
  ↓
Authenticate
  ↓
Identify User
  ↓
Identify Role
  ↓
Identify Resource
  ↓
Check Ownership / Assignment
  ↓
Check Permission
  ↓
Allow / Deny
```

Frontend hiding a button is NOT security.

The backend must always make the final permission decision.

---

# 7. Patient Data Isolation

This is one of the most important security requirements.

Example:

```http
GET /api/reports/100
```

If Patient A changes the request to:

```http
GET /api/reports/101
```

the backend must verify whether report `101` belongs to Patient A.

If not:

```http
403 Forbidden
```

This protects against IDOR/BOLA-style vulnerabilities.

---

# 8. API Security

Protect APIs against:

* SQL Injection
* Broken Access Control
* Brute-force attacks
* Credential Stuffing
* Parameter Tampering
* Excessive Requests
* Malicious Payloads
* Unsafe File Uploads
* Information Leakage

Use:

```text
Parameterized queries
Input validation
Schema validation
Rate limiting
Request size limits
Secure headers
Strict CORS
Safe error handling
```

---

# 9. SQL Injection Protection

Never construct SQL using raw user input.

Bad:

```text
"SELECT * FROM users WHERE id = " + userInput
```

Use:

```text
Parameterized queries
```

or a properly configured ORM/query layer.

---

# 10. Input Validation

Validate all client input.

Examples:

```text
Email
Password
User ID
Patient ID
Doctor ID
Staff ID
Report ID
Shift time
File type
File size
```

Never assume frontend validation is enough.

Backend validation is mandatory.

---

# 11. Rate Limiting

Apply rate limiting to sensitive APIs:

```text
Login
Password Reset
Password Change
Token Verification
Report Download
User Creation
Administrative APIs
```

This reduces:

* Brute-force attacks
* Credential stuffing
* API abuse
* Automated attacks

---

# 12. Medical Report Security

Secure report workflow:

```text
Upload
  ↓
Authentication
  ↓
Authorization
  ↓
File Validation
  ↓
Size Validation
  ↓
Malware / Content Scanning
  ↓
Secure Storage
  ↓
Database Metadata
  ↓
Audit Log
```

For download:

```text
Download Request
       ↓
Authenticate
       ↓
Check Role
       ↓
Check Patient Relationship
       ↓
Check Report Permission
       ↓
Allow Download
```

---

# 13. File Upload Security

Never trust:

```text
Filename
File Extension
Client MIME Type
Patient ID from Browser
```

Use:

* Allowed file types
* Maximum file size
* Content validation
* Malware scanning
* Server-generated filenames
* Secure storage
* Authorization checks

Do not allow uploaded files to become executable server code.

---

# 14. Database Security

Architecture:

```text
Internet
   ↓
Backend API
   ↓
Private PostgreSQL Database
```

The database should not be directly accessible from the public internet.

Use:

* Least-privilege database user
* Strong credentials
* Parameterized queries
* Encryption in transit
* Encryption at rest where appropriate
* Encrypted backups
* Database patching
* Network restrictions

---

# 15. Secrets Management

Never commit:

```text
DATABASE_PASSWORD
JWT_SECRET
API_KEYS
CLOUD_CREDENTIALS
PRIVATE_KEYS
```

Use:

```text
.env
Production Secret Manager
Environment Variables
```

Add sensitive files to `.gitignore`:

```text
.env
.env.*
*.pem
*.key
secrets/
```

Never push production secrets to GitHub.

---

# 16. HTTPS / TLS

Production application must use HTTPS.

```text
Browser
   ↓
HTTPS / TLS
   ↓
Backend
```

Use secure TLS configuration.

Sensitive information such as:

```text
Passwords
Authentication tokens
Medical information
Reports
```

must not be transmitted over unencrypted HTTP in production.

---

# 17. Security Headers

Configure appropriate security headers such as:

```text
HSTS
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Frame protection
```

Use a secure HTTP-header middleware where appropriate.

---

# 18. CORS Security

Do not use unrestricted production CORS such as:

```text
Access-Control-Allow-Origin: *
```

for authenticated private hospital APIs unless there is a specific justified design.

Allow only trusted application origins.

---

# 19. Error Handling Security

Never expose:

```text
Database errors
SQL queries
Stack traces
Server paths
Environment variables
Secrets
Tokens
```

Instead return safe messages:

```json
{
  "success": false,
  "message": "Access denied"
}
```

Detailed technical information should remain in protected server logs.

---

# 20. Audit Logging

Security-sensitive events must be logged.

Examples:

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
Permission denial
Admin actions
```

Do NOT log:

```text
Passwords
JWT tokens
Refresh tokens
API keys
Database passwords
Unnecessary medical information
```

---

# 21. Monitoring

Monitor for suspicious behavior such as:

```text
Repeated failed logins
Large number of denied requests
Unexpected report downloads
Unusual account activity
Repeated API requests
Unauthorized access attempts
```

Security events should be connected to appropriate alerts in the production environment.

---

# 22. Dependency Security

Regularly:

```text
Update dependencies
Remove unused packages
Scan vulnerabilities
Review critical vulnerabilities
Keep package-lock.json
```

Example:

```bash
npm audit
```

For production projects, also use automated dependency/security scanning in CI.

---

# 23. Backup Security

Hospital backups must be protected.

Use:

* Encryption
* Restricted access
* Separate backup credentials
* Backup retention policy
* Regular restore testing
* Backup access logging

Never expose database backups publicly.

---

# 24. Security Testing

Security testing workflow:

```text
Authentication Testing
        ↓
Authorization Testing
        ↓
RBAC Testing
        ↓
Patient Data Isolation
        ↓
API Security Testing
        ↓
File Upload Testing
        ↓
Dependency Scanning
        ↓
Penetration Testing
        ↓
Security Review
```

---

# 25. Mandatory Security Test Cases

### Test 1 — Patient Isolation

```text
Patient A → Patient B Report
```

Expected:

```text
❌ 403 Forbidden
```

---

### Test 2 — Staff Access

```text
Staff → Admin Settings API
```

Expected:

```text
❌ 403 Forbidden
```

---

### Test 3 — Doctor Access

```text
Doctor A → Unauthorized Patient
```

Expected:

```text
❌ 403 Forbidden
```

---

### Test 4 — Anonymous Access

```text
No Login → Patient Report
```

Expected:

```text
❌ 401 Unauthorized
```

---

### Test 5 — Inactive Account

```text
Inactive User → Login
```

Expected:

```text
❌ Login Denied
```

---

### Test 6 — ID Manipulation

```text
Patient A
↓
Change report ID
↓
Patient B report
```

Expected:

```text
❌ Access Denied
```

---

# 26. Security Architecture

```text
                    INTERNET
                       │
                       ▼
                  HTTPS / TLS
                       │
                       ▼
             Reverse Proxy / WAF
                       │
                       ▼
                  Backend API
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
 Authentication              Authorization
          │                         │
          └────────────┬────────────┘
                       ▼
                Business Logic
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
     PostgreSQL              Secure File Storage
          │                         │
          └────────────┬────────────┘
                       ▼
                   Audit Logs
```

---

# 27. Defense in Depth

Security should exist at multiple levels:

```text
Layer 1 → HTTPS
Layer 2 → Reverse Proxy / WAF
Layer 3 → Authentication
Layer 4 → Authorization / RBAC
Layer 5 → Input Validation
Layer 6 → Business Rules
Layer 7 → Database Security
Layer 8 → File Security
Layer 9 → Audit Logging
Layer 10 → Monitoring
Layer 11 → Backup & Recovery
```

If one layer fails, additional layers should continue protecting the system.

---

# 28. Security Incident Response

If suspicious activity is detected:

```text
Detect
  ↓
Alert
  ↓
Contain
  ↓
Investigate
  ↓
Recover
  ↓
Patch
  ↓
Review
```

The system should support:

* Session revocation
* Account disabling
* Credential rotation
* Audit-log investigation
* Security patching
* Recovery from backup

---

# 29. Security Definition of Done

Security is considered ready when:

* Passwords are securely hashed.
* Authentication is implemented.
* First-login password change works.
* Server-side RBAC is enforced.
* Object-level authorization is implemented.
* Patient data isolation is tested.
* API input validation exists.
* Rate limiting is implemented.
* Database is not publicly exposed.
* Secrets are not committed.
* Medical reports are securely stored.
* Report downloads are authorized.
* Audit logging is implemented.
* Errors do not expose internal information.
* Dependencies are scanned.
* Backup security is documented.
* Security tests pass.

---

# 30. Final Security Principle

```text
Frontend
   ↓
Provides the user interface

Backend
   ↓
Decides what the user is allowed to do

Database
   ↓
Protects stored application data

Infrastructure
   ↓
Protects the runtime environment

Monitoring
   ↓
Detects suspicious activity

Security Testing
   ↓
Continuously checks the system
```

> **Final Principle:** Build the hospital application as **secure-by-design**, not as an application where security is added at the end.
