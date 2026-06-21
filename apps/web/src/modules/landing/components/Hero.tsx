import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="mt-24 sm:mt-32 lg:mt-40 w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div className="w-full md:max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-[55px] text-[#080808] font-medium tracking-[-2px]">
              The Latex Workspace for Writing <br className="hidden sm:inline" />
              and Editing Documents
            </h1>

            <p className="text-sm sm:text-lg text-black/80 max-w-2xl mt-4 tracking-[-0.5px]">
              Write, preview, and export clean LaTeX documents from one focused editor. Perfect for research papers, assignments, reports, resumes, and technical notes.
            </p>
          </div>

          <div className="flex  w-full md:w-auto">
            <div className="">
              <Link href="/request-demo" className="bg-[#1A1A1A] text-white text-center px-4 py-1.5 block transition-all hover:bg-black/80 rounded-[4px]">
                Start editing
              </Link>
            </div>
          </div>
        </div>

        <div
          className="relative bg-cover bg-center bg-no-repeat  overflow-hidden flex items-center justify-center shadow-lg mt-30 grayscale rounded-[6px]"
          style={{ backgroundImage: 'url(https://i.pinimg.com/1200x/ac/cb/1e/accb1ea727fe034a0044b4272f2b0fc9.jpg)' }}
        >
          <img
            className="max-w-7xl object-contain px-13 py-13 "
            src="https://res.cloudinary.com/dyv9kenuj/image/upload/v1785634196/Screenshot_from_2026-08-02_06-58-30_j2cowk.png"
            alt="Inside preview"
          />
        </div>
      </div>
    </section>
  );
}
