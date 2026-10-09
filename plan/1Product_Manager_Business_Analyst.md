
# Product Manager / Business Analyst (All-in-One Specification)
**Project Name:** Private Hospital Management Software[cite: 1]  
**Document Type:** Business Requirements Document (BRD) & Product Requirements Document (PRD)[cite: 1]  
**Version:** 1.0[cite: 1]  
**Target Roles:** Admin, Doctor, Staff, Patient[cite: 1]  

---

## 1. Executive Summary & Product Objective
Private Hospital Management Software ek secure, role-based aur privacy-first operational platform hai jo hospital ke internal daily workflows ko automate karta hai[cite: 1]. Is system mein unnecessary public-facing features (jaise online appointment booking, doctor search ya billing gateways) intentionally exclude kiye gaye hain taaki hospital operations fast, focused aur compliant rahein[cite: 1].

### Primary Goals:
- **Fast Hospital Operations:** Hospital staff aur doctors ke daily paperwork aur clicks ko minimize karna[cite: 1].
- **Strict Role Boundaries:** Har user ko sirf wahi details aur actions dikhana jo uske kaam ke liye zaroori hain[cite: 1].
- **Patient Privacy by Design:** Patients ko unki diagnostic reports securely provide karna bina kisi doosre patient ka data expose kiye[cite: 1].
- **End-to-End Governance:** Admin ko hospital shifts, staff locations aur sensitive actions par full visibility dena[cite: 1].

---

## 2. User Personas & Role Matrix

| User Role | Primary Responsibilities | UI & Data Access Scope | Excluded Access |
| :--- | :--- | :--- | :--- |
| **Admin**[cite: 1] | Centralized Hospital Administration & Governance[cite: 1] | Full access: Users, Doctors, Staff, Patients, Departments, Shifts, Reports, Audit Logs, Settings[cite: 1] | Direct clinical modifications (cannot alter verified doctor diagnoses) |
| **Doctor**[cite: 1] | Clinical care, diagnoses, treatment & reports[cite: 1] | Assigned patients only, medical records, prescriptions, diagnostic reports, own shifts[cite: 1] | Unassigned patients, system settings, staff operational logs, user provisioning[cite: 1] |
| **Staff**[cite: 1] | Daily floor operations, ward maintenance, tasks[cite: 1] | Assigned tasks, ward/location, assigned patient operational status, own shifts, notifications[cite: 1] | Writing clinical prescriptions, administrative audit logs, hospital settings[cite: 1] |
| **Patient**[cite: 1] | Diagnostic report verification & download[cite: 1] | Personal profile, viewing own diagnostic reports, downloading official PDFs[cite: 1] | Other patients' records, doctor/staff profiles, administrative dashboards, scheduling[cite: 1] |

---

## 3. High-Level Product Architecture Flow


```

```
                 PRIVATE HOSPITAL MANAGEMENT
                            │
                     ┌──────┴──────┐
                     │    ADMIN    │
                     └──────┬──────┘
                            │
    ┌───────────────────────┼───────────────────────┐
    ▼                       ▼                       ▼
 DOCTORS                  STAFF                  PATIENTS
    │                       │                       │
    ▼                       ▼                       ▼

```

Medical Work            Hospital Work           Own Reports
(Records, Rx, Shifts)    (Tasks, Shifts, Ward)  (View & Download)
│                       │                       │
└───────────────────────┼───────────────────────┘
▼
SECURE DATABASE ENGINE

```

---

## 4. Feature Specifications by Functional Domain

### 4.1 Authentication & User Governance
- **Role Detection Login:** Single unified login page jahan backend credentials verify karke appropriate dashboard par redirect karta hai[cite: 1].
- **Admin Account Creation:** Admin naye Doctor aur Staff accounts create karega[cite: 1]. Public registration allowed nahi hai.
- **One-Time Password (OTP):** First login ke liye system generated temporary password[cite: 1].
- **Mandatory Password Change:** Pehli baar login karte waqt naya permanent password set karna compulsory hoga[cite: 1].
- **User Activation/Deactivation:** Admin kisi bhi employee account ko instant disable kar sakta hai[cite: 1].
- **Session Security:** 15 minute inactivity par automatic session timeout aur re-authentication overlay[cite: 1].

### 4.2 Doctor Management
- **Doctor Registry:** Specialization, department, contact info, aur license ID[cite: 1].
- **Assigned Patient Roster:** Doctor ko sirf unhi patients ki list dikhegi jo use assign kiye gaye hain[cite: 1].
- **Clinical Records & History:** SOAP notes, treatment logs aur admission history view/add karna[cite: 1].
- **Prescription Engine:** Dawaiyon ka dosage, frequency aur instructions set karna[cite: 1].
- **Diagnostic Reports:** Patient ke uploaded test results aur radiology scans check karna[cite: 1].
- **Doctor Shift & Duties:** Apni assigned duty timings aur on-call shifts track karna[cite: 1].

### 4.3 Staff Management
- **Staff Profiles:** Designation (Nurses, Ward Technicians, Duty Assistants)[cite: 1].
- **Shift & Location Tracking:** Assigned shift time aur designated working area (e.g., Ward 4B, ICU, OPD)[cite: 1].
- **Task Board:** Floor tasks ka live status (`Pending`, `In Progress`, `Completed`)[cite: 1].
- **Patient Operational View:** Sirf assigned ward ke patients ke basic vitals aur task check karna[cite: 1].

### 4.4 Patient Management
- **Patient Onboarding:** Admin basic patient record register karega (Name, Age, Blood Group, Contact, Emergency details)[cite: 1].
- **Doctor Allocation:** Patient ko suitable primary physician assign karna[cite: 1].
- **Medical Profile:** Admission records, known allergies aur ongoing medical observations[cite: 1].
- **Status Tracking:** Status pills: `Admitted`, `Observation`, `Discharged`[cite: 1].

### 4.5 Medical & Diagnostic Reports
- **Secure File Ingestion:** Authorized staff dwara reports (PDFs, lab tests) upload karna[cite: 1].
- **Metadata Tagging:** Test name, date, prescribing doctor aur department ka record[cite: 1].
- **Secure PDF Preview:** System ke andar browser preview window[cite: 1].
- **Authenticated Download:** Patient aur authorized doctors ka watermark-protected secure download[cite: 1].
- **Patient Report Isolation:** Patient A ko Patient B ki report kisi bhi tarah nazar nahi aayegi[cite: 1].

### 4.6 Shift & Work Operations
- **Shift Builder:** Morning, Evening aur Night shifts banana[cite: 1].
- **Resource Allocation:** Shifts ko doctors aur staff ke sath link karna[cite: 1].
- **Conflict Management:** Overlapping shift assignments ko system validate karke prevent karega.

### 4.7 Admin Dashboard & KPIs
- **System Counters:** Total Doctors, Active Staff, Admitted Patients, Diagnostic Files Processed[cite: 1].
- **Today's Roster:** Current shift ke under kaun sa doctor/staff kis ward mein active hai[cite: 1].
- **Recent Audit Trail:** Latest administrative activities ki live stream[cite: 1].

### 4.8 Security & Audit Logs
- **Immutable Audit Logs:** Sabhi sensitive actions ka permanent record (Action, User ID, Target ID, Timestamp, IP address)[cite: 1].
- **Zero Exposure via URLs:** Report download URLs mein direct sequential ID expose na hona (UUIDs enforced)[cite: 1].
- **403 Forbidden Shielding:** Unauthorized direct URL hits par generic access denied screen show hona[cite: 1].

---

## 5. Functional Requirements (FR) Matrix

| ID | Title | Description | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **FR-01** | Authentication[cite: 1] | Secure multi-role gateway[cite: 1] | Sahi role detect karke relevant dashboard par load kare[cite: 1]. |
| **FR-02** | RBAC Enforcement[cite: 1] | Role-based feature restriction[cite: 1] | Backend API aur Frontend route guards unpermitted actions block karein[cite: 1]. |
| **FR-03** | User Provisioning[cite: 1] | Admin doctor/staff account create kare[cite: 1] | Form submit hone par unique employee ID aur temp password generate ho[cite: 1]. |
| **FR-04** | First-Login Reset[cite: 1] | Compulsory initial password update[cite: 1] | First sign-in par `/change-password` par force redirect kare[cite: 1]. |
| **FR-05** | Patient Registry[cite: 1] | Patient data onboarding[cite: 1] | Admin patient details register kar sake[cite: 1]. |
| **FR-06** | Doctor Allocation[cite: 1] | Patient ko doctor assign karna[cite: 1] | Assigned doctor ke dashboard mein patient automatically dikhe[cite: 1]. |
| **FR-07** | Staff Allocation[cite: 1] | Staff ko duties aur locations assign karna[cite: 1] | Staff dashboard unki assigned working location display kare[cite: 1]. |
| **FR-08** | Shift Management[cite: 1] | Shifts schedule karna[cite: 1] | Shifts calendar mein doctor/staff ke schedule correctly dikhein[cite: 1]. |
| **FR-09** | Medical Notes[cite: 1] | Doctor notes aur treatment update[cite: 1] | Assigned doctor clinical record save kar sake[cite: 1]. |
| **FR-10** | Report Upload[cite: 1] | Diagnostic lab report ingestion[cite: 1] | PDF upload karne par metadata verify ho aur database mein link ho[cite: 1]. |
| **FR-11** | Isolated Portal[cite: 1] | Patient report access[cite: 1] | Logged-in patient sirf apna data dekh aur download kar sake[cite: 1]. |
| **FR-12** | Audit Trail[cite: 1] | Administrative security logging[cite: 1] | User login, delete actions aur report downloads table mein capture hon[cite: 1]. |

---

## 6. Critical Business Rules (Non-Negotiable)


```

┌────────────────────────────────────────────────────────┐
│                   CORE BUSINESS RULES                  │
├────────────────────────────────────────────────────────┤
│ RULE 1 (Patient Data Isolation)                        │
│   • Patient A  ──► Patient A Reports   ==  [ ALLOWED ] │
│   • Patient A  ──► Patient B Reports   ==  [ BLOCKED ] │
├────────────────────────────────────────────────────────┤
│ RULE 2 (Doctor Assignment Boundary)                    │
│   • Doctor A   ──► Assigned Patient    ==  [ ALLOWED ] │
│   • Doctor A   ──► Unassigned Patient  ==  [ BLOCKED ] │
├────────────────────────────────────────────────────────┤
│ RULE 3 (Staff Responsibility Boundary)                 │
│   • Staff      ──► Assigned Task/Ward  ==  [ ALLOWED ] │
│   • Staff      ──► Admin Settings/Logs ==  [ BLOCKED ] │
├────────────────────────────────────────────────────────┤
│ RULE 4 (Administrative Governance)                     │
│   • Admin      ──► Hospital Operations ==  [ ALLOWED ] │
├────────────────────────────────────────────────────────┤
│ RULE 5 (Zero-Trust Account Setup)                      │
│   • New User   ──► OTP ──► Force Password Change ──► App│
└────────────────────────────────────────────────────────┘

```

---

## 7. Out of Scope (Deliberately Excluded)

System simplicity aur hospital operational focus banaye rakhne ke liye ye features V1.0 ka hissa **nahi** hain[cite: 1]:
1. Patient self-sign-up / public registration forms[cite: 1].
2. Public doctor profile search aur directory[cite: 1].
3. Online patient appointment booking aur doctor scheduling[cite: 1].
4. Patient billing, online payment gateway aur invoices[cite: 1].
5. Telehealth, video call consultations ya direct live chat[cite: 1].
6. Patients ka hospital internal operations ya administrative workflows tak access[cite: 1].

---

## 8. Definition of Done (DoD) for Engineering & QA
- [ ] Saare 12 Functional Requirements backend API aur frontend UI par properly test aur verify hon[cite: 1].
- [ ] Strict backend authorization implemented ho (IDOR validation: Patient A ke session se Patient B ka report ID hit karne par HTTP 403 Forbidden return ho)[cite: 1].
- [ ] First-login temporary password change flow end-to-end verified ho[cite: 1].
- [ ] Responsive design Desktop, Tablet aur Mobile viewports par standard accessible touch targets ke sath test ho[cite: 1].
- [ ] Saare empty states, loading skeletons, validation errors aur unauthorized screens properly styled hon[cite: 1].

```

Aap is poore markdown content ko copy karke directly apne project folder mein **`Product_Manager_Business_Analyst.md`** naam se save kar sakte hain.