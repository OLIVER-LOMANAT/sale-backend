import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import leadRoutes from './routes/lead.route.js';
import visitRoutes from './routes/visit.route.js';
import conversionRoutes from './routes/conversion.route.js';
import assignmentRoutes from './routes/assignment.route.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

app.use('/api/v1', leadRoutes);
app.use('/api/v1', visitRoutes);
app.use('/api/v1', conversionRoutes);
app.use('/api/v1', assignmentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});