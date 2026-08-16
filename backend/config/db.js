const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using the URI from .env.
 * Kept in its own module (not inline in server.js) so any part of the
 * app can trigger a connection and so this is easy to mock in tests later.
 */
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Exit the process - there's no point running the server without a DB
    process.exit(1);
  }
}

module.exports = connectDB;