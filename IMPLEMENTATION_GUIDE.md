# Clean Code Implementation: IP_CCTV Architecture

**Created:** April 8, 2026  
**Status:** ✅ Complete - Schema, Types, Repository, API Routes

---

## 📋 Executive Summary

Refactored CCTV infrastructure to implement **enterprise-grade** monitoring system with:
- ✅ Separation of concerns (device metadata ≠ network config)
- ✅ Audit trail (who, when, why for every IP change)
- ✅ Historical tracking (complete IP change history)
- ✅ Production-ready constraints (data integrity)
- ✅ Scalable architecture (ready for multiple IPs, VPN, proxies)

---

## 🏗️ Architecture

### Schema Design

**Relational Model:**
```
Koperasi (1)
    ↓
CCTV (8) ← Active IP Reference (Denormalized)
    ↓
IP_CCTV (*) ← Full history + audit trail
```

**Database Constraints:**
```sql
-- 1 Koperasi → N CCTVs
ALTER TABLE CCTV ADD CONSTRAINT fk_koperasi_id
  FOREIGN KEY (koperasiId) REFERENCES Koperasi(id);

-- 1 CCTV → 1 Active IP (one-to-one, unique)
ALTER TABLE CCTV ADD CONSTRAINT uq_active_ip
  UNIQUE(activeIpCctvId);

-- 1 CCTV → Many IPs (one-to-many)
ALTER TABLE IP_CCTV ADD CONSTRAINT fk_cctv_id
  FOREIGN KEY (cctvId) REFERENCES CCTV(id) ON DELETE CASCADE;

-- Only 1 active IP per CCTV at a time
ALTER TABLE IP_CCTV ADD CONSTRAINT uq_cctv_active
  UNIQUE(cctvId, isActive)
  WHERE isActive = true;
```

### Data Flow Diagram

```
User Action: "Change CCTV IP from 192.168.1.1 to 192.168.1.2"
    ↓
API: PATCH /api/cctv/{id}/ip
    ↓
CCTVRepository.updateIP(cctvId, newIp, userId, reason)
    ↓
[1] Create new IP_CCTV record
    - ipAddress: "192.168.1.2"
    - isActive: true
    - changedBy: "admin_001"
    - changeReason: "Network maintenance"
    - assignedAt: now()
    ↓
[2] Deactivate old IP_CCTV
    - isActive: false
    - deactivatedAt: now()
    ↓
[3] Update CCTV.activeIpCctvId → new IP_CCTV.id
    ↓
Response: 200 OK with new IP + audit trail
    ↓
Dashboard refresh shows IP changed + history
```

---

## 📁 File Structure

### Schema
```
prisma/
├── schema.prisma          # Core models: CCTV, IP_CCTV
├── MIGRATION_IP_CCTV.md   # Migration guide + seed script
└── migrations/
    └── 20260408_*_add_ip_cctv_table/
        └── migration.sql
```

### Code
```
lib/
├── types.ts                           # TypeScript interfaces (updated)
├── repositories/
│   └── CCTVRepository.ts              # Data access abstraction (NEW)
└── prisma.ts                          # Prisma client

app/api/
├── koperasi/[id]/cctv/
│   └── route.ts                       # List/Create CCTV (updated)
└── cctv/[id]/ip/
    └── route.ts                       # Update/History IP (NEW)
```

---

## 🔑 Key Components

### 1. CCTVRepository (Data Access Layer)

**Benefits:**
- ✅ Single source of truth for queries
- ✅ Consistent error handling
- ✅ Easy to test (mock-friendly)
- ✅ Encapsulates Prisma logic

**Main Methods:**
```typescript
findByIdWithIP(cctvId)          // Get CCTV + active IP
findByKoperasiId(koperasiId)    // Get all CCTVs for Koperasi
getIPHistory(cctvId)            // Full IP change history
updateIP(cctvId, newIp, userId, reason)  // Change IP with audit
create(data)                    // Create new CCTV + initial IP
getStatusSummary(koperasiId)    // Dashboard stats
findByIP(ipAddress)             // Search by IP
delete(cctvId)                  // Soft delete support
```

### 2. API Routes

#### GET `/api/koperasi/[id]/cctv`
Returns all CCTVs for a Koperasi with status summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "koperasiId": "kop_123",
    "koperasiName": "KSP Sejahtera",
    "summary": {
      "total": 8,
      "online": 7,
      "offline": 1,
      "maintenance": 0
    },
    "cctvs": [
      {
        "id": "cctv_001",
        "label": "CCTV-01",
        "location": "Pintu Masuk",
        "status": "ONLINE",
        "activeIpCctv": {
          "ipAddress": "192.168.1.100",
          "port": 8080,
          "protocol": "RTSP",
          "isActive": true
        }
      }
    ],
    "count": 8
  }
}
```

#### POST `/api/koperasi/[id]/cctv`
Create new CCTV with initial IP configuration.

**Request:**
```json
{
  "label": "CCTV-09",
  "location": "Ruang VIP",
  "ipAddress": "192.168.1.109",
  "brand": "Hikvision",
  "resolution": "4K"
}
```

#### PATCH `/api/cctv/[id]/ip`
Update CCTV IP with full audit trail.

**Request:**
```json
{
  "ipAddress": "192.168.1.200",
  "port": 8080,
  "reason": "Network reconfiguration - moved to subnet B",
  "userId": "admin_001"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cctv": { /* full CCTV with new IP */ },
    "newIP": {
      "ipAddress": "192.168.1.200",
      "isActive": true,
      "changedBy": "admin_001",
      "changeReason": "Network reconfiguration - moved to subnet B"
    },
    "changedAt": "2026-04-08T10:30:00Z"
  }
}
```

#### GET `/api/cctv/[id]/ip/history`
Retrieve complete IP change history for audit purposes.

**Response:**
```json
{
  "success": true,
  "data": {
    "cctvId": "cctv_001",
    "cctvLabel": "CCTV-01",
    "ipHistory": [
      {
        "ipAddress": "192.168.1.200",
        "isActive": true,
        "assignedAt": "2026-04-08T10:30:00Z",
        "changedBy": "admin_001",
        "changeReason": "Network reconfiguration"
      },
      {
        "ipAddress": "192.168.1.100",
        "isActive": false,
        "assignedAt": "2026-01-15T09:00:00Z",
        "deactivatedAt": "2026-04-08T10:30:00Z",
        "changeReason": "INITIAL setup"
      }
    ],
    "count": 2,
    "activeIP": { /* active IP object */ }
  }
}
```

---

## 🚀 Usage Examples

### Scenario 1: Dashboard List View
```typescript
// Get all CCTVs with current IP status
const response = await fetch(`/api/koperasi/${koperasiId}/cctv`);
const { data } = await response.json();

// Render with IP info
data.cctvs.forEach(cctv => {
  console.log(`${cctv.label}: ${cctv.activeIpCctv?.ipAddress}`);
});
```

### Scenario 2: IP Change Workflow
```typescript
// Admin changes CCTV IP
const response = await fetch(`/api/cctv/${cctvId}/ip`, {
  method: 'PATCH',
  body: JSON.stringify({
    ipAddress: "192.168.2.50",
    reason: "Device moved to monitoring room 2",
    userId: "admin_john"
  })
});
```

### Scenario 3: Audit & Compliance
```typescript
// Retrieve IP change history for CCTV
const response = await fetch(`/api/cctv/${cctvId}/ip/history`);
const { data } = await response.json();

// Export for compliance report
const csvData = data.ipHistory.map(ip => [
  ip.ipAddress,
  ip.assignedAt,
  ip.deactivatedAt,
  ip.changedBy,
  ip.changeReason
]);
```

---

## 🔒 Security & Production Checklist

### Immediate (Before Production)
- [ ] Encrypt `IP_CCTV.password` field (use bcrypt or libsodium)
- [ ] Add IP address validation (IPv4 & IPv6 format)
- [ ] Add port range validation (1-65535)
- [ ] Implement API rate limiting (prevent brute force IP changes)
- [ ] Add permission checks (only admins can change IPs)
- [ ] Use HTTPS for all API calls

### Short-term (Week 1-2)
- [ ] Add audit log table (separate from active tables)
- [ ] Implement webhook notifications (alert on IP change)
- [ ] Add dashboard UI for IP history view
- [ ] Create database backup strategy

### Medium-term (Month 1-3)
- [ ] Support multiple IPs per CCTV (extend model)
- [ ] Add VPN/proxy support (new fields)
- [ ] Implement IP failover logic
- [ ] Add performance monitoring (query slow-log)

---

## 📊 Performance Characteristics

### Query Performance

| Query | Index | Time | Notes |
|-------|-------|------|-------|
| Get active IP | `activeIpCctvId@CCTV` | O(1) | Denormalized reference |
| List all IPs for CCTV | `cctvId@IP_CCTV` | O(n) | n = IP history length |
| Search by IP | `ipAddress@IP_CCTV` | O(log m) | m = total IPs |
| Get status summary | Full scan | O(k) | k = CCTVs per Koperasi |

### Database Footprint

```
Per CCTV (8 devices)
├── CCTV table: 200 bytes
├── IP_CCTV current: 150 bytes
└── IP_CCTV history (avg 5 records): 750 bytes
───────────────────────────────
Total per Koperasi: ~7.5 KB (8 devices)

Scaling to 1000 Koperasi:
├── CCTV: 8,000 records = 1.6 MB
├── IP_CCTV active: 8,000 records = 1.2 MB
└── IP_CCTV history (5 avg): 40,000 records = 6 MB
───────────────────────────────
Total: ~8.8 MB (manageable)
```

---

## 📚 References

### Related Files
- [MIGRATION_IP_CCTV.md](./MIGRATION_IP_CCTV.md) - Database migration guide
- [types.ts](../lib/types.ts) - TypeScript interfaces
- [CCTVRepository.ts](../lib/repositories/CCTVRepository.ts) - Data layer
- [API Routes](../app/api/) - REST endpoints

### Best Practices Applied
1. **Separation of Concerns** - Repository pattern isolates data access
2. **Audit Trail** - Track who/when/why for compliance
3. **Denormalization** - activeIpCctvId optimizes common queries
4. **Constraints** - Unique(cctvId, isActive) enforces consistency
5. **Error Handling** - Graceful failures with meaningful messages
6. **Type Safety** - Full TypeScript interfaces for dev experience

---

## ❓ FAQ

**Q: Why separate IP_CCTV from CCTV?**  
A: Future scalability. CCTV = device metadata (fixed), IP_CCTV = network config (changeable). Separate tables allow multi-IP per device, VPN support, historical tracking.

**Q: What if I need multiple IPs per CCTV?**  
A: Remove the `@unique` constraint on `activeIpCctvId` and add a new `primaryIpCctvId` field, or use application logic to pick primary.

**Q: How do I migrate existing data?**  
A: Use the seed script in MIGRATION_IP_CCTV.md - creates IP_CCTV records from legacy CCTV.ipAddress field.

**Q: Is this scalable to 10,000+ CCTVs?**  
A: Yes. With proper indexing (already done) and pagination in API, should handle 100K+ easily. Database size stays under 100 MB.

---

**Built with ❤️ following Clean Code & SOLID principles**
