import app from './app.js';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import sequelize from './config/database.js';

// Load environment variables from .env file
dotenv.config();

// Determine the port to listen on
const PORT = process.env.PORT || 3000;

async function startServer() {
  const connected = await testConnection();
  if (!connected) {
    console.log('Database connection failed. Server not started.');
    process.exit(1);
  }
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  // Graceful shutdown: finish in-flight requests, close DB pool, then exit.
  // What K8s SIGTERM expects. Uses Process API (no business logic here).
  const shutdown = async (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try { await sequelize.close(); } catch { /* ignore */ }
      process.exit(0);
    });
    // Force exit if hanging (e.g. long query) after 10s
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();