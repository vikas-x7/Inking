import { AxiosError } from 'axios';
import { httpClient } from '@/src/shared/api/http-client';

export const compileApi = {
  async compile(text: string): Promise<Blob> {
    try {
      const response = await httpClient.post<Blob>('/compile', { text }, { responseType: 'blob' });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data instanceof Blob) {
        throw new Error((await error.response.data.text()) || 'Compilation failed.');
      }

      throw error;
    }
  },
};
