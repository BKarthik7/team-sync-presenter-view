import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import classRoutes from './routes/class';
import teamRoutes from './routes/team';
import evaluationFormRoutes from './routes/evaluationForm';
import evaluationRoutes from './routes/evaluation';
import presentationsRoutes from './routes/presentations';
import { corsMiddleware } from './config/cors';

dotenv.config();

const app = express();

// Update Middleware
app.use(corsMiddleware);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/evaluation-forms', evaluationFormRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/presentations', presentationsRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/team-sync')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

export default app;