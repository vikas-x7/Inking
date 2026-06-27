'use client';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/src/modules/auth/auth-provider';
import { QueryProvider } from './query-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
