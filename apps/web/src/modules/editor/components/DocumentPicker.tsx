'use client';
import { useEffect, useMemo, useState } from 'react';
import { FiGlobe, FiMoreVertical, FiPlus, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { useDeleteDocument, useDocuments } from '@/src/modules/documents/hooks';

interface DocumentPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (documentId: string) => void;
  onNewDocument: () => void;
  currentDocumentId?: string;
}

const formatDateDisplay = (dateString?: string | null) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeString = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `Today at ${timeString}`;
  if (isYesterday) return `Yesterday at ${timeString}`;

  const month = date.toLocaleDateString(undefined, { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();

  const suffix = (d: number) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  return `${month} ${day}${suffix(day)} ${year}, ${timeString}`;
};

export default function DocumentPicker({
  open,
  onClose,
  onSelect,
  onNewDocument,
  currentDocumentId,
}: DocumentPickerProps) {
  const [query, setQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const { data, isLoading, isError } = useDocuments();
  const deleteDocument = useDeleteDocument();

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 sm:px-6"
      onClick={onClose}
    >
      <div
        className="flex h-[580px] max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-[#252526] border border-white/10 shadow-2xl text-white font-sans"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ── Top Bar / Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 border-b border-white/5">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex items-center w-full max-w-xs">
              <FiSearch className="absolute left-3 text-white/70" size={16} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search diagrams"
                className="w-full h-10 rounded-lg  pl-9 pr-3 text-sm text-white placeholder-white/40 outline-none border border-white/5"
              />
            </div>

          
          </div>

          <div className="flex items-center gap-2">
            {/* New Document Button */}
            <button
              onClick={onNewDocument}
              className="flex items-center gap-1.5 rounded-lg bg-black hover:bg-[#0055D6] px-3.5 py-2 text-xs font-medium text-white transition shadow-sm"
            >
              <FiPlus size={15} />
              <span>New</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* ── Table Container ── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center py-12 text-sm text-white/70">
              Loading documents...
            </div>
          ) : isError ? (
            <div className="flex h-full items-center justify-center py-12 text-sm text-red-400">
              Failed to load documents.
            </div>
          ) : documents.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
              <FiGlobe size={32} className="text-slate-500" />
              <p className="text-sm text-white/70">
                {query.trim()
                  ? 'No documents match your search.'
                  : 'No documents yet. Create your first document.'}
              </p>
            </div>
          ) : (
            <div className="w-full">
              {/* Table Column Headers */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2.5 text-xs sm:text-sm font-medium text-white">
                <div className="col-span-6 sm:col-span-5">Name</div>
                <div className="col-span-3 sm:col-span-3">Date Modified</div>
                <div className="col-span-3 sm:col-span-3">Date Created</div>
                <div className="col-span-1 text-right"></div>
              </div>

              {/* Document List Rows */}
              <div className="mt-1 space-y-1">
                {documents.map((document) => {
                  const active = document.id === currentDocumentId;
                  return (
                    <div
                      key={document.id}
                      onClick={() => onSelect(document.id)}
                      className={`group relative grid grid-cols-12 items-center gap-4 rounded-lg px-4 py-3.5 text-sm transition-colors cursor-pointer ${active
                          ? 'bg-[#2F3542] text-white font-medium shadow-sm'
                          : 'hover:bg-[#2A2E39] text-slate-200'
                        }`}
                    >
                      {/* Name Column */}
                      <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                        <FiGlobe size={18} className="shrink-0 text-white/70 group-hover:text-slate-200 transition" />
                        <span className=" text-slate-100 group-hover:text-white transition">
                          {document.title || 'Untitled Diagram'}
                        </span>
                      </div>

                      {/* Date Modified Column */}
                      <div className="col-span-3 sm:col-span-3 text-white/70 group-hover:text-slate-300 text-xs sm:text-sm truncate">
                        {formatDateDisplay(document.updatedAt)}
                      </div>

                      {/* Date Created Column */}
                      <div className="col-span-3 sm:col-span-3 text-white/70 group-hover:text-slate-300 text-xs sm:text-sm truncate">
                        {formatDateDisplay(document.createdAt)}
                      </div>

                      {/* Action Column */}
                      <div className="col-span-1 flex justify-end relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === document.id ? null : document.id);
                          }}
                          className="p-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition"
                          title="Options"
                        >
                          <FiMoreVertical size={18} />
                        </button>

                        {/* Options Dropdown */}
                        {activeMenuId === document.id && (
                          <div
                            className="absolute right-0 top-8 z-20 w-36 rounded-lg bg-[#1B1E25] border border-white/10 p-1 shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                deleteDocument.mutate(document.id);
                              }}
                              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition"
                            >
                              <FiTrash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
