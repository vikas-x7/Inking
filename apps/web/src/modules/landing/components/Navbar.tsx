'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiX, FiGithub, FiArrowUpRight } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const heroHeight = document.getElementById('hero')?.offsetHeight ?? window.innerHeight;
      setScrolled(window.scrollY > heroHeight - 100);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 px-6 py-4 transition-colors duration-300 ${
        scrolled ? 'bg-black/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-8 md:gap-10">
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="image/logo.png"
              alt="Inking Logo"
              className="w-7  "
            />
            <span className="text-xl  font-bold tracking-tight text-white group-hover:opacity-90 transition">
              Inking
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-white/80">
            <Link href="#features" className="hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="/auth" className="hover:text-white transition-colors">
              Get start
            </Link>
            <Link href="#features" className="hover:text-white transition-colors">
              Demo
            </Link>
          </div>
        </div>

        {/* Right Section: Log in & White Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {/* Log in Button (Translucent Pill) */}
          <Link
            href="/auth"
            className="flex items-center gap-1 text-sm font-medium px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/15 transition-all duration-150"
          >
            <span>Log in</span>
          </Link>

          {/* GitHub / Primary Action Button (Solid White Pill) */}
          <a
            href="https://github.com/vikas-x7/Inking"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full bg-white hover:bg-white/90 text-black transition-all duration-150 shadow-sm"
          >
            <FiGithub size={15} />
            <span>GitHub</span>
            <FiArrowUpRight size={14} className="opacity-70" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white/80 hover:text-white focus:outline-none p-2"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden mt-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 px-5 pt-4 pb-6 space-y-4 shadow-2xl">
          <div className="flex flex-col space-y-3 text-sm text-zinc-200">
            <Link
              href="#features"
              className="hover:text-white font-medium"
              onClick={() => setIsOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#faq"
              className="hover:text-white font-medium"
              onClick={() => setIsOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="#"
              className="hover:text-white font-medium"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </Link>
          </div>
          <div className="pt-4 border-t border-white/10 flex flex-col gap-2.5">
            <Link
              href="/auth"
              className="flex items-center justify-center text-sm font-medium py-2 rounded-full bg-white/10 text-white border border-white/15"
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-full bg-white text-black"
              onClick={() => setIsOpen(false)}
            >
              <FiGithub size={16} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
