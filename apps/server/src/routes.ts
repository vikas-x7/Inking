import type { Hono } from 'hono';
import { authRoutes } from './modules/auth/auth.route.js';
import { documentsRoutes } from './modules/document/documents.route.js';
import { usersRoutes } from './modules/users/users.route.js';

export const registerRoutes = (app: Hono) => {
  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);
  app.route('/documents', documentsRoutes);
};
