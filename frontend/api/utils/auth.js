import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'doctor_hub_secret_key_2026';

export function verifyAuth(req, res, ...allowedRoles) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return null;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Unauthorized role access' });
      return null;
    }
    return user;
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return null;
  }
}

// Helper to configure CORS headers for Vercel functions
export function setCorsHeaders(req, res) {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
  ].filter(Boolean);

  const origin = req.headers.origin;
  if (!process.env.FRONTEND_URL || (origin && allowedOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}
