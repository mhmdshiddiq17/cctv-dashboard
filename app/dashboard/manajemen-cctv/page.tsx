'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, ChevronDown } from 'lucide-react';
import type { CCTVItem } from '@/lib/types';

// Mock CCTV data - 1 Koperasi with 8 CCTVs
const MOCK_CCTV_LIST: (CCTVItem & { koperasi: string })[] = [
  { id: "c1", label: "CCTV-01", location: "Pintu Masuk Utama", status: "ONLINE", resolution: "4K", brand: "Hikvision", fps: 30, koperasi: "KUD Mitra Tani" },
  { id: "c2", label: "CCTV-02", location: "Lobby", status: "ONLINE", resolution: "1080p", brand: "Dahua", fps: 25, koperasi: "KUD Mitra Tani" },
  { id: "c3", label: "CCTV-03", location: "Kasir 1", status: "ONLINE", resolution: "1080p", brand: "Axis", fps: 25, koperasi: "KUD Mitra Tani" },
  { id: "c4", label: "CCTV-04", location: "Kasir 2", status: "OFFLINE", resolution: "1080p", brand: "Hikvision", fps: 0, koperasi: "KUD Mitra Tani" },
  { id: "c5", label: "CCTV-05", location: "Gudang", status: "ONLINE", resolution: "4K", brand: "Dahua", fps: 30, koperasi: "KUD Mitra Tani" },
  { id: "c6", label: "CCTV-06", location: "Ruang Server", status: "MAINTENANCE", resolution: "1080p", brand: "Axis", fps: 0, koperasi: "KUD Mitra Tani" },
  { id: "c7", label: "CCTV-07", location: "Area Parkir", status: "ONLINE", resolution: "1080p", brand: "Hikvision", fps: 25, koperasi: "KUD Mitra Tani" },
  { id: "c8", label: "CCTV-08", location: "Pintu Keluar", status: "ONLINE", resolution: "4K", brand: "Dahua", fps: 30, koperasi: "KUD Mitra Tani" },
];

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const statusConfig = {
    ONLINE: { bg: 'bg-green-950', text: 'text-green-400', border: 'border-green-700' },
    OFFLINE: { bg: 'bg-red-950', text: 'text-red-400', border: 'border-red-700' },
    MAINTENANCE: { bg: 'bg-yellow-950', text: 'text-yellow-400', border: 'border-yellow-700' },
  };
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OFFLINE;
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      {status}
    </span>
  );
}

export default function ManagemenCCTVPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedKoperasi, setExpandedKoperasi] = useState<string | null>(null);

  // Group CCTVs by koperasi
  const koperasiGroups = MOCK_CCTV_LIST.reduce((acc, cctv) => {
    if (!acc[cctv.koperasi]) {
      acc[cctv.koperasi] = [];
    }
    acc[cctv.koperasi].push(cctv);
    return acc;
  }, {} as Record<string, typeof MOCK_CCTV_LIST>);

  // Filter CCTVs based on search and status
  const filteredKoperasi = Object.entries(koperasiGroups).map(([koperasi, cctvs]) => ({
    koperasi,
    cctvs: cctvs.filter(cctv => {
      const matchesSearch = cctv.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cctv.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || cctv.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
  })).filter(item => item.cctvs.length > 0);

  const totalOnline = MOCK_CCTV_LIST.filter(c => c.status === 'ONLINE').length;
  const totalOffline = MOCK_CCTV_LIST.filter(c => c.status === 'OFFLINE').length;

  return (
    <div className="p-5 w-full h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Manajemen CCTV</h1>
        <p className="text-gray-400 text-sm">Kelola dan monitor semua perangkat CCTV di seluruh koperasi</p>
      </div>

      <div className="flex gap-3 mb-6 flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 min-w-0 w-full">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              placeholder="Cari CCTV atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-red-600 placeholder-gray-600"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-red-600"
          >
            <option value="all">Semua Status</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition whitespace-nowrap">
          <Plus size={16} /> Tambah CCTV
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-gray-800 bg-gray-900">
        <div className="divide-y divide-gray-800">
          {filteredKoperasi.length > 0 ? (
            filteredKoperasi.map((group) => (
              <div key={group.koperasi}>
                {/* Koperasi Header - Expandable */}
                <button
                  onClick={() => setExpandedKoperasi(expandedKoperasi === group.koperasi ? null : group.koperasi)}
                  className="w-full px-4 py-4 bg-gray-800 hover:bg-gray-700 transition flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform ${expandedKoperasi === group.koperasi ? 'rotate-180' : ''}`}
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{group.koperasi}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{group.cctvs.length} CCTV • {group.cctvs.filter(c => c.status === 'ONLINE').length} Online</p>
                    </div>
                  </div>
                </button>

                {/* CCTV List - Expandable Section */}
                {expandedKoperasi === group.koperasi && (
                  <div className="bg-gray-900">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800 border-t border-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Label</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Lokasi</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Resolusi</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Brand</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">FPS</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-300">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {group.cctvs.map((cctv) => (
                          <tr key={cctv.id} className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-3 text-white font-medium">{cctv.label}</td>
                            <td className="px-4 py-3 text-gray-400">{cctv.location}</td>
                            <td className="px-4 py-3"><StatusBadge status={cctv.status} /></td>
                            <td className="px-4 py-3 text-gray-400">{cctv.resolution}</td>
                            <td className="px-4 py-3 text-gray-400">{cctv.brand}</td>
                            <td className="px-4 py-3 text-gray-400">{cctv.fps}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button className="p-1.5 bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white rounded transition">
                                  <Eye size={14} />
                                </button>
                                <button className="p-1.5 bg-gray-800 hover:bg-yellow-600 text-gray-400 hover:text-white rounded transition">
                                  <Edit2 size={14} />
                                </button>
                                <button className="p-1.5 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white rounded transition">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              Tidak ada data CCTV
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Total CCTV</p>
          <p className="text-2xl font-bold text-white">{MOCK_CCTV_LIST.length}</p>
        </div>
        <div className="bg-gray-900 border border-green-800 rounded-lg p-4">
          <p className="text-green-400 text-xs font-semibold uppercase mb-2">Online</p>
          <p className="text-2xl font-bold text-green-400">{totalOnline}</p>
        </div>
        <div className="bg-gray-900 border border-red-800 rounded-lg p-4">
          <p className="text-red-400 text-xs font-semibold uppercase mb-2">Offline</p>
          <p className="text-2xl font-bold text-red-400">{totalOffline}</p>
        </div>
      </div>
    </div>
  );
}
