import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { compileApi, CompileError, extractLatexLogError, type CompileErrorInfo } from './api';

/**
 * Resolves an error thrown by the compile API into user-facing info.
 * Structured errors pass through; plain-text LaTeX logs get their error
 * blocks extracted so the actual error message is visible.
 */
export const resolveCompileError = (error: unknown): CompileErrorInfo | null => {
  if (error instanceof CompileError) {
    if (error.info) return error.info;
    const extracted = extractLatexLogError(error.message);
    if (extracted) {
      return {
        type: 'latex_error',
        message: extracted.text,
        file: null,
        line: extracted.line,
        column: null,
        raw: error.message,
      };
    }
    return {
      type: 'unknown',
      message: error.message || 'Compilation failed.',
      file: null,
      line: null,
      column: null,
    };
  }
  return null;
};

export function useCompile() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const reset = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPdfUrl(null);
  };

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

  return { ...mutation, pdfUrl, reset };
}
