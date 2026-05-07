'use client';

import { useState, useMemo } from 'react';
import { Search, MapPin } from 'lucide-react';
import type { KoperasiSummary } from '@/lib/types';

interface KoperasiTableProps {
  koperasiList: KoperasiSummary[];
  onSelectKoperasi: (koperasi: KoperasiSummary) => void;
}

type SortKey = 'name' | 'city' | 'onlineCCTV' | 'totalCCTV';

/**
 * Koperasi list table with search, sort, and status visualization
 */
export default function KoperasiTable({
  koperasiList,
  onSelectKoperasi
}: Readonly<KoperasiTableProps>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter & Sort
  const filteredAndSorted = useMemo(() => {
    let filtered = koperasiList.filter(k =>
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.province.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];

      if (sortKey === 'name' || sortKey === 'city') {
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      const numComparison = Number(aVal) - Number(bVal);
      return sortOrder === 'asc' ? numComparison : -numComparison;
    });

    return filtered;
  }, [koperasiList, searchQuery, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (onlineCCTV: number, totalCCTV: number) => {
    const percentage = Math.round((onlineCCTV / totalCCTV) * 100);
    
    if (percentage === 100) {
      return { bg: 'bg-green-900', text: 'text-green-300', label: '✓ Semua Online' };
    } else if (percentage >= 75) {
      return { bg: 'bg-yellow-900', text: 'text-yellow-300', label: '⚠ Sebagian Offline' };
    }
    return { bg: 'bg-red-900', text: 'text-red-300', label: '✗ Banyak Offline' };
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Search Bar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Cari koperasi, kota, provinsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:border-red-600 placeholder-gray-600"
          />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">{filteredAndSorted.length} hasil</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-800">
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 cursor-pointer transition"
                onClick={() => handleSort('name')}>
                <div className="flex items-center gap-2">
                  Nama Koperasi {sortKey === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 cursor-pointer transition"
                onClick={() => handleSort('city')}>
                <div className="flex items-center gap-2">
                  <MapPin size={12} /> Kota {sortKey === 'city' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-gray-400">Provinsi</th>
              <th className="px-4 py-3 text-center font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-300 cursor-pointer transition"
                onClick={() => handleSort('onlineCCTV')}>
                CCTV {sortKey === 'onlineCCTV' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-4 py-3 text-center font-semibold uppercase tracking-wider text-gray-400">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((koperasi, idx) => {
              const { bg, text, label } = getStatusBadge(koperasi.onlineCCTV, koperasi.totalCCTV);
              return (
                <tr
                  key={koperasi.id}
                  className={`border-b border-gray-800 hover:bg-gray-800 transition ${
                    idx % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900'
                  }`}
                >
                  <td className="px-4 py-3 text-white font-semibold">{koperasi.name}</td>
                  <td className="px-4 py-3 text-gray-400">{koperasi.city}</td>
                  <td className="px-4 py-3 text-gray-400">{koperasi.province}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-green-400">{koperasi.onlineCCTV}</span>
                    <span className="text-gray-600">/</span>
                    <span className="font-bold text-gray-400">{koperasi.totalCCTV}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
                      {label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onSelectKoperasi(koperasi)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAndSorted.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-500 text-sm">Tidak ada koperasi yang cocok dengan pencarian</p>
          </div>
        )}
      </div>
    </div>
  );
}
