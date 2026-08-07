'use client';
import { useState } from 'react';
import {
  FiChevronDown,
  FiClock,
  FiCloud,
  FiDownload,
  FiHelpCircle,
  FiLayers,
  FiLogOut,
  FiMinus,
  FiPlay,
  FiPlus,
  FiShare2,
  FiUpload,
  FiUser,
  FiZap,
} from 'react-icons/fi';
import { useAuth } from '@/src/modules/auth/auth-provider';
import { useLogout } from '@/src/modules/auth/hooks';
import DocumentPicker from './DocumentPicker';

interface TopBarProps {
  currentDocumentId?: string;
  onSelectDocument: (documentId: string) => void;
  onNewDocument: () => void;
  title: string;
  onTitleChange: (title: string) => void;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  saveError?: string | null;
  onCompile: () => void;
  isCompiling: boolean;
  hasContent: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  pageInfo: { current: number; total: number };
  pdfUrl: string | null;
}

export default function TopBar({
  currentDocumentId,
  onSelectDocument,
  onNewDocument,
  title,
  onTitleChange,
  isDirty,
  isSaving,
  onSave,
  saveError,
  onCompile,
  isCompiling,
  hasContent,
  zoom,
  onZoomIn,
  onZoomOut,
  pageInfo,
  pdfUrl,
}: TopBarProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const { user, isLoading } = useAuth();
  const logout = useLogout();

  const closePicker = () => setIsPickerOpen(false);

  const handleSelectDocument = (documentId: string) => {
    closePicker();
    onSelectDocument(documentId);
  };

  const handleNewDocument = () => {
    closePicker();
    onNewDocument();
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'document.pdf';
    link.click();
    setShowExportMenu(false);
  };

  return (
    <header className="flex h- shrink-0 items-center justify-between border-b border-white/5 bg-[#252526] px-3 sm:px-4 text-white select-none">
      {/* ── Left Side Controls ── */}
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-none py-1 min-w-0">
        {/* Brand Icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#252526] text-white shadow-sm">
          <img
            src="http://localhost:3000/image/inkinglogo.png"
            alt="Inking Logo"
            className="w-10 h-10 rounded-[6px] object-cover"
          />
        </div>

        {/* Workspace / Personal Picker */}
        <button
          onClick={() => setIsPickerOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition   "
        >
          <span className='text-[15px]'>My document</span>

        </button>

        <button
          onClick={() => setIsPickerOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition   "
        >
          <span className='text-[15px]'>Download</span>

        </button>








      </div>

      {/* ── Center & Right Controls (Compile, Zoom, Upgrade, User Profile) ── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-2">
        {/* Compile Button (MOVED UP) */}


        {/* Zoom & Page Info (MOVED UP) */}
        <div className="hidden sm:flex items-center gap-2 =rounded-lg px-2 py-1 text-xs text-slate-300">
          <span className="text-slate-400 font-mono text-[11px]">
            {pageInfo.current}/{pageInfo.total}
          </span>
          <span className="h-3 w-[1px] bg-slate-600/50" />
          <button
            onClick={onZoomOut}
            disabled={zoom <= 0.5}
            className="text-slate-400 hover:text-white disabled:opacity-30 transition"
            aria-label="Zoom out"
          >
            <FiMinus size={14} />
          </button>
          <span className="font-mono text-[11px] text-slate-200">{Math.round(zoom * 100)}%</span>
          <button
            onClick={onZoomIn}
            disabled={zoom >= 3}
            className="text-slate-400 hover:text-white disabled:opacity-30 transition"
            aria-label="Zoom in"
          >
            <FiPlus size={14} />
          </button>

        </div>

        <button
          onClick={onCompile}
          disabled={isCompiling || !hasContent}
          className="flex items-center gap-1.5 rounded-[5px] bg-[#0052EA] px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-sm disabled:opacity-50"
        >
          <FiPlay size={13} className={isCompiling ? 'animate-spin' : ''} />
          <span>{isCompiling ? 'Compiling...' : 'Compile'}</span>
        </button>

        {/* Upgrade Button */}


        {/* Help Button */}


        {/* User Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1 rounded-lg  p-1 pr-1.5 transition hover:black border border-white/5"
          >
            {isLoading ? (
              <div className="h-6 w-6 animate-pulse rounded-[1px] " />
            ) : user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name} className="h-6 w-6 rounded-md object-cover" />
            ) : (
              <div className="grid h-6 w-6 place-items-center rounded-md bg-black text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase() ?? <FiUser size={13} />}
              </div>
            )}
            <FiChevronDown size={12} className="text-slate-400" />
          </button>

          {showUserMenu && user && (
            <div className="absolute right-0 top-10 z-30 w-44 rounded-[5px] bg-[#252526] border border-white/10 p-1.5 shadow-xl text-xs">
              <div className="px-2 py-1.5 border-b border-white/5 mb-1">
                <p className="font-semibold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-red-400 hover:bg-red-500/10 transition"
              >
                <FiLogOut size={14} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <DocumentPicker
        key={isPickerOpen ? 'open' : 'closed'}
        open={isPickerOpen}
        onClose={closePicker}
        onSelect={handleSelectDocument}
        onNewDocument={handleNewDocument}
        currentDocumentId={currentDocumentId}
      />
    </header>
  );
}
