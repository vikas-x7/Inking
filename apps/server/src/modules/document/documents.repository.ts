import { prisma } from '../../database/prisma.js';

export const documentsRepository = {
  listByUser(userId: string) {
    return prisma.document.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.document.findUnique({
      where: { id },
    });
  },

  create(userId: string, data: { title: string; content: string; description?: string | null }) {
    return prisma.document.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        description: data.description,
      },
    });
  },

  update(
    id: string,
    data: {
      title?: string;
      content?: string;
      description?: string | null;
      isArchived?: boolean;
      lastOpenedAt?: Date;
    },
  ) {
    return prisma.document.update({
      where: { id },
      data,
    });
  },

  delete(id: string) {
    return prisma.document.delete({
      where: { id },
    });
  },
};
