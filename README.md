# 🏭 ApparelFlow ERP — Cutting Verification & Sewing Gate System

## 1. What is this Project & Why Do We Use It?

### 📌 Project Purpose
**ApparelFlow ERP** is a Garment Manufacturing Execution System (MES) designed for apparel factories. 

In garment manufacturing, fabric cutting is a critical phase. When fabric rolls are cut into pattern pieces (front panel, back panel, sleeves, collar), errors such as **component shortages**, **defects**, or **excess fabric wastage** can cause severe production line delays if incomplete cut bundles reach the sewing line operators.

### 💡 Why We Use This Application
1. **Eliminate Production Waste**: Automatically computes standard fabric requirements and tracks fabric wastage percentage against allowed wastage caps.
2. **Prevent Illegal Production State Jumps**: Prevents unapproved or defective cut batches from skipping Quality Control (QC) or entering the sewing line prematurely.
3. **Enforce QC Component Inspection (Traffic Light System)**: Ensures every batch is verified for exact component piece counts before release:
   - **GREEN**: Actual count equals expected count (Pass).
   - **YELLOW**: Actual count exceeds expected count (Warning).
   - **RED**: Actual count is less than expected count (Shortage/Defect Block).
4. **Auditability**: Records every status change, verifier action, and rejection reason in an immutable audit log.

---

## 2. Next.js Project Structure & Core Concepts (Beginner Guide)

This project is built using **Next.js 15 (App Router)**. Here is an explanation of Next.js concepts and structure:

### 🧩 Next.js File Conventions
- **`app/` Directory**: Next.js uses file-system based routing. Every folder inside `app/` represents a URL route in the application.
- **`page.tsx`**: Defines the user interface (UI) for a specific URL route (e.g., `app/qc/page.tsx` maps to the `/qc` webpage).
- **`layout.tsx`**: Defines the shared layout wrapper (Navbar, Sidebar, HTML head) surrounding child pages.
- **`route.ts`**: Defines server-side API endpoints (`GET`, `POST`, `PATCH`, `DELETE`) inside `app/api/`.
- **`"use client"` Directive**: Placed at the top of files that use client-side React state (`useState`, `useEffect`) or browser event handlers (`onClick`, `onSubmit`).

### 📦 Why We Use `package.json` & `package-lock.json`
- **`package.json`**: The project manifest file that lists project metadata, runnable CLI commands (`dev`, `build`, `start`), and third-party libraries (`next`, `react`, `@prisma/client`, `bcryptjs`, `jose`, `tailwindcss`).
- **`package-lock.json`**: Auto-generated file that locks exact version numbers of all installed sub-dependencies to guarantee that the application behaves identically across all computers and deployment servers.

---

## 3. Detailed Project File Map & Importance

```
Apparelflow-ERP/
├── app/                                  # Next.js App Router (Pages & API Routes)
│   ├── admin/
│   │   └── users/
│   │       └── page.tsx                  # Admin User Management & Registration UI
│   ├── api/                              # Backend Server API Endpoints
│   │   ├── auth/
│   │   │   ├── login/route.ts            # Authenticates user & issues JWT session cookie
│   │   │   ├── logout/route.ts           # Clears session cookie
│   │   │   └── me/route.ts               # Returns current logged-in user profile
│   │   ├── cutting-orders/
│   │   │   ├── route.ts                  # GET all orders / POST create cutting order
│   │   │   └── [id]/
│   │   │       ├── route.ts              # GET cutting order details by ID
│   │   │       └── transition/route.ts   # POST status transition (START, SUBMIT, RESUBMIT)
│   │   ├── qc/
│   │   │   └── verification/[orderId]/
│   │   │       └── route.ts              # GET/POST QC inspection (Approve/Reject HTTP 422)
│   │   ├── sewing/
│   │   │   ├── orders/[id]/route.ts      # GET/POST Sewing line progress & status updates
│   │   │   └── queue/route.ts            # GET sewing queue (Strictly WHERE status = 'VERIFIED')
│   │   └── users/
│   │       └── route.ts                  # GET users list / POST create new user (Admin)
│   ├── cutting/
│   │   └── orders/
│   │       ├── page.tsx                  # Cutting Supervisor Orders List UI
│   │       ├── new/page.tsx              # Create Cutting Order Form UI
│   │       └── [id]/page.tsx             # Cutting Order Detail & Actions UI
│   ├── dashboard/
│   │   └── page.tsx                      # Dashboard overview page based on user role
│   ├── login/
│   │   └── page.tsx                      # Login UI with demo credentials
│   ├── qc/
│   │   ├── page.tsx                      # QC Verifier Pending List UI
│   │   └── verification/[orderId]/
│   │       └── page.tsx                  # QC Component Checklist Verification UI
│   ├── sewing/
│   │   └── page.tsx                      # Sewing Line Queue & Progress UI
│   ├── globals.css                       # Global CSS & Inter font styling
│   └── layout.tsx                        # Root HTML layout container with font setup
├── components/                           # Reusable UI Components
│   ├── layout/
│   │   ├── AppLayout.tsx                 # Main layout wrapper combining Navbar & Sidebar
│   │   ├── Navbar.tsx                    # Top header displaying user email, role, and logout
│   │   └── Sidebar.tsx                   # Role-based left navigation bar
│   └── ui/
│       ├── Badge.tsx                     # StatusBadge & RoleBadge visual indicators
│       ├── Button.tsx                    # Standard styled button component
│       ├── Card.tsx                      # Panel card wrapper container
│       └── Modal.tsx                     # Popup modal dialog component
├── lib/                                  # Core Server Utilities & Business Logic
│   ├── auth.ts                           # Password hashing (bcrypt) & JWT session tokens (jose)
│   ├── permissions.ts                    # Role-Based Access Control (RBAC) matrix
│   ├── prisma.ts                         # PostgreSQL Prisma ORM singleton instance
│   └── workflow.ts                       # State transition rules & sewing gate helper
├── prisma/
│   ├── schema.prisma                     # PostgreSQL Database schema definition
│   └── prisma7.config.ts                 # Prisma configuration file
├── scripts/
│   ├── seed.ts                           # Database seeder (Initial recipes, users, orders)
│   └── test-erp.ts                       # 42-assertion automated test suite
├── package.json                          # Dependencies & NPM scripts
├── tsconfig.json                         # TypeScript compiler configuration
└── README.md                             # Project Documentation
```

---

## 4. Data Lifecycle: What Happens Before & After Clicking a Button?

Here is how data moves through the system when a user performs an action:

```
[ User Form Input in Web Browser ]
         │
         ▼ (React Client State: useState)
[ Click Action Button (e.g. "Create Order" / "Approve Batch") ]
         │
         ▼ (Browser HTTP Request: fetch API)
[ Next.js Server API Route (app/api/...) ]
         │
         ▼ (Authentication & Role Check: lib/auth.ts)
[ Business Logic & Validation (lib/workflow.ts) ]
         │
         ▼ (Prisma ORM Query: prisma.$transaction)
[ PostgreSQL Database (Server Data Tables) ]
         │
         ▼ (HTTP JSON Response: 200 OK / 403 Forbidden / 422 Unprocessable)
[ UI Re-renders with Updated Database State ]
```

### Detailed Example (QC Approval Process):
1. **Before Clicking Button**: The QC Verifier enters actual component counts in form inputs (`app/qc/verification/[orderId]/page.tsx`). The data lives temporarily in browser RAM state (`useState`).
2. **Clicking Button**: The user clicks **"Approve Batch"**.
3. **HTTP API Request**: The browser sends an HTTP `POST` request to `/api/qc/verification/[orderId]` containing the component count payload.
4. **Server Validation**:
   - `lib/auth.ts` inspects the HTTP session cookie to verify the user has role `QC` or `ADMIN` (returns `403 Forbidden` if unauthorized).
   - The route handler checks for component shortages. If any item has `actualQty < expectedQty` (RED status), the server rejects the approval with **HTTP 422 Unprocessable Entity**.
5. **Database Storage**: If all items pass, Prisma updates the `CuttingOrder` status from `SUBMITTED` to `VERIFIED` and creates an `AuditLog` entry inside an atomic PostgreSQL database transaction.
6. **Result**: The database state is updated, allowing the order to appear in the Sewing Queue (`WHERE status = 'VERIFIED'`).

---

## 5. Database Architecture (PostgreSQL & Prisma)

The system uses **PostgreSQL** managed through **Prisma ORM**.

### 📊 Relational Database Tables:
- **`User`**: System accounts (`email`, bcrypt hashed `password`, `role`: `ADMIN`, `CUTTING`, `QC`, `SEWING`).
- **`Recipe`**: Garment blueprints (`REC-BL01` Casual Blouse, `REC-CT02` Crop Top) with standard fabric usage (`fabricPerPiece`) and allowed wastage percentage (`wastageCap`).
- **`RecipeComponent`**: Pattern piece ratios per finished garment (e.g. 1 Front Panel, 1 Back Panel, 2 Sleeves).
- **`CuttingOrder`**: Production batch records (`orderNumber`, `quantity`, `fabricRollId`, `actualFabricUsed`, `expectedFabric`, `wastagePercentage`, `status`).
- **`VerificationItem`**: QC component inspection items (`componentName`, `expectedQty`, `actualQty`, `trafficStatus`: `GREEN`/`YELLOW`/`RED`, `status`: `PASS`/`FAIL`).
- **`AuditLog`**: Immutable audit logs (`userId`, `cuttingOrderId`, `action`, `details`, `timestamp`).
- **`SewingQueueItem`**: Sewing line production progress (`targetPieces`, `completedPieces`, `status`).

---

## 6. How to Host & Deploy the Project

### Deploying to Vercel & Supabase / Neon (Recommended Free Hosting)

1. **Create a Cloud PostgreSQL Database**:
   - Create a database on [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
   - Copy the PostgreSQL database connection string (`postgresql://...`).

2. **Deploy to Vercel**:
   - Push your code repository to GitHub.
   - Connect your GitHub repository to [Vercel](https://vercel.com).
   - Add Environment Variables in Vercel settings:
     - `DATABASE_URL`: Your PostgreSQL connection string.
     - `DIRECT_URL`: Direct PostgreSQL connection string.
     - `AUTH_SECRET`: Secret key string for signing JWT tokens.
   - Click **Deploy**. Vercel will build the Next.js app and host it live.

---

## 7. Running & Testing Locally

### Prerequisites
- Node.js >= 18.x
- PostgreSQL database

### Local Setup:
```bash
# 1. Install dependencies
npm install

# 2. Configure database connection in .env
DATABASE_URL="postgresql://user:password@localhost:5432/apparelflow"
DIRECT_URL="postgresql://user:password@localhost:5432/apparelflow"

# 3. Push database schema & seed demo data
npx prisma db push
npx tsx scripts/seed.ts

# 4. Start local development server
npm run dev
```

### Running Automated Tests:
```bash
npx tsx scripts/test-erp.ts
```

Output:
```
==================================================================
📊 TEST SUITE SUMMARY: 42 PASSED, 0 FAILED
==================================================================
```

---

## 8. Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@apparelflow.test` | `ApparelFlow@2026` |
| Cutting Supervisor | `cutting@apparelflow.test` | `ApparelFlow@2026` |
| Cutting Verifier | `qc@apparelflow.test` | `ApparelFlow@2026` |
| Sewing Supervisor | `sewing@apparelflow.test` | `ApparelFlow@2026` |
