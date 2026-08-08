/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';
import { MdArrowOutward } from 'react-icons/md';

export default function Hero() {
  return (
    <section id="hero" className="relative w-full text-white bg-black overflow-hidden font-sans">
      {/* ── Background Video ── */}
      <div className="absolute inset-0 z-0">
    

        <img src="https://images.unsplash.com/photo-1707380657552-25fbec5e2b1a?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="" className="w-full h-full object-cover" />
      </div>


      {/* ── Black Gradient Overlay (Bottom to Top) ── */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none" />

      {/* ── Foreground Content ── */}
      <div className="relative z-10 w-full px-6 pt-40 pb-20">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center text-center">
          {/* Main Title / Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-6xl text-white font-semibold">
            Write Better LaTeX Documents
          </h1>

          {/* Description / Subtitle */}
          <p className="text-[#e5e5e5] text-base sm:text-lg md:text-[15px]  max-w-3xl mt-5 font-semibold tracking-[0.3px]">
            Write, preview, and export clean LaTeX documents from one focused editor. Perfect for
            research papers, assignments, reports, resumes, and technical notes.
          </p>

          {/* Call to Action Button */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/auth"
              id="cta-primary-btn"
              className="group inline-flex items-center gap-2.5 rounded-3xl font-semibold bg-white text-black text-base px-7 py-3 "
            >
              <span>Get started free</span>
              <MdArrowOutward
                size={20}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>

          {/* Product Demo App Window Frame */}
          <div className="mt-14 w-full shadow-2xl overflow-hidden relative ">
            {/* Foreground App Preview Image */}
            <div className="relative ">
              <img
                className="w-full h-auto object-cover shadow-2xl relative z-10"
                src="image/demoimage.png"
                alt="Inking LaTeX Editor Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
