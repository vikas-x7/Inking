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
  {
    title: 'Figma Weave Welcome',
    tag: 'Figma',
    image: 'https://i.pinimg.com/736x/13/18/ee/1318eeb81f7150f1f8fb1082b0988fe1.jpg',
  },
  {
    title: 'Figma Weave Iterators',
    tag: 'Figma',
    image: 'https://i.pinimg.com/736x/13/18/ee/1318eeb81f7150f1f8fb1082b0988fe1.jpg',
  },
  {
    title: 'Multiple Models',
    tag: 'Report',
    image: 'https://i.pinimg.com/736x/13/18/ee/1318eeb81f7150f1f8fb1082b0988fe1.jpg',
  },
  {
    title: 'Editing Images',
    tag: 'Paper',
    image: 'https://i.pinimg.com/736x/13/18/ee/1318eeb81f7150f1f8fb1082b0988fe1.jpg',
  },
  {
    title: 'Compositor Node',
    tag: 'Resume',
    image: 'https://i.pinimg.com/736x/13/18/ee/1318eeb81f7150f1f8fb1082b0988fe1.jpg',
  },
  {
    title: 'Image to Video Models',
    tag: 'Paper',
    image: 'https://i.pinimg.com/736x/13/18/ee/1318eeb81f7150f1f8fb1082b0988fe1.jpg',
  },
];
export default function MyFiles() {
  return (
    <section className="bg-[#F4F4F4]">
      <section className="px-6 sm:px-8 lg:px-4 rounded-[3px] py-3 bg-white">
        <section className="mt-5 rounded-[3px] border border-gray-100 bg-[#F4F4F4] p-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-sm">
              <button className="rounded-[3px] bg-[#7C6BA6] px-3 py-1.5 font-medium text-white">
                All
              </button>
              <button className="font-medium text-gray-500 transition hover:text-black">
                Papers
              </button>
              <button className="font-medium text-gray-500 transition hover:text-black">
                Reports
              </button>
              <button className="font-medium text-gray-500 transition hover:text-black">
                Resumes
              </button>
            </div>
            <a
              className="inline-flex w-fit items-center gap-2 border-b border-black text-sm font-medium text-black"
              href="#"
            >
              Browse all templates
              <FiArrowUpRight size={16} />
            </a>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {templates.map((item, index) => (
              <article key={index} className="group cursor-pointer">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[3px]">
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.74),transparent_58%)]" />
                  <p className="absolute bottom-0 left-0 p-4 text-sm font-semibold text-white">
                    {item.title}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500">{item.tag}</p>
                  <FiPlus size={14} className="text-gray-400 transition group-hover:text-black" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <div>
          <h1 className="text-lg font-semibold tracking-tight text-black px-2 mt-5">
            My Documents
          </h1>
        </div>
        <section className="">
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {files.map((file, index) => (
              <article key={index} className="min-w-0">
                <div className="h-[300px] rounded-[3px] border border-gray-100 bg-[#F4F4F4] flex flex-col px-4 py-4">
                  <div className="flex-1 flex items-center justify-center">
                    <IoMdDocument size={42} className="text-[#9684AF]" />
                  </div>
                  <div className="text-start">
                    <h3 className="line-clamp-2 text-base font-semibold leading-5 text-black break-words">
                      {file.title}
                    </h3>
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
