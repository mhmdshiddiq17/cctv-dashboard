/**
 * PATCH /api/cctv/[id]/ip
 * Update CCTV IP address with audit trail
 * 
 * Body:
 *   - ipAddress (required): New IP address
 *   - port (optional): Port number, default 554
 *   - streamPath (optional): Path after host:port, e.g. /Streaming/Channels/101
 *   - reason (optional): Why the IP was changed
 *   - userId (required in production): User ID making the change
 */

import { NextRequest, NextResponse } from 'next/server';
import { CCTVRepository } from '@/lib/repositories/CCTVRepository';
import { prisma } from '@/lib/prisma';
import type { CCTVProtocol } from '@/lib/types';

const DEFAULT_RTSP_PORT = 554;
const SUPPORTED_PROTOCOLS: readonly CCTVProtocol[] = ['RTSP', 'HTTP', 'ONVIF', 'MQTT'];

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cctvId } = await params;
    const body = await request.json() as {
      ipAddress?: string;
      port?: number | string;
      protocol?: string;
      username?: string | null;
      password?: string | null;
      streamPath?: string | null;
      notes?: string | null;
      reason?: string;
      userId?: string;
    };

    const { ipAddress } = body;
    const reason = body.reason?.trim() || 'Manual update';
    const userId = body.userId?.trim() || 'system';

    // Validate input
    if (!ipAddress) {
      return NextResponse.json(
        { error: 'ipAddress is required' },
        { status: 400 }
      );
    }

    // Validate IP format (basic check)
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ipAddress)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    const port = parsePortInput(body.port);
    if (port === null) {
      return NextResponse.json(
        { error: 'Port must be between 1 and 65535' },
        { status: 400 }
      );
    }
    const protocol = normalizeProtocolInput(body.protocol);

    // Update IP with audit trail
    const newIpRecord = await CCTVRepository.updateIP(
      cctvId,
      {
        ipAddress: ipAddress.trim(),
        port,
        protocol,
        username: body.username?.trim() || null,
        password: body.password?.trim() || null,
        streamPath: body.streamPath?.trim() || null,
        notes: body.notes?.trim() || null,
      },
      userId,
      reason
    );

    // Fetch updated CCTV
    const cctv = await CCTVRepository.findByIdWithIP(cctvId);

    return NextResponse.json({
      success: true,
      data: {
        cctv,
        previousIP: null, // Could fetch from history if needed
        newIP: newIpRecord,
        changedAt: new Date(),
        changedBy: userId,
        reason
      },
      message: `CCTV IP updated to ${ipAddress}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update IP';
    
    if (message.includes('not found')) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    console.error('[PATCH /api/cctv/[id]/ip]', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cctv/[id]/ip/history
 * Get IP change history for a CCTV
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cctvId } = await params;

    // Verify CCTV exists
    const cctv = await prisma.cCTV.findUnique({
      where: { id: cctvId },
      select: { id: true, label: true }
    });

    if (!cctv) {
      return NextResponse.json(
        { error: 'CCTV not found' },
        { status: 404 }
      );
    }

    // Get IP history
    const history = await CCTVRepository.getIPHistory(cctvId);

    return NextResponse.json({
      success: true,
      data: {
        cctvId,
        cctvLabel: cctv.label,
        ipHistory: history,
        count: history.length,
        activeIP: history.find((ip: typeof history[0]) => ip.isActive) || null
      }
    });
  } catch (error) {
    console.error('[GET /api/cctv/[id]/ip/history]', error);
    return NextResponse.json(
      { error: 'Failed to fetch IP history' },
      { status: 500 }
    );
  }
}
