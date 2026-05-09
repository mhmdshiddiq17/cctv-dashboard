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
const DEFAULT_RTSP_PORT = 554;
const DEFAULT_RTSP_STREAM_PATH =
  process.env.CCTV_RTSP_STREAM_PATH?.trim() || '/Streaming/Channels/101';

type ActiveIpRecord = {
  ipAddress: string;
  port: number;
  protocol: string;
  username: string | null;
  password: string | null;
  streamPath: string | null;
};

function yamlEscape(value: string) {
  return value.replaceAll('"', '""');
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

function resolveRtspSource(activeIp: ActiveIpRecord | null) {
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

  const configured = cctvs
    .map((cctv) => {
      const source = resolveRtspSource(cctv.activeIpCctv);
      return source ? { cctv, source } : null;
    })
    .filter((item): item is { cctv: (typeof cctvs)[number]; source: string } => item !== null);

  if (configured.length === 0) {
    lines.push('  # No active RTSP sources found in database.');
  }

  for (const { cctv, source } of configured) {
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
