import { prisma } from '../../database/prisma.js';

export const usersRepository = {
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  update(id: string, data: { name?: string; image?: string | null }) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },
};
