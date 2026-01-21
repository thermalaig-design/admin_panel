import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';

import { errorHandler, notFound } from './middleware/errorHandler.js';
import adminRoutes from './routes/adminRoutes.js';
import sponsorsRoutes from './routes/sponsorsRoutes.js';

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.BACKEND_PORT || 5002;

// --------------------
// MIDDLEWARE
// --------------------



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Handle favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --------------------
// HEALTH CHECK ROUTES
// --------------------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hospital Management Admin API running 🚀',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      admin: '/api/admin'
    }
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Hospital Management Admin API',
    version: '1.0.0',
    endpoints: {
      admin: '/api/admin'
    }
  });
});

// --------------------
// API ROUTES
// --------------------
console.log('Registering admin routes...');
app.use('/api/admin', adminRoutes); // Admin routes
console.log('Registering sponsors routes...');
app.use('/api/sponsors', sponsorsRoutes); // Sponsors routes
console.log('All routes registered');

// --------------------
// ERROR HANDLING
// --------------------
app.use(notFound);
app.use(errorHandler);

// --------------------
// START SERVER
// --------------------
app.listen(PORT, () => {
  console.log('🚀 Server is running on port', PORT);
  console.log(`📍 Local API URL: http://localhost:${PORT}`);
  console.log(`📍 API endpoints available at: http://localhost:${PORT}/api/admin`);
});