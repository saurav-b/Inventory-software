import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { asyncHandler, fail, ok } from '../lib/http.js';
import { User } from '../models/User.js';

const router = express.Router();

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6)
    });
    const body = schema.safeParse(req.body);
    if (!body.success) return fail(res, 400, 'Invalid input', body.error.flatten());

    const user = await User.findOne({ email: body.data.email.toLowerCase() });
    if (!user || !user.active) return fail(res, 401, 'Invalid credentials');

    const okPass = await bcrypt.compare(body.data.password, user.passwordHash);
    if (!okPass) return fail(res, 401, 'Invalid credentials');

    const token = jwt.sign(
      { sub: String(user._id), role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return ok(res, {
      token,
      user: { id: String(user._id), email: user.email, name: user.name, role: user.role }
    });
  })
);

export default router;

