'use client';

import { NAV_ITEMS } from "@/lib/const";
import { ChevronRight, Menu, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  activeNav: string;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

function Sidebar({ activeNav, collapsed, setCollapsed }: Readonly<SidebarProps>) {
  const router = useRouter();

  const getNavRoute = (navId: string) => {
    const routes: Record<string, string> = {
      dashboard: '/dashboard',
      map: '/dashboard',
      cctv: '/dashboard/manajemen-cctv',
      recording: '/dashboard/rekaman',
      settings: '/dashboard/pengaturan',
    };
    return routes[navId] || '/dashboard';
  };

  const handleNavClick = (navId: string) => {
    router.push(getNavRoute(navId));
  };

  return (
    <aside className={`flex flex-col h-full bg-gray-950 border-r border-red-900 transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-red-900">
        <div className="shrink-0 w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900">
          <Shield size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-white font-bold text-sm tracking-wide">KOPERAS<span className="text-red-500">I</span></p>
            <p className="text-gray-400 text-xs">CCTV Monitor</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeNav === id;
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
                ${isActive
                  ? "bg-red-600 text-white shadow-md shadow-red-900"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
              {!collapsed && isActive && <ChevronRight size={14} className="ml-auto" />}
            </button>
          );
        })}
      </nav>

      {/* Stats Mini */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 bg-gray-900 rounded-xl border border-gray-800">
          <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Ringkasan</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Total Koperasi</span>
              <span className="text-white font-bold">5</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">CCTV Online</span>
              <span className="text-green-400 font-bold">34</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">CCTV Offline</span>
              <span className="text-red-400 font-bold">4</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Maintenance</span>
              <span className="text-yellow-400 font-bold">2</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-gray-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-xs transition"
        >
          <Menu size={16} />
          {!collapsed && <span>Tutup Menu</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;