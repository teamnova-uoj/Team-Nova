# Mangrove Guard - Backend Documentation

## 1. Overview

The `server` directory contains the backend of the Mangrove Guard
application.

The backend is responsible for:
- Receiving sensor readings
- Storing readings in MongoDB
- Checking sensor values against configured thresholds
- Generating alerts
- Retrieving alerts
- Updating alert status
- Sending real-time updates to the frontend via Socket.IO
- Providing data to the React frontend

---

## 2. Backend Structure

```text
server/
├── config/
│   └── db.js
├── controllers/
│   ├── alertController.js
│   ├── authController.js
│   ├── deviceController.js
│   ├── messageController.js
│   ├── sensorreadingController.js
│   ├── siteController.js
│   └── userController.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── models/
│   ├── Alert.js
│   ├── Device.js
│   ├── Message.js
│   ├── SensorReading.js
│   ├── Site.js
│   └── User.js
├── routes/
│   ├── alert.js
│   ├── auth.js
│   ├── device.js
│   ├── message.js
│   ├── sensorreading.js
│   ├── site.js
│   └── user.js
├── services/
│   └── smsService.js
├── utils/
│   └── sendEmail.js
├── server.js
├── seed.js
├── .env
└── package.json
```

---

## 3. Sensor Reading Flow

```text
Sensor
   |
   v
Radio Link
   |
   v
Base Station
   |
   v
WiFi / Internet
   |
   v
Backend API  (POST /api/readings)
   |
   v
sensorreadingController.js
   |
   v
Threshold Checking (against Site.thresholds)
   |
   +------------------+
   |                  |
Normal             Out of Range
   |                  |
   v                  v
Store Reading     generateAlerts()
                      |
                      +--> Alert saved to MongoDB
                      +--> Socket.IO 'new_alert' event
                      +--> sendAlertSMS() (services/smsService.js)
                      |
                      v
                  Alert API (/api/alerts)
                      |
                      v
                  React Website
```

---

## 4. Sensor Reading Controller

File: `controllers/sensorreadingController.js`

Receives sensor readings from devices. A reading contains:

- `pH`
- `temperature`
- `salinity`
- `dissolved_o2`

The controller stores the reading, then calls `generateAlerts()`, which
checks each parameter against the thresholds configured on the
reading's `Site` and creates an `Alert` document for any breach.

---

## 5. Alert Generation

When a sensor value goes outside its configured safe range, the backend
creates an alert recording:

- `reading` (ref to SensorReading)
- `device`
- `parameter_name`
- `severity_level`
- `measured_value`
- `threshold_breached` (`min` or `max`)
- `threshold_value`
- `message`
- `recipients` (all admin users at time of creation)
- `status` (starts as `unread`)

Severity is based on how far the value deviates from the threshold:

| Deviation | Severity |
|---|---|
| > 30% | critical |
| > 20% | high |
| > 10% | medium |
| ≤ 10% | low |

Example:

```text
Parameter: pH
Measured value: 4.2
Threshold: 6.5
Threshold breached: min
Severity: high
Status: unread
```

---

## 6. Alert Status

Alerts can have three statuses: `unread`, `read`, `resolved`.

- **unread** — a newly generated alert starts here.
- **read** — the alert has been viewed/acknowledged.
- **resolved** — the underlying issue has been resolved.

---

## 7. Alert API

All routes below require authentication (`protect` middleware).

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/alerts` | List alerts (filterable by `status`, `severity`, `site`; paginated) |
| GET | `/api/alerts/:id` | Get one alert |
| GET | `/api/alerts/unread-count` | Get number of unread alerts |
| PUT | `/api/alerts/:id/status` | Update one alert's status |
| PUT | `/api/alerts/markallread` | Mark all unread alerts as read |

See `routes/alert.js` and `controllers/alertController.js` for exact
implementation.

---

## 8. SMS Notification

`sensorreadingController.js` calls `sendAlertSMS(message)` from
`services/smsService.js` whenever an alert is generated.

Behavior:

- If Twilio env vars are configured (`TWILIO_ACCOUNT_SID`,
  `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `SMS_ALERT_RECIPIENTS`), the
  alert message is sent via Twilio to each recipient number and the
  function returns `{ success: true, skipped: false }`.
- If not configured, the SMS is skipped: the message is logged to the
  console instead, and the function returns
  `{ success: false, skipped: true }`. This mirrors the fallback used
  by `utils/sendEmail.js` for the password-reset flow, so the server
  never crashes just because a provider isn't set up locally.

**Do not commit SMS API keys, passwords or other secrets to GitHub.**
Add them to `.env` only, which is already gitignored.

---

## 9. QA Testing

QA testing should include both normal and abnormal readings.

### Normal reading

All sensor values are within their configured safe ranges.

```text
Reading stored
No alert generated
```

### Abnormal reading

At least one parameter is outside its configured range.

```text
Reading stored
        |
        v
Threshold breached
        |
        v
Alert generated
        |
        v
Alert stored in MongoDB
        |
        v
Alert visible through API
        |
        v
Alert displayed on website
```

---

## 10. Testing Procedure

1. Start the MongoDB connection (`MONGO_URI` in `.env`).
2. From `server/`, run `npm run dev`.
3. Confirm the console shows `MongoDB Connected: ...` and
   `🌿 Server running on port 5000` with no crash.
4. Send a normal sensor reading to `POST /api/readings`.
5. Confirm the reading is stored (check MongoDB or a GET endpoint).
6. Send an out-of-range sensor reading.
7. Check whether an alert is generated (`GET /api/alerts`).
8. Check the alert in the database/API response.
9. Check the alert appears on the frontend.
10. Change the alert status via `PUT /api/alerts/:id/status`.
11. Verify the unread count via `GET /api/alerts/unread-count`.
12. Record the result in `docs/QA_Testing_Log.md`.

---

## 11. Running the Backend

From the `server` directory:

```bash
npm install
npm run dev
```

The development server uses the configuration defined in `.env`
(`MONGO_URI`, `PORT`, `JWT_SECRET`, email config, etc.).

Health check: `GET http://localhost:<PORT>/` returns
`{ success: true, message: "Mangrove Monitor API is running", timestamp }`
with no database or auth required — useful as a first smoke test.

---

## 12. QA Documentation

All testing results should be recorded in `docs/QA_Testing_Log.md`.

Each test case there records:

- Test ID
- Test description
- Expected result
- Actual result
- Status
- Bug/Issue

This provides a record of the backend and alert testing performed.