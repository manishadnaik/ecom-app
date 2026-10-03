import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { globalLimiter } from './middlewares/rate-limit.js';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();
// Needed when behind proxy (nginx / K8s ingress) so rate-limit sees real client IP.
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());
app.use(globalLimiter);

// Mount API routes at /api
app.use('/api/v1', routes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler Triggered:', err);

  // Catch Sequelize Validation Errors (e.g., NOT NULL violations, unique constraints)
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      status: "error",
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  // Catch other general database connection/query issues
  if (err.name.startsWith('Sequelize')) {
    return res.status(500).json({
      status: "error",
      message: "A database error occurred processing your request.",
      error: err.message
    });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status: 'error',
      error: 'Request body must be valid JSON',
      field: 'body',
    });
  }
  // Generic fallback for unhandled exceptions
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

export default app;

