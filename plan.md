# plan.md (Updated)

## 1) Objectives
- Build an internal web app that computes **work start**, **work end**, **total working time**, and **multiple trip segments (forløb)** from **GPS + WebTrack order/message** data.
- Ensure **home zone** is set by **address search in the browser (Nominatim) → coordinates**, with **map click adjustment** (Leaflet + OSM) and **radius 200–500m**.
  - **Constraint (kept):** backend-to-Nominatim calls are blocked in the current shared cloud environment; **v1 uses browser-only geocoding** and sends final chosen coordinates to backend.
- Implement **robust real-world parsing**:
  - GPS **CSV/XLSX** (including semicolon-delimited, Latin-1 CSV with decimal commas).
  - WebTrack reports from **Excel without headers** and **PDF report prints** with messy report-style structure.
- Implement **stable home-zone detection**:
  - Consecutive-point confirmation for departure/return.
  - **Return validation prevents drive-by false returns** via dwell/stop logic.
  - **Real-world truncation handling:** allow a valid return near end-of-file if the vehicle is inside home zone and clearly stops/pauses, even if dwell-in-file is shorter than default dwell threshold.
- Generate a **Movia-ready Danish correction request** (copy/paste), with clear explanation and explicit fallback/estimation notes.

### Added and now implemented
- **Private trip exclusion logic (privat rejse)**
  - Private time is **excluded from work time**.
  - If a private trip occurs between work activities, the current segment ends at the **last completed order (AFLEV completion time)** before the private trip starts.
  - The next segment starts **after** the private trip ends when work resumes, inferred using **both GPS + order/message** data.
  - Must not merge private time into work segments.
  - Must support **manual marking/confirmation** in the app when private trip boundaries are ambiguous.
- **Authentication + RBAC**
  - **Username + password** login.
  - Roles: **Owner/Admin** and **Regular User**.
  - Only Owner/Admin can create users and **soft deactivate/reactivate** users.
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

### Phase 3 — Private Trip Logic + Manual Overrides ✅ IMPLEMENTED + TESTED
**Goal:** Exclude **private trip time** from work time and ensure segments split correctly around private trips.

#### User stories (Phase 3)
1. As a user, I can mark a time range as **Private trip** so it is excluded from work time.
2. As a user, when a private trip is marked between work activities, I see segments split:
   - Segment ends at **last completed order** before private trip starts.
   - Next segment starts after private trip ends when work resumes.
3. As a user, I can adjust boundaries manually.
4. As a user, the correction text clearly states private time was excluded.

#### Implemented behavior
- Backend `/api/analyze` accepts `private_trip_overrides` and applies them as overlays.
- Segment splitting uses **WebTrack completion anchors** (AFLEV planned completion time mapped to same date) to end the segment before private trip.
- Resume time after private trip is inferred using **both**:
  - first GPS movement after private trip end
  - first meaningful WebTrack event after private trip end
  - system selects the earliest valid resume time.
- Total working time is computed as the **sum of segment durations after splitting**, excluding private intervals.
- Danish correction text includes: `Privat kørsel fra HH:MM til HH:MM er fratrukket arbejdstiden.`

#### Verification example (on provided sample files)
- Manual private trip: **12:00–12:30**
- Result:
  - **2 segments**
  - Total minutes: **131**
  - Segment 1 ended at **11:40** (last completed AFLEV before private start)
  - Segment 2 resumed at **12:30:54** (first GPS movement after private end)

#### Status
- ✅ Implemented in backend analysis engine and UI.
- ✅ Covered by automated testing (Testing Agent iteration 2).

---

### Phase 4 — Authentication + RBAC + Admin User Management ✅ IMPLEMENTED + TESTED
**Goal:** Secure internal access control with centralized admin-only user management.

#### User stories (Phase 4)
1. As a user, I can log in using **username + password**.
2. As an Owner/Admin, I can create new user accounts.
3. As an Owner/Admin, I can **soft deactivate/reactivate** users.
4. As a Regular User, I can use the analysis system but cannot manage accounts.

#### Implemented behavior
- Mongo-backed user persistence.
- JWT bearer auth:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Protected endpoints:
  - `/api/analyze` requires authentication.
  - `/api/admin/users*` requires Owner/Admin.
- Admin UI:
  - Visible only to Owner/Admin.
  - Create user + role assignment.
  - Soft deactivate/reactivate.
- Default seeded Owner/Admin account:
  - Seeded from backend env.
  - Documented in `/app/memory/test_credentials.md`.

#### Status
- ✅ Implemented and verified via automated tests (Testing Agent iteration 2).

---

## 3) Next Actions (Post-V1 / Hardening)
Now that Phase 3 and Phase 4 are delivered, the next work should focus on **business-rule validation with real private-trip days** and operational hardening.

1. **Collect real private-trip sample(s) for validation**
   - Provide 1–3 anonymized days where private trip intervals are known.
   - Confirm expected segment boundaries:
     - last completed order timestamp before private trip
     - resume timestamp after private trip

2. **Private-trip detection improvements (optional, data-driven)**
   - Add “suggested private trip” candidates based on:
     - long GPS movement windows with no meaningful WebTrack events
     - known non-work locations (if provided)
   - Keep manual confirmation as the safe default.

3. **Audit & reporting enhancements**
   - Add explicit segment-level explanation fields:
     - why the end boundary was cut (private overlay vs home return)
     - which completion event was used
   - Optional: export PDF summary.

4. **Security hardening (recommended for production)**
   - Move JWT secret + default admin password to secure deployment config.
   - Add “change password” flow for the seeded owner account.
   - Add basic login rate limiting.
   - Tighten CORS origins (replace `*` with internal domains) when deployment target is known.

---

## 4) Success Criteria

### Phase 2 success (MVP) ✅
- ✅ Upload + home zone selection + analysis + map + Danish correction text works.
- ✅ End time based on first valid home-zone entry (not last GPS point).
- ✅ Handles messy GPS/WebTrack inputs including PDF WebTrack.

### Phase 3 success (Private trip logic) ✅
- ✅ Private trip time is excluded from work time.
- ✅ Segment ends at last completed order before private trip.
- ✅ Next segment starts after private trip ends using GPS + order inference.
- ✅ Manual marking works and affects segments, totals, and Danish correction text.

### Phase 4 success (Auth + RBAC) ✅
- ✅ Users must log in with username/password to access analysis.
- ✅ Owner/Admin can create and deactivate/reactivate users.
- ✅ Regular users cannot manage accounts and cannot see admin controls.
- ✅ Deactivated users cannot log in.
- ✅ Default Owner/Admin account is seeded and documented.
