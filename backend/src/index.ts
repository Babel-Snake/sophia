import dotenv from 'dotenv';
import app from './app';
import { initDb } from './db/connection';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.APP_PORT || '3000', 10);

async function start() {
  try {
    // Initialize database connection
    await initDb();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`TZ: ${process.env.TZ || 'UTC'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
