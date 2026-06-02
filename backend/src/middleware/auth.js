import jwt from 'jsonwebtoken';
import { fail } from '../lib/http.js';
import { User } from '../models/User.js';

export function requireAuth() {
  return async (req, res, next) => {
    try {
      const auth = req.headers.authorization || '';
      const [scheme, token] = auth.split(' ');
      if (scheme !== 'Bearer' || !token) return fail(res, 401, 'Missing bearer token');

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).lean();
      if (!user || !user.active) return fail(res, 401, 'Invalid user');

      req.user = { id: String(user._id), email: user.email, name: user.name, role: user.role };
      next();
    } catch {
      return fail(res, 401, 'Unauthorized');
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, 'Unauthorized');
    if (!roles.includes(req.user.role)) return fail(res, 403, 'Forbidden');
    next();
  };
}

