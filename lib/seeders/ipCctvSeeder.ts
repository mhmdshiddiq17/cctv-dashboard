/**
 * Utility untuk generate/seed dummy IP CCTV data
 * Digunakan di API untuk auto-generate data jika belum ada
 */

import { prisma } from '@/lib/prisma';

/**
 * Generate dummy IP untuk semua CCTV yang belum punya IP
 */
export async function ensureIPCCTVData() {
  try {
    // Check apakah ada CCTV tanpa IP
    const cctvWithoutIP = await prisma.cCTV.findMany({
      where: {
        activeIpCctvId: null  // CCTV yang belum punya active IP
      },
      take: 100  // Limit untuk performance
    });

    if (cctvWithoutIP.length === 0) {
      return { created: 0, message: 'All CCTVs already have IP data' };
    }

    let created = 0;
    const baseIP = '192.168.1';
    let ipOctet = 100;

    for (const cctv of cctvWithoutIP) {
      try {
        const dummyIP = `${baseIP}.${ipOctet}`;
        ipOctet++;

        // Create active IP
        const ipRecord = await prisma.iP_CCTV.create({
          data: {
            ipAddress: dummyIP,
            port: 8080,
            protocol: 'RTSP',
            username: 'admin',
            password: 'Dummy@Password123', // Dummy password
            streamPath: '/Streaming/Channels/101',
            isActive: true,
            assignedAt: new Date(),
            notes: 'Auto-generated dummy IP',
            cctvId: cctv.id,
          }
        });

        // Update CCTV with active IP reference
        await prisma.cCTV.update({
          where: { id: cctv.id },
          data: { activeIpCctvId: ipRecord.id }
        });

        created++;
        console.log(`✅ Generated IP ${dummyIP} for CCTV ${cctv.label}`);
      } catch (error) {
        console.error(`Failed to create IP for CCTV ${cctv.label}:`, error);
        // Continue dengan CCTV berikutnya
      }
    }

    console.log(`✓ Generated IP data for ${created} CCTV devices`);
    return { created, message: `Generated IP data for ${created} CCTV devices` };
  } catch (error) {
    console.error('Error ensuring IP CCTV data:', error);
    return { created: 0, error: String(error) };
  }
}
