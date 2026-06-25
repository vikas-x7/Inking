import { jest } from '@jest/globals';

export const googleProvider = {
  createAuthorization: jest.fn(),
  validateCallback: jest.fn<() => Promise<unknown>>(),
};
