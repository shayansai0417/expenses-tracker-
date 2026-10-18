import express, { Application } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export const createApp = (): Application => {
  const app = express();

  // Explicit CORS configuration for frontend development port
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173'
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (such as mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Root welcome route
  app.get('/', (_req, res) => {
    res.json({
      message: 'Expense Tracker API is running',
      endpoints: {
        auth: '/api/auth',
        expenses: '/api/expenses',
        stats: '/api/expenses/stats'
      }
    });
  });

  // Mount API routes
  app.use('/api', apiRoutes);

  // 404 handler for unrecognized routes
  app.use(notFoundHandler);

  // Global centralized error handling middleware
  app.use(errorHandler);

  return app;
};

export const app = createApp();

