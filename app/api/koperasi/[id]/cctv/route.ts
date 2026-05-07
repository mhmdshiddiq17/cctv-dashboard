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

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildRtspStreamInfo(activeIp: {
  ipAddress: string;
  port: number;
  protocol: string;
} | null) {
  if (!activeIp) {
    return {
      hasUsableRtsp: false,
      rtspUrl: null,
      streamHost: null,
      streamPort: null,
      streamPath: null,
    };
  }

  const rawAddress = activeIp.ipAddress.trim();
  if (!rawAddress || !rawAddress.toLowerCase().startsWith('rtsp://')) {
    return {
      hasUsableRtsp: false,
      rtspUrl: null,
      streamHost: null,
      streamPort: null,
      streamPath: null,
    };
  }

  try {
    const parsed = new URL(rawAddress);
    const pathname = `${parsed.pathname || ''}${parsed.search || ''}` || '/';

    return {
      hasUsableRtsp: Boolean(parsed.hostname),
      rtspUrl: rawAddress,
      streamHost: parsed.hostname || null,
      streamPort: parsed.port ? Number(parsed.port) : activeIp.port || 554,
      streamPath: pathname,
    };
  } catch {
    return {
      hasUsableRtsp: false,
      rtspUrl: rawAddress,
      streamHost: null,
      streamPort: activeIp.port || 554,
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
    const body = await request.json();

    // Validate input
    const { label, location, ipAddress, brand, resolution } = body;
    if (!label || !location || !ipAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: label, location, ipAddress' },
        { status: 400 }
      );
    }

    // Create CCTV with IP
    const cctv = await CCTVRepository.create({
      label,
      location,
      koperasiId,
      ipAddress,
      brand,
      resolution
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
