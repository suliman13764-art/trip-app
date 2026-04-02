# plan.md (Updated)

## 1) Objectives
- Build an internal web app that computes **work start**, **work end**, **total working time**, and **multiple trip segments (forløb)** from **GPS + WebTrack order/message** data.
- Ensure **home zone** is set by **address search in the browser (Nominatim) → coordinates**, with **map click adjustment** (Leaflet + OSM) and **radius 200–500m**.
  - **Important update:** backend-to-Nominatim calls are blocked in the current shared cloud environment; **v1 will use browser-only geocoding** and send final chosen coordinates to backend.
- Implement **robust real-world parsing**:
  - GPS **CSV/XLSX** (including semicolon-delimited, Latin-1 CSV with decimal commas).
  - WebTrack reports from **Excel without headers** *and* **PDF report prints** with messy report-style structure.
- Implement **stable home-zone detection**:
  - Consecutive-point confirmation for departure/return.
  - **Return validation must prevent drive-by false returns** via dwell/stop logic.
  - **Real-world truncation handling:** allow a valid return near end-of-file if the vehicle is inside home zone and clearly stops/pauses, even if the in-file dwell time is shorter than the default dwell threshold.
- Generate a **Movia-ready Danish correction request** (copy/paste), with clear explanation and explicit fallback/estimation notes.
- V1 is **single-use** (no persistence/history), reliable, and fails gracefully.

---

## 2) Implementation Steps

### Phase 1 — Core Workflow POC (Isolation, must pass before app UI) ✅ COMPLETED
**Goal:** Prove parsing + segmentation + end-time priority + output synthesis works on real sample files.

**Status:** Completed and validated on the uploaded sample files.

**Validated findings (sample day)**
- **GPS parsing validated**
  - Semicolon-delimited **Latin-1 CSV** parsed successfully.
  - Columns seen: `Date`, `Latitude`, `Longitude`, `Speed`, `Status`, `Address` (plus extras).
  - Timestamp format: `DD-MM-YYYY HH:MM:SS`.
  - Latitude/Longitude had **decimal comma** format and was converted safely.
- **WebTrack parsing validated**
  - Parsed successfully from **PDF** using pdf text extraction + **regex timestamp detection** + line grouping.
  - Works despite non-tabular/report-style layout and implicit headers.
  - Extracted:
    - Run number: **0170/0198**
    - Stop numbers: **50, 51, 52, 53, 54, 55, 56, 69**
    - Primary order number: **1689**
- **Home-zone + segmentation validated**
  - Radius: **300m**, Return dwell default: **10 minutes**.
  - Detected **1 segment** for the sample day.
  - Start time: **10:37** (raw departure point: **2026-04-02 10:37:15**)
  - End time: **13:39** (raw first valid home entry: **2026-04-02 13:39:23**)
  - Total duration: **182 minutes**.
  - End time derived from **first valid home-zone entry**, **not** last GPS point.
- **Important real-world rule validated**
  - Return was accepted because the inside-home sequence ended in **Stop/Paused** state near end-of-file even though the observed post-entry dwell in-file was shorter than 10 minutes.
  - This protects correctness for **truncated day-end GPS files**.
- **Geocoding constraint and v1 decision**
  - Backend calls to public Nominatim are blocked (403/429) in the shared cloud environment.
  - User approved: **Use Nominatim in the browser only**; backend uses the final selected coordinates.

**POC artifacts produced (internal)**
- Analysis engine module: `/app/backend/analysis_core.py`
- POC runner: `/app/tests/phase1_poc.py`
- POC JSON output: `/app/tests/phase1_poc_result.json`

**Checkpoint:** Phase 1 success criteria met; proceed to Phase 2.

---

### Phase 2 — V1 App Development (Build UI around proven core) 🚧 IN PROGRESS
**Goal:** Deliver an internal website that runs the proven engine, visualizes routes/segments, and generates copy-ready Danish correction text.

**User stories (V1)**
1. As a user, I can upload a GPS file and a WebTrack file and immediately see whether both parsed successfully.
2. As a user, I can search my home address in the browser (Nominatim) and set/adjust the home zone on a map without entering coordinates.
3. As a user, I can choose a radius and see home-zone circle plus entry/exit markers and segments on the route.
4. As a user, I can see computed start/end/total time and a list of segments with timestamps.
5. As a user, I can copy a Danish Movia-ready correction request text and clearly see if any times were estimated and why.

**Steps**
1. **Architecture (stateless v1)**
   - Backend: **FastAPI** API endpoints for upload + analysis.
   - Frontend: **React** UI with **Leaflet + OpenStreetMap tiles**.
   - No DB/persistence in v1.

2. **Backend endpoints (FastAPI)**
   - `POST /api/analyze`
     - Input: multipart upload for `gps_file`, `webtrack_file` + JSON fields:
       - `home_lat`, `home_lon` (from browser geocode / map click)
       - `radius_m` (default 300; allowed 200–500)
       - `return_dwell_minutes` (default 10)
       - optional advanced: min consecutive outside/inside points
     - Output JSON:
       - segments list + start/end/total
       - debug: closest distance, rejected return candidates (if any)
       - extracted WebTrack summary (run, stops, order)
       - Danish correction text
   - Parsing rules implemented from Phase 1:
     - GPS: delimiter/encoding detection; decimal comma handling.
     - WebTrack: support **PDF** and **Excel without headers**.

3. **Frontend flow (React)**
   - **Step A: Upload**
     - Two file inputs: GPS + WebTrack.
     - File type hints and “common issues” help text.
   - **Step B: Home zone setup**
     - Address input with **browser-side Nominatim search**.
     - Show candidate results; user selects one.
     - Map centers on selected result.
     - User can click to adjust the home center.
     - Radius slider (200–500m, default 300m).
   - **Step C: Run analysis**
     - Frontend sends files + chosen coordinates + radius/dwell to backend.
   - **Step D: Results dashboard**
     - Summary cards: start, end, total, number of segments.
     - WebTrack summary: run number, stop list/count, primary order.
     - Copyable **Movia Danish correction request** text.
     - Debug panel (collapsible):
       - closest distance to home
       - how return was validated (dwell vs stop/paused vs fallback)

4. **Map visualization (Leaflet)**
   - Show:
     - GPS polyline route
     - Home zone circle
     - Entry/exit markers
     - Segment coloring (if multiple)
   - Interaction:
     - click map to set home zone center
     - optional: show point tooltip (timestamp/speed/status)

5. **Error handling (must-not-crash)**
   - Clear errors for:
     - missing/empty GPS
     - missing timestamps in WebTrack
     - unsupported file type
     - no valid segments found
   - If **no home return** detected:
     - Apply end-time priority rules:
       1) GPS first valid home entry
       2) WebTrack last meaningful order + travel estimate (if possible)
       3) last GPS timestamp as last fallback
     - Clearly mark as **estimated** in UI + correction text.

6. **Movia Danish text generator (v1)**
   - Deterministic, structured text including:
     - date, run number, order number
     - start, end, total minutes
     - number of segments
     - stop range/list
     - explicit statement that end time uses **first valid home-zone entry**
     - explicit fallback explanation if used

7. **Configuration + compliance**
   - Nominatim usage:
     - Use in browser only for v1.
     - Add client-side debounce and minimal requests.
     - Provide attribution and required headers if needed by the frontend library approach.

8. **Mandatory end-to-end testing (before release)**
   - Run the full UI flow using the provided sample files.
   - Verify:
     - start/end match Phase 1 POC for the sample
     - end time is not last GPS point
     - drive-by home-zone pass does not trigger return
     - PDF WebTrack parsing works
   - Add at least 2 more anonymized real days if possible:
     - multiple segments day
     - day with missing return (fallback)

---

### Phase 3 — Hardening + Feature Enhancements (post-V1)
**User stories (Phase 3)**
1. As a user, I can override detected segment boundaries manually if the data is ambiguous.
2. As a user, I can adjust detection sensitivity (consecutive points, dwell time, speed cutoff) and rerun quickly.
3. As a user, I can see a “data quality” score (GPS gaps, sparse sampling, WebTrack missing pieces).
4. As a user, I can export a PDF summary (route snapshot + segments + correction text).
5. As an admin, I can optionally enable history/case saving for audits.
6. As an admin, I can switch geocoding mode:
   - browser-only Nominatim (default)
   - backend geocoding via self-hosted Nominatim or paid provider (if later required)

**Steps**
- Manual segment editing UI (drag start/end markers) + recalculated totals.
- Expand WebTrack parsers with more patterns from real exports (Excel without headers, additional message formats).
- Add automated “quality checks” and tuning recommendations.
- Add PDF export.
- Optional persistence layer (only if requested later).

---

## 3) Next Actions
1. Implement Phase 2 UI + API using the proven engine from Phase 1.
2. Add browser-based address search (Nominatim) + Leaflet map selection.
3. Wire `/api/analyze` to accept uploaded files + selected coordinates.
4. Run mandatory E2E validation with the provided sample files and confirm output matches Phase 1:
   - start 10:37, end 13:39, 1 segment, 182 minutes (with the same home center and parameters).
5. Collect one multi-segment day sample to validate segment splitting in the full app.

---

## 4) Success Criteria
**Phase 1 success (Completed)**
- ✅ Correctly parsed GPS semicolon-delimited Latin-1 CSV with decimal commas.
- ✅ Parsed WebTrack PDF report with regex timestamp extraction and messy structure.
- ✅ Detected segment with correct start/end logic and end time based on **first valid home entry**.
- ✅ Generated Danish Movia-ready correction text and extracted run/stops/order.

**V1 success (Phase 2)**
- A user can upload files, set home by **browser address search + map click**, run analysis, view map + segments, and copy correction text in <2 minutes.
- End time never defaults to last GPS point unless explicitly flagged as fallback.
- Clear UI errors for bad/partial inputs; debug includes closest distance and why fallback was used.
- Works with real messy data: WebTrack without headers and PDF report prints.
