'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface TextBlockProps {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  descClass?: string;
  cta: string;
  href: string;
}

function TextBlock({ eyebrow, title, description, descClass, cta, href }: TextBlockProps) {
  return (
    <div className="max-w-md">
      <span className="text-gray-400 text-sm sm:text-base font-normal block mb-2">{eyebrow}</span>
      <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold  text-white ">{title}</h2>
      <p
        className={`text-white/50 text-sm sm:text-base font-normal mt-4 leading-relaxed ${descClass ?? 'max-w-sm'}`}
      >
        {description}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm font-normal mt-8 group cursor-pointer"
      >
        <span>{cta}</span>
        <span className="transition-transform duration-200 group-hover:translate-x-1">&gt;</span>
      </Link>
    </div>
  );
}

function WorkspaceCard() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-white rounded-[24px] p-7 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] w-full max-w-[340px] aspect-square flex flex-col justify-between relative transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
    >
      <div>
        <h3 className="text-gray-900 font-semibold text-xl sm:text-[22px] tracking-tight leading-snug">
          Research Paper.tex
        </h3>
        <p className="text-[#8E8E93] text-sm font-normal mt-1">Updated Jul 20</p>
      </div>

      <div
        className={`absolute top-[48%] right-[32%] transition-transform duration-300 ${
          hovered ? 'translate-x-1 translate-y-1 scale-110' : ''
        }`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="drop-shadow-sm">
          <path
            d="M3 3L10.07 19.97L13.58 13.58L19.97 10.07L3 3Z"
            fill="black"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="space-y-2.5 pt-4">
        <div className="flex items-center gap-3 text-gray-900 text-sm sm:text-[15px] font-medium">
          <svg
            className="w-5 h-5 text-gray-800"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span>102 Packages</span>
        </div>

        <div className="flex items-center gap-3 text-gray-900 text-sm sm:text-[15px] font-medium">
          <div className="w-5 h-5 rounded-[4px] border-[1.8px] border-gray-800 flex items-center justify-center">
            <span className="text-[12px] font-bold leading-none select-none text-gray-800">*</span>
          </div>
          <span>25 Equations</span>
        </div>
      </div>
    </div>
  );
}

function AssistantCard() {
  const [hovered, setHovered] = useState(false);
  const [queryInput, setQueryInput] = useState('\\begin{equation}');

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-white rounded-[24px] p-7 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] w-full max-w-[340px] aspect-square flex flex-col justify-between relative transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
    >
      <div>
        <input
          type="text"
          placeholder="Enter LaTeX command..."
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          className="w-full text-gray-800 placeholder:text-gray-400 text-base sm:text-lg font-mono bg-transparent border-none outline-none p-0 focus:ring-0"
        />
      </div>

      <div className="border-[1.5px] border-dashed border-gray-300 rounded-[14px] p-4 sm:p-5 relative flex items-center justify-center my-3 bg-gray-50/40 min-h-[96px] overflow-visible">
        <div className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 bg-white">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>

        <div className="absolute right-3 -bottom-3 flex items-end">
          <div className="relative w-12 h-14 bg-gray-200 rounded-lg shadow-sm border border-gray-300/80 flex items-end justify-center overflow-hidden">
            <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-gray-300 rounded-bl-[3px]" />
            <div className="absolute top-0 right-0 border-t-[7px] border-r-[7px] border-t-white border-r-white" />
          </div>

          <div className="-ml-5 mb-2 relative z-10">
            <span className="bg-[#0052EA] text-white text-[11px] font-bold px-2.5 py-1 rounded-[6px] shadow-sm tracking-wider inline-block">
              .TEX
            </span>
          </div>

          <div
            className={`absolute -right-2 -bottom-2 z-20 transition-transform duration-300 ${
              hovered ? 'translate-x-1 translate-y-1 scale-110' : ''
            }`}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
              <path
                d="M3 3L10.07 19.97L13.58 13.58L19.97 10.07L3 3Z"
                fill="black"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div>
        <button
          type="button"
          className="w-full bg-[#0052EA] hover:bg-[#003DC2] text-white font-medium text-base py-3.5 px-5 rounded-[12px] text-center transition-colors shadow-sm cursor-pointer"
        >
          Compile Document
        </button>
      </div>
    </div>
  );
}

interface Section {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  descClass?: string;
  cta: string;
  href: string;
  visualBg: string;
  rootClass: string;
  Visual: React.ComponentType;
  reverse?: boolean;
}

const sections: Section[] = [
  {
    eyebrow: 'Workspace',
    title: 'Structured LaTeX Workspaces',
    description:
      'Upload, store, and organize thousands of LaTeX papers, bib files, and assets with auto-saved cloud syncing.',
    cta: 'Explore Workspaces',
    href: '/auth',
    visualBg: 'bg-[#D9D3E3]',
    rootClass: 'min-h-[460px] lg:min-h-[220px]',
    Visual: WorkspaceCard,
  },
  {
    eyebrow: 'Assistant',
    title: 'Tailored for Academics',
    description:
      'Delegate complex TeX formatting, matrix equations, and bibliography citations to your focused LaTeX editor.',
    cta: 'Explore Assistant',
    href: '/auth',
    visualBg: 'bg-[#E5DCDD]',
    rootClass: 'min-h-[460px] lg:min-h-[520px]',
    Visual: AssistantCard,
    reverse: true,
  },
];

export default function FeatureShowcase() {
  return (
    <section className="w-full bg-black text-white font-sans overflow-hidden my-50">
      <div className="w-6xl mx-auto space-y-20">
        {sections.map(
          (
            {
              eyebrow,
              title,
              description,
              descClass,
              cta,
              href,
              visualBg,
              rootClass,
              Visual,
              reverse,
            },
            i,
          ) => (
            <div key={i} className={`grid grid-cols-1 lg:grid-cols-2 ${rootClass} w-full`}>
              <div
                className={`${visualBg} p-8 sm:p-12 md:p-16 flex items-center justify-center relative overflow-hidden ${reverse ? 'order-1 lg:order-2' : ''}`}
              >
                <Visual />
              </div>
              <div
                className={`bg-[#141414] p-8 sm:p-12 md:p-16 flex flex-col justify-center text-white ${reverse ? 'order-2 lg:order-1' : ''}`}
              >
                <TextBlock
                  eyebrow={eyebrow}
                  title={title}
                  description={description}
                  descClass={descClass}
                  cta={cta}
                  href={href}
                />
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
