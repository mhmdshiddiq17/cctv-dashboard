import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function yamlEscape(value: string) {
  return value.replaceAll('"', '""');
}

async function main() {
  const cctvs = await prisma.cCTV.findMany({
    include: {
      activeIpCctv: true,
    },
    orderBy: [
      { koperasiId: 'asc' },
      { label: 'asc' },
    ],
  });

  const configuredHosts = (process.env.MEDIAMTX_WEBRTC_ADDITIONAL_HOSTS || 'localhost,127.0.0.1')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const webrtcAdditionalHosts = configuredHosts.length > 0
    ? configuredHosts.map((host) => `"${yamlEscape(host)}"`).join(', ')
    : '';

  const lines: string[] = [
    'logLevel: info',
    '',
    'api: yes',
    'apiAddress: :9997',
    '',
    'rtspAddress: :8554',
    'webrtc: yes',
    'webrtcAddress: :8889',
    'webrtcLocalUDPAddress: :8189',
    'webrtcIPsFromInterfaces: no',
    `webrtcAdditionalHosts: [${webrtcAdditionalHosts}]`,
    'webrtcAllowOrigins: ["*"]',
    '',
    'paths:',
  ];

  const configured = cctvs.filter((cctv) => {
    const ip = cctv.activeIpCctv?.ipAddress?.trim();
    return Boolean(ip?.startsWith('rtsp://'));
  });

  if (configured.length === 0) {
    lines.push('  # No active RTSP sources found in database.');
  }

  for (const cctv of configured) {
    const activeIp = cctv.activeIpCctv;
    if (!activeIp) {
      continue;
    }

    const source = activeIp.ipAddress.trim();

    lines.push(
      `  ${cctv.id}:`,
      `    source: "${yamlEscape(source)}"`,
      '    sourceOnDemand: yes',
      '    sourceOnDemandStartTimeout: 15s',
      '    sourceOnDemandCloseAfter: 10s'
    );
  }

  const targetPath = resolve(process.cwd(), 'infra', 'mediamtx', 'mediamtx.yml');
  writeFileSync(targetPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(`Generated MediaMTX config with ${configured.length} path(s) at ${targetPath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
