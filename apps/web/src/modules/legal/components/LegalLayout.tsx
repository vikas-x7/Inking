'use client';

import React from 'react';
import Link from 'next/link';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col">
      {/* Header / Nav */}
      <header className="w-full border-b border-white/10  py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white hover:opacity-80 transition">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/image/logo.png" alt="Inking Logo" className="h-6 w-6" />
            Inking
          </Link>
          <button
            onClick={() => window.history.back()}
            className="text-[17px] px-4 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto py-16 w-full">
        <div className="mb-12 border-b border-white/10 pb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{title}</h1>
          <p className="text-sm text-white/50">Last updated: {lastUpdated}</p>
        </div>
        <div className="prose prose-invert max-w-none text-white/80 space-y-6 text-sm sm:text-base leading-relaxed">
          {children}
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-white/40 uppercase tracking-widest font-mono">
        © INKING 2026
      </footer>
    </div>
  );
}
