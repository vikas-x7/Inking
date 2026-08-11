'use client';

import React from 'react';
import Link from 'next/link';
import { MdArrowOutward } from 'react-icons/md';

const CtaSection = () => {
  return (
    <section className="w-full bg-black py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-4xl mx-auto relative">
        <div className="relative  backdrop-blur-sm px-8 py-16 sm:px-16 sm:py-20 text-center overflow-hidden">
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-5">
            Start writing better <span>LaTeX</span> today
          </h2>
          <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            Join thousands of researchers, students, and engineers writing cleaner documents faster.
            No setup, no friction.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth"
              id="cta-primary-btn"
              className="group inline-flex items-center gap-2.5 rounded-3xl  text-black bg-white font-medium text-base px-7 py-3 "
            >
              <span>Get started for free</span>
              <MdArrowOutward
                size={20}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
