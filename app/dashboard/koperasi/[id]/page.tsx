'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KoperasiDetailHeader, CCTVDetailList, KoperasiInfoPanel } from '@/components/ui/KoperasiDetail';
import { CCTVLiveGrid } from '@/components/ui/CCTVLiveGrid';
import type { KoperasiSummary, CCTVItem } from '@/lib/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

interface KoperasiCCTVResponse {
  success: boolean;
  data: KoperasiSummary & {
    cctvs: CCTVItem[];
  };
}

async function fetchKoperasiDetail(id: string) {
  const response = await fetch(`/dashboard/api/koperasi/${id}/cctv`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Gagal mengambil data CCTV koperasi');
  }

  const payload = (await response.json()) as KoperasiCCTVResponse;
  if (!payload.success) {
    throw new Error('Response API CCTV tidak valid');
  }

  return payload.data;
}

/**
 * Detail page untuk single Koperasi
 * Shows CCTV list, status, dan informasi koperasi
 */
export default function KoperasiDetailPage({ params }: Readonly<PageProps>) {
  const [paramData, setParamData] = useState<{ id: string } | null>(null);

  // Resolve params
  useEffect(() => {
    params.then(p => setParamData(p));
  }, [params]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['koperasi-detail', paramData?.id],
    queryFn: () => fetchKoperasiDetail(paramData!.id),
    enabled: Boolean(paramData?.id),
  });

  const koperasi = data ?? null;
  const cctvList: CCTVItem[] = data?.cctvs || [];

  if (isLoading || !paramData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Memuat data koperasi...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-400 text-lg">Gagal memuat data CCTV</p>
          <p className="text-gray-500 text-sm mt-2">Periksa koneksi server dan konfigurasi kamera.</p>
        </div>
      </div>
    );
  }

  if (!koperasi) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Koperasi tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950 p-5 overflow-y-auto">
        <KoperasiDetailHeader koperasi={koperasi} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Live CCTV Grid */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <CCTVLiveGrid cctvList={cctvList} />
          </div>

          {/* CCTV Details & Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* CCTV List - Main */}
            <div className="lg:col-span-2">
              <CCTVDetailList cctvList={cctvList} />
            </div>

            {/* Sidebar - Info */}
            <div>
              <KoperasiInfoPanel koperasi={koperasi} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
