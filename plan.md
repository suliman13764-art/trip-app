# plan.md (Updated)

## 1) Objectives
- Build an internal web app that computes **work start**, **work end**, **total working time**, and **multiple trip segments (forløb)** from **GPS + WebTrack order/message** data.
- Ensure **home zone** is set by **address search in the browser (Nominatim) → coordinates**, with **map click adjustment** (Leaflet + OSM) and **radius 200–500m**.
  - **Important constraint:** backend-to-Nominatim calls are blocked in the current shared cloud environment; **v1 uses browser-only geocoding** and sends final chosen coordinates to backend.
- Implement **robust real-world parsing**:
  - GPS **CSV/XLSX** (including semicolon-delimited, Latin-1 CSV with decimal commas).
  - WebTrack reports from **Excel without headers** and **PDF report prints** with messy report-style structure.
- Implement **stable home-zone detection**:
  - Consecutive-point confirmation for departure/return.
  - **Return validation prevents drive-by false returns** via dwell/stop logic.
  - **Real-world truncation handling:** allow a valid return near end-of-file if the vehicle is inside home zone and clearly stops/pauses, even if dwell-in-file is shorter than default dwell threshold.
- Generate a **Movia-ready Danish correction request** (copy/paste), with clear explanation and explicit fallback/estimation notes.
- **NEW (post-MVP): Private trip exclusion logic**
  - Detect/handle **private trips (privat rejse)** so private time is **excluded from work time**.
  - If a private trip occurs between work activities, end the current work segment at the **last completed order** before the private trip starts.
  - Start the next work segment **after** the private trip ends when work actually resumes.
  - Must not merge private time into work segments.
  - Must support **manual marking/confirmation** in the app when private trip boundaries are ambiguous.
- **NEW (post-MVP): Authentication + RBAC**
  - Implement **username + password** authentication.
  - Roles: **Owner/Admin** and **Regular User**.
  - Only Owner/Admin can create users and **soft deactivate** users.
  - Regular users can run analyses but cannot manage accounts.
  - Seed a **default initial Owner/Admin** account for internal setup/testing.

---

## 2) Implementation Steps

### Phase 1 — Core Workflow POC (Isolation, must pass before app UI) ✅ COMPLETED
**Goal:** Prove parsing + segmentation + end-time priority + output synthesis works on real sample files.

**Status:** Completed and validated on uploaded sample files.

**Validated findings (sample day)**
- GPS parsing validated (semicolon-delimited Latin-1 CSV; decimal commas; `DD-MM-YYYY HH:MM:SS`).
- WebTrack PDF parsing validated (regex timestamp extraction; run 0170/0198; stops 50–69; order 1689).
- Home-zone segmentation validated (radius 300m; dwell 10m) with **1 segment**:
  - start 10:37 (departure)
  - end 13:39 (first valid home entry)
  - total 182 minutes
- End time derived from **first valid home-zone entry**, not last GPS point.
- Return acceptance handles end-of-file stop/paused behavior.
- Browser-only Nominatim approved due to backend blocking.

**POC artifacts produced (internal)**
- `/app/backend/analysis_core.py`
- `/app/tests/phase1_poc.py`
- `/app/tests/phase1_poc_result.json`

---

### Phase 2 — V1 App Development (Build UI around proven core) ✅ MVP COMPLETE
**Goal:** Deliver an internal website that runs the proven engine, visualizes routes/segments, and generates copy-ready Danish correction text.

**Status:** Implemented end-to-end.

**Delivered in MVP**
- Upload GPS + WebTrack files.
- Browser-based Nominatim address search + map click home zone selection.
- Adjustable radius + dwell + stable points.
- `/api/analyze` backend with robust parsing (GPS CSV/XLSX; WebTrack PDF/XLSX/CSV).
- Results dashboard with KPIs, segments table, Danish correction text, debug panel.
- Copy to clipboard actions.
- `/api/health` endpoint.

**Known constraints**
- OSM tiles and Nominatim are external services; can be blocked/throttled in automated environments. UI still works with map click fallback.

---

### Phase 3 — Private Trip Logic + Manual Overrides (NEW ACTIVE PHASE)
**Goal:** Correctly exclude **private trip time** from work time and ensure segments split properly around private trips, with manual marking/confirmation when data is ambiguous.

#### User stories (Phase 3A: Private Trip)
1. As a user, I can mark a time range as **Private trip** so it is excluded from work time.
2. As a user, when a private trip is detected/marked between work activities, I see segments split:
   - Segment ends at **last completed order** before private trip starts.
   - Next segment starts after private trip ends when work resumes.
3. As a user, I can confirm or adjust private trip boundaries if the system is uncertain.
4. As a user, the system never merges private time into a work segment and shows an explicit “private time excluded” explanation in the correction text.

#### Logic requirements (must implement)
- **Normal case:** segment starts when leaving home zone and ends on first valid home-zone return.
- **Private trip case:**
  - If a private trip occurs between work activities:
    - Current work segment ends at **timestamp of the last completed order (AFLEV / completion)** before the private trip starts.
    - The private trip interval is **excluded** from work time.
    - Next segment starts **after private trip end**, at the time work actually resumes.
  - The segment must **not** continue through the private trip.
  - The system must not merge work + private trip time.
- **Passing through home zone** during active work or private driving must **not** end a segment unless return is validated (dwell/stop logic). (Existing rule remains.)

#### Private trip identification (flexible)
- Use a combination of:
  - GPS patterns (e.g., long gap, travel to non-work location, unusual routing)
  - WebTrack patterns (lack of meaningful work events during movement window; message hints if present)
  - **Manual marking/confirmation in the UI** (required for v1 of this feature)

#### Proposed implementation tasks
1. **Data model additions (analysis result)**
   - Add `private_trips: [{ start_time, end_time, source: 'manual'|'auto', confidence, notes }]`.
   - Add `segment_adjustments: [{ reason, original_boundary, adjusted_boundary }]`.
2. **WebTrack “completion” extraction**
   - Define “completed order” events (e.g., `AFLEV` with a time) as completion anchors.
   - Ensure we store completion timestamps by stop/order (not just summary).
3. **Segment splitting rules (engine update)**
   - After base segmentation, apply private-trip overlays:
     - For each private trip window, find the last completion timestamp before `private_start` → segment end.
     - Identify next work-resume timestamp after `private_end` using both:
       - first meaningful WebTrack event after private end
       - corresponding GPS movement time window
     - Create new segment start at resume timestamp.
4. **Manual marking UI**
   - Provide “Mark private trip” controls:
     - Option A: select start/end by choosing from detected timeline events (GPS timestamps + WebTrack timestamps)
     - Option B: enter start/end times manually (time inputs)
   - Show private trip intervals on the map (e.g., gray overlay) and in the segments table.
5. **Correction text update (Danish)**
   - Include explicit statement:
     - “Privat kørsel fra HH:MM til HH:MM er fratrukket arbejdstiden.”
   - Ensure totals are computed as sum of segment durations **minus private trip intervals**.
6. **Testing (must add before release)**
   - Add at least 1 real anonymized day with a known private trip.
   - Validate:
     - segment ends exactly at last completed order before private trip
     - resume starts after private trip end
     - total work minutes excludes private interval
     - no false end from passing through home zone

---

### Phase 4 — Authentication + RBAC + Admin User Management (NEW ACTIVE PHASE, PARALLEL/AFTER 3)
**Goal:** Add secure internal access control with centralized admin-only user management.

#### User stories (Phase 4)
1. As a user, I can log in using **username + password**.
2. As an Owner/Admin, I can create new user accounts.
3. As an Owner/Admin, I can **soft deactivate** users (disable access) and reactivate if needed.
4. As a Regular User, I can use the analysis system but cannot create/deactivate users.
5. As an Owner/Admin, I can view a list of users and their status (active/deactivated) and role.

#### Requirements (must implement)
- Auth method: **username + password**.
- Roles:
  - **Owner/Admin**: can create users; can soft deactivate users; can manage access.
  - **Regular User**: can log in and run analysis; no user management.
- Removal: **soft deactivate only** (no hard deletes).
- Seed default Owner/Admin user for internal setup/testing.

#### Proposed implementation tasks
1. **Backend auth foundations (FastAPI)**
   - Add user table/collection (MongoDB or file-backed). Even if analysis is stateless, auth requires persistence.
   - Fields: `username`, `password_hash`, `role`, `is_active`, `created_at`, `last_login_at`.
   - Password hashing: bcrypt/passlib.
   - Token/session:
     - JWT access token stored in memory/localStorage OR httpOnly cookie (prefer cookie if feasible).
2. **RBAC middleware/dependencies**
   - Dependency guard: `require_auth`, `require_role_admin`.
   - Protect endpoints:
     - `/api/analyze` requires authenticated user.
     - `/api/admin/users/*` requires admin.
3. **Admin endpoints**
   - `POST /api/auth/login`
   - `POST /api/auth/logout` (if cookie-based)
   - `GET /api/auth/me`
   - `POST /api/admin/users` (create)
   - `PATCH /api/admin/users/{id}` (deactivate/reactivate, change role if allowed)
   - `GET /api/admin/users` (list)
4. **Frontend login + protected UI**
   - Add login page/form.
   - Store auth state; redirect unauthenticated users to login.
   - Hide admin UI for regular users.
5. **Admin management UI**
   - Users table with create modal and activate/deactivate toggles.
   - Clear role badges.
6. **Seeding default Owner/Admin**
   - Add startup hook:
     - If no users exist, create default `owner` user with a configurable password.
   - Provide “change password” flow (optional but recommended).
7. **Security + audit basics**
   - Rate limit login attempts (basic).
   - Log admin actions: create/deactivate.
   - Ensure deactivated accounts cannot log in.
8. **Testing (must)**
   - Automated tests for:
     - login success/failure
     - role enforcement
     - deactivate blocks login
     - admin can create users; regular cannot

---

## 3) Next Actions
**New active workstream after MVP:** Phase 3 + Phase 4.

1. **Private trip support**
   - Provide 1 anonymized day example where a private trip is known + expected boundaries and last completed order time.
   - Implement private trip data model + manual marking UI.
   - Update engine to split segments using last completed order before private trip.
   - Update Danish correction text to explicitly subtract private trip time.

2. **Auth + RBAC**
   - Implement username/password login and seed owner/admin.
   - Add admin endpoints and UI for creating/deactivating users.
   - Protect `/api/analyze` behind authentication.

3. **Regression tests**
   - Re-run sample day (no private trip) to ensure previous results remain unchanged.
   - Add new tests for private trip day and RBAC flows.

---

## 4) Success Criteria
**MVP success (Completed / Phase 2)**
- ✅ Upload + home zone selection + analysis + map + Danish correction text works.
- ✅ End time based on first valid home-zone entry (not last GPS point).
- ✅ Handles messy GPS/WebTrack inputs including PDF WebTrack.

**Phase 3 success (Private trip logic)**
- Private trip time is **never counted** in work time.
- If private trip occurs between work activities:
  - Segment ends at **last completed order time** before private trip.
  - Next segment starts after private trip ends when work resumes.
- Manual marking/confirmation works and is reflected in:
  - segments
  - totals
  - Danish correction request text

**Phase 4 success (Auth + RBAC)**
- Users must log in with username/password to access the tool.
- Owner/Admin can create and deactivate users.
- Regular users cannot manage accounts.
- Deactivated users cannot log in.
- Default Owner/Admin account is seeded for initial setup/testing.
