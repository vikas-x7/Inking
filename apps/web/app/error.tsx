'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 bg-black px-6 font-sans text-white">
      <Image src="/image/logo.png" alt="Inking Logo" width={52} height={52} className="h-13 w-13" />
      <div className="text-center">
        <p className="text-2xl font-semibold">Something went wrong</p>
        <p className="mt-2 text-sm text-white/50">An unexpected error occurred while loading this page.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-white/90 cursor-pointer"
        >
          Try again
        </button>
     
      </div>
    </div>
  );
}