'use client';

import { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, MapPin } from 'lucide-react';
import type { KoperasiSummary } from '@/lib/types';

interface KoperasiMapProps {
  koperasiList: KoperasiSummary[];
  selectedKoperasi: KoperasiSummary | null;
  onSelectKoperasi: (koperasi: KoperasiSummary | null) => void;
}

// Leaflet loader singleton
let leafletLoader: Promise<void> | null = null;

const DEFAULT_CENTER: [number, number] = [-7.1, 110.5];
const DEFAULT_ZOOM = 8;

// Ensure link tag in document
const ensureLink = (href: string) => {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }
};

// Ensure script tag in document
const ensureScript = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${src}"]`);

    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === 'true') {
        resolve();
      } else {
        existing.addEventListener('load', () => resolve(), { once: true });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.loaded = 'false';
    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
        resolve();
      },
      { once: true }
    );
    document.head.appendChild(script);
  });
};

// Ensure Leaflet assets are loaded
async function ensureLeafletAssets(): Promise<void> {
  if (globalThis.window === undefined) return;

  const win = globalThis.window as unknown as { L?: any };
  if (win.L) return;
  if (leafletLoader !== null) return leafletLoader;

  leafletLoader = (async () => {
    ensureLink('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    await ensureScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
  })();

  return leafletLoader;
}

export default function KoperasiMap({
  koperasiList,
  selectedKoperasi,
  onSelectKoperasi
}: Readonly<KoperasiMapProps>) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [mapReady, setMapReady] = useState(false);

  // Create marker icon
  const createMarkerIcon = (status: 'online' | 'partial' | 'offline', isSelected: boolean) => {
    const L = (globalThis.window as any).L;
    if (!L) return undefined;

    const colorMap = {
      online: '#22c55e',
      partial: '#eab308',
      offline: '#ef4444',
    };
    const color = colorMap[status];
    const scale = isSelected ? 1.5 : 1;

    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background: ${color};
          width: ${20 * scale}px;
          height: ${20 * scale}px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          cursor: pointer;
        ">
          <div style="
            width: ${6 * scale}px;
            height: ${6 * scale}px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [20 * scale, 20 * scale],
      iconAnchor: [10 * scale, 10 * scale],
      popupAnchor: [0, -10 * scale],
    });
  };

  // Initialize map once on mount
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      await ensureLeafletAssets();
      if (!isMounted || !mapContainerRef.current) return;

      const L = (globalThis.window as any).L;
      const map = L.map(mapContainerRef.current, { 
        preferCanvas: true,
        zoomControl: false,
        attributionControl: true
      }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

      // Add satellite tile layer from Esri
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Esri',
          maxZoom: 19,
          minZoom: 4
        }
      ).addTo(map);

      mapRef.current = map;
      setMapReady(true);

      map.whenReady(() => {
        map.invalidateSize();
      });
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const L = (globalThis.window as any).L;

    const nextIds = new Set<string>();

    // Add new markers
    koperasiList.forEach((koperasi) => {
      nextIds.add(koperasi.id);
      let statusKey: 'online' | 'partial' | 'offline';
      if (koperasi.onlineCCTV === koperasi.totalCCTV) {
        statusKey = 'online';
      } else if (koperasi.onlineCCTV > 0) {
        statusKey = 'partial';
      } else {
        statusKey = 'offline';
      }

      const isSelected = selectedKoperasi?.id === koperasi.id;
      const popupHtml = (() => {
        const offlineCCTV = koperasi.totalCCTV - koperasi.onlineCCTV;
        const uptimePercent = koperasi.totalCCTV > 0
          ? Math.round((koperasi.onlineCCTV / koperasi.totalCCTV) * 100)
          : 0;

        return `
          <div style="font-family: system-ui;">
            <h4 style="margin: 0 0 8px; color: #1f2937; font-size: 14px; font-weight: 600;">
              ${koperasi.name}
            </h4>
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">
              📍 ${koperasi.city}, ${koperasi.province}
            </p>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; margin-bottom: 10px; font-size: 12px;">
              <span style="color: #374151; font-weight: 600;">Total CCTV</span>
              <span style="text-align: right; color: #111827; font-weight: 600;">${koperasi.totalCCTV}</span>
              <span style="color: #16a34a; font-weight: 600;">Online</span>
              <span style="text-align: right; color: #16a34a; font-weight: 600;">${koperasi.onlineCCTV}</span>
              <span style="color: #dc2626; font-weight: 600;">Offline</span>
              <span style="text-align: right; color: #dc2626; font-weight: 600;">${offlineCCTV}</span>
              <span style="color: #6b7280; font-weight: 600;">Uptime</span>
              <span style="text-align: right; color: #374151; font-weight: 600;">${uptimePercent}%</span>
            </div>
            <a
              href="/dashboard/koperasi/${koperasi.id}"
              style="display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 8px 10px; background: #dc2626; color: #ffffff; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none;"
            >
              Lihat Detail Koperasi
            </a>
          </div>
        `;
      })();

      const icon = createMarkerIcon(statusKey, isSelected);
      const existingMarker = markersRef.current[koperasi.id];

      if (existingMarker) {
        existingMarker.setIcon(icon);
        existingMarker.bindPopup(popupHtml, { maxWidth: 260 });
        existingMarker.off('click');
        existingMarker.on('click', () => {
          onSelectKoperasi(isSelected ? null : koperasi);
          existingMarker.openPopup();
        });
        return;
      }

      const marker = L.marker([koperasi.lat, koperasi.lng], {
        icon,
      });

      marker.bindPopup(popupHtml, { maxWidth: 260 });
      marker.on('click', () => {
        onSelectKoperasi(isSelected ? null : koperasi);
        marker.openPopup();
      });

      marker.addTo(mapRef.current);
      markersRef.current[koperasi.id] = marker;
    });

    Object.keys(markersRef.current).forEach((id) => {
      if (!nextIds.has(id)) {
        const marker = markersRef.current[id];
        if (mapRef.current.hasLayer(marker)) {
          mapRef.current.removeLayer(marker);
        }
        delete markersRef.current[id];
      }
    });
  }, [koperasiList, selectedKoperasi, mapReady, onSelectKoperasi, createMarkerIcon]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (mapRef.current) {
      const zoom = mapRef.current.getZoom();
      mapRef.current.setZoom(direction === 'in' ? zoom + 1 : zoom - 1);
    }
  };


  return (
    <div className="relative w-full bg-slate-900 rounded-xl border border-gray-800 overflow-hidden" style={{ height: '600px' }}>
      <div ref={mapContainerRef} className="h-full w-full" />

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/70 z-10">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-300 text-sm mt-2">Memuat peta...</p>
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button
          onClick={() => handleZoom('in')}
          className="w-8 h-8 bg-gray-950 border border-gray-700 text-gray-300 rounded-lg hover:border-red-600 hover:text-white transition flex items-center justify-center shadow-md"
          title="Zoom in"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="w-8 h-8 bg-gray-950 border border-gray-700 text-gray-300 rounded-lg hover:border-red-600 hover:text-white transition flex items-center justify-center shadow-md"
          title="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
      </div>

      {/* Header */}
      <div className="absolute top-3 left-3 z-20 bg-gray-950 border border-red-800 rounded-lg px-3 py-1.5 shadow-md">
        <p className="text-red-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1">
          <MapPin size={12} /> 🇮🇩 Peta Indonesia
        </p>
        <p className="text-gray-500 text-xs">{koperasiList.length} Koperasi</p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-20 bg-gray-950 border border-gray-800 rounded-lg p-3 shadow-md">
        <p className="text-gray-400 text-xs font-semibold mb-2 uppercase">Status</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-gray-400 text-xs">Online</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span className="text-gray-400 text-xs">Bermasalah</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-gray-400 text-xs">Offline</span>
          </div>
        </div>
      </div>

      <style>{`
        .leaflet-container {
          background: #111827 !important;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .leaflet-attribution {
          background: rgba(0, 0, 0, 0.6) !important;
          border-radius: 4px !important;
          padding: 3px 6px !important;
          font-size: 10px !important;
          color: #888 !important;
        }
        .leaflet-attribution a {
          color: #0066cc !important;
        }
        .leaflet-popup-content-wrapper {
          background: #f9fafb !important;
          border-radius: 6px !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid #e5e7eb !important;
        }
        .leaflet-popup-tip {
          background: #f9fafb !important;
          border: 1px solid #e5e7eb !important;
        }
        .leaflet-popup-close-button {
          color: #6b7280 !important;
          opacity: 0.7 !important;
        }
        .leaflet-popup-close-button:hover {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
