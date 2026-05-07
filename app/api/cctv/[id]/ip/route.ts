/**
 * PATCH /api/cctv/[id]/ip
 * Update CCTV IP address with audit trail
 * 
 * Body:
 *   - ipAddress (required): New IP address
 *   - port (optional): Port number, default 8080
 *   - reason (optional): Why the IP was changed
 *   - userId (required in production): User ID making the change
 */

import { NextRequest, NextResponse } from 'next/server';
import { CCTVRepository } from '@/lib/repositories/CCTVRepository';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cctvId } = await params;
    const body = await request.json();

    const { ipAddress, port = 8080, reason = 'Manual update', userId = 'system' } = body;

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

    // Validate port
    if (port < 1 || port > 65535) {
      return NextResponse.json(
        { error: 'Port must be between 1 and 65535' },
        { status: 400 }
      );
    }

    // Update IP with audit trail
    const newIpRecord = await CCTVRepository.updateIP(
      cctvId,
      ipAddress,
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
