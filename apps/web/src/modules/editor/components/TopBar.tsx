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
  FiPlay,
  FiShare2,
  FiUpload,
  FiUser,
  FiZap,
} from 'react-icons/fi';
import { useAuth } from '@/src/modules/auth/auth-provider';
import { useLogout } from '@/src/modules/auth/hooks';
import DocumentPicker from './DocumentPicker';
import { MdOutlineAutorenew } from 'react-icons/md';

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
    <header className="flex h- shrink-0 items-center justify-between border-b border-white/5 bg-[#252526] px-2 py-1 text-white select-none">
      
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-none ">
        
        <div className="flex">
          <img
            src="/image/logo.png"
            alt="Inking Logo"
            className=" w-5  "
          />
         
        </div>
        <p className='ml-[-6px] font-bold'>  Inking</p>

  
        <button
          onClick={() => setIsPickerOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition cursor-pointer hover:bg-white/5"
        >
          <span className='text-[15px]'>All Document</span>

        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={!pdfUrl}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition cursor-pointer hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Download PDF"
          title="Download PDF"
        >
          <FiDownload size={14} />
          <span className='text-[15px] hidden sm:inline'>Download</span>
        </button>










      </div>

      
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-2">
        {/* Compile Button (MOVED UP) */}

        <button
          onClick={onCompile}
          disabled={isCompiling || !hasContent}
          className="flex items-center gap-1.5 rounded-[5px] bg-[#0052EA] px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-sm disabled:opacity-50"
        >
          <MdOutlineAutorenew  size={13} className={isCompiling ? 'animate-spin' : ''}/>
         
          <span>{isCompiling ? 'Compiling...' : 'Compile'}</span>
        </button>

        {/* Upgrade Button */}


        {/* Help Button */}


        {/* User Profile Avatar */}
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
