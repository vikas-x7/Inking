'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiX, FiGithub, FiChevronDown } from 'react-icons/fi';
import { RxBorderSplit } from 'react-icons/rx';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-1">
            <RxBorderSplit size={19} className="text-[#0f0f0f]" />
            <Link href="/" className="text-xl font-bold tracking-tight text-black/80 mt-0.5 flex items-center gap-1">
              Inking
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center gap-6 lg:gap-10 text-[14px] font-medium text-black/90">
              <div className="flex items-center gap-1 cursor-pointer hover:text-black transition">Editor</div>
              <div className="flex items-center gap-1 cursor-pointer hover:text-black transition">
                Templates <FiChevronDown size={14} />
              </div>
              <div className="flex items-center gap-1 cursor-pointer hover:text-black transition">
                Docs <FiChevronDown size={14} />
              </div>
              <Link href="/pricing" className="hover:text-black transition">
                Pricing
              </Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 lg:gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-2 rounded-[3px] hover:bg-gray-100 transition">
              <FiGithub size={14} />
              <span>GitHub</span>
            </a>

            <Link href="/auth" className="text-sm  text-black bg-[#d8d8d8] px-4 py-1.5  hover:bg-black/80 transition rounded-[3px] ">
              Sing up
            </Link>
          </div>

          <div className="flex md:hidden items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-black focus:outline-none p-2 ">
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-3 text-sm text-gray-700">
            <span className="cursor-pointer font-medium">Editor</span>
            <span className="cursor-pointer font-medium">Templates</span>
            <span className="cursor-pointer font-medium">Docs</span>
            <Link href="/pricing" className="font-medium">
              Pricing
            </Link>
          </div>
          <div className="pt-4 border-t border-gray-100 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Open source</span>
              <a href="https://github.com" className="flex items-center gap-1 text-xs font-medium bg-gray-50 border px-2 py-1 rounded">
                <FiGithub size={14} /> GitHub
              </a>
            </div>
            <Link href="/login" className="text-center text-sm font-medium py-2 border rounded-md">
              Log in
            </Link>
            <Link href="/contact" className="text-center text-sm font-medium py-2 border border-gray-300 rounded-md">
              Browse templates
            </Link>
            <Link href="/auth" className="text-center text-sm font-medium text-white bg-black py-2 rounded-md">
              Start writing
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
