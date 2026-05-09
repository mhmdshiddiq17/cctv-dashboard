'use client';

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import KoperasiMap from "@/components/map/KoperasiMap";
import KoperasiTable from "@/components/ui/KoperasiTable";
import type { KoperasiSummary } from "@/lib/types";
import { KOPERASI_LIST } from "@/lib/const";
import { useRouter } from "next/navigation";

type StatColor = "red" | "green" | "yellow" | "gray";

// ─── STAT CARD ────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: Readonly<{ label: string; value: string; sub?: string; color: StatColor }>) {
  const colors = {
    red:    "border-red-700 bg-red-950",
    green:  "border-green-700 bg-green-950",
    yellow: "border-yellow-700 bg-yellow-950",
    gray:   "border-gray-700 bg-gray-900",
  };
  const textColors = { red: "text-red-400", green: "text-green-400", yellow: "text-yellow-400", gray: "text-gray-300" };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const [pingResult, setPingResult] = useState<{ success: boolean; latency?: number; error?: string } | null>(null);
  const [selectedKoperasi, setSelectedKoperasi] = useState<KoperasiSummary | null>(null);
  const router = useRouter();

  // Calculate stats
  const totalCCTV = KOPERASI_LIST.reduce((sum, k) => sum + k.totalCCTV, 0);
  const onlineCCTV = KOPERASI_LIST.reduce((sum, k) => sum + k.onlineCCTV, 0);
  const offlineCCTV = totalCCTV - onlineCCTV;

  const handleSelectKoperasi = (koperasi: KoperasiSummary) => {
    router.push(`/dashboard/koperasi/${koperasi.id}`);
  };

  const handleRefresh = async () => {
    try {
      const res = await fetch('/dashboard/api/ping');
      const data = await res.json();
      setPingResult(data);
    } catch (err) {
      setPingResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  return (
    <>
      {/* Stat Bar */}
      <div className="grid grid-cols-4 gap-3 px-5 py-3 border-b border-gray-800 bg-gray-950">
        <StatCard label="Total Koperasi" value={String(KOPERASI_LIST.length)} sub="Seluruh Indonesia" color="gray" />
        <StatCard label="CCTV Online" value={String(onlineCCTV)} sub={`dari ${totalCCTV} unit`} color="green" />
        <StatCard label="CCTV Offline" value={String(offlineCCTV)} sub="Perlu penanganan" color="red" />
        <div className={`rounded-xl border p-4 ${pingResult?.success ? 'border-green-700 bg-green-950' : 'border-red-700 bg-red-950'}`}>
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Server Status</p>
          <p className={`text-2xl font-bold ${pingResult?.success ? 'text-green-400' : 'text-red-400'}`}>
            {pingResult?.success ? 'Online' : 'Offline'}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {pingResult?.success 
              ? pingResult?.latency 
                ? `${pingResult.latency}ms latency`
                : 'Connected'
              : pingResult?.error || 'Connection failed'
            }
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 py-3 border-b border-gray-800 bg-gray-950 flex items-center justify-end">
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-gray-400 hover:text-white transition text-sm"
          title="Refresh server status"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <KoperasiMap
          koperasiList={KOPERASI_LIST}
          selectedKoperasi={selectedKoperasi}
          onSelectKoperasi={(koperasi: KoperasiSummary | null) => {
            setSelectedKoperasi(koperasi);
          }}
        />
        <KoperasiTable
          koperasiList={KOPERASI_LIST}
          onSelectKoperasi={handleSelectKoperasi}
        />
      </div>
    </>
  );
}