'use client';
import { FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useDeleteDocument, useDocuments, useRestoreDocument } from '@/src/modules/documents/hooks';

const formatDeletedAt = (value: string) => {
  const date = new Date(value);
  const formatted = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return `Archived ${formatted}`;
};

export default function Trash() {
  const { data, isLoading, isError } = useDocuments();
  const restoreDocument = useRestoreDocument();
  const deleteDocument = useDeleteDocument();

  const trashedFiles = (data?.documents ?? []).filter((document) => document.isArchived);

  return (
    <section className="bg-[#F4F4F4]">
      <section className="px-6 sm:px-8 lg:px-4 rounded-[3px] py-3 bg-white">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-black px-2 mt-5">Trash</h1>
        </div>
        {isLoading ? (
          <p className="mt-6 px-2 text-sm text-gray-400">Loading trash...</p>
        ) : isError ? (
          <p className="mt-6 px-2 text-sm text-red-500">Failed to load trash.</p>
        ) : trashedFiles.length === 0 ? (
          <p className="mt-6 px-2 text-sm text-gray-400">Trash is empty.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {trashedFiles.map((file) => (
              <article key={file.id} className="min-w-0">
                <div className="h-[300px] rounded-[3px] border border-gray-100 bg-[#F4F4F4] flex flex-col px-4 py-4">
                  <div className="flex-1 flex items-center justify-center">
                    <FiTrash2 size={42} className="text-black/60" />
                  </div>
                  <div className="text-start">
                    <h3 className="line-clamp-2 text-base font-semibold leading-5 text-black break-words">
                      {file.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400">{formatDeletedAt(file.updatedAt)}</p>
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        onClick={() => restoreDocument.mutate(file.id)}
                        disabled={restoreDocument.isPending}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 transition hover:text-black disabled:opacity-50"
                      >
                        <FiRefreshCw size={14} />
                        Restore
                      </button>
                      <button
                        onClick={() => deleteDocument.mutate(file.id)}
                        disabled={deleteDocument.isPending}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-red-500 transition hover:text-red-700 disabled:opacity-50"
                      >
                        <FiTrash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
