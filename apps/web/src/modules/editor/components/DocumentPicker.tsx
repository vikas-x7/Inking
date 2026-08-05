'use client';
import { useEffect, useMemo, useState } from 'react';
import { FiFile, FiPlus, FiSearch } from 'react-icons/fi';
import { IoMdDocument } from 'react-icons/io';
import { useDocuments } from '@/src/modules/documents/hooks';

interface DocumentPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (documentId: string) => void;
  onNewDocument: () => void;
  currentDocumentId?: string;
}

const formatUpdatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function DocumentPicker({
  open,
  onClose,
  onSelect,
  onNewDocument,
  currentDocumentId,
}: DocumentPickerProps) {
  const [query, setQuery] = useState('');
  const { data, isLoading, isError } = useDocuments();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const documents = useMemo(() => {
    const all = (data?.documents ?? []).filter((document) => !document.isArchived);
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? all.filter((document) => document.title.toLowerCase().includes(normalized))
      : all;
    return [...filtered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [data, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-[6px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-gray-100 p-4">
          <h2 className="text-base font-semibold tracking-tight text-black">My Documents</h2>
          <label className="mt-3 flex h-9 w-full items-center gap-2 rounded-[3px] border border-gray-200 bg-[#F4F4F4] px-2">
            <FiSearch className="shrink-0 text-gray-400" size={16} />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documents..."
              className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-gray-400"
            />
          </label>
          <button
            onClick={onNewDocument}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-[3px] bg-[#7C6BA6] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#655493]"
          >
            <FiPlus size={16} />
            New Document
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <p className="px-3 py-6 text-center text-sm text-gray-400">Loading documents...</p>
          ) : isError ? (
            <p className="px-3 py-6 text-center text-sm text-red-500">Failed to load documents.</p>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
              <FiFile size={28} className="text-gray-300" />
              <p className="text-sm text-gray-400">
                {query.trim()
                  ? 'No documents match your search.'
                  : 'No documents yet. Create your first document.'}
              </p>
            </div>
          ) : (
            <ul>
              {documents.map((document) => {
                const active = document.id === currentDocumentId;
                return (
                  <li key={document.id}>
                    <button
                      onClick={() => onSelect(document.id)}
                      className={`flex w-full items-center gap-3 rounded-[3px] px-2 py-2 text-left transition ${
                        active ? 'bg-[#9684AF]/20' : 'hover:bg-[#F4F4F4]'
                      }`}
                    >
                      <IoMdDocument size={20} className="shrink-0 text-[#9684AF]" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-black">{document.title}</p>
                        <p className="truncate text-xs text-gray-400">
                          Last edited {formatUpdatedAt(document.updatedAt)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
