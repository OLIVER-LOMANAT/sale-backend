import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';  // Add this import
import { connectDB } from './lib/db.js';
import leadRoutes from './routes/lead.route.js';
import visitRoutes from './routes/visit.route.js';
import conversionRoutes from './routes/conversion.route.js';
import assignmentRoutes from './routes/assignment.route.js';
import uploadRoutes from "./routes/upload.route.js";

dotenv.config();

const app = express();

// ── CORS — 
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

// This makes files in the 'uploads' folder accessible at /uploads/...
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use('/api/v1', leadRoutes);
app.use('/api/v1', visitRoutes);
app.use('/api/v1', conversionRoutes);
app.use('/api/v1', assignmentRoutes);

app.use("/api/v1", uploadRoutes);

// Health check — Render pings this to verify service is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});