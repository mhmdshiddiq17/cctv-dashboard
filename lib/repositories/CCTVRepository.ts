import { prisma } from '@/lib/prisma';
import type { IpCctv } from '@/lib/types';

type IpConfigInput = Pick<
  IpCctv,
  'ipAddress' | 'port' | 'protocol' | 'username' | 'password' | 'streamPath' | 'notes'
>;

/**
 * CCTV Repository - Data access layer for CCTV and IP_CCTV operations
 * Handles queries, mutations, and business logic for CCTV management
 */

export class CCTVRepository {
  /**
   * Find single CCTV by ID with active IP and koperasi relationship
   */
  static async findByIdWithIP(cctvId: string) {
    return prisma.cCTV.findUnique({
      where: { id: cctvId },
      include: {
        koperasi: true,
        activeIpCctv: true,
        ipCctvs: {
          where: { isActive: true },
          take: 1,
        },
      },
    });
  }

  /**
   * Find all CCTVs for a specific Koperasi
   */
  static async findByKoperasiId(koperasiId: string) {
    return prisma.cCTV.findMany({
      where: { koperasiId },
      include: {
        activeIpCctv: true,
        ipCctvs: {
          take: 1,
          where: { isActive: true },
        },
      },
      orderBy: { label: 'asc' },
    });
  }

  /**
   * Get all IP history for a CCTV (ordered by rece ncy)
   */
  static async getIPHistory(cctvId: string) {
    return prisma.iP_CCTV.findMany({
      where: { cctvId },
      orderBy: [{ isActive: 'desc' }, { assignedAt: 'desc' }],
    });
  }

  /**
   * Update CCTV IP with audit trail
   * Creates new IP_CCTV, deactivates old one, updates activeIpCctvId
   */
  static async updateIP(
    cctvId: string,
    newIpData: IpConfigInput,
    userId: string,
    reason?: string
  ) {
    // Find current active IP
    const currentActiveIP = await prisma.iP_CCTV.findFirst({
      where: { cctvId, isActive: true },
    });

    // Deactivate current IP
    if (currentActiveIP) {
      await prisma.iP_CCTV.update({
        where: { id: currentActiveIP.id },
        data: { isActive: false, deactivatedAt: new Date() },
      });
    }

    // Create new IP_CCTV
    const newIP = await prisma.iP_CCTV.create({
      data: {
        cctvId,
        ipAddress: newIpData.ipAddress,
        port: newIpData.port,
        protocol: newIpData.protocol,
        username: newIpData.username,
        password: newIpData.password,
        streamPath: newIpData.streamPath,
        isActive: true,
        assignedAt: new Date(),
        changedBy: userId,
        changeReason: reason || 'Manual update',
        notes: newIpData.notes,
      },
    });

    // Update CCTV activeIpCctvId
    await prisma.cCTV.update({
      where: { id: cctvId },
      data: { activeIpCctvId: newIP.id },
    });

    return newIP;
  }

  /**
   * Create new CCTV with initial IP
   */
  static async create(data: {
    koperasiId: string;
    label: string;
    location: string;
    brand?: string | null;
    resolution?: string | null;
    initialIP: IpConfigInput;
    createdBy: string;
  }) {
    return await prisma.$transaction(async () => {
      // Create CCTV
      const cctv = await prisma.cCTV.create({
        data: {
          koperasiId: data.koperasiId,
          label: data.label,
          location: data.location,
          brand: data.brand ?? null,
          resolution: data.resolution ?? null,
          status: 'ONLINE',
        },
      });

      // Create initial IP_CCTV
      const ip = await prisma.iP_CCTV.create({
        data: {
          cctvId: cctv.id,
          ipAddress: data.initialIP.ipAddress,
          port: data.initialIP.port,
          protocol: data.initialIP.protocol,
          username: data.initialIP.username,
          password: data.initialIP.password,
          streamPath: data.initialIP.streamPath,
          isActive: true,
          assignedAt: new Date(),
          changedBy: data.createdBy,
          changeReason: 'Initial setup',
          notes: data.initialIP.notes,
        },
      });

      // Link activeIpCctvId
      await prisma.cCTV.update({
        where: { id: cctv.id },
        data: { activeIpCctvId: ip.id },
      });

      return { cctv, ip };
    });
  }

  /**
   * Get status summary for a Koperasi
   */
  static async getStatusSummary(koperasiId: string) {
    const cctvs = await prisma.cCTV.findMany({
      where: { koperasiId },
      select: { status: true },
    });

    const total = cctvs.length;
    const online = cctvs.filter((c: typeof cctvs[0]) => c.status === 'ONLINE').length;
    const offline = cctvs.filter((c: typeof cctvs[0]) => c.status === 'OFFLINE').length;
    const maintenance = cctvs.filter((c: typeof cctvs[0]) => c.status === 'MAINTENANCE').length;

    return { total, online, offline, maintenance };
  }

  /**
   * Find CCTVs by active IP address
   */
  static async findByIP(ipAddress: string) {
    return prisma.cCTV.findMany({
      where: {
        activeIpCctv: {
          ipAddress,
          isActive: true,
        },
      },
      include: { activeIpCctv: true },
    });
  }

  /**
   * Get recent IP changes in the last N hours
   */
  static async getRecentIPChanges(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return prisma.iP_CCTV.findMany({
      where: {
        assignedAt: { gte: since },
      },
      include: { cctv: true },
      orderBy: { assignedAt: 'desc' },
    });
  }
}
