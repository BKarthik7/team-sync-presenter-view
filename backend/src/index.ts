import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Pusher from 'pusher';
import authRoutes from './routes/auth';
import classRoutes from './routes/class';
import teamRoutes from './routes/team';
import evaluationRoutes from './routes/evaluation';
import projectRoutes from './routes/projects';
import presentationsRoutes from './routes/presentations';
import evaluationFormRoutes from './routes/evaluationForm';
import { corsMiddleware } from './config/cors';

dotenv.config();

const app = express();

// Update Middleware
app.use(corsMiddleware);
app.use(express.json());

// Pusher configuration
let pusher: Pusher | null = null;
if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER) {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true
  });
} else {
  console.warn('Pusher credentials not found. Real-time updates will be disabled.');
}

export { pusher };

// Add root route before other routes
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.get('/', (req, res) => {
  res.send(`Welcome to the Team Sync Presenter View Backend API at ${BASE_URL}`);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/presentations', presentationsRoutes);
app.use('/api/evaluation-forms', evaluationFormRoutes);

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/team-sync';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if we can't connect to MongoDB
  });

app.listen(PORT, () => {
  console.log(`Server is running at ${BASE_URL}`);
});

// Update export for Vercel
export default app;