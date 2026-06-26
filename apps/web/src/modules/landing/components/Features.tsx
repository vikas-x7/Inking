import React from 'react';
import { FiPlus, FiCircle, FiCheck, FiSquare } from 'react-icons/fi';

export default function Features() {
  return (
    <section className="w-full text-black py-14 sm:py-20 px-4 sm:px-6 lg:px-12 font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 sm:mb-16 gap-5 sm:gap-8">
          <div>
            <h2 className="text-4xl sm:text-6xl tracking-normal font-semibold">Feature</h2>
          </div>

          <div className="max-w-2xl lg:text-right">
            <p className="text-base sm:text-[19px] text-black/80 tracking-normal leading-relaxed">
              Inking makes LaTeX easier to understand and faster to use by keeping writing, preview,
              error checking, templates, and PDF export in one simple workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-4">
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 text-[17px] font-medium text-black/80 tracking-normal">
              <li className="flex items-center gap-3">
                <span className="text-base text-black font-bold">
                  <FiPlus size={17} />
                </span>{' '}
                Live Preview
              </li>
              <li className="flex items-center gap-3">
                <span className="text-sm text-black">
                  <FiCircle size={17} />
                </span>{' '}
                Clean Formatting
              </li>
              <li className="flex items-center gap-3">
                <span className="text-sm text-black">
                  <FiCheck size={17} />
                </span>{' '}
                Error Checking
              </li>
              <li className="flex items-center gap-3">
                <span className="text-sm text-black">
                  <FiSquare size={17} />
                </span>{' '}
                PDF Export
              </li>
            </ul>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between min-h-52 sm:min-h-72">
              <div className="text-4xl sm:text-5xl font-normal tracking-normal text-black">
                105+
              </div>
              <p className="text-sm text-black/90 font-normal leading-relaxed">
                Ready-to-use templates for papers, reports, resumes, and assignments
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between min-h-52 sm:min-h-72">
              <div className="text-4xl sm:text-5xl font-normal tracking-normal text-black">92%</div>
              <p className="text-sm text-black/90 font-normal leading-relaxed">
                Faster writing flow with source and preview kept side by side
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col justify-between min-h-52 sm:min-h-72">
              <div className="text-4xl sm:text-5xl font-normal tracking-normal text-black">1M+</div>
              <p className="text-sm text-black/90 font-normal leading-relaxed">
                Export-ready PDF output for submission, sharing, and printing
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
