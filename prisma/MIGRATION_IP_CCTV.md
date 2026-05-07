# Migration: IP_CCTV Table Implementation

**Date:** April 8, 2026  
**Status:** Schema Created (Ready for Migration)

## Overview

Refactored CCTV model to separate **device metadata** from **network configuration**, introducing new `IP_CCTV` table for clean architecture and scalability.

### Architecture Changes

#### Before (Monolithic)
```
CCTV
├── label, location, status, resolution, brand
├── ipAddress (single field, no history)
└── koperasiId
```

#### After (Separated Concerns)
```
CCTV (Device Metadata)
├── label, location, status, resolution, brand
├── koperasiId
├── activeIpCctvId (FK→IP_CCTV, @unique)
└── Relations: ipCctvs[], activeIpCctv?

IP_CCTV (Network Configuration)
├── ipAddress, port, protocol, username, password
├── isActive, assignedAt, deactivatedAt
├── Audit: changedBy, changeReason, notes
├── cctvId (FK→CCTV, onDelete: Cascade)
├── Constraints: @@unique([cctvId, isActive])
└── Indexes: ipAddress, isActive, cctvId
```

## Key Features

### 1. **One-to-One Active IP** (Efficient)
- Only 1 active IP per CCTV at any time
- Denormalized `activeIpCctvId` for fast queries
- Backward compatible with existing code

### 2. **Audit Trail** (Production-Ready)
- Track WHO changed IP: `changedBy` (user ID)
- Track WHY: `changeReason` (maintenance, replacement, etc.)
- Historical log: `deactivatedAt` timestamp
- Impact: Easy to debug network issues & compliance

### 3. **Flexible Network Config** (Future-Proof)
- Protocol support: RTSP, HTTP, ONVIF, MQTT
- Port dynamic: not hardcoded to 8080
- Optional auth: username/password fields (encrypt in production!)
- Extensible: easy to add VPN, proxies, etc.

### 4. **Data Integrity Constraints**
```sql
-- Only 1 active IP per CCTV
UNIQUE(cctvId, isActive)

-- Cascade delete: removing CCTV deletes all its IPs
ON DELETE CASCADE
```

## Migration Path

### Step 1: Create Migration
```bash
npx prisma migrate dev --name add_ip_cctv_table
```

### Step 2: Seed Data (Optional)
```typescript
// Migrate existing CCTV.ipAddress → IP_CCTV
const cctvs = await prisma.cctv.findMany({
  include: { activeIpCctv: true }
});

for (const cctv of cctvs) {
  if (!cctv.ipAddress) continue;
  
  const ipCctv = await prisma.iP_CCTV.create({
    data: {
      cctvId: cctv.id,
      ipAddress: cctv.ipAddress,
      port: 8080,
      protocol: "RTSP",
      isActive: true,
      assignedAt: cctv.installedAt,
      changeReason: "MIGRATION from legacy ipAddress field"
    }
  });
  
  await prisma.cctv.update({
    where: { id: cctv.id },
    data: { activeIpCctvId: ipCctv.id }
  });
}
```

### Step 3: Remove Legacy Field
After migration succeeds:
```sql
ALTER TABLE "CCTV" DROP COLUMN "ipAddress";
```

## Query Examples

### Get CCTV with Active IP (Efficient)
```typescript
const cctv = await prisma.cctv.findUnique({
  where: { id: "cctv_123" },
  include: {
    activeIpCctv: true // 1 query, minimal data
  }
});

console.log(cctv.activeIpCctv?.ipAddress); // Direct access
```

### Get All IPs (History)
```typescript
const allIps = await prisma.iP_CCTV.findMany({
  where: { cctvId: "cctv_123" },
  orderBy: { assignedAt: "desc" }
});
```

### Change CCTV IP (Audit Trail)
```typescript
async function updateCCTVIP(
  cctvId: string,
  newIp: string,
  changedBy: string,
  reason: string
) {
  const newIpCctv = await prisma.iP_CCTV.create({
    data: {
      cctvId,
      ipAddress: newIp,
      isActive: true,
      changedBy,
      changeReason: reason
    }
  });

  await prisma.iP_CCTV.updateMany({
    where: { cctvId, isActive: true, id: { not: newIpCctv.id } },
    data: { isActive: false, deactivatedAt: new Date() }
  });

  await prisma.cctv.update({
    where: { id: cctvId },
    data: { activeIpCctvId: newIpCctv.id }
  });

  return newIpCctv;
}
```

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Scalability** | Single field, no room | Multiple IPs, historical track |
| **Audit** | None | Full trail (who, when, why) |
| **Query perf** | Scalar lookups | Indexed table + @unique constraint |
| **Maintainability** | Mixed concerns | Clear separation |
| **API Flexibility** | Limited | Protocol, port, auth configurable |

## TypeScript Updates

Updated in `lib/types.ts`:

```typescript
export interface IP_CCTV {
  id: string;
  ipAddress: string;
  port: number;
  protocol: "RTSP" | "HTTP" | "ONVIF" | "MQTT";
  username: string | null;
  password: string | null;
  isActive: boolean;
  assignedAt: string;
  deactivatedAt: string | null;
  notes: string | null;
  changedBy: string | null;
  changeReason: string | null;
}

export interface CCTV {
  // ... existing fields
  activeIpCctvId: string | null;
  ipCctvs?: IP_CCTV[];
  activeIpCctv?: IP_CCTV | null;
}
```

## Next Steps

1. ✅ Schema updated & validated
2. ✅ TypeScript types updated
3. ⏳ Run `npx prisma migrate dev` to apply to dev DB
4. ⏳ Seed data migration script (optional)
5. ⏳ Update API routes to use new `activeIpCctv` relation
6. ⏳ Update dashboard frontend to display IP history
7. ⏳ Add audit log UI (optional)

## Production Checklist

- [ ] Encrypt `password` field before storing (use e.g., libsodium, bcrypt)
- [ ] Add validation for IP address format (IPv4/IPv6)
- [ ] Add port range validation (1-65535)
- [ ] Implement API rate limiting for IP changes
- [ ] Log all IP changes to audit table separate
- [ ] Add permission check: only admins can change IPs
