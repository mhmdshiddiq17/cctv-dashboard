'use client';

import { Volume2, VolumeX, Maximize2, Settings } from 'lucide-react';
import type { CCTVItem } from '@/lib/types';
import { WebRTCStreamPlayer } from '@/components/ui/WebRTCStreamPlayer';
import { useState } from 'react';

interface CCTVLiveGridProps {
  cctvList: CCTVItem[];
}

const STATUS_CONFIG = {
  ONLINE: { bg: 'bg-green-900', text: 'text-green-300', dot: 'bg-green-500', border: 'border-green-700' },
  OFFLINE: { bg: 'bg-red-900', text: 'text-red-300', dot: 'bg-red-500', border: 'border-red-700' },
  MAINTENANCE: { bg: 'bg-yellow-900', text: 'text-yellow-300', dot: 'bg-yellow-500', border: 'border-yellow-700' }
} as const;

function hasLiveStream(cctv: CCTVItem, brokenStreams: Set<string>) {
  return cctv.status === 'ONLINE'
    && cctv.hasStream === true
    && Boolean(cctv.webrtcUrl)
    && !brokenStreams.has(cctv.id);
}

function CameraIcon({ size }: Readonly<{ size: number }>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function StreamViewport({
  cctv,
  isLive,
  onStreamError,
  gridId,
  iconSize,
  muted,
}: Readonly<{
  cctv: CCTVItem;
  isLive: boolean;
  onStreamError: (cctvId: string) => void;
  gridId: string;
  iconSize: number;
  muted: boolean;
}>) {
  return (
    <div className="absolute inset-0">
      {isLive && cctv.webrtcUrl ? (
        <WebRTCStreamPlayer
          webrtcUrl={cctv.webrtcUrl}
          className="w-full h-full object-cover"
          muted={muted}
          onError={() => onStreamError(cctv.id)}
        />
      ) : null}

      <div className={`w-full h-full ${isLive ? 'opacity-0' : 'opacity-20'}`}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={gridId} width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${gridId})`} />
        </svg>
      </div>

      {isLive ? null : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
          <CameraIcon size={iconSize} />
        </div>
      )}
    </div>
  );
}

function CCTVGridCard({
  cctv,
  isMuted,
  isLive,
  onSelect,
  onToggleMute,
  onStreamError,
}: Readonly<{
  cctv: CCTVItem;
  isMuted: boolean;
  isLive: boolean;
  onSelect: (cctvId: string) => void;
  onToggleMute: (cctvId: string, e: React.MouseEvent) => void;
  onStreamError: (cctvId: string) => void;
}>) {
  const config = STATUS_CONFIG[cctv.status];

  return (
    <div className="relative group rounded-lg overflow-hidden border border-gray-700 hover:border-red-600 transition w-full text-left">
      <div className="aspect-video bg-linear-to-br from-gray-800 to-gray-900 relative overflow-hidden flex items-center justify-center">
        <StreamViewport
          cctv={cctv}
          isLive={isLive}
          onStreamError={onStreamError}
          gridId={`grid-${cctv.id}`}
          iconSize={60}
          muted
        />

        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full z-10">
          <div className={`w-2 h-2 rounded-full ${config.dot} ${cctv.status === 'ONLINE' ? 'animate-pulse' : ''}`} />
          <span className={`text-xs font-bold ${config.text}`}>{cctv.status}</span>
        </div>

        <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-white text-xs font-semibold z-10">
          {cctv.label}
        </div>

        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-red-900/80 px-2 py-1 rounded z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-300 text-xs font-bold">REC</span>
        </div>

        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-gray-300 text-xs font-mono z-10 max-w-[calc(100%-1rem)]">
          {isLive ? cctv.location : `${cctv.location} • stream unavailable`}
        </div>

        <button
          type="button"
          onClick={() => onSelect(cctv.id)}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center z-20"
          title={`View ${cctv.label} fullscreen`}
        >
          <div className="flex flex-col items-center gap-3">
            <Maximize2 size={32} className="text-white" />
            <span className="text-white text-sm font-semibold">View Fullscreen</span>
          </div>
        </button>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition z-20 pointer-events-none">
          <div className="text-gray-300 text-xs font-mono bg-black/60 px-2 py-1 rounded whitespace-nowrap">
            {new Date().toLocaleTimeString('id-ID')}
          </div>
        </div>
      </div>

      <div className={`bg-gray-900 border-t ${config.border} px-3 py-2 space-y-1`}>
        <div className="flex items-center justify-between">
          <span className="text-white text-xs font-semibold">{cctv.label}</span>
          <button
            type="button"
            onClick={(e) => onToggleMute(cctv.id, e)}
            className="p-1 hover:bg-gray-800 rounded transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX size={14} className="text-red-400" />
            ) : (
              <Volume2 size={14} className="text-gray-400" />
            )}
          </button>
        </div>
        <div className="text-gray-500 text-xs">{cctv.resolution} • {cctv.fps}fps</div>
      </div>
    </div>
  );
}

/**
 * CCTV Live Grid - Shows CCTV feeds in grid and fullscreen mode.
 */
export function CCTVLiveGrid({ cctvList }: Readonly<CCTVLiveGridProps>) {
  const [selectedCCTV, setSelectedCCTV] = useState<string | null>(null);
  const [mutedCCTVs, setMutedCCTVs] = useState<Set<string>>(new Set());
  const [brokenStreams, setBrokenStreams] = useState<Set<string>>(new Set());

  const toggleMute = (cctvId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedCCTVs((current) => {
      const next = new Set(current);
      if (next.has(cctvId)) {
        next.delete(cctvId);
      } else {
        next.add(cctvId);
      }
      return next;
    });
  };

  const markStreamAsBroken = (cctvId: string) => {
    setBrokenStreams((current) => {
      const next = new Set(current);
      next.add(cctvId);
      return next;
    });
  };

  if (selectedCCTV) {
    const cctv = cctvList.find((item) => item.id === selectedCCTV);
    if (!cctv) {
      return null;
    }

    const isLive = hasLiveStream(cctv, brokenStreams);
    const config = STATUS_CONFIG[cctv.status];
    const isMuted = mutedCCTVs.has(cctv.id);

    return (
      <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col">
        <div className="bg-gray-900 border-b border-gray-800 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${config.dot} animate-pulse`} />
            <div>
              <h1 className="text-white font-bold text-lg">{cctv.label}</h1>
              <p className="text-gray-400 text-xs">{cctv.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => toggleMute(cctv.id, e)}
              className="p-2 hover:bg-gray-800 rounded-lg transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX size={18} className="text-red-400" />
              ) : (
                <Volume2 size={18} className="text-gray-300" />
              )}
            </button>
            <button type="button" className="p-2 hover:bg-gray-800 rounded-lg transition">
              <Settings size={18} className="text-gray-300" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedCCTV(null)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition"
            >
              Exit Fullscreen
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
          <div className="w-full h-full bg-linear-to-br from-gray-900 to-gray-800 flex items-center justify-center relative">
            <StreamViewport
              cctv={cctv}
              isLive={isLive}
              onStreamError={markStreamAsBroken}
              gridId="grid-fullscreen"
              iconSize={200}
              muted={isMuted}
            />

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${config.dot}`} />
                <span className={`text-sm font-bold ${config.text}`}>{cctv.label} - {cctv.status}</span>
              </div>

              <div className="absolute top-4 right-4">
                <div className="text-gray-300 text-xs font-mono bg-black/50 px-2 py-1 rounded">
                  {new Date().toLocaleString('id-ID')}
                </div>
              </div>

              <div className="absolute bottom-4 left-4 text-xs text-gray-400 font-mono bg-black/50 px-2 py-1 rounded space-y-1">
                <div>📍 {cctv.location}</div>
                <div>📹 {cctv.resolution} • {cctv.fps}fps</div>
                <div>📱 {cctv.brand}</div>
                {isLive ? null : <div>⚠ Stream RTSP belum tersedia di browser</div>}
              </div>

              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-xs font-bold">REC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          📹 Live CCTV Feed ({cctvList.length} Kamera)
        </h3>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cctvList.map((cctv) => (
          <CCTVGridCard
            key={cctv.id}
            cctv={cctv}
            isMuted={mutedCCTVs.has(cctv.id)}
            isLive={hasLiveStream(cctv, brokenStreams)}
            onSelect={setSelectedCCTV}
            onToggleMute={toggleMute}
            onStreamError={markStreamAsBroken}
          />
        ))}
      </div>
    </div>
  );
}
