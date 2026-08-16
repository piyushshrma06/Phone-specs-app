const mongoose = require('mongoose');

/**
 * Returns server status AND MongoDB connection status.
 * This is more useful than a bare "ok" - if Mongo silently drops later,
 * this endpoint will tell you immediately instead of you finding out
 * when a real request fails.
 */
function getHealth(req, res) {
  const dbState = mongoose.connection.readyState;
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = dbState === 1 ? 'connected' : 'not connected';

  res.status(200).json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { getHealth };