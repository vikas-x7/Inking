import { httpClient } from '@/src/shared/api/http-client';
import type { User } from '@/src/shared/api/types';
import { API_URL } from '@/src/shared/config/env';

export const authApi = {
  me: async () => (await httpClient.get<{ user: User }>('/auth/me')).data,

  logout: async () => (await httpClient.post('/auth/logout')).data as { success: boolean },

  googleUrl: `${API_URL}/auth/google`,
  githubUrl: `${API_URL}/auth/github`,
};
