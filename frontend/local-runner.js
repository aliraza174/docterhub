import http from 'http';
import { parse } from 'url';
import fs from 'fs';
import path from 'path';

// Import handlers dynamically to resolve ES module dependencies
const handlers = {
  auth: (await import('./api/auth.js')).default,
  doctors: (await import('./api/doctors.js')).default,
  appointments: (await import('./api/appointments.js')).default,
  payments: (await import('./api/payments.js')).default,
  admin: (await import('./api/admin.js')).default,
  prescriptions: (await import('./api/prescriptions.js')).default,
};

const server = http.createServer(async (req, res) => {
  // Setup standard CORS headers for local API requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const parsedUrl = parse(req.url, true);
  const pathname = parsedUrl.pathname; // e.g. /api/auth
  const route = pathname.split('/')[2]; // e.g. auth

  const handler = handlers[route];
  if (!handler) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: `Backend endpoint '/api/${route || ''}' not found` }));
    return;
  }

  // Read request body buffer
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    // Populate request properties
    req.query = parsedUrl.query;
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch (e) {
      req.body = {};
    }

    // Mock Express-like response helper methods used in the handlers
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };

    try {
      await handler(req, res);
    } catch (error) {
      console.error('Local Runner execution error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message || 'Internal Server Error' }));
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\x1b[32m[Local Backend] Runner listening on http://localhost:${PORT}\x1b[0m`);
  console.log(`\x1b[36m[Local Backend] Proxy from Vite Dev Server (http://localhost:5173) is active.\x1b[0m`);
});
