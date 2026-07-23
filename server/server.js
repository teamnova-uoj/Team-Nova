const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// Socket connection handler
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Core middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
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
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/users',   require('./routes/user'));
app.use('/api/sites',   require('./routes/site'));
app.use('/api/devices', require('./routes/device'));
app.use('/api/readings',require('./routes/sensorreading'));
app.use('/api/alerts',  require('./routes/alert'));

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
server.listen(PORT, () => {
  console.log(`🌿 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io ready`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});