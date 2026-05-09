'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/SideBar';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Search, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface CenterLayoutProps {
  children: React.ReactNode;
}

function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-gray-950 border-b border-red-900 flex items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 items-center">
          <div className="w-5 h-5 rounded-sm bg-red-600" />
          <div className="w-5 h-5 rounded-sm bg-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm tracking-wide">
            Monitoring CCTV <span className="text-red-500">Koperasi Indonesia</span>
          </h1>
          <p className="text-gray-500 text-xs">Dashboard Monitoring Real-time</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            placeholder="Cari koperasi..."
            className="bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-lg pl-8 pr-3 py-2 w-48 focus:outline-none focus:border-red-600 placeholder-gray-600"
          />
        </div>
        <div
          className="relative"
          onBlur={(event) => {
            const nextFocus = event.relatedTarget as HTMLElement | null;
            if (!event.currentTarget.contains(nextFocus)) {
              setUserMenuOpen(false);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setUserMenuOpen(false);
            }
          }}
        >
          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 text-xs hover:border-red-600 hover:text-white transition"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            aria-controls="user-menu"
          >
            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <span>Admin</span>
            <ChevronDown
              size={14}
              className={`transition ${userMenuOpen ? 'rotate-180 text-white' : 'text-gray-400'}`}
            />
          </button>
          {userMenuOpen && (
            <div
              id="user-menu"
              role="menu"
              className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-800 bg-gray-950 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)] p-1 z-30"
            >
              <Link
                href="/dashboard/pengaturan"
                role="menuitem"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-300 hover:bg-gray-900 hover:text-white transition"
                onClick={() => setUserMenuOpen(false)}
              >
                <User size={14} />
                Profile
              </Link>
              <Link
                href="/"
                role="menuitem"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-300 hover:bg-gray-900 hover:text-white transition"
                onClick={() => setUserMenuOpen(false)}
              >
                <LogOut size={14} />
                Keluar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: Readonly<CenterLayoutProps>) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  
  // Determine active nav based on current path
  let activeNav = 'dashboard';
  if (pathname.includes('/manajemen-cctv')) activeNav = 'cctv';
  else if (pathname.includes('/rekaman')) activeNav = 'recording';
  else if (pathname.includes('/pengaturan')) activeNav = 'settings';
  else if (pathname.includes('/koperasi')) activeNav = 'map';

  return (
    <QueryProvider>
      <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
        <Sidebar activeNav={activeNav} collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </QueryProvider>
  );
}
