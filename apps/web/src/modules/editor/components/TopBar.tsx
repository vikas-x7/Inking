'use client';
import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiEdit3, FiExternalLink, FiLogOut, FiUser } from 'react-icons/fi';
import { BsFileEarmarkPdf } from 'react-icons/bs';
import { useAuth, useLogout } from '@/src/modules/auth/hooks';
import DocumentPicker from './DocumentPicker';
import type { EditorSaveState } from '../page/Editor';

export type LayoutMode = 'split' | 'editor' | 'pdf';

interface TopBarProps {
  currentDocumentId?: string;
  onSelectDocument: (documentId: string) => void;
  onNewDocument: () => void;
  onCompile: () => void;
  isCompiling: boolean;
  hasContent: boolean;
  pdfUrl: string | null;
  saveState?: EditorSaveState;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
}

const LAYOUT_MENU_WIDTH = 240;

export default function TopBar({
  currentDocumentId,
  onSelectDocument,
  onNewDocument,
  onCompile,
  isCompiling,
  hasContent,
  pdfUrl,
  saveState = 'idle',
  layoutMode,
  onLayoutModeChange,
}: TopBarProps) {
  const [pickerView, setPickerView] = useState<'active' | 'archived' | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [layoutMenuPos, setLayoutMenuPos] = useState({ left: 0, top: 0 });

  const layoutMenuRef = useRef<HTMLDivElement>(null);
  const layoutButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, isLoading } = useAuth();
  const logout = useLogout();

  const isPickerOpen = pickerView !== null;

  const closePicker = () => setPickerView(null);

  const handleSelectDocument = (documentId: string) => {
    closePicker();
    onSelectDocument(documentId);
  };

  const handleNewDocument = () => {
    closePicker();
    onNewDocument();
  };

  const openLayoutMenu = () => {
    const rect = layoutButtonRef.current?.getBoundingClientRect();
    if (!rect) {
      setShowLayoutMenu(true);
      return;
    }
    setLayoutMenuPos({
      left: Math.round(Math.min(rect.left, window.innerWidth - LAYOUT_MENU_WIDTH - 8)),
      top: Math.round(rect.bottom + 6),
    });
    setShowLayoutMenu(true);
  };

  const toggleLayoutMenu = () => {
    if (showLayoutMenu) {
      setShowLayoutMenu(false);
      return;
    }
    openLayoutMenu();
  };

  const selectLayoutMode = (mode: LayoutMode) => {
    onLayoutModeChange(mode);
    setShowLayoutMenu(false);
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'document.pdf';
    link.click();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(event.target as Node)) {
        setShowLayoutMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    const closeOnViewportChange = () => setShowLayoutMenu(false);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', closeOnViewportChange, true);
    window.addEventListener('resize', closeOnViewportChange);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', closeOnViewportChange, true);
      window.removeEventListener('resize', closeOnViewportChange);
    };
  }, []);

  const actionButtonClass = [
    'flex shrink-0 items-center gap-1.5 rounded-[2px] px-2 py-1',
    'text-[15px] font-medium text-slate-200 transition cursor-pointer hover:bg-white/5',
  ].join(' ');

  return (
    <header className="relative z-30 flex h-9 shrink-0 select-none items-center justify-between border-b border-white/5 bg-[#252526] text-white px-2">
      <div className="flex items-center gap-x-1 overflow-x-auto scrollbar-none">
        {/* Brand */}
        <div className="mr-5 flex items-center gap-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image/logo.png" alt="Inking Logo" className="h-5 w-5" />
          <span className="text-[16px] font-black text-slate-100">Inking</span>
        </div>

        {/* Action buttons */}
        <button onClick={() => setPickerView('active')} className={actionButtonClass}>
          Files
        </button>
        <button onClick={() => setPickerView('archived')} className={`${actionButtonClass} hidden sm:flex`}>
          Archive
        </button>

        {/* Layout button + dropdown */}
        <div className="relative" ref={layoutMenuRef}>
          <button ref={layoutButtonRef} onClick={toggleLayoutMenu} className={actionButtonClass}>
            Layout
          </button>

          {showLayoutMenu && (
            <div
              style={{ left: layoutMenuPos.left, top: layoutMenuPos.top }}
              className="fixed z-50 w-60 select-none rounded-[5px] border border-white/10 bg-[#252526] p-2 shadow-2xl text-xs"
            >
              <div className="mb-1 px-2.5 py-1 text-[12px] font-normal text-slate-400">Layout options</div>

              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => selectLayoutMode('split')}
                  className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[15px] font-normal text-left transition cursor-pointer ${
                    layoutMode === 'split' ? 'bg-[#0052EA] font-medium text-white' : 'text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <FiCheck className={`shrink-0 stroke-[2.5] text-base ${layoutMode === 'split' ? 'text-white' : 'opacity-0'}`} />
                  Split view
                </button>

                <button
                  onClick={() => selectLayoutMode('editor')}
                  className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[15px] font-normal text-left transition cursor-pointer ${
                    layoutMode === 'editor' ? 'bg-[#0052EA] font-medium text-white' : 'text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <FiEdit3 className="shrink-0 text-base text-slate-200" />
                  Editor only
                </button>

                <button
                  onClick={() => selectLayoutMode('pdf')}
                  className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[15px] font-normal text-left transition cursor-pointer ${
                    layoutMode === 'pdf' ? 'bg-[#0052EA] font-medium text-white' : 'text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <BsFileEarmarkPdf className="shrink-0 text-base text-slate-200" />
                  PDF only
                </button>

                <button
                  onClick={() => {
                    setShowLayoutMenu(false);
                    if (pdfUrl) {
                      window.open(pdfUrl, '_blank');
                    }
                  }}
                  disabled={!pdfUrl}
                  className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-[15px] font-normal text-left text-slate-100 transition hover:bg-white/5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <FiExternalLink className="shrink-0 text-base text-slate-200" />
                  Open PDF in separate tab
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={handleNewDocument} className={`${actionButtonClass} hidden sm:flex`}>
          New File
        </button>
        <button onClick={() => setShowHelpModal(true)} className={`${actionButtonClass} hidden sm:flex`}>
          Help
        </button>

        {/* Compile button */}
        <button
          onClick={onCompile}
          disabled={isCompiling || !hasContent}
          className={`${actionButtonClass} rounded-[4px] disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isCompiling ? 'Compiling...' : 'Compile'}
        </button>

        <button onClick={handleDownloadPdf} disabled={!pdfUrl} className={`${actionButtonClass} disabled:cursor-not-allowed disabled:opacity-30`}>
          Download
        </button>
      </div>

      {/* Save state + user menu */}
      <div className="flex shrink-0 items-center gap-2 pl-2 sm:gap-3">
        {saveState !== 'idle' && (
          <span className={`text-[11px] font-medium whitespace-nowrap ${saveState === 'error' ? 'text-red-400' : 'text-white/50'}`}>
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save failed'}
          </span>
        )}

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1 rounded-lg p-1 transition hover:bg-white/5 cursor-pointer"
          >
            {isLoading ? (
              <div className="h-6 w-6 animate-pulse rounded-[1px] bg-white/10" />
            ) : user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name} className="h-6 w-6 rounded-md object-cover" />
            ) : (
              <div className="grid h-6 w-6 place-items-center rounded-md bg-black text-[15px] font-bold text-white">
                {user?.name?.[0]?.toUpperCase() ?? <FiUser size={15} />}
              </div>
            )}
          </button>

          {showUserMenu && user && (
            <div className="absolute right-0 top-full z-30 mt-1.5 w-44 rounded-[5px]  bg-[#252526] p-1.5 text-[15px] shadow-xl">
              <div className="mb-1 border-b border-white/5 px-2 py-1.5">
                <p className="truncate  text-white">{user.name}</p>
                <p className="truncate text-[11px] text-white/50">{user.email}</p>
              </div>
              <button
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-red-400 transition hover:bg-red-500/10 cursor-pointer"
              >
                <FiLogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Document picker modal */}
      <DocumentPicker
        key={pickerView ?? 'closed'}
        open={isPickerOpen}
        initialView={pickerView ?? 'active'}
        onClose={closePicker}
        onSelect={handleSelectDocument}
        onNewDocument={handleNewDocument}
        currentDocumentId={currentDocumentId}
      />

      {/* Help modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#1e1e1e] p-5 text-slate-200 shadow-2xl">
            <h3 className="mb-3 text-base font-semibold text-white">LaTeX Editor Shortcuts & Help</h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex justify-between border-b border-white/5 pb-1.5">
                <span>Compile Document</span>
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">Compile Button</kbd>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-1.5">
                <span>Layout Switcher</span>
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">Layout menu</kbd>
              </li>
              <li className="flex justify-between border-b border-white/5 pb-1.5">
                <span>Resize Panes</span>
                <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px]">Drag center separator</kbd>
              </li>
              <li className="flex justify-between pb-1">
                <span>Auto-save</span>
                <span className="text-emerald-400">Automatic on typing</span>
              </li>
            </ul>
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="rounded-md bg-[#0052EA] px-4 py-1.5 text-[15px] font-medium text-white transition hover:bg-[#0047cc] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}