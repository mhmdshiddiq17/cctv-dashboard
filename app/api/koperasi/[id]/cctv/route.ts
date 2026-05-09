/**
 * GET /api/koperasi/[id]/cctv
 * Returns all CCTVs for a Koperasi with active IPs
 * 
 * Query params:
 *   - include=history (optional) - include full IP history per CCTV
 */

import { NextRequest, NextResponse } from 'next/server';
import { CCTVRepository } from '@/lib/repositories/CCTVRepository';
import { prisma } from '@/lib/prisma';
import type { CCTVProtocol } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_RTSP_PORT = 554;
const DEFAULT_RTSP_STREAM_PATH =
  process.env.CCTV_RTSP_STREAM_PATH?.trim() || '/Streaming/Channels/101';
const SUPPORTED_PROTOCOLS: readonly CCTVProtocol[] = ['RTSP', 'HTTP', 'ONVIF', 'MQTT'];

type ActiveIpStreamSource = {
  ipAddress: string;
  port: number | string | null;
  protocol: string | null;
  username?: string | null;
  password?: string | null;
  streamPath?: string | null;
};

function normalizePort(port: ActiveIpStreamSource['port']) {
  const numericPort =
    typeof port === 'number'
      ? port
      : typeof port === 'string'
        ? Number(port)
        : Number.NaN;

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

function parsePortInput(port: unknown) {
  if (port === undefined || port === null || port === '') {
    return DEFAULT_RTSP_PORT;
  }

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

  return null;
}

function normalizeProtocolInput(protocol: unknown): CCTVProtocol {
  if (typeof protocol !== 'string') {
    return 'RTSP';
  }

  const normalized = protocol.trim().toUpperCase();
  return SUPPORTED_PROTOCOLS.includes(normalized as CCTVProtocol)
    ? (normalized as CCTVProtocol)
    : 'RTSP';
}

function normalizePath(path: string | null | undefined) {
  const cleaned = path?.trim();
  if (!cleaned) {
    return DEFAULT_RTSP_STREAM_PATH;
  }

  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}

function resolveRtspUrl(activeIp: ActiveIpStreamSource) {
  const rawAddress = activeIp.ipAddress.trim();
  if (!rawAddress) {
    return null;
  }

  if (rawAddress.includes('://')) {
    return rawAddress.toLowerCase().startsWith('rtsp://') ? rawAddress : null;
  }

  const protocol = activeIp.protocol?.trim().toUpperCase() || 'RTSP';
  if (protocol !== 'RTSP') {
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

function buildRtspStreamInfo(activeIp: ActiveIpStreamSource | null) {
  if (!activeIp) {
    return {
      hasUsableRtsp: false,
      rtspUrl: null,
      streamHost: null,
      streamPort: null,
      streamPath: null,
    };
  }

  const rtspUrl = resolveRtspUrl(activeIp);
  if (!rtspUrl) {
    return {
      hasUsableRtsp: false,
      rtspUrl: null,
      streamHost: null,
      streamPort: normalizePort(activeIp.port),
      streamPath: null,
    };
  }

  try {
    const parsed = new URL(rtspUrl);
    const pathname = `${parsed.pathname || ''}${parsed.search || ''}` || '/';

    return {
      hasUsableRtsp: Boolean(parsed.hostname),
      rtspUrl,
      streamHost: parsed.hostname || null,
      streamPort: parsed.port ? Number(parsed.port) : normalizePort(activeIp.port),
      streamPath: pathname,
    };
  } catch {
    return {
      hasUsableRtsp: false,
      rtspUrl,
      streamHost: null,
      streamPort: normalizePort(activeIp.port),
      streamPath: null,
    };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: koperasiId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeHistory = searchParams.get('include') === 'history';

    // Validate Koperasi exists
    const koperasi = await prisma.koperasi.findUnique({
      where: { id: koperasiId },
      select: { id: true, name: true }
    });

    if (!koperasi) {
      return NextResponse.json(
        { error: 'Koperasi not found' },
        { status: 404 }
      );
    }

    // Get CCTVs with active IPs
    const cctvs = await CCTVRepository.findByKoperasiId(koperasiId);

    const response = await Promise.all(
      cctvs.map(async (cctv: typeof cctvs[0]) => {
        const activeIp = cctv.activeIpCctv ?? cctv.ipCctvs.find((ip) => ip.isActive) ?? null;
        const streamInfo = buildRtspStreamInfo(activeIp);

        return {
          ...cctv,
          activeIpCctv: activeIp,
          ...streamInfo,
          ...(includeHistory
            ? { ipHistory: await CCTVRepository.getIPHistory(cctv.id) }
            : {}),
        };
      })
    );

    // Add summary stats
    const summary = await CCTVRepository.getStatusSummary(koperasiId);

    return NextResponse.json({
      success: true,
      data: {
        koperasiId,
        koperasiName: koperasi.name,
        summary,
        cctvs: response,
        count: cctvs.length
      }
    });
  } catch (error) {
    console.error('[GET /api/koperasi/[id]/cctv]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/koperasi/[id]/cctv
 * Create new CCTV with initial IP
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: koperasiId } = await params;
    const body = await request.json() as {
      label?: string;
      location?: string;
      ipAddress?: string;
      port?: number | string;
      protocol?: string;
      username?: string | null;
      password?: string | null;
      notes?: string | null;
      streamPath?: string | null;
      userId?: string;
      brand?: string | null;
      resolution?: string | null;
    };

    // Validate input
    const { label, location, ipAddress, brand, resolution } = body;
    if (!label || !location || !ipAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: label, location, ipAddress' },
        { status: 400 }
      );
    }

    const port = parsePortInput(body.port);
    if (port === null) {
      return NextResponse.json(
        { error: 'Port must be a valid integer between 1 and 65535' },
        { status: 400 }
      );
    }

    const protocol = normalizeProtocolInput(body.protocol);
    const userId = body.userId?.trim() || 'system';

    // Create CCTV with IP
    const cctv = await CCTVRepository.create({
      label,
      location,
      koperasiId,
      brand,
      resolution,
      createdBy: userId,
      initialIP: {
        ipAddress: ipAddress.trim(),
        port,
        protocol,
        username: body.username?.trim() || null,
        password: body.password?.trim() || null,
        streamPath: body.streamPath?.trim() || null,
        notes: body.notes?.trim() || null,
      }
    });

    return NextResponse.json({
      success: true,
      data: cctv,
      message: `CCTV ${label} created successfully`
    });
  } catch (error) {
    console.error('[POST /api/koperasi/[id]/cctv]', error);
    return NextResponse.json(
      { error: 'Failed to create CCTV' },
      { status: 500 }
    );
  }
}
