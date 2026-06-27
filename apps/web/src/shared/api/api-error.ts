import { AxiosError } from 'axios';

export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'error' in data) {
      return (data as { error: string }).error;
    }
    if (typeof data === 'string' && data) return data;
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
};
