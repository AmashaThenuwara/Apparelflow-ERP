# 🏭 ApparelFlow ERP — End-to-End Application & Feature Guide

This guide provides a comprehensive walkthrough of **every page, feature, and workflow process** in **ApparelFlow ERP**.

---

## 📋 Table of Contents

1. [Manufacturing Flow Architecture](#1-manufacturing-flow-architecture)
2. [Page 1: Authentication & Role Switcher (`/login`)](#page-1-authentication--role-switcher-login)
3. [Page 2: Executive Dashboard (`/dashboard`)](#page-2-executive-dashboard-dashboard)
4. [Page 3: Garment Recipe Management (`/recipes`)](#page-3-garment-recipe-management-recipes)
5. [Page 4: Cutting Department & Order Engine (`/cutting/orders`)](#page-4-cutting-department--order-engine-cuttingorders)
6. [Page 5: Quality Control Verification Gate (`/qc`)](#page-5-quality-control-verification-gate-qc)
7. [Page 6: Sewing Assembly Queue (`/sewing`)](#page-6-sewing-assembly-queue-sewing)
8. [Page 7: User Administration Portal (`/admin/users`)](#page-7-user-administration-portal-adminusers)
9. [Summary of Security Guards & Hard Stops](#9-summary-of-security-guards--hard-stops)

---

## 1. Manufacturing Flow Architecture

ApparelFlow ERP controls the production handover from the **Cutting Department** to the **Sewing Line Assembly Floor**:

```
┌────────────────────────┐       ┌────────────────────────┐       ┌────────────────────────┐
│   CUTTING DEPARTMENT   │ ────> │  QC VERIFICATION GATE  │ ────> │ SEWING ASSEMBLY FLOOR  │
│ Creates Batch & Logs   │       │ 5-Point Panel Check &  │       │ Line Assembly & Final  │
│ Fabric Piece Counts    │       │ Traffic Lights (🟢🟡🔴)  │       │ Completion Tracking    │
└────────────────────────┘       └────────────────────────┘       └────────────────────────┘
```

---

## Page 1: Authentication & Role Switcher (`/login`)

### 🎯 Purpose & Features
The login page authenticates factory operators and enforces **Role-Based Access Control (RBAC)** across the system. It features a **1-Click Quick Demo Login Panel** allowing evaluators and staff to switch seamlessly between factory roles.

### 👥 Pre-Configured Factory Accounts
All demo accounts use password: `ApparelFlow@2026`

- 🛡️ **Admin (`admin@apparelflow.test`)**: Maddy — Full system access & user management.
- ✂️ **Cutting Manager (`cutting@apparelflow.test`)**: S.Thenuwara — Batch creation & fabric spreading.
- 🔬 **QC Inspector (`qc@apparelflow.test`)**: D.Kodithuwakku — 5-point QC verification gate.
- 🧵 **Sewing Supervisor (`sewing@apparelflow.test`)**: A.K.Thenuwara — Verified sewing queue & line tracking.

### 📝 Step-by-Step Instructions
1. Open `http://localhost:3000/login` (or live Vercel URL).
2. Click any of the **Quick 1-Click Role Login** buttons (or enter email and password manually).
3. Click **Sign In to ERP**.
4. The system validates credentials via `bcryptjs`, issues a stateless `jose` JWT cookie (`apparelflow_session`), and redirects to the **Executive Dashboard**.

---

## Page 2: Executive Dashboard (`/dashboard`)

### 🎯 Purpose & Features
The central command hub displaying real-time factory analytics, order distribution counts, active cutting batches, and a live audit trail feed.

### 📊 Key Dashboard Modules
- **KPI Metrics Cards**: Displays Total Active Users, Active Garment Recipes, Total Production Orders, and Orders in Sewing.
- **Order Pipeline Breakdown**: Color-coded summary cards for `PENDING`, `IN_PROGRESS`, `SUBMITTED`, `VERIFIED`, `REJECTED`, and `SENT_TO_SEWING`.
- **Recent Orders Table**: Lists the 6 most recent cutting batches with order number, garment recipe name, target quantity, current status badge, and update timestamp.
- **Live System Audit Trail**: Stream of recent factory actions recording user attribution, action performed, and timestamp.

### 📝 Step-by-Step Instructions
1. Navigate to `/dashboard` from the navigation bar.
2. Review top-level production metrics.
3. Click on any order in the **Recent Orders** table to view its detailed breakdown.

---

## Page 3: Garment Recipe Management (`/recipes`)

### 🎯 Purpose & Features
Garment recipes serve as the **Bill of Materials (BOM)** blueprints. Each recipe specifies fabric requirements, maximum allowed wastage percentage, and the required cut panel ratios per garment unit.

### 📐 Seeded Production Recipes

#### 1. Casual Blouse (`REC-BL01`)
- **Category**: Blouse | **Standard Fabric**: 1.8 yards/piece | **Wastage Cap**: 5.0%
- **Cut Components**:
  - Front Body Panel: 1 panel/garment
  - Back Body Panel: 1 panel/garment
  - Sleeves (Left & Right): 2 panels/garment
  - Collar & Stand: 1 piece/garment
  - Sleeve Cuffs: 2 strips/garment

#### 2. Crop Top (`REC-CT02`)
- **Category**: Crop Top | **Standard Fabric**: 1.1 yards/piece | **Wastage Cap**: 8.0%
- **Cut Components**:
  - Front Chest Panel: 1 panel/garment
  - Back Support Panel: 1 panel/garment
  - Neck Binding Strip: 1 strip/garment
  - Hem Elastic Casing: 1 strip/garment
  - Side Strap Accents: 2 strips/garment

### 📝 Step-by-Step Instructions to Create a New Recipe
1. Navigate to **Recipes** ➔ Click **+ Create Recipe** (`/recipes/new`).
2. Enter Recipe Code (e.g. `REC-JK03`), Garment Name (e.g. `Denim Jacket`), Description, and Version.
3. Add component rows with Component Name, Code, Ratio Quantity, and Unit.
4. Click **Save Garment Recipe**.

---

## Page 4: Cutting Department & Order Engine (`/cutting/orders`)

### 🎯 Purpose & Features
Where Cutting Managers create new production batches, track fabric spreading, enter actual cut component counts, and submit completed batches to Quality Control.

### 🧮 Dynamic Component Multiplier Engine
When creating a cutting order, the system dynamically calculates the **Expected Component Counts**:

$$\text{Expected Count} = \text{Target Garment Quantity} \times \text{Component Ratio per Garment}$$

*Example for 50 Casual Blouses*:
- Front Body Panel = $50 \times 1 = 50$
- Sleeves = $50 \times 2 = 100$
- Sleeve Cuffs = $50 \times 2 = 100$

### 📝 Step-by-Step Instructions
1. **Create Order** (`/cutting/orders/new`):
   - Select Garment Recipe (e.g. Casual Blouse).
   - Enter Target Order Quantity (e.g. `50` units).
   - Enter Fabric Roll ID (e.g. `FAB-ROLL-882`) and Actual Fabric Used (e.g. `92.5` yards).
   - Review automatically generated expected component breakdown.
   - Click **Create Cutting Order**. Order status starts as **`PENDING`**.

2. **Start Knife Cutting**:
   - On the Order Details page (`/cutting/orders/[id]`), click **Start Knife Cutting**. Status transitions to **`IN_PROGRESS`**.

3. **Log Cut Counts & Submit to QC**:
   - Enter physical cut panel counts for each component.
   - Click **Submit Batch to QC Gate**. Status transitions to **`SUBMITTED`**.

---

## Page 5: Quality Control Verification Gate (`/qc`)

### 🎯 Purpose & Features
The core quality gatekeeper terminal where QC Inspectors physically verify panel bundles before releasing fabric to the sewing machines.

### 🟢🟡🔴 Traffic-Light Status Matrix
For each cut component, the system evaluates status in real time:

| Status Flag | Condition Formula | Action Rule |
| :--- | :--- | :--- |
| 🟢 **GREEN (MATCH)** | $\text{Actual} == \text{Expected}$ | Exact match. Passes verification. |
| 🟡 **YELLOW (EXCESS)** | $\text{Actual} > \text{Expected}$ | Surplus pieces. Warning logged; batch may proceed. |
| 🔴 **RED (SHORTAGE)** | $\text{Actual} < \text{Expected}$ | **Defect shortage**. **Approve action strictly blocked**. |

### 📊 Fabric Wastage Calculation
The system computes fabric consumption variance:

$$\text{Fabric Wastage \%} = \left( \frac{\text{Actual Fabric Used} - \text{Expected Fabric}}{\text{Expected Fabric}} \right) \times 100$$

### 📝 Step-by-Step Instructions
1. Open **QC Inspection Gate** (`/qc`).
2. Under Pending Inspection Queue, click **Inspect Order** on a submitted batch.
3. Review actual vs target panel counts.
4. **If all items are 🟢 GREEN or 🟡 YELLOW**:
   - Click **Approve Batch**. Status becomes **`VERIFIED`**, releasing the order to the Sewing Queue.
5. **If any item is 🔴 RED or defective**:
   - The **Approve Batch** button is disabled.
   - Select **Reject Batch**.
   - Enter a **Mandatory Rejection Reason** (e.g. `Collar pieces short by 2`).
   - Click **Submit Rejection**. Status becomes **`REJECTED`**, returning the order to Cutting for recutting.

---

## Page 6: Sewing Assembly Queue (`/sewing`)

### 🎯 Purpose & Features
The sewing floor assembly queue. To guarantee factory SOP compliance, **only orders with `VERIFIED` status** are queryable or visible on this page (`WHERE status = 'VERIFIED'`).

### 🔒 Server-Side Hard Stop
Even if an unverified order ID is manually typed into the URL or sent via Postman, the server API rejects the request with **HTTP `403 Forbidden`**.

### 📝 Step-by-Step Instructions
1. Open **Sewing Queue** (`/sewing`).
2. Review verified batches, inspector notes, and fabric wastage percentage.
3. Click **Start Sewing Assembly**. Status updates to **`SENT_TO_SEWING`** (Assembly In Progress).
4. Once line assembly is finished, click **Mark Assembly Complete**.

---

## Page 7: User Administration Portal (`/admin/users`)

### 🎯 Purpose & Features
Admin management portal for provisioning factory personnel accounts and managing access rights.

### 📝 Step-by-Step Instructions
1. Log in as Admin (`admin@apparelflow.test`).
2. Navigate to **Admin** ➔ **Manage Users** (`/admin/users`).
3. View existing user list, assigned roles, and active statuses.
4. Click **+ Add User**, fill in email, full name, role, and password, then click **Save User**.

---

## 9. Summary of Security Guards & Hard Stops

| Security Boundary | Client Behavior | Server API Behavior |
| :--- | :--- | :--- |
| **Shortage Batch Approval** | "Approve Batch" button disabled in UI | API returns **`422 Unprocessable Entity`** |
| **Empty Rejection Reason** | Form requires text note | API returns **`422 Unprocessable Entity`** |
| **Bypassing QC Gate** | Sewing buttons hidden for unverified batches | API returns **`403 Forbidden`** |
| **Role Violation** | Non-permitted navigation hidden | API checks JWT role & returns **`403 Forbidden`** |
