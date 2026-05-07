'use client';

import { ChevronLeft, MapPin, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { KoperasiSummary, CCTVItem, CCTVStatus } from '@/lib/types';

interface KoperasiDetailHeaderProps {
  koperasi: KoperasiSummary;
}

/**
 * Koperasi detail header with key information and status summary
 */
export function KoperasiDetailHeader({ koperasi }: Readonly<KoperasiDetailHeaderProps>) {
  const onlinePercentage = Math.round((koperasi.onlineCCTV / koperasi.totalCCTV) * 100);

  let progressColor = 'bg-red-500';
  let statusBgColor = 'bg-red-900 text-red-300';
  
  if (onlinePercentage === 100) {
    progressColor = 'bg-green-500';
    statusBgColor = 'bg-green-900 text-green-300';
  } else if (onlinePercentage >= 75) {
    progressColor = 'bg-yellow-500';
    statusBgColor = 'bg-yellow-900 text-yellow-300';
  }

  return (
    <div className="space-y-4">
      {/* Back Button & Title */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition">
            <ChevronLeft size={20} className="text-gray-400 hover:text-white" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{koperasi.name}</h1>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            <MapPin size={14} /> {koperasi.city}, {koperasi.province}
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs uppercase MB-1">Total CCTV</p>
          <p className="text-2xl font-bold text-white">{koperasi.totalCCTV}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs uppercase mb-1">Online</p>
          <p className="text-2xl font-bold text-green-400">{koperasi.onlineCCTV}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs uppercase mb-1">Offline</p>
          <p className="text-2xl font-bold text-red-400">{koperasi.totalCCTV - koperasi.onlineCCTV}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-3">
          <p className="text-gray-500 text-xs uppercase mb-1">Status</p>
          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${statusBgColor}`}>
            {onlinePercentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm font-medium">CCTV Status</span>
          <span className="text-white text-sm font-semibold">{koperasi.onlineCCTV}/{koperasi.totalCCTV} Online</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${progressColor}`}
            style={{ width: `${onlinePercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * CCTV status icon component
 */
function CCTVStatusIcon({ status }: Readonly<{ status: CCTVStatus }>) {
  if (status === 'ONLINE') return <Wifi size={14} className="text-green-400" />;
  if (status === 'OFFLINE') return <WifiOff size={14} className="text-red-400" />;
  if (status === 'MAINTENANCE') return <AlertTriangle size={14} className="text-yellow-400" />;
  return null;
}

interface CCTVListProps {
  cctvList: CCTVItem[];
}

/**
 * CCTV list with status badges and IP information
 */
export function CCTVDetailList({ cctvList }: Readonly<CCTVListProps>) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        📹 Daftar CCTV ({cctvList.length} Titik)
      </h3>

      {cctvList.map((cctv) => {
        const statusConfig = {
          ONLINE: { bg: 'bg-green-900', text: 'text-green-300', label: 'Online' },
          OFFLINE: { bg: 'bg-red-900', text: 'text-red-300', label: 'Offline' },
          MAINTENANCE: { bg: 'bg-yellow-900', text: 'text-yellow-300', label: 'Maintenance' }
        };
        const config = statusConfig[cctv.status];
        const activeIP = cctv.activeIpCctv || (cctv.ipCctvs && cctv.ipCctvs.length > 0 ? cctv.ipCctvs[0] : null);

        return (
          <div
            key={cctv.id}
            className="bg-gray-900 border border-gray-800 hover:border-red-800 rounded-lg p-4 transition"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
                  <CCTVStatusIcon status={cctv.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{cctv.label}</p>
                  <p className="text-gray-500 text-xs">{cctv.location}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} whitespace-nowrap`}>
                {config.label}
              </span>
            </div>

            {/* CCTV Details */}
            <div className="grid grid-cols-4 gap-2 text-xs mb-3">
              <div>
                <p className="text-gray-500 mb-0.5">Resolusi</p>
                <p className="text-gray-300 font-medium">{cctv.resolution || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Brand</p>
                <p className="text-gray-300 font-medium">{cctv.brand || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">FPS</p>
                <p className="text-gray-300 font-medium">{cctv.fps > 0 ? `${cctv.fps} fps` : '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Uptime</p>
                <p className="text-green-400 font-medium text-xs">99.2%</p>
              </div>
            </div>

            {/* IP Address Section */}
            {activeIP && (
              <div className="bg-gray-800 rounded-lg p-3 mb-3 border border-gray-700">
                <p className="text-gray-500 text-xs uppercase mb-2 font-semibold">📡 IP Aktif</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">IP Address:</span>
                    <span className="text-blue-400 font-mono font-semibold">{activeIP.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Port:</span>
                    <span className="text-gray-300 font-mono">{activeIP.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Protocol:</span>
                    <span className="text-gray-300 font-mono">{activeIP.protocol}</span>
                  </div>
                  {activeIP.username && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Username:</span>
                      <span className="text-gray-300 font-mono">{activeIP.username}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded transition">
                View Stream
              </button>
              <button className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition">
                View Recording
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Additional info panel (coordinates, contact, etc.)
 */
export function KoperasiInfoPanel({ koperasi }: Readonly<{ koperasi: KoperasiSummary }>) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-lg font-semibold text-white">Informasi Koperasi</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-2 border-b border-gray-800">
          <span className="text-gray-500">Nama</span>
          <span className="text-gray-300 font-medium">{koperasi.name}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-800">
          <span className="text-gray-500">Kota</span>
          <span className="text-gray-300 font-medium">{koperasi.city}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-800">
          <span className="text-gray-500">Provinsi</span>
          <span className="text-gray-300 font-medium">{koperasi.province}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-800">
          <span className="text-gray-500">Koordinat</span>
          <span className="text-gray-300 font-medium text-right">{koperasi.lat.toFixed(4)}, {koperasi.lng.toFixed(4)}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-500">Total CCTV</span>
          <span className="text-gray-300 font-medium">{koperasi.totalCCTV} Unit</span>
        </div>
      </div>

      <button className="w-full mt-4 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition">
        Edit Informasi
      </button>
    </div>
  );
}
