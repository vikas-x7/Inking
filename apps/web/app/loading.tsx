import Image from 'next/image';

export default function Loading() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 bg-black font-sans text-white">
      <Image src="/image/logo.png" alt="Inking Logo" width={52} height={52} className="h-13 w-13" />
      <div className="loader" />
    </div>
  );
}