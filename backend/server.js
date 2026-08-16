require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const healthRoutes = require('./routes/health.routes');
const phoneRoutes = require('./routes/phone.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB before anything else
connectDB();

// Middleware
app.use(cors()); // allows the React frontend (different port) to call this API later
app.use(express.json()); // parses JSON request bodies

// Routes
app.use('/health', healthRoutes);
app.use('/api/phones', phoneRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});