import { Hono } from 'hono';
import { compileController } from './compile.controller.js';

export const compileRoutes = new Hono();

compileRoutes.get('/', (c) => compileController.compileFromQuery(c));
compileRoutes.post('/', (c) => compileController.compileFromBody(c));
