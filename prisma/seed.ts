import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
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
};

type SeedCctv = {
  label: string;
  location: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  resolution: string;
  brand: string;
  ipAddress: string;
};

const KOPERASI_SEED: SeedKoperasi[] = [
  {
    id: '1',
    name: 'KSP Sejahtera Mandiri',
    city: 'Surabaya',
    provinceNama: 'Jawa Timur',
    address: 'Jl. Pahlawan No. 10, Surabaya',
    latitude: -6.93136,
    longitude: 110.82637,
  },
  {
    id: '2',
    name: 'KUD Mitra Tani',
    city: 'Sidoarjo',
    provinceNama: 'Jawa Timur',
    address: 'Jl. Raya Sidoarjo No. 21, Sidoarjo',
    latitude: -6.72636,
    longitude: 111.55538,
  },
  {
    id: '3',
    name: 'Kopkar Nusantara',
    city: 'Gresik',
    provinceNama: 'Jawa Timur',
    address: 'Jl. Veteran No. 8, Gresik',
    latitude: -7.6565,
    longitude: 110.89875,
  },
  {
    id: '4',
    name: 'KSP Bumi Artha',
    city: 'Jakarta',
    provinceNama: 'DKI Jakarta',
    address: 'Jl. Sudirman No. 5, Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
  },
  {
    id: '5',
    name: 'KUD Karya Bersama',
    city: 'Bandung',
    provinceNama: 'Jawa Barat',
    address: 'Jl. Asia Afrika No. 99, Bandung',
    latitude: -6.9175,
    longitude: 107.6191,
  },
];

function buildCameraSeed(koperasiId: string): SeedCctv[] {
  return [
    {
      label: 'CCTV-01',
      location: 'Pintu Masuk Utama',
      status: 'ONLINE',
      resolution: '4K',
      brand: 'Hikvision',
      ipAddress: koperasiId === '2'
        ? 'rtsp://admin:Hik2026!@192.168.6.9:554/Streaming/Channels/102'
        : `rtsp://admin:password@192.168.${koperasiId}.101:554/Streaming/Channels/101`,
    },
    {
      label: 'CCTV-02',
      location: 'Lobby',
      status: 'OFFLINE',
      resolution: '1080p',
      brand: 'Dahua',
      ipAddress: `rtsp://admin:password@192.168.${koperasiId}.102:554/Streaming/Channels/101`,
    },
    {
      label: 'CCTV-03',
      location: 'Kasir',
      status: 'MAINTENANCE',
      resolution: '1080p',
      brand: 'Axis',
      ipAddress: `rtsp://admin:password@192.168.${koperasiId}.103:554/Streaming/Channels/101`,
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

    const cameraSeed = buildCameraSeed(koperasi.id);

    for (let index = 0; index < cameraSeed.length; index += 1) {
      const camera = cameraSeed[index];
      const cctvId = `${koperasi.id}-c${index + 1}`;

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
          id: `${cctvId}-ip1`,
          cctvId,
          ipAddress: camera.ipAddress,
          port: 554,
          protocol: 'RTSP',
          username: 'admin',
          password: koperasi.id === '2' ? 'Hik2026!' : 'password',
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
