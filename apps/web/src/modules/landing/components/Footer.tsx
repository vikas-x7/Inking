'use client';

import React from 'react';
import Link from 'next/link';
import { FaXTwitter, FaLinkedinIn, FaGithub } from 'react-icons/fa6';

const Footer = () => {
  return (
    <footer className="w-full overflow-hidden border-t border-white/10 bg-black pt-12 text-white md:pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid */}
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand & Socials Section */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2 select-none">
              <h1 className="text-[24px]  md:text-[32px]">Inking</h1>
            </div>

            <p className="text-sm text-white/50">
              A modern LaTeX editor with live preview and
              <br />
              PDF export. Write, compile, and share.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-white/10 text-white/50 transition-all hover:bg-white/5 hover:text-white"
              >
                <FaGithub size={14} />
              </Link>
              <Link
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-white/10 text-white/50 transition-all hover:bg-white/5 hover:text-white"
              >
                <FaXTwitter size={14} />
              </Link>
              <Link
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-white/10 text-white/50 transition-all hover:bg-white/5 hover:text-white"
              >
                <FaLinkedinIn size={14} />
              </Link>
            </div>
          </div>

          {/* Product Section */}
          <div className="space-y-4">
            <h3 className="text-sm text-white">Product</h3>
            <ul className="flex flex-col gap-3 text-[13px] md:text-sm">
              <li>
                <Link href="/auth" className="text-white/50 transition-colors hover:text-white">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/50 transition-colors hover:text-white">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div className="space-y-4">
            <h3 className="text-sm text-white">Company</h3>
            <ul className="flex flex-col gap-3 text-[13px] md:text-sm">
              <li>
                <Link href="#" className="text-white/50 transition-colors hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/50 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/50 transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-white/50 transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Line */}
        <div className="flex flex-col items-center justify-between border-t border-white/5 py-6 text-[12px] text-white/30 md:flex-row">
          <p>&copy; 2026 Inking. All rights reserved.</p>
          <p>Designed and built with LaTeX.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
