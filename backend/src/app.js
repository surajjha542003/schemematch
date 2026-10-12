/**
 * SCHEME FINDER BACKEND — Express App
 *
 * Architecture:
 *   app.js      — Express instance, middleware, routes
 *   server.js   — HTTP server start (imports app.js)
 */

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

// Routes (Stage 2)
const authRoutes      = require('./routes/auth.routes');
const schemesRoutes   = require('./routes/schemes.routes');
const userRoutes      = require('./routes/user.routes');
const profileRoutes   = require('./routes/profile.routes');
const ingestionRoutes = require('./routes/ingestion.routes');
const chatRoutes      = require('./routes/chat.routes');

// Middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security & parsing middleware ──
app.use(helmet());
const allowedOrigins=(process.env.ALLOWED_ORIGIN || (process.env.NODE_ENV==='production'?'':'http://localhost:3000')).split(',').map(value=>value.trim()).filter(Boolean);
app.use(cors({origin(origin,callback){
  callback(null,!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*'));
}}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', stage: 1, timestamp: new Date().toISOString() });
});

// ── API routes (Stage 2) ──
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/schemes',   schemesRoutes);
app.use('/api/v1/user',      userRoutes);
app.use('/api/v1/profile',   profileRoutes);
app.use('/api/v1/ingestion', ingestionRoutes);
app.use('/api/v1/chat',      chatRoutes);

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──
app.use(errorHandler);

module.exports = app;
