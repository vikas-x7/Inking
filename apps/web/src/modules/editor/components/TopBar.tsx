'use client';
import { useState } from 'react';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth, useLogout } from '@/src/modules/auth/hooks';
import DocumentPicker from './DocumentPicker';
import type { EditorSaveState } from '../page/Editor';

interface TopBarProps {
  currentDocumentId?: string;
  onSelectDocument: (documentId: string) => void;
  onNewDocument: () => void;
  onCompile: () => void;
  isCompiling: boolean;
  hasContent: boolean;
  pdfUrl: string | null;
  saveState?: EditorSaveState;
}

export default function TopBar({
  currentDocumentId,
  onSelectDocument,
  onNewDocument,
  onCompile,
  isCompiling,
  hasContent,
  pdfUrl,
  saveState = 'idle',
}: TopBarProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
  };

  const actions: Array<{ label: string; onClick?: () => void; disabled?: boolean; alwaysVisible?: boolean }> = [
    { label: 'Files', onClick: () => setIsPickerOpen(true), alwaysVisible: true },
    { label: 'Archive' },
    { label: 'Layout' },
    { label: 'New File' },
    
    { label: 'Help' },
    { label: 'Download', onClick: handleDownloadPdf, disabled: !pdfUrl },
  ];

  return (
    <header className="flex h- shrink-0 items-center justify-between border-b border-white/5 bg-[#252526] px-2  text-white select-none">
      <div className="flex items-center  overflow-x-auto gap-x-1 scrollbar-none ">
        <div className="flex">
          <img src="/image/logo.png" alt="Inking Logo" className=" w-5  " />
        </div>
        <p className="ml-[-2px] font-medium mr-5"> Inking</p>
        {actions.map(({ label, onClick, disabled, alwaysVisible }) => (
          <button
            key={label}
            onClick={onClick}
            disabled={disabled}
            className="flex shrink-0 items-center gap-1.5 rounded-[2px] px-1.5 py-[0.7px] text-xs font-medium text-slate-200 transition cursor-pointer hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className={`text-[15px] ${alwaysVisible ? '' : 'hidden sm:inline'}`}>{label}</span>
          </button>
        ))}
        <button
          onClick={onCompile}
          disabled={isCompiling || !hasContent}
          className="flex items-center gap-1.5 rounded-[2px] px-1.5 py-[0.7px]  font-medium text-white transition shadow-sm disabled:opacity-50"
        >
          <span>{isCompiling ? 'Compiling...' : 'Compile'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-2">
        {saveState !== 'idle' && (
          <span
            className={[
              'text-[11px] font-medium whitespace-nowrap',
              saveState === 'error' ? 'text-red-400' : 'text-white/50',
            ].join(' ')}
          >
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save failed'}
          </span>
        )}

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-1 rounded-lg  p-1 pr-1.5 transition hover:black cursor-pointer"
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