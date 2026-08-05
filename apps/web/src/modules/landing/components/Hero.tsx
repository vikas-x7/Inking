/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';
import { MdArrowOutward } from 'react-icons/md';

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen text-white overflow-hidden font-sans">
      {/* ── Background Video ── */}
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
          <source src="https://www.pexels.com/download/video/35345172/" type="video/mp4" />
        </video>
      </div>

      {/* ── Foreground Content ── */}
      <div className="relative z-10 pb-50 mt-70">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Main Title / Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-6xl text-white font-semibold">
            Write Better LaTeX Documents
          </h1>

          {/* Description / Subtitle */}
          <p className="text-[#e5e5e5] text-base sm:text-lg md:text-[15px]  max-w-3xl mt-5 font-semibold">
            Write, preview, and export clean LaTeX documents from one focused editor. Perfect for
            research papers, assignments, reports, resumes, and technical notes.
          </p>

          {/* Call to Action Button */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/auth"
              id="cta-primary-btn"
              className="group inline-flex items-center gap-2.5 rounded-3xl bg-white text-black font-medium text-base px-7 py-3 shadow-lg shadow-blue-600/25 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            >
              <span>Get started for free</span>
              <MdArrowOutward
                size={20}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>

          {/* Product Demo App Window Frame */}
          <div className="mt-14 w-full max-w-6xl  border border-white/10 shadow-2xl overflow-hidden relative">
            {/* Foreground App Preview Image */}
            <div className="relative ">
              <img
                className="w-full h-auto  border border-white/10 object-cover shadow-2xl relative z-10"
                src="https://res.cloudinary.com/dyv9kenuj/image/upload/v1785634196/Screenshot_from_2026-08-02_06-58-30_j2cowk.png"
                alt="Inking LaTeX Editor Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
