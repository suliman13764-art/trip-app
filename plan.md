# plan.md

## 1) Objectives
- Build an internal web app that computes **work start**, **work end**, **total working time**, and **multiple trip segments (forløb)** from **GPS + WebTrack order/message** data.
- Ensure **home zone** is set by **address → coordinates** (Nominatim) with **map click adjustment** (Leaflet + OSM) and **radius 200–500m**.
- Implement **robust real-world parsing** (GPS CSV/XLSX + messy WebTrack Excel with no headers) and **stable home-zone detection** (consecutive points + dwell/stop rules).
- Generate a **Movia-ready Danish correction request** that is copy/paste ready, with clear explanation and confidence/estimation flags.
- V1 is **single-use** (no persistence/history), reliable, and fails gracefully.

---

## 2) Implementation Steps

### Phase 1 — Core Workflow POC (Isolation, must pass before app UI)
**Goal:** Prove parsing + segmentation + end-time priority + output synthesis works on real sample files.

**User stories (POC)**
1. As an analyst, I can run a script on a GPS file and get parsed points with correct timestamps and coordinates.
2. As an analyst, I can run a script on a headerless WebTrack file and still extract timestamped events, run number, stops, and key messages.
3. As an analyst, I can define a home address + radius and get reliable leave/return detections without false returns from drive-by passes.
4. As an analyst, I can get multiple segments for a day when the vehicle returns home and leaves again.
5. As an analyst, I can generate a Danish Movia-ready correction text with start/end derived by the priority rules and clear estimation flags.

**Steps**
1. **Collect samples**: obtain 1 GPS file + 1 WebTrack report file; confirm timezone, date format, and known expected start/end for manual comparison.
2. **POC parsing modules (Python)**
   - GPS ingest: CSV/XLSX, flexible column mapping (timestamp/lat/lon; optional speed/status/address).
   - WebTrack ingest: detect timestamps by regex in cells, infer columns/fields, extract:
     - event time, order id, stop no., pickup/dropoff hints, run/route (e.g. 0153/0158), messages like “V.LØBE SLUT 13:16”.
3. **Home zone module**
   - Geocode address via Nominatim → (lat, lon).
   - Implement distance calc (Haversine) + radius.
   - Stability rules: require **N consecutive outside** to confirm departure, **M consecutive inside** + **min dwell/low speed** to confirm return.
4. **Segmentation engine**
   - State machine: `IN_HOME` ↔ `OUTSIDE` with debouncing.
   - Output segments: start_time = confirmed departure; end_time = confirmed return (first valid inside event).
   - Handle missing/irregular GPS sampling.
5. **End time priority rules**
   - Primary: first valid return-to-home detection.
   - Secondary: if no return, use last meaningful WebTrack event + estimate travel time from last order location (if present) to home.
   - Final fallback: last GPS timestamp; mark as estimated.
6. **Order/message enrichment**
   - Detect stops range/count; last meaningful order; run number(s); pickup/dropoff times if derivable.
   - Ensure no “unknown: None” outputs: use explicit “Ikke fundet i filen” + reasons.
7. **POC output**
   - Emit JSON + human-readable report + Danish correction text draft.
   - Include debug metrics: closest distance to home, confidence flags, why fallback used.
8. **Validation loop (required)**
   - Compare POC results vs expected; adjust thresholds (N/M, dwell minutes, speed cutoff).
   - Add test cases from the same files: e.g., pass-through near home, multiple segments.
9. **Checkpoint**: do not proceed to Phase 2 until POC matches expected outcomes on provided samples.

**Web search (during POC)**
- Best practices for Nominatim usage limits/caching and proper User-Agent.
- Robust timestamp extraction from messy Excel exports and common Danish/European date formats.
- Practical trip segmentation heuristics (debounce/dwell) for GPS sampling noise.

---

### Phase 2 — V1 App Development (Build UI around proven core)
**Goal:** Deliver an internal website that runs the proven engine, visualizes routes/segments, and generates copy-ready Danish correction text.

**User stories (V1)**
1. As a user, I can upload a GPS file and a WebTrack file and immediately see whether both parsed successfully.
2. As a user, I can type my home address and set/adjust the home zone on a map without entering coordinates.
3. As a user, I can choose a radius and see home-zone circle plus entry/exit markers and segments on the route.
4. As a user, I can see computed start/end/total time and a list of segments with timestamps.
5. As a user, I can copy a Danish Movia-ready correction request text and clearly see if any times were estimated and why.

**Steps**
1. **Architecture**
   - Backend API (e.g., FastAPI/Node): file upload, parsing, analysis, response.
   - Frontend (simple React/Vite or similar): upload UI + map + results.
   - Stateless processing (no DB).
2. **Backend endpoints**
   - `POST /analyze`: accepts GPS + WebTrack files + home address/radius + optional map-adjusted lat/lon override.
   - Returns: segments, start/end/total, order summary, debug fields, Danish correction text.
3. **Frontend UI**
   - Step flow: Upload → Home zone setup (address search + map) → Run analysis → Results.
   - Leaflet map: show polyline route, home circle, segment coloring, entry/exit points.
   - Controls: radius slider (200–500), thresholds (optional “Advanced”).
4. **Geocoding integration**
   - Call backend geocode (server-side Nominatim) to avoid client CORS and to standardize.
5. **Error handling UX**
   - File parse errors with line/cell hints.
   - Missing timestamps, empty GPS, no return detected (show fallback + closest distance).
6. **Movia Danish text generator**
   - Deterministic template-like structure (auto-generated), includes:
     - dato, vogn/ID (if present), start/slut, total, antal forløb, run nr., stop interval, rationale + any estimation note.
7. **Security + ops basics**
   - File size limits, PII minimization, no persistence.
   - Internal deployment (single environment) with configuration for Nominatim User-Agent.
8. **End-to-end testing (mandatory)**
   - Run with provided sample files.
   - Validate: multi-segment day, pass-through near home, headerless WebTrack.
   - Fix until stable.

---

### Phase 3 — Hardening + Feature Enhancements (post-V1)
**User stories (Phase 3)**
1. As a user, I can override detected segment boundaries manually if the data is ambiguous.
2. As a user, I can adjust detection sensitivity (consecutive points, dwell time, speed cutoff) and rerun quickly.
3. As a user, I can see a “data quality” score and what’s missing (GPS gaps, sparse sampling, missing order locations).
4. As a user, I can export a PDF summary (route image + segments + correction text).
5. As an admin, I can configure default radius/thresholds per depot/vehicle type.

**Steps**
- Add manual edit tools on map (drag start/end markers) with recomputed totals.
- Improve WebTrack parsers with more patterns from real exports; add a library of regex rules.
- Add automated “quality checks” and recommendations.
- Add export (PDF) and optional case saving (only if requested later).
- Regression test suite with multiple anonymized real files.

---

## 3) Next Actions
1. Receive the **sample GPS** and **sample WebTrack** files.
2. Confirm:
   - timezone (CET/CEST) and whether timestamps are local time,
   - what constitutes a “meaningful dwell” at home (e.g., 5–10 minutes) for return validation.
3. Build and run Phase 1 POC against the samples; review outputs with you and tune thresholds.
4. After POC passes, implement Phase 2 V1 app end-to-end and do one full E2E test pass with the same samples.

---

## 4) Success Criteria
**POC success (Phase 1)**
- Correctly parses both files even when WebTrack has **no headers**.
- Detects **multiple segments** correctly using stable home-zone rules.
- End time follows priority rules and never defaults to last GPS point unless flagged as fallback.
- Produces a Danish Movia-ready correction text with no “unknown: None”; missing fields are explained.

**V1 success (Phase 2)**
- A user can upload files, set home by address/map, run analysis, view map + segments, and copy the correction text in <2 minutes.
- Clear, non-crashing error messages for bad/partial inputs; debug shows closest distance when return missing.
- Results are consistent across reruns with same inputs and documented thresholds.