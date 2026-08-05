'use client';
import { useState } from 'react';
import { FiFolder, FiLogOut, FiUser } from 'react-icons/fi';
import { useAuth } from '@/src/modules/auth/auth-provider';
import { useLogout } from '@/src/modules/auth/hooks';
import DocumentPicker from './DocumentPicker';

interface TopBarProps {
  currentDocumentId?: string;
  onSelectDocument: (documentId: string) => void;
  onNewDocument: () => void;
}

export default function TopBar({
  currentDocumentId,
  onSelectDocument,
  onNewDocument,
}: TopBarProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
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

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#151515] px-4">
      <button
        onClick={() => setIsPickerOpen(true)}
        className="flex items-center gap-2 rounded-[5px] border border-white/40 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
      >
        <FiFolder size={16} />
        My Documents
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-2.5 text-sm text-white/80">
          {isLoading ? (
            <div className="h-8 w-8 animate-pulse rounded-[3px] bg-white/10" />
          ) : user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name} className="h-8 w-8 rounded-[3px] object-cover" />
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-[3px] bg-white/10 text-white/70">
              <FiUser size={16} />
            </div>
          )}
          <span className="hidden max-w-[180px] truncate sm:inline">
            {isLoading ? 'Loading...' : (user?.name ?? 'Guest')}
          </span>
        </div>
        {user && (
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="grid h-8 w-8 place-items-center rounded-[3px] text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            title="Log out"
            aria-label="Log out"
          >
            <FiLogOut size={16} />
          </button>
        )}
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
