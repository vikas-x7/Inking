import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 bg-black px-6 text-center font-sans text-white">
      <p className="text-7xl font-bold tracking-tight">404</p>
      <p className="text-sm text-white/50">This page could not be found.</p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-white/90"
      >
        Go home
      </Link>
    </div>
  );
}