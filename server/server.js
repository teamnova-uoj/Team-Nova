const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { startWatchdog } = require('./services/watchdogService');

const app = express();
const server = http.createServer(app);

// Enable trust proxy in production for reverse proxies (Nginx, Cloudflare, Heroku, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Lightweight in-memory rate limiter
const createRateLimiter = (windowMs, maxRequests, message) => {
  const requests = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of requests.entries()) {
      if (now - entry.startTime > windowMs) {
        requests.delete(ip);
      }
    }
  }, 300000);

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = requests.get(ip);

    if (!entry || now - entry.startTime > windowMs) {
      entry = { startTime: now, count: 1 };
      requests.set(ip, entry);
      return next();
    }

    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later.'
      });
    }

    next();
  };
};

const authLimiter = createRateLimiter(15 * 60 * 1000, 30, 'Too many login attempts, please try again after 15 minutes.');
const ingestLimiter = createRateLimiter(60 * 1000, 300, 'Ingest rate limit exceeded.');

app.use('/api/auth/login', authLimiter);
app.use('/api/readings', ingestLimiter);

// CLIENT_URL may carry a path (https://host/mangrove-guard); CORS compares
// against the browser's Origin header, which never does.
const allowedOrigins = ['http://localhost:3000', process.env.CLIENT_URL]
  .filter(Boolean)
  .map((url) => {
    try { return new URL(url).origin; } catch { return url; }
  });

// Socket.io setup. Served under /api so it shares the API's proxy/ingress route.
const io = new Server(server, {
  path: '/api/socket.io',
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// Connect to MongoDB and start watchdog
connectDB().then(async () => {
  try {
    const Alert = require('./models/Alert');
    await Alert.deleteMany({ $or: [{ type: 'system_offline' }, { device: null }] });
  } catch (err) {}
  startWatchdog(io);
});

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Core middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Mangrove Monitor API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/sites', require('./routes/site'));
app.use('/api/devices', require('./routes/device'));
app.use('/api/sensors', require('./routes/sensor'));
app.use('/api/parameters', require('./routes/parameter'));
app.use('/api/readings', require('./routes/sensorreading'));
app.use('/api/alerts', require('./routes/alert'));
app.use('/api/messages', require('./routes/message'));
app.use('/api/search', require('./routes/search'));
app.use('/api/change-requests', require('./routes/changeRequest'));

// 404 handler — catches any route that doesn't match above
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler — must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '::';

server.listen(PORT, HOST, () => {
  console.log(`🌿 Server running on port ${PORT} (host: ${HOST})`);
  console.log(`🔌 Socket.io ready`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
