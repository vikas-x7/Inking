import type { Hono } from 'hono';
import type { AppBindings } from './shared/types/app.types.js';
import { authRoutes } from './modules/auth/auth.route.js';
import { compileRoutes } from './modules/compile/compile.route.js';
import { documentsRoutes } from './modules/document/documents.route.js';
import { usersRoutes } from './modules/users/users.route.js';

export const registerRoutes = (app: Hono<AppBindings>) => {
  app.route('/auth', authRoutes);
  app.route('/users', usersRoutes);
  app.route('/documents', documentsRoutes);
  app.route('/compile', compileRoutes);
};
