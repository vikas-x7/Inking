import React from 'react';

export default function Workflow() {
  return (
    <section className="w-full text-black py-16 px-4 sm:px-6 lg:px-12 font-sans selection:bg-red-500 selection:text-white mt-30">
      <div className="max-w-7xl mx-auto flex flex-col h-[160vh]">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 pt-2 mb-30">
          <div className="space-y-1 flex-1 min-w-[130px]">
            <div className="text-[15px] font-mono tracking-wider text-gray-500">1</div>
            <div className="text-lg font-bold uppercase">DISCOMFORT</div>
            <p className="text-[14px] text-gray-600 leading-relaxed font-normal">
              Practice healthy discomfort. Learn <br /> to lean into your stress, not resist it.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-6 w-full lg:w-8/12">
            <div className="space-y-1 flex-1 min-w-[200px]">
              <div className="text-[15px] font-mono tracking-wider text-gray-500">2</div>
              <div className="text-lg font-bold uppercase">CEREBRAL</div>
              <p className="text-[14x] text-gray-600 leading-relaxed font-normal">Stop being so cerebral. Do things with your hands. Cook, clean, go outside.</p>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <div className="text-[15px] font-mono tracking-wider text-gray-500">3</div>
              <div className="text-lg font-bold  uppercase">DECEPTIONS</div>
              <p className="text-[14px] text-gray-600 leading-relaxed font-normal">You are not a freak. You&apos;ve got to learn not to be intimidated by your mind.</p>
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <div className="text-[15px] font-mono tracking-wider text-gray-500">4</div>
              <div className="text-lg font-semibold tracking-[-0.5px] uppercase">TRAJECTORY</div>
              <p className="text-[14px] text-gray-600 leading-relaxed font-normal">Stop gauging how bad things are in life by how much you panic.</p>
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="w-full ">
            <h2 className="text-3xl sm:text-4xl lg:text-3xl font-medium tracking-[-0.5px]">
              From draft to PDF
              <br />
              keep every edit <br />
              in flow
            </h2>
          </div>
          <div className="flex justify-start lg:justify-end gap-2 overflow-x-auto pb-2 w-full">
            <div className="w-36 h-36 bg-black overflow-hidden flex-shrink-0 relative">
              <img
                src="https://i.pinimg.com/736x/67/ed/c6/67edc698d0e54d442ee3344839f7c217.jpg"
                alt="Document preview crop 1"
                className="absolute w-[250%] h-[250%] max-w-none object-cover grayscale contrast-125 opacity-90 -top-[125%] -left-[40%]"
              />
            </div>
            <div className="w-36 h-36 bg-black overflow-hidden flex-shrink-0 relative">
              <img
                src="https://i.pinimg.com/736x/67/ed/c6/67edc698d0e54d442ee3344839f7c217.jpg"
                alt="Document preview crop 2"
                className="absolute w-[250%] h-[250%] max-w-none object-cover grayscale contrast-125 opacity-90 top-[5%] -left-[35%]"
              />
            </div>
            <div className="w-36 h-36 bg-black overflow-hidden flex-shrink-0 relative">
              <img
                src="https://i.pinimg.com/736x/67/ed/c6/67edc698d0e54d442ee3344839f7c217.jpg"
                alt="Document preview crop 3"
                className="absolute w-[220%] h-[220%] max-w-none object-cover grayscale contrast-125 opacity-90 -top-[40%] -left-[10%]"
              />
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="flex flex-col lg:flex-row justify-between items-end  my-16 lg:my-24">
          <div className="w-full flex justify-start lg:justify-end">
            <h1 className="text-7xl sm:text-9xl lg:text-[13rem] font-bold tracking-tighter text-black leading-none select-none">Inking</h1>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-6 pt-6 border-t border-gray-300/60 text-xs text-gray-700">
          <div className="flex-1">
            <p className="font-medium text-black">LaTeX Workspace</p>
            <p className="text-gray-600">Writing, previewing, and exporting documents seamlessly.</p>
          </div>

          <div className="flex-1 font-mono text-[11px] text-gray-500">
            <div>VERSION 1.0.0</div>
            <div>2026©All rights reserved</div>
          </div>

          <div className="flex-1 font-mono text-[11px] text-gray-500 sm:text-right">
            <div>PDF EXPORT</div>
            <div>TEMPLATE READY</div>
          </div>
        </div>
      </div>
    </section>
  );
}
