import { FiArrowUpRight, FiPlus } from 'react-icons/fi';
import { IoMdDocument } from 'react-icons/io';

const files = [
  { title: 'Untitel', edited: 'Last edited 3 months ago' },
  { title: 'Untitel', edited: 'Last edited 3 months ago' },
  { title: 'Untitel', edited: 'Last edited 3 months ago' },
  { title: 'Untitel', edited: 'Last edited 3 months ago' },
  { title: 'Untitel', edited: 'Last edited 3 months ago' },
  { title: 'Untitel', edited: 'Last edited 3 months ago' },
  { title: 'Untitel', edited: 'Last edited 3 months ago' },
  { title: 'Untitel', edited: 'Last edited 3 months ago' },
  { title: 'Untitel', edited: 'Last edited 3 months ago' },
  { title: 'Untitel', edited: 'Last edited 3 months ago' },
];

const templates = [
  { title: 'Figma Weave Welcome', tag: 'Figma', image: 'from-zinc-100 via-zinc-500 to-zinc-950' },
  { title: 'Figma Weave Iterators', tag: 'Figma', image: 'from-zinc-200 via-neutral-500 to-neutral-900' },
  { title: 'Multiple Models', tag: 'Report', image: 'from-neutral-100 via-zinc-600 to-black' },
  { title: 'Editing Images', tag: 'Paper', image: 'from-stone-100 via-neutral-600 to-zinc-950' },
  { title: 'Compositor Node', tag: 'Resume', image: 'from-white via-zinc-500 to-neutral-950' },
  { title: 'Image to Video Models', tag: 'Paper', image: 'from-zinc-200 via-neutral-700 to-black' },
];
export default function MyFiles() {
  return (
    <section className="bg-[#F4F4F4]">
      <section className="px-6 sm:px-8 lg:px-4 rounded-[5px] py-3 bg-white">
        <section className="mt-5 rounded-[3px] border border-gray-100 bg-[#F4F4F4] p-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-sm">
              <button className="rounded-[3px] bg-black px-3 py-1.5 font-medium text-white">All</button>
              <button className="font-medium text-gray-500 transition hover:text-black">Papers</button>
              <button className="font-medium text-gray-500 transition hover:text-black">Reports</button>
              <button className="font-medium text-gray-500 transition hover:text-black">Resumes</button>
            </div>
            <a className="inline-flex w-fit items-center gap-2 border-b border-black text-sm font-medium text-black" href="#">
              Browse all templates
              <FiArrowUpRight size={16} />
            </a>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {templates.map((item) => (
              <article key={item.title} className="group cursor-pointer">
                <div className={`relative aspect-[4/3] overflow-hidden rounded-[3px] bg-gradient-to-br ${item.image}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_22%,rgba(255,255,255,0.5),transparent_22%),linear-gradient(to_top,rgba(0,0,0,0.74),transparent_58%)]" />
                  <p className="relative mt-auto p-4 text-sm font-semibold text-white">{item.title}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{item.tag}</p>
                  <FiPlus size={14} className="text-gray-400 transition group-hover:text-black" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <div>
          <h1 className="text-lg font-semibold tracking-tight text-black px-2 mt-5">My Documents</h1>
        </div>
        <section className="">
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {files.map((file, index) => (
              <article key={index} className="min-w-0">
                <div className="h-[300px] rounded-[3px] border bg-[#F4F4F4] border-black/8 flex flex-col px-4 py-4">
                  <div className="flex-1 flex items-center justify-center">
                    <IoMdDocument size={42} className="text-black/60" />
                  </div>
                  <div className="text-start">
                    <h3 className="line-clamp-2 text-base font-semibold leading-5 text-black break-words">{file.title}</h3>
                    <p className="mt-2 text-sm text-gray-400">{file.edited}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </section>
  );
}
