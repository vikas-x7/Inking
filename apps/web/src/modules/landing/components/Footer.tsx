'use client';

import React from 'react';
import Link from 'next/link';
import { FaGithub } from 'react-icons/fa6';

const Footer = () => {
  return (
    <footer className="w-full overflow-hidden border-t border-white/10 bg-black pt-16 pb-0 text-white font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 md:gap-12 mb-16">
          {/* BRAND HEADER (LEFT START) */}
          <div className="space-y-3 col-span-2">
            <div className='flex items-center gap-2'>

            <img src="image/logo.png" alt="" className='w-6' />
            <h2 className="text-2xl font-semibold text-white tracking-tight">Inking</h2>
            </div>
            <p className="text-base text-white/70 leading-relaxed max-w-xs">
              A modern LaTeX editor with live preview and PDF export. Write, compile, and share.
            </p>
          </div>


  <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              SOCIAL
            </h3>
            <ul className="flex flex-col space-y-3 text-base text-white/80 font-normal">
              <li>
                <a
                  href="https://github.com/vikas-x7/Inking"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <FaGithub className="text-base text-white" />
                  <span>GitHub</span>
                </a>
              </li>
           
            </ul>
          </div>
          {/* PRODUCT */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              PRODUCT
            </h3>
            <ul className="flex flex-col space-y-3 text-base text-white/80 font-normal">
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                See Demo
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-white transition-colors">
                 Faq
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-white transition-colors">
                  Get started
                </Link>
              </li>
            </ul>
          </div>

          {/* RESOURCES */}
      

          {/* SOCIAL */}
        

          {/* THE BORING BUT NECESSARY */}
          <div className="space-y-4 col-span-2 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
              THE BORING BUT NECESSARY
            </h3>
            <ul className="flex flex-col space-y-3 text-base text-white/80 font-normal">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/terms-of-use" className="hover:text-white transition-colors">
                  Website Terms of Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex items-center justify-between text-xs  tracking-widest text-white/30 uppercase">
        
          <span>© INKING 2026</span>
        </div>

        <div className="w-full overflow-hidden flex items-center justify-center pt-10 sm:pt-14 select-none pointer-events-none -mb-2 sm:-mb-6">
          <h1 className="text-[18vw] font-bold tracking-tighter bg-gradient-to-t from-black via-[#161616] to-[#3a3a3a] bg-clip-text text-transparent leading-[0.8] text-center uppercase translate-y-[8%]">
            INKING
          </h1>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

