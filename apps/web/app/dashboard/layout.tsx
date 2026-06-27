import Sidebar from '@/src/modules/dashboard/components/Sidebar';
import NewDocumentButton from '@/src/modules/dashboard/components/NewDocumentButton';
import { FiSearch } from 'react-icons/fi';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[#F4F4F4] font-sans">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 bg-[#F4F4F4]">
          <div className="flex justify-between py-4">
            <div className="flex items-center gap-3">
              <label className="flex h-9 w-full items-center gap-3 rounded-[3px] border border-gray-200 bg-white px-2 text-sm text-gray-400 sm:w-56">
                <FiSearch className="shrink-0 text-gray-400" size={18} />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-gray-400"
                  placeholder="Search"
                />
              </label>
            </div>
            <NewDocumentButton />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
