import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { compileApi } from './api';

export function useCompile() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: compileApi.compile,
    onSuccess: (blob) => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = URL.createObjectURL(blob);
      setPdfUrl(objectUrlRef.current);
    },
  });

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  return { ...mutation, pdfUrl };
}
