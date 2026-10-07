# AI Optimization & Engineering Report — ApparelFlow ERP

**Company**: Webtezza (Pvt) Ltd  
**Position**: Software Engineering Intern (Full-Stack / React / Next.js)  
**Assessment**: Production Batch Verification & Sewing Queue Gate

---

## 1. Tools & Prompting Strategy

During the development of the **ApparelFlow ERP** Cutting Operations & Gatekeeper Terminal, modern developer tooling was used for initial boilerplate generation, schema definition, and test case structuring.

* **Tools Used**: Next.js 15 App Router, TypeScript, Prisma ORM, Tailwind CSS.
* **Scaffolding**: Used for generating relational database model definitions (`schema.prisma`) and initial Next.js API route handlers.
* **Refactoring Strategy**: Focused on auditing server-side security boundaries, fixing HTTP status codes, enforcing high-contrast UI readability, and building an automated test suite.

---

## 2. Flawed / Broken Code Identified & Resolved

During engineering audit, several critical flaws were identified and corrected:

1. **Incorrect HTTP Status Code for Defect Approvals**:
   * *Issue*: Early API logic returned `HTTP 400 Bad Request` when attempting to verify an order with missing or RED/defective items.
   * *Refactor*: Updated backend validation to strictly return **`HTTP 422 Unprocessable Entity`** as mandated by the Webtezza security contract.

2. **Missing Backend Validation for Rejection Reasons**:
   * *Issue*: The QC verification route allowed rejecting an order without enforcing a non-empty comment note on the server.
   * *Refactor*: Added server-side validation check:
     ```ts
     if (decision === "REJECT" && (!comments || !comments.trim())) {
       return NextResponse.json({ success: false, message: "Rejection reason is required." }, { status: 422 });
     }
     ```

3. **Client-Bypassable Sewing Queue Filtering**:
   * *Issue*: Early queue endpoints included both `VERIFIED` and `SENT_TO_SEWING` in array parameters.
   * *Refactor*: Enforced strict database-level filtering:
     ```ts
     where: { status: OrderStatus.VERIFIED }
     ```

---

## 3. Human Engineering Refactoring

To ensure production-grade security and reliability:

* **Role Isolation & RBAC**: Implemented `requireRole([Role.ADMIN, Role.QC])` middleware to reject non-verifier approval attempts with `HTTP 403 Forbidden`.
* **Database Transactions**: Wrapped QC verification updates and state transitions inside atomic `prisma.$transaction` blocks to prevent partial database writes.
* **High Contrast UI**: Styled all form text fields, search bars, and dropdown menus with explicit high-contrast colors (`text-slate-900` on `bg-white`) to eliminate invisible text defects.

---

## 4. Defensive Architecture & Validation Rules

* **Server-Side Hard Stop**: The Sewing Queue API ignores frontend state and queries the persistent database directly for `WHERE status = 'VERIFIED'`.
* **Authenticated Context**: Verifier identity (`verifiedById`) and verification timestamps (`verifiedAt`) are derived strictly from the server-side JWT session cookie, never trusted from client request payloads.
* **Automated Test Suite**: Built a 42-assertion test suite in `scripts/test-erp.ts` verifying RBAC enforcement, JWT token validation, state machine rules, defect approval blocking, and queue isolation.
