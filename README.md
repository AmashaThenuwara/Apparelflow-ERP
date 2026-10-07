# 🏭 ApparelFlow ERP — Cutting Verification & Sewing Line Gate System

> **Webtezza Engineering Assessment Implementation**  
> Modern Garment Manufacturing ERP & QC Security Gate built with Next.js 15, React 19, TypeScript, Prisma ORM, PostgreSQL, and Tailwind CSS.

---

## 🌟 Overview & Assessment Alignment

**ApparelFlow ERP** is an enterprise-grade garment manufacturing execution system designed to eliminate production waste, prevent illegal workflow state jumps, and strictly regulate the transition of cut garment components into the sewing line assembly.

### 🔑 Key Business Logic & Technical Highlights
1. **Garment Recipe Engine (BOM Multiplier)**:
   - **REC-BL01**: Casual Blouse (1.5 yards/pc, 5.0% wastage cap, Front/Back/Sleeve ratio 1:1:2)
   - **REC-CT02**: Crop Top (1.2 yards/pc, 4.0% wastage cap, Front/Back/Neckband ratio 1:1:1)
   - Dynamic expected component calculations: `Target Quantity × Component Ratio`.
2. **Cutting Workflow State Machine**:
   ```
   PENDING  ──►  IN_PROGRESS  ──►  SUBMITTED  ──►  QC (VERIFIED / REJECTED)  ──►  SEWING
   ```
   - Illegal transitions (e.g. `PENDING -> VERIFIED` or `SUBMITTED -> SENT_TO_SEWING` without QC approval) are strictly blocked on the backend.
3. **5-Point QC Traffic Light System**:
   - `Actual == Expected` ──► **GREEN** (Passed)
   - `Actual > Expected`  ──► **YELLOW** (Excess component warning)
   - `Actual < Expected`  ──► **RED** (Shortage / Defect flag)
   - **Hard Approval Block**: Approval fails with **HTTP 422 (Unprocessable Entity)** if any metric has defects or RED status.
4. **Mandatory Rejection Validation**:
   - Rejecting an order without a non-empty reason note is rejected by backend validation with **HTTP 422**.
5. **Sewing Gate Security (`WHERE status = 'VERIFIED'`)**:
   - The Sewing Line Queue API strictly filters orders at the database level:
     ```ts
     where: { status: OrderStatus.VERIFIED }
     ```
   - Attempting to fetch or update an unverified order (e.g. `PENDING`, `SUBMITTED`, `REJECTED`) returns **HTTP 403 Forbidden**.
6. **Role-Based Access Control (RBAC) & Authentication**:
   - Roles: `ADMIN`, `CUTTING`, `QC`, `SEWING`.
   - Passwords hashed using `bcrypt` (10 rounds).
   - Sessions managed via secure `jose` JWT cookies.

---

## 🏗️ Architecture & Project Structure

```
Apparelflow-ERP/
├── app/
│   ├── api/
│   │   ├── auth/              # JWT Login, Logout, Session endpoints
│   │   ├── cutting-orders/    # Cutting order CRUD & State transitions
│   │   ├── qc/                # QC Verification endpoints (HTTP 422 enforcement)
│   │   ├── sewing/            # Sewing Queue (WHERE status = 'VERIFIED') & Progress
│   │   └── users/             # Admin User Management
│   ├── cutting/               # Cutting Master Workstation UI
│   ├── qc/                    # QC Inspector Workstation UI
│   ├── sewing/                # Sewing Line Supervisor UI
│   └── admin/                 # User Management & System Logs UI
├── components/                # Reusable UI Components (AppLayout, Cards, Badges, Modals)
├── lib/
│   ├── auth.ts                # Bcrypt, JWT Session, requireRole middleware
│   ├── permissions.ts         # Granular RBAC Permission Matrix
│   ├── prisma.ts              # PostgreSQL Prisma Client instance
│   └── workflow.ts            # State Machine & Sewing Gate Security rules
├── prisma/
│   └── schema.prisma          # Relational PostgreSQL Database Schema
├── scripts/
│   ├── seed.ts                # Database Seeder (Users, Recipes, Orders, Audit Logs)
│   └── test-erp.ts            # 42-Assertion Automated Test Suite
├── README.md                  # System Documentation & Webtezza Contract Specs
└── AI_OPTIMIZATION_REPORT.md  # Architectural Decisions & AI Refactoring Report
```

---

## 🧪 Automated Testing & Verification

The repository includes a comprehensive 42-assertion automated test suite in `scripts/test-erp.ts`.

### 5 Required Webtezza Assessment Verification Tests:
1. ✅ **GREEN batch can be approved**: QC verification succeeds (HTTP 200) when all checklist items pass.
2. ✅ **RED batch cannot be approved**: Attempting to verify a batch with RED/defects returns **HTTP 422**.
3. ✅ **Reject without reason fails**: Rejecting an order without a reason note returns **HTTP 422**.
4. ✅ **Non-verifier gets 403**: Users without `QC` or `ADMIN` role get **HTTP 403 Forbidden**.
5. ✅ **Unapproved order doesn't appear in Sewing Queue**: Database query strictly enforces `WHERE status = 'VERIFIED'`.

### Running Tests Locally:
```bash
npx tsx scripts/test-erp.ts
```

---

## 🚀 Getting Started

### Prerequisites:
- Node.js >= 18.x
- PostgreSQL database (e.g., Supabase / Neon / Local Postgres)

### Installation & Setup:
```bash
# 1. Clone the repository
git clone https://github.com/AmashaThenuwara/Apparelflow-ERP.git
cd Apparelflow-ERP

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
# Fill in DATABASE_URL and DIRECT_URL

# 4. Push database schema & seed initial data
npx prisma db push
npx tsx scripts/seed.ts

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 👥 Demo Logins

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@apparelflow.test` | `ApparelFlow@2026` |
| **Cutting Master** | `cutting@apparelflow.test` | `ApparelFlow@2026` |
| **QC Inspector** | `qc@apparelflow.test` | `ApparelFlow@2026` |
| **Sewing Supervisor** | `sewing@apparelflow.test` | `ApparelFlow@2026` |

---

## 📄 Assessment Compliance Summary

- ✅ **Domain/Business Logic**: BOM Recipe engine with accurate multiplier formulas.
- ✅ **Cutting Workflow State Machine**: Defensive state guards preventing illegal jumps.
- ✅ **QC Traffic Lights**: GREEN / YELLOW / RED status calculation with strict HTTP 422 gate.
- ✅ **Sewing Hard Stop**: Server-side security checking `isSewingApproved(status)` + `WHERE status = 'VERIFIED'`.
- ✅ **Mandatory Rejection Note**: Backend HTTP 422 check when `decision === "REJECT"` without reason.
- ✅ **RBAC & JWT**: Full role isolation for Admin, Cutting, QC, and Sewing operators.
- ✅ **Documentation**: `README.md` and `AI_OPTIMIZATION_REPORT.md` fully documented in repository root.
