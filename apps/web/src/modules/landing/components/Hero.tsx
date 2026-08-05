/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';
import { MdArrowOutward } from 'react-icons/md';

export default function Hero() {
  return (
    <section className="w-full bg-[#000000] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden font-sans">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Main Title / Heading */}
        <h1 className="text-4xl sm:text-6xl md:text-6xl font-bold tracking-tight text-white leading-[1.08]">
          Write Better LaTeX Documents
        </h1>

        {/* Description / Subtitle */}
        <p className="text-[#c9c9c9] text-base sm:text-lg md:text-xl font-normal max-w-3xl mt-5 ">
          Write, preview, and export clean LaTeX documents from one focused editor. Perfect for
          research papers, assignments, reports, resumes, and technical notes.
        </p>

        {/* Call to Action Button */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/auth"
            id="cta-primary-btn"
            className="group inline-flex items-center gap-2.5 rounded-xl bg-[#0059FF] hover:bg-[#0055D6] text-white font-medium text-base px-7 py-3 shadow-lg shadow-blue-600/25 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <span>Get started for free</span>
            <MdArrowOutward
              size={20}
              className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </div>

        {/* Product Demo App Window Frame */}
        <div className="mt-14 w-full max-w-6xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
          {/* Background Image */}
          <img
            className="absolute inset-0 w-full h-full object-cover"
            src="https://i.pinimg.com/1200x/b5/a6/1b/b5a61b4a69f43879a2e8b0778f577daa.jpg"
            alt=""
          />

          {/* Foreground App Preview Image */}
          <div className="relative p-2 sm:p-16">
            <img
              className="w-full h-auto rounded-2xl border border-white/10 object-cover shadow-2xl relative z-10"
              src="https://res.cloudinary.com/dyv9kenuj/image/upload/v1785634196/Screenshot_from_2026-08-02_06-58-30_j2cowk.png"
              alt="Inking LaTeX Editor Preview"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
