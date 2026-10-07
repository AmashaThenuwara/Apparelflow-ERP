# 📂 ApparelFlow ERP — Project Structure & File Guide

This document provides a complete breakdown of the **Next.js 16 (App Router)** directory structure and an explanation of why every file exists in this project.

---

## 📐 Directory Overview

```text
apparelflow-erp/
├── app/                        # Next.js App Router (Pages, Layouts & API Routes)
│   ├── admin/                  # Admin management interfaces
│   ├── api/                    # Server-side API Route Handlers
│   ├── cutting/                # Cutting Department workspace & order creation
│   ├── dashboard/              # Executive Dashboard with metrics & audit feed
│   ├── login/                  # Authentication page with 1-click role switcher
│   ├── qc/                     # Quality Control verification terminal
│   ├── recipes/                # Garment recipe (BOM) management
│   ├── sewing/                 # Sewing line assembly queue
│   ├── globals.css             # Tailwind v4 styles & high-contrast themes
│   └── layout.tsx              # Root HTML layout
├── components/                 # Reusable UI & Layout Components
│   ├── layout/                 # Navbar & App shell layouts
│   └── ui/                     # Badges, Buttons, Cards, Modals
├── lib/                        # Core Domain Logic & Infrastructure
│   ├── auth.ts                 # JWT session & authentication helpers
│   ├── permissions.ts          # Role-Based Access Control (RBAC) rules
│   ├── prisma.ts               # Database connection pool manager
│   └── workflow.ts             # Manufacturing state machine & formulas
├── prisma/                     # Database Schema
│   └── schema.prisma           # Relational data model definitions
├── scripts/                    # Automation Scripts
│   ├── seed.ts                 # Database seeder (Users, Recipes, Orders)
│   └── test-erp.ts             # 36-point automated integration test suite
├── AI_OPTIMIZATION_REPORT.md   # AI engineering & refactoring report
├── README.md                   # Project overview & quick start guide
├── package.json                # Project dependencies & npm scripts
├── next.config.ts              # Next.js framework configuration
└── tsconfig.json               # TypeScript compiler configuration
```

---

## 🔍 Detailed File Guide: Purpose of Every File

### 1. Root Configuration & Project Files

- 📄 **`package.json`**: Defines all npm packages (Next.js, Prisma, `@prisma/adapter-pg`, `jose`, `bcryptjs`, Tailwind CSS) and build scripts (`"build": "prisma generate && next build"`).
- 📄 **`tsconfig.json`**: Configures TypeScript strict mode, path aliases (`@/*`), and JSX settings for React 19.
- 📄 **`next.config.ts`**: Next.js framework configuration enabling Turbopack build optimizations.
- 📄 **`middleware.ts`**: Edge middleware that runs before requests reach pages. Intercepts unauthenticated users and redirects them to `/login`.
- 📄 **`prisma7.config.ts`**: Prisma 7 configuration file pointing to the `@prisma/adapter-pg` driver adapter.
- 📄 **`README.md`**: Master documentation containing project workflow, default user credentials, seeded recipes, and setup steps.
- 📄 **`AI_OPTIMIZATION_REPORT.md`**: Evaluation report detailing AI usage, prompt strategies, and two specific AI flaws caught and refactored by the engineer.

---

### 2. Database Schema (`prisma/`)

- 📄 **`prisma/schema.prisma`**: The single source of truth for the PostgreSQL database structure. Defines 7 relational models:
  - `User`: Factory staff accounts with hashed passwords and assigned roles.
  - `Recipe`: Production recipes (Bill of Materials) like Casual Blouse and Crop Top.
  - `RecipeComponent`: Expected cut panel ratios per garment unit.
  - `CuttingOrder`: Batch cutting orders tracked through the manufacturing state machine.
  - `VerificationItem`: Component-by-component actual vs expected cut counts.
  - `VerificationLog`: Permanent audit record of QC inspection decisions and fabric wastage.
  - `AuditLog`: System-wide audit trail recording every state change and user action.

---

### 3. Core Domain Logic & Infrastructure (`lib/`)

- 📄 **`lib/prisma.ts`**: Manages the PostgreSQL connection pool using `pg` and `@prisma/adapter-pg`. Ensures connection timeouts and pool limits are respected on Vercel serverless hosting.
- 📄 **`lib/auth.ts`**: Handles JWT session token creation and verification using `jose` (Web Crypto API compliant). Sets and clears secure HttpOnly session cookies.
- 📄 **`lib/permissions.ts`**: Defines the Role-Based Access Control (RBAC) permission matrix for `ADMIN`, `CUTTING`, `QC`, and `SEWING` roles.
- 📄 **`lib/workflow.ts`**: Implements the deterministic manufacturing state machine rules and calculates fabric wastage percentage using the formula:
  $$\text{Fabric Wastage \%} = \left( \frac{\text{Actual Fabric} - \text{Expected Fabric}}{\text{Expected Fabric}} \right) \times 100$$

---

### 4. User Interface Components (`components/`)

- 📄 **`components/layout/Navbar.tsx`**: Top navigation header displaying the active user's name, role badge, navigation links, and logout button.
- 📄 **`components/layout/AppLayout.tsx`**: Main app shell container wrapping pages with the navigation bar and background theme.
- 📄 **`components/ui/Button.tsx`**: Reusable button component supporting primary, secondary, danger, and outline variants with loading spinners.
- 📄 **`components/ui/Card.tsx`**: Flexible card and statistic metric card containers used on the dashboard.
- 📄 **`components/ui/Badge.tsx`**: Color-coded badges rendering status flags (e.g. `PENDING`, `VERIFIED`, `REJECTED`, `SENT_TO_SEWING`).
- 📄 **`components/ui/Modal.tsx`**: Accessible modal overlay for confirmation dialogs.

---

### 5. Application Pages (`app/`)

- 📄 **`app/layout.tsx`**: Root HTML shell setting document titles, viewport metadata, and Tailwind styles.
- 📄 **`app/globals.css`**: Tailwind CSS v4 directives and custom scrollbar/high-contrast styling.
- 📄 **`app/login/page.tsx`**: Login page featuring work email/password authentication and 1-click quick role login buttons for fast demo testing.
- 📄 **`app/dashboard/page.tsx`**: Executive Dashboard displaying aggregated KPI metric cards, active cutting orders table, and system audit trail feed.
- 📄 **`app/recipes/page.tsx`**: Lists all active garment recipes and their required cut components.
- 📄 **`app/recipes/new/page.tsx`**: Form for creating new garment recipes with dynamic component rows (ADMIN & CUTTING only).
- 📄 **`app/cutting/orders/page.tsx`**: List of all cutting batches filterable by status.
- 📄 **`app/cutting/orders/new/page.tsx`**: Form to create a new cutting order. Uses the **Multiplier Engine** to dynamically derive expected component quantities (e.g., 50 garments × 2 cuffs = 100 cuffs).
- 📄 **`app/cutting/orders/[id]/page.tsx`**: Detailed order page displaying batch progress, fabric usage, cut breakdown, and workflow action buttons.
- 📄 **`app/qc/page.tsx`**: Quality Control Inspection Queue listing all batches awaiting verification.
- 📄 **`app/qc/verification/[orderId]/page.tsx`**: The **Traffic-Light QC Verification Terminal**. Evaluates component counts in real time (🟢 MATCH, 🟡 EXCESS, 🔴 SHORTAGE). Strictly disables approval if any component is 🔴 RED.
- 📄 **`app/sewing/page.tsx`**: Verified Sewing Queue screen. Displays only `VERIFIED` batches ready for line assembly (`WHERE status = 'VERIFIED'`).
- 📄 **`app/admin/users/page.tsx`**: User management portal for Administrators to create and manage factory staff accounts.

---

### 6. API Route Handlers (`app/api/`)

- 📄 **`app/api/auth/login/route.ts`**: `POST` endpoint verifying user credentials with bcrypt and issuing JWT session cookies.
- 📄 **`app/api/auth/logout/route.ts`**: `POST` endpoint clearing session cookies.
- 📄 **`app/api/auth/me/route.ts`**: `GET` endpoint returning current authenticated user details.
- 📄 **`app/api/recipes/route.ts`**: `GET`/`POST` endpoint for querying and creating garment recipes.
- 📄 **`app/api/cutting-orders/route.ts`**: `GET`/`POST` endpoint for listing and creating cutting orders.
- 📄 **`app/api/cutting-orders/[id]/transition/route.ts`**: `POST` endpoint executing server-side state transitions.
- 📄 **`app/api/qc/verification/[orderId]/route.ts`**: `POST` endpoint submitting QC verification checks. Enforces the **Server-Side Hard Stop** (`422 Unprocessable Entity` if any component is short or rejection reason is empty).
- 📄 **`app/api/sewing/queue/route.ts`**: `GET` endpoint querying approved batches (`WHERE status = 'VERIFIED'`).
- 📄 **`app/api/sewing/orders/[id]/route.ts`**: `POST` endpoint starting sewing line assembly. Enforces **Server-Side RBAC** (`403 Forbidden` if order is unverified or user is unauthorized).
- 📄 **`app/api/dashboard/stats/route.ts`**: `GET` endpoint returning aggregated factory metrics.

---

### 7. Automation & Testing Scripts (`scripts/`)

- 📄 **`scripts/seed.ts`**: Database seeder script creating 4 demo users (Maddy, S.Thenuwara, D.Kodithuwakku, A.K.Thenuwara), 5 garment recipes (Casual Blouse, Crop Top, etc.), and initial cutting orders.
- 📄 **`scripts/test-erp.ts`**: Automated 36-point integration test suite verifying password hashing, JWT tokens, RBAC permissions, state transitions, traffic-light rules, and hard-stop enforcement.
