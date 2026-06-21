'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IoMdSquare } from 'react-icons/io';
import { FiFile, FiLayout, FiTrash2, FiUser } from 'react-icons/fi';

const links = [
  { label: 'My files', icon: FiFile, href: '/dashboard' },
  { label: 'Templates', icon: FiLayout, href: '/dashboard/templates' },
  { label: 'Trash', icon: FiTrash2, href: '/dashboard/trash' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-54 bg-[#F4F4F4] shrink-0 h-screen sticky top-0 border-r border-gray-100 flex flex-col ">
      <div className="flex items-center gap-1 px-2 py-2">
        <IoMdSquare size={25} className="text-[#1d1d1d]" />
        <Link href="/" className="text-xl font-semibold mt-1 tracking-tight text-black/80 flex items-center gap-1">
          Inking
        </Link>
      </div>
      <div className="w-full px-2 mt-4">
        <button className="bg-[#292929] w-full py-1.5 rounded-[3px] text-[14px] text-white p-1 tracking-[-0.1px]">Create new file</button>
      </div>

      <nav className="mt-2 flex-1 flex flex-col gap-1 px-2">
        {links.map(({ label, icon: Icon, href }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-2 px-1 py-1.5  tracking-[-0.1px] text-[13px] font-medium transition ${active ? 'bg-[#FCFCFC] text-black' : 'text-black/70 hover:bg-gray-50 hover:text-black'}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50">
        <div className="w-9 h-9 rounded-[3px] bg-gray-200 flex items-center justify-center text-gray-500">
          <FiUser size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-black truncate">User Name</p>
          <p className="text-xs text-gray-500 truncate">user@example.com</p>
        </div>
      </div>
    </aside>
  );
}
