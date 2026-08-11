import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authApi } from '../api';
import { useAuth } from './use-auth';

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      router.push('/');
    },
  });
}
