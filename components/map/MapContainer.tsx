"use client";

import dynamic from "next/dynamic";
import type { Koperasi } from "@/lib/types";

// ─── Dynamic import — ssr:false wajib karena Leaflet butuh `window` ───────────
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <MapSkeleton message="Memuat peta..." />,
});

// ─── Skeleton / fallback states ───────────────────────────────────────────────
function MapSkeleton({ message }: { message: string }) {
  return (
    <div className="w-full h-full bg-gray-900 rounded-xl border border-gray-800 flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

function MapError() {
  return (
    <div className="w-full h-full bg-gray-900 rounded-xl border border-red-900/60 flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 bg-red-950 rounded-full flex items-center justify-center text-red-400 text-2xl">!</div>
      <p className="text-red-400 text-sm font-semibold">Gagal memuat data peta</p>
      <p className="text-gray-500 text-xs">Periksa koneksi atau coba refresh halaman</p>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
type MapContainerProps = {
  koperasiList:     Koperasi[];
  selectedKoperasi: Koperasi | null;
  onMarkerClick:    (koperasi: Koperasi) => void;
  isLoading?:       boolean;
  isError?:         boolean;
};

// ─── Wrapper ──────────────────────────────────────────────────────────────────
export default function MapContainer({
  koperasiList,
  selectedKoperasi,
  onMarkerClick,
  isLoading = false,
  isError   = false,
}: MapContainerProps) {
  if (isLoading) return <MapSkeleton message="Mengambil data koperasi..." />;
  if (isError)   return <MapError />;

  return (
    <LeafletMap
      koperasiList={koperasiList}
      selectedKoperasi={selectedKoperasi}
      onMarkerClick={onMarkerClick}
    />
  );
}