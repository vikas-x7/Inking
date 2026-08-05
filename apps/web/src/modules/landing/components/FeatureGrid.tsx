import React from 'react';
import { FiCode, FiEye, FiFileText, FiLayers, FiZap, FiShield } from 'react-icons/fi';

const features = [
  {
    icon: FiCode,
    title: 'Live LaTeX Preview',
    description:
      'See your document render in real-time as you type. No more guessing — every equation, table, and figure appears instantly.',
  },
  {
    icon: FiFileText,
    title: 'Built-in PDF Export',
    description:
      'Export your LaTeX documents to publication-ready PDFs with a single click. Perfect for journals, assignments, and reports.',
  },
  {
    icon: FiLayers,
    title: 'Smart Templates',
    description:
      'Start faster with curated templates for research papers, theses, resumes, presentations, and more. Customize anything.',
  },
  {
    icon: FiZap,
    title: 'Auto-Complete & Snippets',
    description:
      'Intelligent auto-complete for LaTeX commands, environments, and math symbols. Write faster with smart snippets.',
  },
  {
    icon: FiEye,
    title: 'Split Editor View',
    description:
      'Work on your LaTeX source and see the live preview side by side. The perfect workflow for focused writing.',
  },
  {
    icon: FiShield,
    title: 'Cloud-Saved Projects',
    description:
      'Your documents are automatically saved and synced across devices. Pick up exactly where you left off, anytime.',
  },
];

export default function FeatureGrid() {
  return (
    <section className="w-full bg-[#000000] text-white pt-6 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-[#171615]  rounded-[5px] p-6 sm:p-7 flex flex-col items-start text-left "
              >
                <div className="w-11 h-11 rounded-full bg-[#1b1b1c] flex items-center justify-center mb-5 text-white shadow-inner">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-semibold text-base sm:text-[17px] tracking-tight mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed font-normal">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
