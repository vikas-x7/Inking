'use client';

import { useState } from 'react';

const faqs1 = [
  {
    question: 'What is Inking?',
    answer:
      'Inking is a modern LaTeX editor with live preview and built-in PDF export. Write research papers, theses, resumes, and technical documents in a clean, focused environment without any local setup.',
  },
  {
    question: 'Do I need to install LaTeX on my computer?',
    answer:
      'No. Inking runs entirely in your browser. There is no need to install TeX Live, MiKTeX, or any other LaTeX distribution. Just open the editor and start writing.',
  },
  {
    question: 'Is Inking free to use?',
    answer:
      'Yes, Inking offers a generous free tier for individuals. You can create, edit, and export LaTeX documents without paying anything. Premium plans are available for teams and power users.',
  },
  {
    question: 'Can I export my documents as PDF?',
    answer:
      'Absolutely. Inking compiles your LaTeX source into a publication-ready PDF. You can download it instantly or share a link with collaborators.',
  },
  {
    question: 'What LaTeX packages are supported?',
    answer:
      'Inking supports a wide range of popular LaTeX packages including AMS math, babel, hyperref, graphicx, tikz, and many more. The editor handles compilation so you do not have to worry about local package management.',
  },
];

const faqs2 = [
  {
    question: 'How does live preview work?',
    answer:
      'As you type your LaTeX source, Inking continuously compiles your document in the background and updates the preview in real-time. You see your formatted output instantly without clicking any buttons.',
  },
  {
    question: 'Can I collaborate with others?',
    answer:
      'Yes. You can share your Inking projects with teammates or classmates. Everyone can view and edit the document together, making group projects and peer review effortless.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Your documents are encrypted and stored securely in the cloud. We never use your content for training or advertising. You have full control over your data and can delete it anytime.',
  },
  {
    question: 'Does Inking support math equations?',
    answer:
      'Yes. Full support for inline and display math environments, AMS packages, and equation numbering. The live preview renders complex mathematical notation accurately.',
  },
  {
    question: 'Can I use Inking for my thesis or research paper?',
    answer:
      'Inking is designed for exactly that. Use it for dissertations, journal papers, conference submissions, technical reports, or any document that requires LaTeX formatting.',
  },
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<string | null>(null);

  return (
    <section id="faq" className="bg-black text-white py-14 lg:py-20 scroll-mt-24">
      <div className="max-w-6xl mx-auto ">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-medium  md:text-5xl tracking-[-0.2px]">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-sm text-white/50 md:text-base">Everything to know about Inking</p>
        </div>

        {/* Grid container responsive layout balanced */}
        <div className="w-full gap-8 md:grid md:grid-cols-2">
          {/* Left Column */}
          <div className="flex w-full flex-col gap-3">
            {faqs1.map((f, i) => {
              const id = `1-${i}`;
              const isOpen = activeIndex === id;
              return (
                <div key={i} className="w-full">
                  <button
                    onClick={() => setActiveIndex(isOpen ? null : id)}
                    className="flex w-full items-center justify-between rounded-[4px] border border-white/[0.03] bg-[#0b0b0b] px-5 py-4 text-left transition-colors hover:bg-[#121212]"
                  >
                    <span className="pr-4 text-sm leading-6 font-medium sm:text-[15px] md:text-[16px]">
                      {f.question}
                    </span>
                    <span
                      className={`shrink-0 text-xl text-white/60 transition-transform duration-300 ${
                        isOpen ? 'rotate-45 text-white' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'mt-1 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden rounded-[4px] border border-white/[0.02] bg-[#0b0b0b]">
                      <p className="px-5 py-4 text-[13px] leading-relaxed text-white/60 md:text-[14px]">
                        {f.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="mt-3 flex w-full flex-col gap-3 md:mt-0">
            {faqs2.map((f, i) => {
              const id = `2-${i}`;
              const isOpen = activeIndex === id;
              return (
                <div key={i} className="w-full">
                  <button
                    onClick={() => setActiveIndex(isOpen ? null : id)}
                    className="flex w-full items-center justify-between rounded-[4px] border border-white/[0.03] bg-[#0b0b0b] px-5 py-4 text-left transition-colors hover:bg-[#121212]"
                  >
                    <span className="pr-4 text-sm leading-6 font-medium sm:text-[15px] md:text-[16px]">
                      {f.question}
                    </span>
                    <span
                      className={`shrink-0 text-xl text-white/60 transition-transform duration-300 ${
                        isOpen ? 'rotate-45 text-white' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'mt-1 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden rounded-[4px] border border-white/[0.02] bg-[#0b0b0b]">
                      <p className="px-5 py-4 text-[13px] leading-relaxed text-white/60 md:text-[14px]">
                        {f.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
