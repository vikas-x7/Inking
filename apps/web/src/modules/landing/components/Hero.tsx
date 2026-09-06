import Image from 'next/image';
import Link from 'next/link';
import { MdArrowOutward } from 'react-icons/md';

export default function Hero() {
  return (
    <section id="hero" className="relative w-full text-white bg-black overflow-hidden font-sans  ">
      <div className="relative z-10 w-full px-4 sm:px-6 pt-40 pb-20">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center text-start md:text-center  ">
          <h1 className="text-4xl sm:text-6xl md:text-6xl text-white font-semibold">
            Write Better Latex Documents
          </h1>
          <p className="text-[#e5e5e5] text-base sm:text-lg md:text-[15px]  max-w-3xl mt-5 md:font-medium tracking-[0.3px]">
            Write, preview, and export clean LaTeX documents from one focused editor. Perfect for
            research papers, assignments, reports, resumes, and technical notes.
          </p>
          <div className="mt-8 flex w-full flex-col items-start gap-3 md:w-auto md:items-center">
            <Link
              href="/auth"
              id="cta-primary-btn"
              className="group inline-flex items-center gap-2.5 rounded-3xl md:font-semibold tracking-[0.5px] bg-white text-black text-[15px] md:text-base px-4 py-1 md:px-7 md:py-3 "
            >
              <span>Get started free</span>
              <MdArrowOutward
                size={20}
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>

          <div id="demo" className="relative mt-14 w-full overflow-hidden scroll-mt-24">
            <Image
              src="/image/bg.webp"
              alt=""
              aria-hidden="true"
              fill
              sizes="100vw"
              className="object-cover rounded-[10px]"
            />

            <div className="relative z-10 p-4 sm:p-15">
              <Image
                src="/image/heroimage1.webp"
                alt="Inking LaTeX Editor Preview"
                width={7680}
                height={4320}
                priority
                sizes="(max-width: 768px) 100vw, 80vw"
                className="h-auto w-full object-cover shadow-2xl rounded-[10px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
