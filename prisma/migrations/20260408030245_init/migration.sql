-- CreateEnum
CREATE TYPE "CCTVStatus" AS ENUM ('ONLINE', 'OFFLINE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "Koperasi" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Koperasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CCTV" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "ipAddress" TEXT,
    "status" "CCTVStatus" NOT NULL DEFAULT 'ONLINE',
    "resolution" TEXT,
    "brand" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "koperasiId" TEXT NOT NULL,

    CONSTRAINT "CCTV_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CCTV" ADD CONSTRAINT "CCTV_koperasiId_fkey" FOREIGN KEY ("koperasiId") REFERENCES "Koperasi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
