# Mangrove Guard - QA Testing Log

## 1. Purpose

This document records the testing performed for the Mangrove Guard
water-quality monitoring and alert system.

The testing focuses on:
- Sensor reading submission
- Safe-range validation
- Automatic alert generation
- Alert retrieval
- Alert status updates
- Unread alert count
- Frontend alert display
- SMS notification availability

---

## 2. Test Environment

| Item | Details |
|---|---|
| Project | Mangrove Guard |
| Backend | Node.js / Express |
| Database | MongoDB |
| Frontend | React |
| API Port | 5000 (from `.env` `PORT`) |
| Testing Type | Functional / Integration / QA |

---

## 3. Test Cases

### TC-001: Normal Sensor Reading

**Test:** POST a sensor reading to `/api/readings` where all parameters (pH, temperature, salinity, dissolved_o2) are within the site's configured thresholds.

**Expected Result:**
- Reading is stored successfully.
- No alert is generated.

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-002: pH Below Minimum

**Test:** Send a sensor reading where `pH` is below the site's configured `thresholds.pH.min`.

**Expected Result:**
- Reading is stored.
- A pH alert is created via `generateAlerts`.
- `threshold_breached` = `min`, `measured_value` matches the sent value.
- `status` starts as `unread`.
- A `new_alert` event is emitted over Socket.IO.

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-003: Temperature Above Maximum

**Test:** Send a reading where `temperature` exceeds `thresholds.temperature.max`.

**Expected Result:**
- Reading is stored.
- Temperature alert is generated with `threshold_breached` = `max`.
- `severity_level` matches the deviation (see severity table below).

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-004: Salinity Out of Range

**Test:** Send a `salinity` value outside `thresholds.salinity`.

**Expected Result:**
- Reading is stored.
- Salinity alert is generated with correct threshold info.

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-005: Dissolved Oxygen Out of Range

**Test:** Send a `dissolved_o2` value outside `thresholds.dissolved_o2`.

**Expected Result:**
- Reading is stored.
- Alert generated with correct severity per the deviation thresholds
  (>10% = medium, >20% = high, >30% = critical, else low).

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-006: Retrieve Alerts

**Test:** `GET /api/alerts` (authenticated).

**Expected Result:**
- Returns `{ success, count, total, page, pages, data }`.
- Each alert includes populated `device` (with nested `site`) and `reading`.
- Supports `status`, `severity`, `site`, `page`, `limit` query params.

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-007: Update Alert Status

**Test:** `PUT /api/alerts/:id/status` with body `{ "status": "read" }`.

**Expected Result:**
- Alert status changes to `read`.
- Response includes the updated alert.
- Invalid status values return `400`.

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-008: Resolve Alert

**Test:** `PUT /api/alerts/:id/status` with body `{ "status": "resolved" }`.

**Expected Result:**
- Alert status becomes `resolved`.

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-009: Mark All Alerts as Read

**Test:** `PUT /api/alerts/markallread`.

**Expected Result:**
- All alerts with `status: unread` become `read`.
- Response includes `modifiedCount`.

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-010: Unread Alert Count

**Test:** `GET /api/alerts/unread-count`.

**Expected Result:**
- Returns `{ success: true, count: <number of unread alerts> }`.

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-011: Frontend Alert Display

**Test:** Open the Alerts/Admin Alerts page after generating an abnormal reading.

**Expected Result:**
- Generated alert appears on the website.
- Parameter, severity, value and status are displayed.

**Actual Result:** To be recorded after testing.
**Status:** Pending
**Bug/Issue:** None identified yet.

---

### TC-012: SMS Alert

**Test:** Generate an alert and check whether an SMS notification is sent.

**Expected Result:**
- `sendAlertSMS(message)` is called from `sensorreadingController.js`.
- If a provider (Twilio) is configured via env vars, an SMS is sent and
  the function returns `{ success: true, skipped: false }`.
- If not configured, it returns `{ success: false, skipped: true }` and
  logs the message to console instead of failing.

**Actual Result:**
- `services/smsService.js` was missing, causing `MODULE_NOT_FOUND` and a
  full server crash on startup. This has been fixed by adding the file
  and wiring the `sendAlertSMS(message)` call back into
  `generateAlerts()` (see BUG-001). SMS provider (Twilio) itself is
  **not** configured, so SMS sending is currently in "skipped/logged"
  dev mode, not actually delivering texts.

**Status:** Partially passed (server no longer crashes, SMS call fires correctly and skips gracefully; real SMS delivery via Twilio not yet verified — needs Twilio credentials to test end-to-end)
**Bug/Issue:** See BUG-001.

---

## 4. Bug / Issue Log

| Bug ID | Description | Severity | Status | Fix |
|---|---|---|---|---|
| BUG-001 | `services/smsService.js` did not exist, so `sensorreadingController.js` crashed the entire backend on startup (`MODULE_NOT_FOUND`) | High | Fixed | Added `server/services/smsService.js` exporting `sendAlertSMS(message)`, returning `{ success, skipped }`. Falls back to logging when no SMS provider is configured, matching the existing `sendEmail.js` fallback pattern. |
| BUG-002 | `threshold_breached`, `threshold_value`, and `recipients` were commented out in `Alert.create(...)` inside `generateAlerts()`, and were missing from the `Alert` schema entirely — so a stored alert didn't record which threshold (min/max) was breached, its value, or who it was addressed to. | Medium | Fixed | Added the three fields back to `models/Alert.js` and un-commented them in `sensorreadingController.js`'s `Alert.create(...)` call. |
| BUG-003 | `getStats()` in `sensorreadingController.js` used `mongoose.Types.ObjectId(...)` but `mongoose` was never `require`d in that file — would throw `ReferenceError: mongoose is not defined` on any call to `GET /api/readings/stats?device=...` | Medium | Fixed | Added `const mongoose = require('mongoose');` to the top of `sensorreadingController.js`. |
| BUG-004 | `getAlert()` in `alertController.js` calls `.populate('recipients', 'name email')`, but `recipients` wasn't a field on the `Alert` schema — Mongoose throws a `StrictPopulateError` on any `GET /api/alerts/:id` call. | Medium | Fixed | Resolved as a side effect of BUG-002 (restoring `recipients` to the schema). |

---

## 5. Testing Summary

| Category | Tests | Passed | Failed | Pending |
|---|---:|---:|---:|---:|
| Sensor readings | 5 | 0 | 0 | 5 |
| Alert API | 4 | 0 | 0 | 4 |
| Frontend | 1 | 0 | 0 | 1 |
| SMS | 1 | 0 (partial) | 0 | 1 |

Results will be updated as tests are executed.

---

## 6. Notes

Testing should be performed using both normal and deliberately
out-of-range sensor readings.

Out-of-range readings should confirm that alert generation, database
storage, API retrieval and website display all work correctly end to
end. Do not mark a test "Passed" until it has actually been run and the
result recorded above.