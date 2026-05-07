"use client";

import { useEffect, useRef } from "react";
import type { Koperasi } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────
type LeafletMapProps = {
  koperasiList:     Koperasi[];
  selectedKoperasi: Koperasi | null;
  onMarkerClick:    (koperasi: Koperasi) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [-2.5, 118.0];
const DEFAULT_ZOOM   = 5;
const LEAFLET_CSS    = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS     = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// ─── Leaflet Loader (singleton promise — load sekali, reuse selamanya) ────────
let leafletLoader: Promise<void> | null = null;

const ensureLink = (href: string): void => {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link  = document.createElement("link");
    link.rel    = "stylesheet";
    link.href   = href;
    document.head.appendChild(link);
  }
};

const ensureScript = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === "true") {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve(), { once: true });
      }
      return;
    }
    const script        = document.createElement("script");
    script.src          = src;
    script.async        = false;
    script.dataset.loaded = "false";
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    document.head.appendChild(script);
  });
};

async function ensureLeafletAssets(): Promise<void> {
  if (typeof window === "undefined") return;
  const win = window as unknown as { L?: unknown };
  if (win.L) return;
  if (leafletLoader !== null) return leafletLoader;
  leafletLoader = (async () => {
    ensureLink(LEAFLET_CSS);
    await ensureScript(LEAFLET_JS);
  })();
  return leafletLoader;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const escapeHtml = (str: string): string =>
  str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const hasCoordinate = (
  k: Koperasi
): k is Koperasi & { latitude: number; longitude: number } =>
  k.latitude !== null && k.longitude !== null;

// ─── Marker Status ────────────────────────────────────────────────────────────
type MarkerStatus = {
  label:       string;
  fillColor:   string;
  borderColor: string;
  glowColor:   string;
};

function getMarkerStatus(koperasi: Koperasi): MarkerStatus {
  const total  = koperasi._count?.cctvs ?? 8;
  const online = koperasi.onlineCCTV    ?? total;
  const ratio  = total > 0 ? online / total : 0;

  if (ratio === 1) {
    return {
      label:       "Semua Online",
      fillColor:   "#ef4444",   // merah Indonesia
      borderColor: "#ffffff",
      glowColor:   "#ef4444",
    };
  }
  if (ratio >= 0.5) {
    return {
      label:       `${online}/${total} Online`,
      fillColor:   "#eab308",   // kuning warning
      borderColor: "#ffffff",
      glowColor:   "#eab308",
    };
  }
  return {
    label:       `${online}/${total} Online`,
    fillColor:   "#6b7280",   // abu kritis
    borderColor: "#d1d5db",
    glowColor:   "#6b7280",
  };
}

// ─── Custom SVG DivIcon ───────────────────────────────────────────────────────
function createDivIcon(L: any, status: MarkerStatus, isSelected: boolean): any {
  const size   = isSelected ? 42 : 34;
  const height = size + 10;

  const svg = `
    <svg width="${size}" height="${height}" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-30%" y="-10%" width="160%" height="150%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${status.glowColor}" flood-opacity="0.5"/>
        </filter>
      </defs>
      <!-- Drop shadow ellipse -->
      <ellipse cx="17" cy="42" rx="7" ry="2.5" fill="rgba(0,0,0,0.35)"/>
      <!-- Pin body -->
      <path
        d="M17 2 C9 2 2 9 2 17 C2 26 17 42 17 42 C17 42 32 26 32 17 C32 9 25 2 17 2Z"
        fill="${status.fillColor}"
        stroke="${status.borderColor}"
        stroke-width="${isSelected ? 2.5 : 1.8}"
        filter="url(#shadow)"
      />
      <!-- Inner circle -->
      <circle cx="17" cy="16" r="8.5" fill="rgba(0,0,0,0.22)"/>
      <!-- Camera body -->
      <rect x="10.5" y="13" width="13" height="8.5" rx="2" fill="white" opacity="0.95"/>
      <!-- Camera lens -->
      <circle cx="17" cy="17.2" r="2.8" fill="${status.fillColor}"/>
      <circle cx="17" cy="17.2" r="1.2" fill="white" opacity="0.6"/>
      <!-- Camera flash bump -->
      <rect x="20" y="11.5" width="3.5" height="2.5" rx="1" fill="white" opacity="0.9"/>
      ${isSelected ? `<circle cx="17" cy="16" r="12.5" fill="none" stroke="${status.fillColor}" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.6"/>` : ""}
    </svg>
  `;

  return L.divIcon({
    html:        svg,
    className:   "",          // kosong — hindari default Leaflet class
    iconSize:    [size, height],
    iconAnchor:  [size / 2, height],
    popupAnchor: [0, -(height + 2)],
  });
}

// ─── Popup HTML ───────────────────────────────────────────────────────────────
function buildPopupHtml(koperasi: Koperasi, status: MarkerStatus, popupActionId: string): string {
  const total   = koperasi._count?.cctvs ?? 8;
  const online  = koperasi.onlineCCTV    ?? total;
  const offline = total - online;
  const pct     = total > 0 ? Math.round((online / total) * 100) : 0;
  const barColor = pct === 100 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";

  const safeName     = escapeHtml(koperasi.name);
  const safeCity     = escapeHtml(koperasi.city);
  const safeProvince = escapeHtml(koperasi.province);
  const safeStatus   = escapeHtml(status.label);

  return `
    <div style="font-family: 'Segoe UI', sans-serif; min-width: 240px; padding: 14px;">
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:10px;">
        <div>
          <div style="font-weight:700; font-size:13px; color:#f1f5f9; line-height:1.3;">${safeName}</div>
          <div style="font-size:11px; color:#94a3b8; margin-top:2px;">${safeCity}, ${safeProvince}</div>
        </div>
        <span style="
          padding: 2px 8px; border-radius:999px; font-size:10px; font-weight:700;
          background:${status.fillColor}22; color:${status.fillColor};
          border:1px solid ${status.fillColor}55; white-space:nowrap; flex-shrink:0;
        ">${safeStatus}</span>
      </div>

      <!-- Progress Bar -->
      <div style="margin-bottom:10px;">
        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
          <span style="color:#94a3b8;">Status CCTV</span>
          <span style="color:#f1f5f9; font-weight:600;">${online}/${total} Online</span>
        </div>
        <div style="background:#1e293b; border-radius:4px; height:5px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:${barColor}; border-radius:4px; transition:width .4s ease;"></div>
        </div>
      </div>

      <!-- Stats -->
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-bottom:12px;">
        <div style="background:#0f172a; border-radius:8px; padding:6px; text-align:center;">
          <div style="font-weight:700; font-size:14px; color:#22c55e;">${online}</div>
          <div style="font-size:10px; color:#64748b;">Online</div>
        </div>
        <div style="background:#0f172a; border-radius:8px; padding:6px; text-align:center;">
          <div style="font-weight:700; font-size:14px; color:#ef4444;">${offline}</div>
          <div style="font-size:10px; color:#64748b;">Offline</div>
        </div>
        <div style="background:#0f172a; border-radius:8px; padding:6px; text-align:center;">
          <div style="font-weight:700; font-size:14px; color:#e2e8f0;">${total}</div>
          <div style="font-size:10px; color:#64748b;">Total</div>
        </div>
      </div>

      <!-- CTA Button -->
      <button
        type="button"
        data-popup-action="${popupActionId}"
        style="
          width:100%; background:#dc2626; color:#fff; border:none;
          border-radius:8px; padding:8px 12px; font-size:12px; font-weight:700;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;
        "
        onmouseover="this.style.background='#b91c1c'"
        onmouseout="this.style.background='#dc2626'"
      >
        &#128247;&nbsp; Lihat Detail CCTV
      </button>
    </div>
  `;
}

// ─── Bind popup button click ke handler ──────────────────────────────────────
function bindPopupButton(
  marker:        any,
  koperasi:      Koperasi,
  popupActionId: string,
  onMarkerClick: (koperasi: Koperasi) => void
): void {
  marker.on("popupopen", (event: any) => {
    const popupEl    = event.popup?.getElement() as HTMLElement | undefined;
    const btn        = popupEl?.querySelector<HTMLButtonElement>(
      `[data-popup-action="${popupActionId}"]`
    );
    if (!btn) return;

    btn.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onMarkerClick(koperasi);
      marker.closePopup();
    }, { once: true });
  });
}

// ─── Override Leaflet popup style (dark theme + merah putih) ─────────────────
const POPUP_STYLE = `
  .leaflet-popup-content-wrapper {
    background: #0f172a !important;
    border: 1px solid #7f1d1d !important;
    border-radius: 14px !important;
    box-shadow: 0 8px 32px rgba(239,68,68,0.18), 0 2px 8px rgba(0,0,0,0.5) !important;
    padding: 0 !important;
    overflow: hidden;
  }
  .leaflet-popup-content {
    margin: 0 !important;
  }
  .leaflet-popup-tip {
    background: #0f172a !important;
  }
  .leaflet-popup-close-button {
    color: #64748b !important;
    font-size: 20px !important;
    top: 6px !important;
    right: 8px !important;
    z-index: 10;
  }
  .leaflet-popup-close-button:hover { color: #ef4444 !important; }
  .leaflet-control-zoom a {
    background: #111827 !important;
    color: #d1d5db !important;
    border-color: #374151 !important;
  }
  .leaflet-control-zoom a:hover {
    background: #dc2626 !important;
    color: #fff !important;
    border-color: #dc2626 !important;
  }
  .leaflet-control-attribution {
    background: rgba(3,7,18,0.75) !important;
    color: #4b5563 !important;
    font-size: 10px !important;
  }
  .leaflet-control-attribution a { color: #6b7280 !important; }
  .leaflet-tile-pane {
    filter: brightness(0.75) saturate(0.6);
  }
`;

function injectPopupStyle(): void {
  if (document.getElementById("leaflet-dark-override")) return;
  const style   = document.createElement("style");
  style.id      = "leaflet-dark-override";
  style.textContent = POPUP_STYLE;
  document.head.appendChild(style);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LeafletMap({
  koperasiList,
  selectedKoperasi,
  onMarkerClick,
}: LeafletMapProps) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  // Simpan ref onMarkerClick agar tidak perlu re-run effect saat fungsi berubah
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

  // ── Init map sekali saja ──────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!containerRef.current || mapRef.current) return;
      await ensureLeafletAssets();
      if (!isMounted || !containerRef.current) return;

      injectPopupStyle();

      const L   = (window as any).L;
      const map = L.map(containerRef.current, {
        preferCanvas: true,
        zoomControl:  true,
      }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

      // Dark tile layer — OpenStreetMap (dimmed via CSS filter di .leaflet-tile-pane)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current          = map;

      map.whenReady(() => { map.invalidateSize(); });
    };

    initMap();

    return () => {
      isMounted = false;
      mapRef.current?.remove();
      mapRef.current          = null;
      markersLayerRef.current = null;
    };
  }, []);

  // ── Render/update markers setiap kali data berubah ────────────────────────
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    markersLayerRef.current.clearLayers();

    const validPoints = koperasiList.filter(hasCoordinate);
    if (validPoints.length === 0) {
      mapRef.current.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds([]);

    validPoints.forEach((koperasi, index) => {
      const status        = getMarkerStatus(koperasi);
      const isSelected    = selectedKoperasi?.id === koperasi.id;
      const icon          = createDivIcon(L, status, isSelected);
      const popupActionId = `koperasi-detail-${index}`;

      const marker = L.marker([koperasi.latitude, koperasi.longitude], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.bindPopup(
        buildPopupHtml(koperasi, status, popupActionId),
        { maxWidth: 300, minWidth: 260 }
      );

      bindPopupButton(marker, koperasi, popupActionId, (k) => {
        onMarkerClickRef.current(k);
      });

      markersLayerRef.current.addLayer(marker);
      bounds.extend([koperasi.latitude, koperasi.longitude]);
    });

    if (bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
    }
  }, [koperasiList, selectedKoperasi]);

  // ── Fly to selected marker ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !selectedKoperasi) return;
    if (!hasCoordinate(selectedKoperasi)) return;
    mapRef.current.flyTo(
      [selectedKoperasi.latitude, selectedKoperasi.longitude],
      13,
      { animate: true, duration: 1.0 }
    );
  }, [selectedKoperasi]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-800">
      {/* Map container — Leaflet mount di sini */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Legenda */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] bg-gray-950/90 border border-gray-800 rounded-xl p-3 text-xs backdrop-blur-sm">
        <p className="text-gray-400 font-semibold uppercase tracking-wider mb-2">Legenda</p>
        <div className="space-y-1.5">
          {[
            ["#ef4444", "Semua CCTV Online"],
            ["#eab308", "Ada CCTV Bermasalah"],
            ["#6b7280", "Mayoritas Offline"],
          ].map(([color, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Counter */}
      <div className="pointer-events-none absolute top-3 left-3 z-[1000] bg-gray-950/90 border border-red-900/60 rounded-lg px-3 py-1.5 backdrop-blur-sm">
        <p className="text-red-400 text-xs font-bold uppercase tracking-wider">🇮🇩 Indonesia</p>
        <p className="text-gray-400 text-xs">{koperasiList.filter(hasCoordinate).length} Koperasi Terdaftar</p>
      </div>
    </div>
  );
}