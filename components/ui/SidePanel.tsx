'use client';

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  LayoutDashboard, MapPin, Camera, Video, Settings,
  Bell, ChevronRight, Menu, X,
  Wifi, WifiOff, AlertTriangle, Circle, Search,
  RefreshCw, Shield, Building2
} from "lucide-react";
import { CCTVStatus } from "@/lib/types";


type KoperasiSummary = {
  id: string;
  name: string;
  city: string;
  province: string;
  onlineCCTV: number;
  totalCCTV: number;
  lat: number;
  lng: number;
};

type CCTVItem = {
  id: string;
  label: string;
  location: string;
  status: CCTVStatus;
  resolution: string;
  brand: string;
  fps: number;
};

const CCTV_LIST: CCTVItem[] = [
  { id: "c1", label: "CCTV-01", location: "Pintu Masuk Utama", status: "ONLINE",  resolution: "4K",    brand: "Hikvision", fps: 30 },
  { id: "c2", label: "CCTV-02", location: "Lobby",              status: "ONLINE",  resolution: "1080p", brand: "Dahua",     fps: 25 },
  { id: "c3", label: "CCTV-03", location: "Kasir 1",            status: "ONLINE",  resolution: "1080p", brand: "Axis",      fps: 25 },
  { id: "c4", label: "CCTV-04", location: "Kasir 2",            status: "OFFLINE", resolution: "1080p", brand: "Hikvision", fps: 0  },
  { id: "c5", label: "CCTV-05", location: "Gudang",             status: "ONLINE",  resolution: "4K",    brand: "Dahua",     fps: 30 },
  { id: "c6", label: "CCTV-06", location: "Ruang Server",       status: "MAINTENANCE", resolution: "1080p", brand: "Axis", fps: 0 },
  { id: "c7", label: "CCTV-07", location: "Area Parkir",        status: "ONLINE",  resolution: "1080p", brand: "Hikvision", fps: 25 },
  { id: "c8", label: "CCTV-08", location: "Pintu Keluar",       status: "ONLINE",  resolution: "4K",    brand: "Dahua",     fps: 30 },
];
function StatusBadge({ status }: Readonly<{ status: CCTVStatus }>) {
  const config = {
    ONLINE:      { label: "Online",      class: "bg-green-900 text-green-300 border border-green-700" },
    OFFLINE:     { label: "Offline",     class: "bg-red-900 text-red-300 border border-red-700" },
    MAINTENANCE: { label: "Maintenance", class: "bg-yellow-900 text-yellow-300 border border-yellow-700" },
  };
  const c = config[status] ?? config.OFFLINE;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.class}`}>
      {c.label}
    </span>
  );
}

function SidePanel({ koperasi, onClose }: Readonly<{ koperasi: KoperasiSummary | null; onClose: () => void }>) {
  const [activeTab, setActiveTab] = useState<"cctv" | "info">("cctv");
  if (!koperasi) return null;
  const onlineCount = koperasi.onlineCCTV;
  const pct = Math.round((onlineCount / koperasi.totalCCTV) * 100);
  let progressColorClass = "bg-red-500";
  if (pct === 100) {
    progressColorClass = "bg-green-500";
  } else if (pct >= 75) {
    progressColorClass = "bg-yellow-500";
  }

  const tabItems: ReadonlyArray<{ key: "cctv" | "info"; label: string }> = [
    { key: "cctv", label: "Daftar CCTV" },
    { key: "info", label: "Info Koperasi" },
  ];

  return (
    <div className="w-96 shrink-0 bg-gray-950 border-l border-red-900 flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-800">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-900 rounded-lg flex items-center justify-center">
              <Building2 size={16} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">{koperasi.name}</h2>
              <p className="text-gray-500 text-xs">{koperasi.city}, {koperasi.province}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition">
            <X size={14} />
          </button>
        </div>
        {/* Progress CCTV Online */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">Status CCTV</span>
            <span className="text-white font-semibold">{onlineCount}/{koperasi.totalCCTV} Online</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${progressColorClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {tabItems.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition border-b-2
              ${activeTab === key ? "text-red-400 border-red-500" : "text-gray-500 border-transparent hover:text-gray-300"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "cctv" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-xs uppercase font-semibold tracking-wider">8 Titik CCTV</p>
              <button className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            {CCTV_LIST.map((cctv) => {
              let cameraBgClass = "bg-yellow-900";
              let cameraIconClass = "text-yellow-400";
              if (cctv.status === "ONLINE") {
                cameraBgClass = "bg-green-900";
                cameraIconClass = "text-green-400";
              } else if (cctv.status === "OFFLINE") {
                cameraBgClass = "bg-red-900";
                cameraIconClass = "text-red-400";
              }

              return (
                <div key={cctv.id} className="bg-gray-900 border border-gray-800 hover:border-red-900 rounded-xl p-3 cursor-pointer transition group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cameraBgClass}`}>
                        <Camera size={14} className={cameraIconClass} />
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">{cctv.label}</p>
                        <p className="text-gray-500 text-xs">{cctv.location}</p>
                      </div>
                    </div>
                    <StatusBadge status={cctv.status} />
                  </div>
                  <div className="mt-2 flex gap-3 text-xs text-gray-600">
                    <span>{cctv.resolution}</span>
                    <span>·</span>
                    <span>{cctv.brand}</span>
                    {cctv.fps > 0 && <><span>·</span><span>{cctv.fps}fps</span></>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {activeTab === "info" && (
          <div className="space-y-3 text-xs">
            {[
              ["Nama Koperasi", koperasi.name],
              ["Kota", koperasi.city],
              ["Provinsi", koperasi.province],
              ["Koordinat", `-6.20°, 106.84°`],
              ["Total CCTV", `${koperasi.totalCCTV} Unit`],
              ["CCTV Online", `${koperasi.onlineCCTV} Unit`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-800">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-200 font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div className="p-3 border-t border-gray-800">
        <button className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2">
          <Video size={14} /> Lihat Rekaman CCTV
        </button>
      </div>
    </div>
  );
}

export default SidePanel
