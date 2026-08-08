/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import Link from 'next/link';
import {
  FiZap,
  FiCode,
  FiCheckCircle,
  FiLayers,
  FiArrowRight,
  FiCpu,
  FiShield,
} from 'react-icons/fi';

export default function EditorShowcase() {


  return (
    <section className="w-full bg-black text-white py-20 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ── LEFT SIDE: Layered Image Stack (BG Image + FG Overlay Image) ── */}
          <div className="lg:col-span-6 relative group">
            {/* Background Decorative Glow */}
    

            {/* Main Outer Container */}
            <div className="relative rounded-2xl bg-neutral-900/90 p-3 sm:p-4 shadow-2xl overflow-hidden">
              
              {/* 1. BACKGROUND IMAGE (BG Image) */}
              <div className="relative w-full h-[320px] sm:h-[420px] md:h-[460px] rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
                  alt="Editor Background Texture"
                  className="w-full h-full object-cover filter brightness-[0.4] contrast-125 scale-105 transition-transform duration-700 ease-out group-hover:scale-100"
                />

                {/* Subtle Grid Gradient Overlay */}
                
                {/* 2. FOREGROUND IMAGE (FG Image - Floating / Overlay Card) */}
                <div className="absolute ">
                  {/* Window Bar Header */}
                

                  {/* FG Main Screenshot */}
                  <img
                    src="https://res.cloudinary.com/dyv9kenuj/image/upload/v1785634196/Screenshot_from_2026-08-02_06-58-30_j2cowk.png"
                    alt="Inking LaTeX Editor Workspace"
                    className="w-full h-[calc(100%-2rem)] object-cover object-top"
                  />
                </div>

           

           

              </div>
            </div>
          </div>

          {/* ── RIGHT SIDE: Project Details & High Quality Explanation ── */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6">
            
     

            {/* Main Section Heading */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.15]">
              Powerful LaTeX Editing, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Without the Friction.
              </span>
            </h2>

            {/* High level explanation */}
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
              Inking is engineered specifically for researchers, academics, and students who demand publication-quality documents. Write LaTeX side-by-side with instantaneous rendering, smart autocompletion, and zero-configuration export.
            </p>

          

      

            {/* Call to Action Link / Button */}
            <div className="pt-2">
              <Link
                href="/auth"
                className="group inline-flex items-center gap-3 rounded-full bg-white text-black font-semibold text-sm px-6 py-3 transition-all duration-200 hover:bg-slate-200 shadow-lg shadow-white/5"
              >
                <span>Try Inking Editor Now</span>
                <FiArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
