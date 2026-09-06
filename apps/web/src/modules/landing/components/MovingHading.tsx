'use client';

const marqueeItemsData = [
  'Research Paper',
  'Resume',
  'CV',
  'Thesis',
  'Dissertation',
  'Assignment',
  'Project Report',
  'Technical Report',
  'Presentation',
  'Beamer Slides',
  'Book',
  'Journal Article',
  'Cover Letter',
  'Bibliography',
  'Proposal',
  'Poster',
  'Notes',
  'Letter',
];

export default function MovingHading() {
  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-loop {
          display: flex;
          width: max-content;
          animation: marquee 160s linear infinite;
        }
      `}</style>

      <section className="relative w-full overflow-hidden bg-black flex justify-center items-center py-14 sm:py-20">
        <div className="relative overflow-hidden max-w-6xl w-full">
          <div className="animate-marquee-loop">
            {[0, 1].map((group) => (
              <div
                key={group}
                className="flex shrink-0 items-center gap-10 sm:gap-14"
                aria-hidden={group === 1}
              >
                {marqueeItemsData.map((name, i) => (
                  <div key={`${group}-${i}`} className="flex shrink-0 items-center gap-3">
                    <span className="whitespace-nowrap text-lg sm:text-2xl md:text-xl font-semibold text-white">
                      {name}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-32 bg-gradient-to-r from-black to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-32 bg-gradient-to-l from-black to-transparent" />
        </div>
      </section>
    </>
  );
}
