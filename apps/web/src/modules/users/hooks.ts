import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './api';

export const usersKeys = {
  me: ['users', 'me'] as const,
};

export function useMe() {
  return useQuery({
    queryKey: usersKeys.me,
    queryFn: usersApi.me,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(usersKeys.me, { user });
    },
  });
}
