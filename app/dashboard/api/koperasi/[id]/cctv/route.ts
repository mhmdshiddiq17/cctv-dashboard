/**
 * GET /dashboard/api/koperasi/[id]/cctv
 * Fetch all CCTV devices for a koperasi with their IP addresses
 */

import { NextRequest, NextResponse } from 'next/server';
import { connect } from 'node:net';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEBRTC_URL_TEMPLATE = process.env.CCTV_WEBRTC_URL_TEMPLATE;
const WEBRTC_BASE_URL = process.env.CCTV_WEBRTC_BASE_URL || process.env.NEXT_PUBLIC_CCTV_WEBRTC_BASE_URL || 'http://localhost:8889';
const DEFAULT_RTSP_PORT = 554;
const DEFAULT_RTSP_STREAM_PATH =
  process.env.CCTV_RTSP_STREAM_PATH?.trim() || '/Streaming/Channels/101';

type ActiveIpRecord = {
  id: string;
  ipAddress: string;
  port: number;
  protocol: string;
  username: string | null;
  password: string | null;
  streamPath: string | null;
  isActive: boolean;
  assignedAt: Date;
  deactivatedAt: Date | null;
  notes: string | null;
  changedBy: string | null;
  changeReason: string | null;
  cctvId: string;
  createdAt: Date;
  updatedAt: Date;
};

function pickActiveIp(cctv: {
  activeIpCctv: ActiveIpRecord | null;
  ipCctvs: ActiveIpRecord[];
}) {
  if (cctv.activeIpCctv) {
    return cctv.activeIpCctv;
  }

  const fromHistory = cctv.ipCctvs.find((ip) => ip.isActive);
  if (fromHistory) {
    return fromHistory;
  }

  return cctv.ipCctvs[0] ?? null;
}

function hasUsableStreamSource(activeIp: ActiveIpRecord | null) {
  if (!activeIp) {
    return false;
  }

  return Boolean(resolveRtspUrl(activeIp));
}

function normalizePort(port: unknown) {
  const numericPort =
    typeof port === 'number' ? port : typeof port === 'string' ? Number(port) : Number.NaN;

  if (
    Number.isFinite(numericPort) &&
    Number.isInteger(numericPort) &&
    numericPort > 0 &&
    numericPort <= 65535
  ) {
    return numericPort;
  }

  return DEFAULT_RTSP_PORT;
}

function normalizePath(path: string | null | undefined) {
  const cleaned = path?.trim();
  if (!cleaned) {
    return DEFAULT_RTSP_STREAM_PATH;
  }

  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

function resolveRtspUrl(activeIp: ActiveIpRecord | null) {
  if (!activeIp) {
    return null;
  }

  const rawAddress = activeIp.ipAddress?.trim();
  if (!rawAddress) {
    return null;
  }

  if (rawAddress.includes('://')) {
    return rawAddress.toLowerCase().startsWith('rtsp://') ? rawAddress : null;
  }

  if (activeIp.protocol.toUpperCase() !== 'RTSP') {
    return null;
  }

  const firstSlashIndex = rawAddress.indexOf('/');
  const hostPortPart =
    firstSlashIndex === -1 ? rawAddress : rawAddress.slice(0, firstSlashIndex);
  const addressPath =
    firstSlashIndex === -1 ? null : rawAddress.slice(firstSlashIndex);

  let parsedHost: URL;
  try {
    parsedHost = new URL(`rtsp://${hostPortPart}`);
  } catch {
    return null;
  }

  if (!parsedHost.hostname) {
    return null;
  }

  const username = activeIp.username?.trim() ?? '';
  const password = activeIp.password?.trim() ?? '';
  const credentials = username
    ? `${encodeURIComponent(username)}${password ? `:${encodeURIComponent(password)}` : ''}@`
    : '';
  const port = parsedHost.port ? Number(parsedHost.port) : normalizePort(activeIp.port);
  const path = normalizePath(activeIp.streamPath || addressPath || DEFAULT_RTSP_STREAM_PATH);

  return `rtsp://${credentials}${parsedHost.hostname}:${port}${path}`;
}

function isLikelyDummyRtsp(rawAddress: string) {
  const normalized = rawAddress.toLowerCase();

  // Guard seeded placeholder streams so UI doesn't keep trying broken WHEP sessions.
  return normalized.includes('admin:password@192.168.');
}

function buildWebRtcUrl(cctv: {
  id: string;
  activeIpCctv: ActiveIpRecord | null;
  rtspUrl: string | null;
}) {
  const rawAddress = cctv.activeIpCctv?.ipAddress?.trim();
  if (!rawAddress) {
    return null;
  }

  if (isLikelyDummyRtsp(rawAddress)) {
    return null;
  }

  if (rawAddress.startsWith('http://') || rawAddress.startsWith('https://')) {
    return rawAddress;
  }

  const streamKey = cctv.id;

  if (WEBRTC_URL_TEMPLATE) {
    return WEBRTC_URL_TEMPLATE
      .replace('{streamKey}', encodeURIComponent(streamKey))
      .replace('{rtspUrl}', cctv.rtspUrl || '')
      .replace('{encodedRtspUrl}', cctv.rtspUrl ? encodeURIComponent(cctv.rtspUrl) : '');
  }

  if (!WEBRTC_BASE_URL) {
    return null;
  }

  const baseWhepUrl = `${WEBRTC_BASE_URL.replace(/\/$/, '')}/${encodeURIComponent(streamKey)}/whep`;
  if (!cctv.rtspUrl) {
    return baseWhepUrl;
  }

  const sourceWithProtocol = cctv.rtspUrl.replace(/^rtsp:\/\//i, 'rtsp://');
  return `${baseWhepUrl}?source=${encodeURIComponent(sourceWithProtocol)}`;
}

const REACHABILITY_CACHE_TTL_MS = 20_000;
const reachabilityCache = new Map<string, { value: boolean; expiresAt: number }>();

async function isRtspEndpointReachable(rtspAddress: string, defaultPort = 554) {
  try {
    const parsed = new URL(rtspAddress);
    const host = parsed.hostname;
    const port = parsed.port ? Number(parsed.port) : defaultPort;

    if (!host || !port) {
      return false;
    }

    const cacheKey = `${host}:${port}`;
    const cached = reachabilityCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const reachable = await new Promise<boolean>((resolve) => {
      const socket = connect({ host, port });

      const cleanup = (result: boolean) => {
        socket.removeAllListeners();
        socket.destroy();
        resolve(result);
      };

      socket.setTimeout(2_500);
      socket.once('connect', () => cleanup(true));
      socket.once('timeout', () => cleanup(false));
      socket.once('error', () => cleanup(false));
    });

    reachabilityCache.set(cacheKey, {
      value: reachable,
      expiresAt: Date.now() + REACHABILITY_CACHE_TTL_MS,
    });

    return reachable;
  } catch {
    return false;
  }
}

function sanitizeIp(ip: {
  id: string;
  ipAddress: string;
  port: number;
  protocol: string;
  username: string | null;
  password: string | null;
  streamPath: string | null;
  isActive: boolean;
  assignedAt: Date;
  deactivatedAt: Date | null;
  notes: string | null;
  changedBy: string | null;
  changeReason: string | null;
  cctvId: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...ip,
    password: null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: koperasiId } = await params;
    let resolvedKoperasiId = koperasiId;

    if (!koperasiId) {
      return NextResponse.json(
        { error: 'Koperasi ID is required' },
        { status: 400 }
      );
    }

    // Fallback for dashboard routes still using numeric IDs (1-based index).
    if (/^\d+$/.test(koperasiId)) {
      const position = Number(koperasiId);
      if (position > 0) {
        const byOrder = await prisma.koperasi.findFirst({
          orderBy: { createdAt: 'asc' },
          skip: position - 1,
          select: { id: true },
        });

        if (byOrder?.id) {
          resolvedKoperasiId = byOrder.id;
        }
      }
    }

    // Fetch koperasi dengan semua CCTV dan IP-nya
    const koperasi = await prisma.koperasi.findUnique({
      where: { id: resolvedKoperasiId },
      include: {
        cctvs: {
          include: {
            ipCctvs: {
              orderBy: { assignedAt: 'desc' }
            },
            activeIpCctv: true
          },
          orderBy: { label: 'asc' }
        }
      }
    });

    if (!koperasi) {
      return NextResponse.json(
        { error: 'Koperasi not found' },
        { status: 404 }
      );
    }

    // Count online CCTV
    const onlineCCTV = koperasi.cctvs.filter(c => c.status === 'ONLINE').length;
    const provinceName = koperasi.provinceNama || koperasi.city;

    return NextResponse.json({
      success: true,
      data: {
        id: koperasi.id,
        name: koperasi.name,
        city: koperasi.city,
        province: provinceName,
        address: koperasi.address,
        lat: koperasi.latitude,
        lng: koperasi.longitude,
        onlineCCTV,
        totalCCTV: koperasi.cctvs.length,
        cctvs: await Promise.all(
          koperasi.cctvs.map(async (cctv) => {
            const resolvedActiveIp = pickActiveIp(cctv);
            const isOnline = cctv.status === 'ONLINE';
            const hasUsableSource = hasUsableStreamSource(resolvedActiveIp);
            const resolvedRtspUrl = resolveRtspUrl(resolvedActiveIp);
            const candidateWebRtcUrl = buildWebRtcUrl({
              id: cctv.id,
              activeIpCctv: resolvedActiveIp,
              rtspUrl: resolvedRtspUrl,
            });

            const isReachable = isOnline && hasUsableSource && resolvedActiveIp
              ? await isRtspEndpointReachable(
                  resolvedRtspUrl || resolvedActiveIp.ipAddress,
                  normalizePort(resolvedActiveIp.port)
                )
              : false;

            const hasStream = isOnline && hasUsableSource && Boolean(candidateWebRtcUrl) && isReachable;

            return {
              id: cctv.id,
              label: cctv.label,
              location: cctv.location,
              status: cctv.status,
              resolution: cctv.resolution || '1080p',
              brand: cctv.brand || '-',
              fps: 25,
              hasStream,
              streamUrl: null,
              webrtcUrl: hasStream ? candidateWebRtcUrl : null,
              ipCctvs: (cctv.ipCctvs || []).map(sanitizeIp),
              activeIpCctv: resolvedActiveIp ? sanitizeIp(resolvedActiveIp) : null
            };
          })
        )
      }
    });
  } catch (error) {
    console.error('Error fetching CCTV data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
