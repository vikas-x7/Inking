import type { Context } from 'hono';
import { updateMeSchema } from './users.schema.js';
import { usersService } from './users.service.js';

export const usersController = {
  async me(c: Context) {
    const user = await usersService.getCurrentUser(c.get('userId'));

    return c.json({ user });
  },

  async updateMe(c: Context) {
    const body = updateMeSchema.parse(await c.req.json());
    const user = await usersService.updateCurrentUser(c.get('userId'), body);

    return c.json({ user });
  },
};
