import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './lib/db.js';

import leadRoutes from './routes/lead.route.js';
import visitRoutes from './routes/visit.route.js';
import conversionRoutes from './routes/conversion.route.js';
import assignmentRoutes from './routes/assignment.route.js';
import uploadRoutes from "./routes/upload.route.js";

dotenv.config();

const app = express();

// CORS Configuration 
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);  
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests
// app.options('*', cors());

// Parse JSON
app.use(express.json());

// uploaded files served statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use('/api/v1', leadRoutes);
app.use('/api/v1', visitRoutes);
app.use('/api/v1', conversionRoutes);
app.use('/api/v1', assignmentRoutes);
app.use("/api/v1", uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => { 
    console.log(`Server running on port ${PORT}`);
  });
});