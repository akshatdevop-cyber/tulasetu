# Implementation of My Code

## Legal Metrology Verification Portal

This document defines the complete phase-wise implementation plan for the existing Legal Metrology Verification Portal.

---

# 1. Project Context

## Technology Stack

- React + Vite
- TypeScript
- Tailwind CSS
- React Router
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Cloud Functions, where trusted backend logic is required
- Lucide React
- Leaflet and React Leaflet for GIS
- Turf.js for spatial calculations

## Existing User Roles

### Business

- Register and log in
- Submit instrument verification applications
- Track application status
- View approved certificates

### Legal Metrology Officer

- Submit an officer registration request
- Upload an official ID card image
- Provide official details
- Wait for administrator approval
- Review assigned applications after approval
- Approve or reject applications
- Issue certificates

### Administrator

- Manage officer registrations
- Compare submitted officer details with pre-seeded official records
- View uploaded ID card images
- Approve or reject officer registrations
- Manage officer jurisdictions and availability
- Monitor applications and assignments
- Reassign applications when authorized

### General Public

- Search certificates by certificate number
- Scan QR codes
- View certificate validity and public certificate details

## Existing Firestore Collection

The project already contains:

```text
applications
```

Do not rename, delete, or duplicate this collection without inspecting the existing schema.

---

# 2. Overall Roadmap

```text
Phase 1: Fix QR Certificate Verification
                ↓
Phase 2: Strengthen Application, Certificate, and Officer Data
                ↓
Phase 3: Add Officer Signup Verification and Admin Approval
                ↓
Phase 4: Add GIS Location and Map Features
                ↓
Phase 5: Add Officer Jurisdiction and Automatic Allocation
                ↓
Phase 6: Integrate Allocation with Officer Dashboard
                ↓
Phase 7: Add Advanced GIS, Audit, Notifications, and Production Features
```

---

# Phase 1 — Fix QR Certificate Verification

## Objective

Ensure that the complete certificate verification workflow works:

```text
Officer approves application
        ↓
Certificate data is created or stored
        ↓
QR code contains the correct verification URL
        ↓
Public opens the URL
        ↓
VerifyPage reads the certificate identifier
        ↓
Firestore is queried correctly
        ↓
Certificate details are displayed
```

## Step 1: Inspect the Existing Implementation

Before changing code, inspect:

1. How an officer approves an application.
2. Where certificate data is stored.
3. Whether certificates are stored:
   - Inside `applications`, or
   - In a separate `certificates` collection.
4. The application document ID.
5. The certificate number field.
6. The QR generation code.
7. The exact URL or value embedded in the QR.
8. How `VerifyPage.tsx` reads URL parameters.
9. Which Firestore collection VerifyPage queries.
10. Which Firestore field or document ID the query uses.

Do not assume that:

- The collection is named `certificates`.
- The certificate number is the Firestore document ID.
- The URL parameter is named `certificate`.
- The certificate is automatically created after approval.

## Step 2: Identify the Root Cause

Check for:

- QR contains a certificate number, but VerifyPage searches by document ID.
- QR contains an application ID, but VerifyPage searches by certificate number.
- QR parameter names do not match.
- VerifyPage queries the wrong collection.
- VerifyPage queries the wrong field.
- Certificate data is never created after approval.
- Certificate number is generated but not saved.
- Certificate data is stored under another field name.
- Firestore security rules block public reads.
- QR points to the wrong route.
- React Router does not correctly handle the verification route.
- Expiry or status logic incorrectly displays “Not Found.”

Trace the actual data flow and confirm the root cause before implementing a fix.

## Step 3: Fix Certificate Creation

When an officer approves an application:

- Preserve the existing application document.
- Create or update certificate data using the existing schema.
- Ensure the certificate has a stable identifier.
- Save the identifier consistently.
- Keep the application and certificate connected.
- Prevent duplicate certificate creation when the same application is approved again.

If certificate data already exists inside `applications`, keep that design unless there is a strong technical reason to change it.

## Step 4: Fix QR Generation

The QR code should contain a complete verification URL.

Example:

```text
https://your-domain.com/verify?certificate=LM-2026-000124
```

Requirements:

- Do not hardcode a sample certificate number.
- URL-encode the identifier.
- Ensure the QR points to the deployed verification route.
- Ensure the QR remains valid after page refresh.

Example:

```ts
const verificationUrl =
  `${window.location.origin}/verify?certificate=${encodeURIComponent(
    certificateNumber
  )}`;
```

## Step 5: Fix VerifyPage

VerifyPage must:

- Read the correct URL parameter.
- Support manual certificate ID entry.
- Automatically verify when opened through a QR URL.
- Query the correct Firestore collection.
- Use the correct field or document ID.
- Display a loading state.
- Display a proper not-found state.
- Handle Firestore errors.
- Display certificate details only when the certificate exists.
- Avoid exposing unnecessary private business information.

## Step 6: Certificate Validity

Display:

- Certificate number
- Instrument type
- Manufacturer
- Model number, if available
- Serial number
- Issue date
- Expiry date
- Issuing officer or department, if available
- Current status

Validity rules:

```text
Revoked → Revoked
Expiry date in the past → Expired
Otherwise → Valid
```

Do not mark a certificate as valid merely because a document exists.

## Step 7: Firestore Security

Inspect the existing Firestore security rules.

Public users should only be able to read the information required for certificate verification.

Do not expose:

- Passwords
- Authentication secrets
- Private application data
- Unnecessary business information
- Internal officer information

Do not solve the issue by allowing unrestricted reads of all application documents.

## Phase 1 Testing Checklist

- [ ] Officer approves a new application.
- [ ] Certificate data is created or saved.
- [ ] QR code is generated.
- [ ] QR opens the correct verification route.
- [ ] VerifyPage reads the correct identifier.
- [ ] Firestore returns the correct certificate.
- [ ] Certificate details display correctly.
- [ ] Manual certificate search works.
- [ ] Invalid certificate displays “Certificate Not Found.”
- [ ] Expired certificate displays “Expired.”
- [ ] Revoked certificate displays “Revoked.”
- [ ] Refreshing the verification page works.
- [ ] Verification works in a new browser or incognito window.
- [ ] Existing business and officer workflows remain functional.

## Phase 1 Completion Criteria

The QR verification flow works independently of GIS and can verify a certificate using the public portal.

---

# Phase 2 — Strengthen Application, Certificate, and Officer Data

## Objective

Prepare the database for GIS, officer verification, and allocation without breaking current features.

## Step 1: Inspect Existing Application Documents

Inspect documents in:

```text
applications
```

Identify existing fields such as:

- Application ID
- Business ID
- Business name
- Instrument details
- Status
- Certificate ID
- Certificate number
- Submission date
- Review information

Do not overwrite or rename existing fields unnecessarily.

## Step 2: Add a Location Structure

Recommended structure:

```ts
export interface Location {
  address: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}
```

Example:

```json
{
  "location": {
    "address": "Industrial Area, Kanpur",
    "district": "Kanpur Nagar",
    "state": "Uttar Pradesh",
    "latitude": 26.4499,
    "longitude": 80.3319
  }
}
```

## Step 3: Add Allocation Fields

Add optional fields:

```ts
assignedOfficerId?: string;
assignedOfficerName?: string;
assignedAt?: string;
assignmentStatus?: "unassigned" | "assigned" | "reassigned";
```

## Step 4: Preserve Backward Compatibility

Existing applications may not contain location or assignment fields.

The UI must handle missing fields safely.

Example:

```ts
const district = application.location?.district ?? "Not provided";
```

Do not make the entire dashboard crash because an old application has no GIS data.

## Step 5: Add Officer Verification Fields

Officer accounts should not become active immediately after signup.

Recommended fields:

```ts
type VerificationStatus = "pending" | "approved" | "rejected";

interface OfficerRegistration {
  uid: string;
  name: string;
  email: string;
  officerId: string;
  department: string;
  designation: string;
  district: string;
  state: string;
  idCardImageUrl: string;
  verificationStatus: VerificationStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}
```

## Step 6: Improve Status Structure

Recommended application statuses:

```text
submitted
under_review
inspection_scheduled
approved
rejected
```

If the existing project uses different values, preserve them or create a controlled migration.

## Phase 2 Testing Checklist

- [ ] Existing applications still load.
- [ ] New applications save location data.
- [ ] Old applications without location do not crash.
- [ ] Assignment fields are optional.
- [ ] Officer registration fields are supported.
- [ ] Application and certificate relationships remain intact.
- [ ] QR verification still works.
- [ ] Status values remain consistent.

## Phase 2 Completion Criteria

Applications and user records support location, officer verification, and allocation workflows.

---

# Phase 3 — Officer Signup Verification and Administrator Approval

## Objective

Prevent unverified users from accessing the officer dashboard or receiving applications.

An officer registration must create a pending verification request. The administrator compares the submitted details and ID card with pre-seeded official records before approving the account.

## Required Workflow

```text
Officer opens Signup
        ↓
Enters official details
        ↓
Uploads official ID card image
        ↓
Submits registration
        ↓
Account status = pending_verification
        ↓
Admin compares submitted details
with pre-seeded official records
        ↓
Admin approves or rejects
        ↓
If approved:
  Officer role activated
  Officer can access dashboard
  Officer becomes eligible for allocation
        ↓
If rejected:
  Officer cannot access officer dashboard
```

## Step 1: Create Pre-seeded Official Records

Create a collection:

```text
officialOfficerRecords
```

Recommended document structure:

```json
{
  "officialName": "Rajesh Kumar",
  "officerId": "LM-OFF-001",
  "department": "Legal Metrology Department",
  "designation": "Inspector",
  "district": "Kanpur Nagar",
  "state": "Uttar Pradesh",
  "officialEmail": "officer001@department.gov.in",
  "instrumentCategories": [
    "weighing_instruments",
    "measuring_instruments"
  ],
  "active": true
}
```

These records must be created by an administrator or trusted seed process.

Officers must not be allowed to create or modify their own official records.

## Step 2: Create Officer Registration Collection

Recommended collection:

```text
officerRegistrations
```

Example:

```json
{
  "uid": "firebase-user-uid",
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "officerId": "LM-OFF-001",
  "department": "Legal Metrology Department",
  "designation": "Inspector",
  "district": "Kanpur Nagar",
  "state": "Uttar Pradesh",
  "idCardImageUrl": "firebase-storage-url",
  "verificationStatus": "pending",
  "submittedAt": "2026-09-14T12:00:00Z"
}
```

## Step 3: Officer Signup Form

The form should collect:

- Full name
- Email
- Password
- Officer ID
- Department
- Designation
- District
- State
- Official ID card image

Required validations:

- All mandatory fields must be completed.
- ID card image must be an accepted file type.
- File size must be limited.
- Officer ID must not be empty.
- Email must be valid.
- Password must meet the application’s security requirements.

## Step 4: Upload ID Card Image

Use Firebase Storage.

Recommended path:

```text
officer-id-cards/{uid}/{fileName}
```

Requirements:

- Upload only authenticated user files.
- Restrict file types.
- Restrict file size.
- Do not make ID card images publicly readable.
- Store the Storage download URL or file reference in the registration document.
- Allow only authorized administrators to view submitted ID cards.

## Step 5: Create Pending Registration

After signup:

```text
users/{uid}
```

should contain a restricted or inactive role state, such as:

```json
{
  "uid": "firebase-user-uid",
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "role": "pending_officer",
  "verificationStatus": "pending"
}
```

The registration details should be stored in:

```text
officerRegistrations/{uid}
```

Do not assign an active `officer` role before approval.

## Step 6: Administrator Dashboard

Create an administrator page such as:

```text
src/pages/admin/OfficerVerificationPage.tsx
```

The page should show pending registrations with:

- Submitted name
- Officer ID
- Department
- Designation
- District
- State
- Submitted email
- Uploaded ID card image
- Matching pre-seeded official record
- Verification status
- Approve button
- Reject button
- Rejection reason field

## Step 7: Compare Submitted Data with Official Records

The administrator should compare:

```text
Submitted officer name
        ↔
Pre-seeded official name

Submitted officer ID
        ↔
Pre-seeded officer ID

Submitted department
        ↔
Pre-seeded department

Submitted designation
        ↔
Pre-seeded designation

Submitted district
        ↔
Pre-seeded district
```

A matching officer ID is useful, but the administrator must make the final decision.

An uploaded ID card alone does not prove authenticity.

## Step 8: Approval Logic

On approval:

```text
officerRegistrations/{uid}
  verificationStatus = "approved"

users/{uid}
  role = "officer"
  verificationStatus = "approved"
```

Also create or update:

```text
officers/{uid}
```

with approved details:

```json
{
  "uid": "firebase-user-uid",
  "name": "Rajesh Kumar",
  "officerId": "LM-OFF-001",
  "district": "Kanpur Nagar",
  "state": "Uttar Pradesh",
  "instrumentCategories": [
    "weighing_instruments",
    "measuring_instruments"
  ],
  "available": true,
  "workload": 0,
  "verificationStatus": "approved"
}
```

Only approved officers should be eligible for application allocation.

## Step 9: Rejection Logic

On rejection:

```text
officerRegistrations/{uid}
  verificationStatus = "rejected"
  rejectionReason = "Reason entered by administrator"

users/{uid}
  role = "pending_officer"
  verificationStatus = "rejected"
```

The user must not access the officer dashboard.

## Step 10: Security Requirements

- Do not let users set their own role to `officer`.
- Do not allow officers to approve themselves.
- Do not allow officers to modify pre-seeded official records.
- Restrict ID card images to the submitting officer and authorized administrators.
- Restrict approval actions to administrators.
- Use trusted backend logic or secure Firestore rules for role activation.
- Record who approved or rejected the registration.
- Record approval or rejection timestamps.

## Phase 3 Testing Checklist

- [ ] Officer can submit a registration request.
- [ ] Officer must upload an ID card image.
- [ ] ID card image is stored securely.
- [ ] Registration status is initially pending.
- [ ] Officer cannot access the officer dashboard while pending.
- [ ] Administrator can view pending registrations.
- [ ] Administrator can view the uploaded ID card.
- [ ] Administrator can compare submitted data with pre-seeded records.
- [ ] Administrator can approve a registration.
- [ ] Approved officer receives the correct role.
- [ ] Approved officer appears in the officers collection.
- [ ] Approved officer becomes eligible for allocation.
- [ ] Administrator can reject a registration.
- [ ] Rejected officer cannot access the officer dashboard.
- [ ] Rejection reason is recorded.
- [ ] Approval and rejection actions are audited.

## Phase 3 Completion Criteria

Only administrator-approved officers can access the officer dashboard or receive applications.

---

# Phase 4 — Add GIS Location and Map Features

## Objective

Allow businesses to provide accurate instrument locations and allow officers to visualize applications on a map.

## Recommended GIS Stack

| Requirement | Technology |
|---|---|
| Interactive map | Leaflet |
| React integration | React Leaflet |
| Map tiles | OpenStreetMap |
| Location search | Nominatim or another geocoding provider |
| Spatial calculations | Turf.js |
| Location storage | Firestore |
| Boundary data | GeoJSON |

## Step 1: Install GIS Libraries

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

For spatial calculations:

```bash
npm install @turf/turf
```

## Step 2: Create a Reusable Map Component

Create:

```text
src/components/GISMap.tsx
```

Responsibilities:

- Display the map.
- Display application markers.
- Display officer markers.
- Handle map clicks.
- Select a location.
- Display marker details.
- Support future jurisdiction overlays.

## Step 3: Add Location Selection to ApplyPage

Recommended workflow:

```text
Business enters address
        ↓
Business searches or selects location on map
        ↓
Latitude and longitude are captured
        ↓
Location is saved with application
```

Initially, keep this simple. Do not start with complex polygon selection.

## Step 4: Add Map to OfficerDashboard

Display:

- Pending applications.
- Assigned applications.
- Application locations.
- Officer locations, if available.

Clicking an application marker should show:

- Application number
- Business name
- Instrument type
- District
- Status
- Assigned officer

## Step 5: Add Location Validation

Validate:

- Latitude is between `-90` and `90`.
- Longitude is between `-180` and `180`.
- District and state are not empty.
- Location is available before allocation.

## Phase 4 Testing Checklist

- [ ] Map loads correctly.
- [ ] Map tiles display.
- [ ] Business can select a location.
- [ ] Latitude and longitude are saved.
- [ ] Application markers appear.
- [ ] Clicking a marker displays application details.
- [ ] Officer dashboard displays application distribution.
- [ ] Missing location data is handled safely.

## Phase 4 Completion Criteria

The portal stores accurate application locations and displays them visually on a map.

---

# Phase 5 — Add Officer Jurisdiction and Automatic Allocation

## Objective

Automatically assign applications to eligible Legal Metrology Officers based on jurisdiction, instrument category, availability, workload, and optionally distance.

## Important Allocation Principle

Do not allocate officers only by nearest distance.

Use this priority:

```text
1. Jurisdiction
2. Instrument category or authority
3. Officer approval status
4. Officer availability
5. Current workload
6. Distance as a tie-breaker
```

## Step 1: Create Officers Collection

Recommended collection:

```text
officers
```

Example document:

```json
{
  "uid": "firebase-user-uid",
  "name": "Officer A",
  "officerId": "OFF-001",
  "district": "Kanpur Nagar",
  "state": "Uttar Pradesh",
  "instrumentCategories": [
    "weighing_instruments",
    "measuring_instruments"
  ],
  "available": true,
  "workload": 3,
  "verificationStatus": "approved"
}
```

## Step 2: Define Officer Type

```ts
export interface Officer {
  uid: string;
  name: string;
  officerId: string;

  jurisdiction: {
    district: string;
    state: string;
  };

  instrumentCategories: string[];

  available: boolean;
  workload: number;
  verificationStatus: "pending" | "approved" | "rejected";

  location?: {
    latitude: number;
    longitude: number;
  };
}
```

## Step 3: Determine Eligibility

An officer is eligible if:

- The officer is approved.
- The officer is available.
- The officer belongs to the application’s jurisdiction.
- The officer supports the required instrument category.
- The officer is authorized to review the application.

## Step 4: Implement Allocation Logic

Recommended workflow:

```text
New application submitted
        ↓
Read application district and category
        ↓
Find approved officers in the same jurisdiction
        ↓
Filter by supported category
        ↓
Filter available officers
        ↓
Sort by workload
        ↓
Use distance as a tie-breaker if needed
        ↓
Assign officer with lowest workload
        ↓
Save assignment to application
```

## Step 5: Use a Trusted Backend

The allocation decision should ideally run in a Firebase Cloud Function or another trusted backend layer.

The backend should:

- Validate the application.
- Find eligible officers.
- Assign an officer.
- Save the assignment.
- Update workload.
- Prevent conflicting assignments.
- Record assignment time.
- Ensure only approved officers are selected.

## Step 6: Handle No Eligible Officer

If no officer matches:

```text
assignmentStatus = "unassigned"
```

Display:

```text
No eligible officer is currently available.
The application requires administrative assignment.
```

Do not silently assign an unauthorized officer.

## Phase 5 Testing Checklist

- [ ] Officers have jurisdiction data.
- [ ] Officers have supported instrument categories.
- [ ] Applications have district and category.
- [ ] Unapproved officers are excluded.
- [ ] Unavailable officers are excluded.
- [ ] System filters ineligible officers.
- [ ] System selects based on workload.
- [ ] Assignment is saved.
- [ ] No eligible officer creates an unassigned state.
- [ ] Allocation logic runs in a trusted backend.
- [ ] Duplicate or conflicting assignments are prevented.

## Phase 5 Completion Criteria

A submitted application is automatically assigned to an eligible, approved officer using jurisdiction and workload rules.

---

# Phase 6 — Integrate Allocation with Officer Dashboard

## Objective

Ensure officers see the applications assigned to them and can complete the review workflow.

## Step 1: Query Assigned Applications

Use the officer’s authenticated UID.

Example:

```ts
const q = query(
  collection(db, "applications"),
  where("assignedOfficerId", "==", user.uid)
);
```

Use the actual field names from the existing schema.

## Step 2: Organize the Dashboard

Recommended sections:

```text
Officer Dashboard

├── Assigned Applications
├── Pending Inspection
├── Under Review
├── Approved
└── Rejected
```

## Step 3: Display Assignment Details

Each application should show:

- Application number
- Business name
- Instrument type
- Location
- District
- Assigned officer
- Status
- Submission date
- Next action

## Step 4: Connect Review and Approval

The officer should be able to:

- Open an assigned application.
- Review instrument details.
- Add inspection remarks.
- Record inspection date.
- Approve or reject.
- Generate a certificate after approval.

## Step 5: Add Reassignment

An administrator or authorized senior officer may reassign an application.

Reassignment should:

- Select another eligible officer.
- Record the reason.
- Record the previous officer.
- Record the new officer.
- Update assignment time.
- Update workload counts.

Do not allow every officer to freely reassign applications.

## Phase 6 Testing Checklist

- [ ] Officer sees assigned applications.
- [ ] Officer cannot see unauthorized private applications.
- [ ] Officer can review assigned applications.
- [ ] Officer can approve or reject.
- [ ] Approval generates a certificate.
- [ ] QR verification remains functional.
- [ ] Reassignment is restricted to authorized users.
- [ ] Reassignment history is recorded.

## Phase 6 Completion Criteria

The full workflow works:

```text
Business submits
        ↓
Officer automatically assigned
        ↓
Officer reviews
        ↓
Officer approves or rejects
        ↓
Certificate generated
        ↓
Public verifies through QR
```

---

# Phase 7 — Advanced GIS, Audit, Notifications, and Production Features

Only implement this phase after Phases 1–6 are stable.

## Feature 1: Jurisdiction Boundaries

Use GeoJSON boundary data.

Workflow:

```text
Application coordinates
        ↓
Point-in-polygon check
        ↓
Identify district or jurisdiction
        ↓
Select eligible officers
```

Turf.js can be used for spatial calculations.

## Feature 2: Distance-Based Allocation

After filtering by jurisdiction and authority:

```text
Eligible officers
        ↓
Calculate distance
        ↓
Compare workload
        ↓
Assign the best candidate
```

Distance should not override legal jurisdiction.

## Feature 3: Officer Workload Dashboard

Display:

```text
Officer A — 3 pending
Officer B — 8 pending
Officer C — 2 pending
```

Track:

- Pending applications
- Under-review applications
- Completed inspections
- Average processing time
- Current availability

## Feature 4: Application Heatmap

Display areas with high numbers of:

- Pending applications
- Approved applications
- Rejected applications
- Expiring certificates
- Inspection requests

## Feature 5: Inspection Route Planning

For officers with multiple inspections:

```text
Assigned application locations
        ↓
Calculate an efficient route
        ↓
Display suggested inspection order
```

This should be a planning aid, not an automatic legal decision.

## Feature 6: Audit Trail

Create an audit collection or embedded history.

Recommended collection:

```text
auditLogs
```

Example:

```json
{
  "applicationId": "app123",
  "action": "officer_assigned",
  "performedBy": "admin123",
  "previousValue": null,
  "newValue": "officer456",
  "timestamp": "2026-09-14T12:00:00Z"
}
```

Track:

- Application submitted
- Officer registration submitted
- Officer registration approved
- Officer registration rejected
- Officer assigned
- Officer reassigned
- Inspection recorded
- Application approved
- Application rejected
- Certificate issued
- Certificate revoked

## Feature 7: Notifications

Possible notifications:

- Application submitted.
- Officer registration submitted.
- Officer registration approved.
- Officer registration rejected.
- Officer assigned.
- Inspection scheduled.
- Application approved.
- Application rejected.
- Certificate issued.
- Certificate nearing expiry.

Possible implementation:

- Firebase Cloud Functions
- Email service
- In-app notifications
- SMS provider, if required

## Feature 8: Certificate QR and PDF Improvements

Add:

- QR code
- Certificate number
- Issue date
- Expiry date
- Instrument details
- Officer or department details
- Verification URL
- Revocation status

The QR should always point to the public verification page, not expose private application data.

---

# 3. Recommended Firestore Collections

```text
users/{uid}
    ├── name
    ├── email
    ├── role
    └── verificationStatus

applications/{applicationId}
    ├── businessId
    ├── instrumentDetails
    ├── location
    ├── status
    ├── assignedOfficerId
    ├── assignedAt
    └── reviewDetails

officerRegistrations/{uid}
    ├── submittedOfficerDetails
    ├── idCardImageUrl
    ├── verificationStatus
    ├── reviewedBy
    └── reviewedAt

officialOfficerRecords/{recordId}
    ├── officialName
    ├── officerId
    ├── department
    ├── designation
    ├── district
    ├── state
    └── active

officers/{uid}
    ├── approvedOfficerDetails
    ├── jurisdiction
    ├── instrumentCategories
    ├── available
    ├── workload
    └── verificationStatus

certificates/{certificateId}
    ├── certificateNumber
    ├── applicationId
    ├── businessId
    ├── issueDate
    ├── expiryDate
    └── status

auditLogs/{logId}
    ├── action
    ├── performedBy
    ├── targetId
    └── timestamp
```

If certificates are currently stored inside `applications`, preserve that structure and adapt the verification logic accordingly.

---

# 4. Recommended Final Architecture

```text
React + Vite
│
├── Business Portal
│   ├── Apply
│   ├── Track Application
│   └── View Certificate
│
├── Officer Portal
│   ├── Officer Signup
│   ├── Pending Verification
│   ├── Assigned Applications
│   ├── Review
│   ├── Inspection
│   └── Certificate Issuance
│
├── Admin Portal
│   ├── Officer Verification
│   ├── Official Officer Records
│   ├── Application Allocation
│   ├── Reassignment
│   └── Audit Logs
│
├── Public Portal
│   └── QR Certificate Verification
│
├── GIS Module
│   ├── Location Selection
│   ├── Application Map
│   ├── Officer Map
│   ├── Jurisdiction Detection
│   └── Officer Allocation
│
└── Firebase Backend
    ├── Authentication
    ├── Firestore
    ├── Cloud Functions
    ├── Storage
    └── Security Rules
```

---

# 5. Recommended MVP Scope for a Hackathon

Build these features first:

1. Fix QR verification.
2. Add location fields to applications.
3. Display applications on a map.
4. Add officer signup with ID card upload.
5. Seed official officer records.
6. Add administrator approval and rejection.
7. Activate only approved officer accounts.
8. Add officer jurisdiction.
9. Automatically assign eligible officers.
10. Display assigned applications on the officer dashboard.
11. Approve application and generate certificate.
12. Verify certificate publicly through QR.

The final demonstrable workflow should be:

```text
Officer registers
        ↓
Uploads official ID card
        ↓
Administrator compares details with pre-seeded records
        ↓
Administrator approves officer
        ↓
Business submits application
        ↓
GIS identifies application location
        ↓
System finds eligible approved officer
        ↓
Officer is allocated
        ↓
Officer reviews and verifies instrument
        ↓
Certificate is issued
        ↓
QR code is generated
        ↓
Public scans QR
        ↓
Certificate validity is displayed
```

---

# 6. Implementation Order

| Phase | Main Deliverable | Priority |
|---|---|---|
| Phase 1 | Working QR verification | Critical |
| Phase 2 | Location, certificate, and officer-ready data model | Critical |
| Phase 3 | Officer signup, ID upload, and admin approval | Critical |
| Phase 4 | GIS map and location capture | High |
| Phase 5 | Jurisdiction-based officer allocation | Critical |
| Phase 6 | Officer dashboard integration | Critical |
| Phase 7 | Advanced GIS, audit, notifications | Optional |

---

# 7. Important Design Rules

- Keep the existing `applications` collection.
- Inspect the current schema before adding fields.
- Do not create duplicate certificate collections.
- Keep certificate verification independent of GIS.
- Do not trust frontend-only role checks.
- Do not allow users to set their own role to `officer`.
- Do not activate officer access before administrator approval.
- Do not allow officers to modify pre-seeded official records.
- Store ID card images securely.
- Do not expose ID card images publicly.
- Do not allocate officers only by distance.
- Use jurisdiction and authority before workload or distance.
- Use trusted backend logic for allocation.
- Preserve an audit trail for important actions.
- Do not expose private application data through public verification.
- Do not claim a certificate is valid merely because it exists.
- Handle old application documents that lack new fields.
- Do not claim an ID card is authentic solely because submitted details match.
- Require a human administrator to make the final officer approval decision.
