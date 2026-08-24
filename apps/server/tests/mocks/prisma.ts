import { jest } from '@jest/globals';

const prisma = {
  user: {
    findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    update: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    create: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  },
  account: {
    findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    update: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    create: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  },
  document: {
    findMany: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    findFirst: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    findUnique: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    create: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    update: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    delete: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  },
  $transaction: jest.fn<(cb: (tx: unknown) => Promise<unknown>) => Promise<unknown>>(),
};

prisma.$transaction.mockImplementation(async (cb) => cb(prisma));

export { prisma };
