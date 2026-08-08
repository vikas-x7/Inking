'use client';
import React from 'react';
import Link from 'next/link';

interface ResourceCardItem {
  id: string;
  title: string;
  category: string;
  image: string;
  href?: string;
}

const defaultCards: ResourceCardItem[] = [
  {
    id: '1',
    title: 'Live LaTeX Preview',
    category:
      'See your document render in real-time as you typeevery equation, table, and figure appears instantly.',
    image:
      'https://i.pinimg.com/736x/cd/63/c7/cd63c743a3ed6a81b887fd19367ec26f.jpg',
    href: '#',
  },
  {
    id: '2',
    title: 'Built-in PDF Export',
    category:
      'Export your LaTeX documents to publication-ready PDFs with a single click  perfect for journals, assignments, and reports.',
    image:
      'https://i.pinimg.com/1200x/2e/ac/e6/2eace612c81c2b90c6bd6741df301d73.jpg',
    href: '#',
  },
  {
    id: '3',
    title: 'Cloud-Saved Projects',
    category:
      'Your documents are automatically saved and synced across devices  pick up exactly where you left off, anytime.',
    image:
      'https://i.pinimg.com/736x/a1/f2/25/a1f225616fd79ab42113751ba430ddb1.jpg',
    href: '#',
  },
];

export default function WhyInking() {
  return (
    <section className="w-full bg-black text-white py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-12 text-left">
          <h2 className="text-3xl sm:text-4xl md:text-4xl text-white  font-semibold ">
            One editor <br />
            Every document handled 
          </h2>
          <p className="text-white/50 text-base sm:text-lg mt-4 max-w-2xl leading-relaxed">
            Everything you need to write, preview, and publish clean LaTeX  live
            rendering, one click PDF export, and auto-saved cloud projects in a
            single focused editor.
          </p>
        </div>

        {/* ── Resource Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {defaultCards.map((card) => (
            <Link key={card.id} href={card.href || '#'} className="group block text-left">
              <div className="w-full aspect-square overflow-hidden rounded-[2px] bg-neutral-900 shadow-lg">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              <div className="mt-4">
                <h3 className="text-white font-semibold text-base sm:text-lg  group-hover:text-slate-200 transition">
                  {card.title}
                </h3>
                <p className="text-white/50 text-xs sm:text-sm font-normal mt-1">
                  {card.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}