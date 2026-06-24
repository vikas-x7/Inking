import { Hono } from 'hono';
import type { AppBindings } from '../../shared/types/app.types.js';
import { authGuard } from '../auth/guards/auth.guard.js';
import { documentsController } from './documents.controller.js';

export const documentsRoutes = new Hono<AppBindings>();

documentsRoutes.use('*', authGuard);

documentsRoutes.get('/', (c) => documentsController.list(c));
documentsRoutes.get('/:documentId', (c) => documentsController.get(c));
documentsRoutes.post('/', (c) => documentsController.create(c));
documentsRoutes.patch('/:documentId', (c) => documentsController.update(c));
documentsRoutes.delete('/:documentId', (c) => documentsController.remove(c));
