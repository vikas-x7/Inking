import { Hono } from 'hono';
import type { AppBindings } from '../../shared/types/app.types.js';
import { authGuard } from '../auth/guards/auth.guard.js';
import { usersController } from './users.controller.js';

export const usersRoutes = new Hono<AppBindings>();

usersRoutes.get('/me', authGuard, (c) => usersController.me(c));
usersRoutes.patch('/me', authGuard, (c) => usersController.updateMe(c));
