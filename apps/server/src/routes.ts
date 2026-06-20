import type { Hono } from 'hono';
import { authRoutes } from './modules/auth/auth.route.js';

export const registerRoutes = (app: Hono) => {
  app.route('/auth', authRoutes);
};
