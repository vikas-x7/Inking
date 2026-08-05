'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiX, FiGithub } from 'react-icons/fi';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full bg-[#000000] sticky top-0 z-50 ">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between h-16 items-center">
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <img src="image/inkinglogo.png" alt="" className="w-10 rounded-[5px]" />
            <Link
              href="/"
              className="text-[24px] font-semibold tracking-tight text-white hover:opacity-90 transition ml-[-13px]"
            >
              Inking
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-7 text-[14px] font-normal text-[#d5d3d3]">
            <Link href="/editor" className="hover:text-white transition-colors">
              Editor
            </Link>
            <Link href="/dashboard/templates" className="hover:text-white transition-colors">
              Templates
            </Link>
            <Link href="#faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Contact
            </Link>
          </div>

          {/* Right Action: GitHub Pill Button */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-[6px] bg-[#18181b] hover:bg-[#27272a] text-white  shadow-sm transition-all duration-150"
            >
              <FiGithub size={14} />
              <span>GitHub</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-white focus:outline-none p-2"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-[#0A0908] border-b border-white/10 px-4 pt-3 pb-6 space-y-4">
          <div className="flex flex-col space-y-3 text-sm text-zinc-300">
            <Link href="/editor" className="hover:text-white font-medium">
              Editor
            </Link>
            <Link href="/dashboard/templates" className="hover:text-white font-medium">
              Templates
            </Link>
            <Link href="#faq" className="hover:text-white font-medium">
              FAQ
            </Link>
            <Link href="#" className="hover:text-white font-medium">
              Contact
            </Link>
          </div>
          <div className="pt-4 border-t border-white/10 flex flex-col space-y-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-full bg-[#18181b] text-white border border-white/10"
            >
              <FiGithub size={14} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
