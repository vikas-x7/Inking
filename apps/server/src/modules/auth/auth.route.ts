import { Hono } from 'hono';
import type { AppBindings } from '../../shared/types/app.types.js';
import { authController } from './auth.controller.js';

export const authRoutes = new Hono<AppBindings>();

authRoutes.get('/google', (c) => authController.google(c));
authRoutes.get('/google/callback', (c) => authController.googleCallback(c));
authRoutes.get('/github', (c) => authController.github(c));
authRoutes.get('/github/callback', (c) => authController.githubCallback(c));
authRoutes.get('/me', (c) => authController.me(c));
authRoutes.post('/refresh', (c) => authController.refresh(c));
authRoutes.post('/logout', (c) => authController.logout(c));
