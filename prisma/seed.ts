import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run seed');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: ['warn', 'error'],
});

type SeedKoperasi = {
  id: string;
  name: string;
  city: string;
  provinceNama: string;
  address: string;
  latitude: number;
  longitude: number;
  ipSubnet: string;
  defaultPassword: string;
};

type SeedCctv = {
  label: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  resolution: string;
  brand: string;
  ipAddress: string;
  streamPath: string;
};

const KOPERASI_SEED: SeedKoperasi[] = [
  {
    id: '65ea8854-b5f2-43dc-8f5f-9b9622f45f14',
    name: 'KSP Sejahtera Mandiri',
    city: 'Surabaya',
    provinceNama: 'Jawa Timur',
    address: 'Jl. Pahlawan No. 10, Surabaya',
    latitude: -6.93136,
    longitude: 110.82637,
    ipSubnet: '192.168.1',
    defaultPassword: 'password',
  },
  {
    id: '2bdcf258-2d7a-4e63-b258-3efba9207e78',
    name: 'KUD Mitra Tani',
    city: 'Sidoarjo',
    provinceNama: 'Jawa Timur',
    address: 'Jl. Raya Sidoarjo No. 21, Sidoarjo',
    latitude: -6.72636,
    longitude: 111.55538,
    ipSubnet: '192.168.2',
    defaultPassword: 'Hik2026!',
  },
  {
    id: '26da5f8d-bf98-4594-a2d5-b922537f0de8',
    name: 'Kopkar Nusantara',
    city: 'Gresik',
    provinceNama: 'Jawa Timur',
    address: 'Jl. Veteran No. 8, Gresik',
    latitude: -7.6565,
    longitude: 110.89875,
    ipSubnet: '192.168.3',
    defaultPassword: 'password',
  },
  {
    id: '17f283ef-dd2b-42fd-ad55-4daaf8f0d6ea',
    name: 'KSP Bumi Artha',
    city: 'Jakarta',
    provinceNama: 'DKI Jakarta',
    address: 'Jl. Sudirman No. 5, Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
    ipSubnet: '192.168.4',
    defaultPassword: 'password',
  },
  {
    id: '0be8fe9b-0cad-47eb-8778-52c57dc2692b',
    name: 'KUD Karya Bersama',
    city: 'Bandung',
    provinceNama: 'Jawa Barat',
    address: 'Jl. Asia Afrika No. 99, Bandung',
    latitude: -6.9175,
    longitude: 107.6191,
    ipSubnet: '192.168.5',
    defaultPassword: 'password',
  },
];

function createStableUuid(seed: string) {
  const hash = createHash('sha256').update(seed).digest('hex').slice(0, 32).split('');
  hash[12] = '4';
  hash[16] = ['8', '9', 'a', 'b'][Number.parseInt(hash[16], 16) % 4];
  const hex = hash.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function buildCameraSeed(koperasi: SeedKoperasi): SeedCctv[] {
  return [
    {
      label: 'CCTV-01',
      location: 'Pintu Masuk Utama',
      status: 'ONLINE',
      resolution: '4K',
      brand: 'Hikvision',
      ipAddress: `${koperasi.ipSubnet}.101`,
      streamPath: '/Streaming/Channels/101',
    },
    {
      label: 'CCTV-02',
      location: 'Lobby',
      status: 'ONLINE',
      resolution: '1080p',
      brand: 'Hikvision',
      ipAddress: `${koperasi.ipSubnet}.102`,
      streamPath: '/Streaming/Channels/101',
    },
    {
      label: 'CCTV-03',
      location: 'Kasir',
      status: 'ONLINE',
      resolution: '1080p',
      brand: 'Hikvision',
      ipAddress: `${koperasi.ipSubnet}.103`,
      streamPath: '/Streaming/Channels/101',
    },
  ];
}

async function seedKoperasiData() {
  for (const koperasi of KOPERASI_SEED) {
    await prisma.koperasi.upsert({
      where: { id: koperasi.id },
      update: {
        name: koperasi.name,
        city: koperasi.city,
        provinceNama: koperasi.provinceNama,
        address: koperasi.address,
        latitude: koperasi.latitude,
        longitude: koperasi.longitude,
        picName: 'Admin Koperasi',
        picPhoneNumber: '081234567890',
      },
      create: {
        id: koperasi.id,
        name: koperasi.name,
        city: koperasi.city,
        provinceNama: koperasi.provinceNama,
        address: koperasi.address,
        latitude: koperasi.latitude,
        longitude: koperasi.longitude,
        picName: 'Admin Koperasi',
        picPhoneNumber: '081234567890',
      },
    });

    await prisma.cCTV.deleteMany({
      where: { koperasiId: koperasi.id },
    });

    const cameraSeed = buildCameraSeed(koperasi);

    for (let index = 0; index < cameraSeed.length; index += 1) {
      const camera = cameraSeed[index];
      const cctvId = createStableUuid(`cctv:${koperasi.id}:${index + 1}`);

      await prisma.cCTV.create({
        data: {
          id: cctvId,
          label: camera.label,
          location: camera.location,
          status: camera.status,
          resolution: camera.resolution,
          brand: camera.brand,
          koperasiId: koperasi.id,
        },
      });

      const ipRecord = await prisma.iP_CCTV.create({
        data: {
          id: createStableUuid(`ipcctv:${cctvId}:1`),
          cctvId,
          ipAddress: camera.ipAddress,
          port: 554,
          protocol: 'RTSP',
          username: 'admin',
          password: koperasi.defaultPassword,
          streamPath: camera.streamPath,
          isActive: true,
          changeReason: 'Initial seed data',
          notes: 'Auto seeded for development',
        },
      });

      await prisma.cCTV.update({
        where: { id: cctvId },
        data: { activeIpCctvId: ipRecord.id },
      });
    }
  }
}

async function main() {
  console.log('Starting initial dashboard seed...');
  await seedKoperasiData();
  console.log('Seed complete. Koperasi, CCTV, and active IP data are ready.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
