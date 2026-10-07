# ApparelFlow ERP

A garment manufacturing management system built with Next.js, TypeScript, Prisma, PostgreSQL, and Tailwind CSS. It manages cutting orders, QC component verification, and sewing line dispatch with role-based access control.

## User Roles

- **Admin**: User registration and role management.
- **Cutting Supervisor**: Create cutting orders and record fabric metrics.
- **Cutting Verifier**: Perform QC inspection on cut component counts.
- **Sewing Supervisor**: View and process the verified sewing queue.

## Workflow

```
Admin (Registers users)
   ↓
Cutting Supervisor (Creates Cutting Order)
   ↓
QC Verifier (Checks component counts & approves/rejects)
   ↓
Sewing Supervisor (Processes verified orders)
```

## Features

- **User & Role Management**: Admin can create and list system users with assigned roles (`CUTTING`, `QC`, `SEWING`, `ADMIN`).
- **Cutting Order Management**: Create orders based on garment recipes (`Casual Blouse`, `Crop Top`), auto-compute component target counts, and track fabric wastage.
- **QC Verification Gate**: Component checklist verification with GREEN / YELLOW / RED status indicators:
  - `GREEN`: Actual count equals expected count.
  - `YELLOW`: Actual count is greater than expected.
  - `RED`: Actual count is less than expected (shortage).
  - Orders with shortages or missing rejection reasons are rejected on the server with HTTP 422.
- **Sewing Queue Filter**: Only orders with status `VERIFIED` appear in the sewing queue (enforced at the database level).
- **Role-Based Access Control**: Server-side JWT authentication and permission checks on all API endpoints.

## Technologies Used

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (`jose`) and `bcryptjs` password hashing
- **Styling**: Tailwind CSS

## Getting Started

1. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/AmashaThenuwara/Apparelflow-ERP.git
   cd Apparelflow-ERP
   npm install
   ```

2. **Configure Environment Variables**:
   Set `DATABASE_URL` and `DIRECT_URL` in `.env`.

3. **Database Setup & Seed Data**:
   ```bash
   npx prisma db push
   npx tsx scripts/seed.ts
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Run the automated test suite:

```bash
npx tsx scripts/test-erp.ts
```

Test Results:
```
==================================================================
📊 TEST SUITE SUMMARY: 42 PASSED, 0 FAILED
==================================================================
```

## Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@apparelflow.test` | `ApparelFlow@2026` |
| Cutting Supervisor | `cutting@apparelflow.test` | `ApparelFlow@2026` |
| Cutting Verifier | `qc@apparelflow.test` | `ApparelFlow@2026` |
| Sewing Supervisor | `sewing@apparelflow.test` | `ApparelFlow@2026` |
