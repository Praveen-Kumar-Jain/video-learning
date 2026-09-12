import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import videoRoutes from './routes/video.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import reportRoutes from './routes/report.routes.js';
import userRoutes from './routes/user.routes.js';

export function createApp(clientUrl = 'http://localhost:5173') {
  const app = express();
  app.use(cors({ origin: clientUrl }));
  app.use(express.json());
  app.use(morgan('dev'));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/users', userRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
