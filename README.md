# Team Nova
We developed this project using MERN stack

## System Data Flow

```text
Sensor
 ↓
Radio Link
 ↓
Base Station
 ↓
WiFi
 ↓
Backend API
 ↓
MongoDB
 ↓
Alert/Reading Processing
 ↓
React Website
```

A sensor reading is transmitted over a radio link to a base station,
which forwards it over WiFi to the backend API. The backend stores the
reading in MongoDB, checks it against the site's configured thresholds,
and generates an alert (with a real-time Socket.IO update and an SMS
notification attempt) whenever a value is out of range. Alerts and
readings are then served to the React frontend through the REST API.

See `server/README.md` for backend-specific documentation and
`docs/QA_Testing_Log.md` for QA testing records.