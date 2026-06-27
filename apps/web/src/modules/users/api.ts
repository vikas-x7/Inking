import { httpClient } from '@/src/shared/api/http-client';
import type { User } from '@/src/shared/api/types';

export interface UpdateMeInput {
  name?: string;
  image?: string | null;
}

export const usersApi = {
  me: async () => (await httpClient.get<{ user: User }>('/users/me')).data,

  updateMe: async (input: UpdateMeInput) =>
    (await httpClient.patch<{ user: User }>('/users/me', input)).data,
};
