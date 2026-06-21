import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="w-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="mt-24 sm:mt-32 lg:mt-30 w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div className="w-full md:max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-[55px] text-[#080808] font-medium tracking-[-2px]">
              The Latex Workspace for Writing <br className="hidden sm:inline" />
              and Editing Documents
            </h1>

            <p className="text-sm sm:text-lg text-black/80 max-w-2xl mt-4 ">
              Write, preview, and export clean LaTeX documents from one focused editor. Perfect for research papers, assignments, reports, resumes, and technical notes.
            </p>
            <div className="mt-4 flex gap-4">
              <button>
                <Link href="/auth" className="text-black text-center px-4 py-1.5 block transition-all hover:bg-black/80 rounded-[3px] bg-[#d8d8d8]">
                  See how works
                </Link>
              </button>
              <button>
                <Link href="/auth" className="text-black/90 text-center px-4 py-1.5 block transition-all hover:bg-black/80 rounded-[3px] bg-[#d8d8d8]">
                  Start editing
                </Link>
              </button>
            </div>
          </div>

          <div className="flex  w-full md:w-auto">
            <div className=""></div>
          </div>
        </div>

        <div
          className="relative bg-cover bg-center bg-no-repeat mt-20  overflow-hidden flex items-center justify-center shadow-lg mt-0 rounded-[6px] opacity-80"
          style={{ backgroundImage: 'url(https://i.pinimg.com/736x/8c/71/7e/8c717ee9f2f499fd2c94da2b3c34c2af.jpg)' }}
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
