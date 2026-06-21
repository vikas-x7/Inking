import { FiRefreshCw, FiTrash2 } from 'react-icons/fi';

const trashedFiles = [
  { title: 'Old resume draft', deleted: 'Deleted 2 days ago' },
  { title: 'Math assignment v1', deleted: 'Deleted 5 days ago' },
  { title: 'Project proposal backup', deleted: 'Deleted 2 weeks ago' },
  { title: 'Notes from last semester', deleted: 'Deleted 1 month ago' },
  { title: 'Old resume draft', deleted: 'Deleted 2 days ago' },
  { title: 'Math assignment v1', deleted: 'Deleted 5 days ago' },
  { title: 'Project proposal backup', deleted: 'Deleted 2 weeks ago' },
  { title: 'Notes from last semester', deleted: 'Deleted 1 month ago' },
];

export default function Trash() {
  return (
    <section className="bg-[#F4F4F4]">
      <section className="px-6 sm:px-8 lg:px-4 rounded-[4px] py-3 bg-white">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-black px-2 mt-5">Trash</h1>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {trashedFiles.map((file, index) => (
            <article key={index} className="min-w-0">
              <div className="h-[300px] rounded-[3px] border bg-[#F4F4F4] border-black/8 flex flex-col px-4 py-4">
                <div className="flex-1 flex items-center justify-center">
                  <FiTrash2 size={42} className="text-black/60" />
                </div>
                <div className="text-start">
                  <h3 className="line-clamp-2 text-base font-semibold leading-5 text-black break-words">{file.title}</h3>
                  <p className="mt-2 text-sm text-gray-400">{file.deleted}</p>
                  <button className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-black">
                    <FiRefreshCw size={14} />
                    Restore
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
