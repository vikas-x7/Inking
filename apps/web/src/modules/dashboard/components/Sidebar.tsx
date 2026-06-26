'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoMdSquare } from 'react-icons/io';
import { FiFile, FiLayout, FiTrash2, FiUser, FiPlus } from 'react-icons/fi';
import { RxBorderSplit } from 'react-icons/rx';

const links = [
  { label: 'My files', icon: FiFile, href: '/dashboard' },
  { label: 'Templates', icon: FiLayout, href: '/dashboard/templates' },
  { label: 'Trash', icon: FiTrash2, href: '/dashboard/trash' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#F4F4F4] shrink-0 h-screen sticky top-0 border-r border-gray-100 flex flex-col">
      <div className="flex items-center gap-2 px-2 py-2">
        <RxBorderSplit size={18} className="text-[#0f0f0f]" />
        <Link
          href="/"
          className="text-xl font-semibold mt-1 tracking-tight text-black flex items-center gap-1"
        >
          Inking
        </Link>
      </div>
      <div className="w-full px-2 mt-4">
        <button className="bg-[#7C6BA6] w-full py-1.5 rounded-[3px] text-[14px] text-white tracking-[-0.1px] hover:bg-[#655493] transition">
          Create new file
        </button>
      </div>

      <nav className="mt-2 flex-1 flex flex-col gap-1 px-2">
        {links.map(({ label, icon: Icon, href }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-2 px-1 py-1.5 tracking-[-0.1px] text-[13px] font-medium transition ${
                active
                  ? 'bg-[#9684AF]/15 text-black'
                  : 'text-black/70 hover:bg-white hover:text-black'
              }`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-100">
        <div className="w-9 h-9 rounded-[3px] bg-[#9684AF]/20 flex items-center justify-center text-[#6B5B95]">
          <FiUser size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-black truncate">User Name</p>
          <p className="text-xs text-gray-500 truncate">user@example.com</p>
        </div>
        <FiPlus size={16} className="ml-auto text-gray-400" />
      </div>
    </aside>
  );
}
