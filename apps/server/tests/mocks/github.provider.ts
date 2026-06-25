import { jest } from '@jest/globals';

export const githubProvider = {
  createAuthorization: jest.fn(),
  validateCallback: jest.fn<() => Promise<unknown>>(),
};
