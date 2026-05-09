'use client';

import { useState } from 'react';
import { Search, Download, Trash2, Play, Calendar, ChevronDown } from 'lucide-react';

interface RecordingItem {
  id: string;
  cctvLabel: string;
  location: string;
  koperasi: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  size: string;
  quality: string;
}

// Mock recording data
const MOCK_RECORDINGS: RecordingItem[] = [
  { id: "rec1", cctvLabel: "CCTV-01", location: "Pintu Masuk Utama", koperasi: "KSP Sejahtera Mandiri", date: "2026-04-07", startTime: "08:00", endTime: "16:00", duration: "8h", size: "2.4 GB", quality: "4K" },
  { id: "rec2", cctvLabel: "CCTV-02", location: "Lobby", koperasi: "KSP Sejahtera Mandiri", date: "2026-04-07", startTime: "08:00", endTime: "16:00", duration: "8h", size: "1.8 GB", quality: "1080p" },
  { id: "rec3", cctvLabel: "CCTV-03", location: "Kasir 1", koperasi: "KUD Mitra Tani", date: "2026-04-07", startTime: "08:00", endTime: "16:00", duration: "8h", size: "1.8 GB", quality: "1080p" },
  { id: "rec4", cctvLabel: "CCTV-05", location: "Gudang", koperasi: "Kopkar Nusantara", date: "2026-04-07", startTime: "08:00", endTime: "16:00", duration: "8h", size: "2.4 GB", quality: "4K" },
  { id: "rec5", cctvLabel: "CCTV-07", location: "Area Parkir", koperasi: "KSP Bumi Artha", date: "2026-04-06", startTime: "20:00", endTime: "04:00", duration: "8h", size: "1.8 GB", quality: "1080p" },
  { id: "rec6", cctvLabel: "CCTV-08", location: "Pintu Keluar", koperasi: "KUD Karya Bersama", date: "2026-04-06", startTime: "20:00", endTime: "04:00", duration: "8h", size: "2.4 GB", quality: "4K" },
];

function QualityBadge({ quality }: Readonly<{ quality: string }>) {
  const qualityConfig = {
    "4K": "bg-blue-950 text-blue-400 border-blue-700",
    "1080p": "bg-gray-800 text-gray-300 border-gray-700",
    "720p": "bg-gray-800 text-gray-300 border-gray-700",
  };
  const config = qualityConfig[quality as keyof typeof qualityConfig] || qualityConfig["1080p"];
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${config}`}>
      {quality}
    </span>
  );
}

export default function RekamananPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState<string>('');
  const [expandedKoperasi, setExpandedKoperasi] = useState<string | null>(null);

  const filteredRecordings = MOCK_RECORDINGS.filter(recording => {
    const matchesSearch = 
      recording.cctvLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.koperasi.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = !filterDate || recording.date === filterDate;
    return matchesSearch && matchesDate;
  });

  const koperasiGroups = filteredRecordings.reduce((acc, recording) => {
    if (!acc[recording.koperasi]) {
      acc[recording.koperasi] = [];
    }
    acc[recording.koperasi].push(recording);
    return acc;
  }, {} as Record<string, RecordingItem[]>);

  const filteredKoperasi = Object.entries(koperasiGroups).map(([koperasi, recordings]) => ({
    koperasi,
    recordings,
  }));

  const getGroupSize = (recordings: RecordingItem[]) => {
    return recordings
      .reduce((sum, rec) => sum + Number.parseFloat(rec.size), 0)
      .toFixed(2);
  };

  // Calculate total size
  const totalSize = MOCK_RECORDINGS.reduce((sum, rec) => {
    const sizeInGB = Number.parseFloat(rec.size);
    return sum + sizeInGB;
  }, 0).toFixed(2);

  return (
    <div className="p-5 w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Manajemen Rekaman</h1>
        <p className="text-gray-400 text-sm">Lihat dan kelola rekaman video dari semua CCTV yang tersedia</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Total Rekaman</p>
          <p className="text-2xl font-bold text-white">{MOCK_RECORDINGS.length}</p>
        </div>
        <div className="bg-gray-900 border border-blue-800 rounded-lg p-4">
          <p className="text-blue-400 text-xs font-semibold uppercase mb-2">Total Ukuran</p>
          <p className="text-2xl font-bold text-blue-400">{totalSize} GB</p>
        </div>
        <div className="bg-gray-900 border border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-400 text-xs font-semibold uppercase mb-2">Hari Ini</p>
          <p className="text-2xl font-bold text-yellow-400">{MOCK_RECORDINGS.filter(r => r.date === '2026-04-07').length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-6 flex-col sm:flex-row items-start sm:items-center">
        <div className="w-full sm:flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            placeholder="Cari CCTV atau lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-red-600 placeholder-gray-600"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded-lg pl-10 pr-3 py-2.5 focus:outline-none focus:border-red-600"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-gray-800 bg-gray-900">
        <div className="divide-y divide-gray-800">
          {filteredKoperasi.length > 0 ? (
            filteredKoperasi.map((group) => (
              <div key={group.koperasi}>
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
                      <p className="text-gray-400 text-xs mt-0.5">
                        {group.recordings.length} Rekaman • {getGroupSize(group.recordings)} GB
                      </p>
                    </div>
                  </div>
                </button>

                {expandedKoperasi === group.koperasi && (
                  <div className="bg-gray-900">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800 border-t border-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">CCTV</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Lokasi</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Tanggal</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Waktu</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Durasi</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Ukuran</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-300">Kualitas</th>
                          <th className="px-4 py-3 text-center font-semibold text-gray-300">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {group.recordings.map((recording) => (
                          <tr key={recording.id} className="hover:bg-gray-800/50 transition">
                            <td className="px-4 py-3 text-white font-medium">{recording.cctvLabel}</td>
                            <td className="px-4 py-3 text-gray-400">{recording.location}</td>
                            <td className="px-4 py-3 text-gray-400">{recording.date}</td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{recording.startTime} - {recording.endTime}</td>
                            <td className="px-4 py-3 text-gray-400">{recording.duration}</td>
                            <td className="px-4 py-3 text-gray-400">{recording.size}</td>
                            <td className="px-4 py-3"><QualityBadge quality={recording.quality} /></td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button className="p-1.5 bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white rounded transition" title="Play">
                                  <Play size={14} />
                                </button>
                                <button className="p-1.5 bg-gray-800 hover:bg-green-600 text-gray-400 hover:text-white rounded transition" title="Download">
                                  <Download size={14} />
                                </button>
                                <button className="p-1.5 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white rounded transition" title="Delete">
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
              Tidak ada data rekaman
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
