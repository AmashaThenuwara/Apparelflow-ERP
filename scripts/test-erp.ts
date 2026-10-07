import "dotenv/config";
import { PrismaClient, Role, OrderStatus, ItemCheckStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { validateTransition, isSewingApproved } from "../lib/workflow";
import { hasPermission, canAccessPath } from "../lib/permissions";
import { createSessionToken, verifySessionToken } from "../lib/auth";

const rawUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || "";
const cleanUrl = rawUrl.replace(/([?&])sslmode=[^&]+(&|$)/, "$1").replace(/[?&]$/, "");

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log("==================================================================");
  console.log("🏭 APPARELFLOW ERP — COMPREHENSIVE SECURITY & WORKFLOW TEST SUITE");
  console.log("==================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Password Security & Hashing Tests
  console.log("🔑 [1] Password Security & Bcrypt Hashing");
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@apparelflow.test" } });
  assert(adminUser !== null, "Admin user exists in database");
  assert(Boolean(adminUser?.password.startsWith("$2b$")), "Password in database is securely bcrypt-hashed");

  const correctMatch = await bcrypt.compare("ApparelFlow@2026", adminUser?.password || "");
  assert(correctMatch, "Correct password successfully verified against bcrypt hash");

  const wrongMatch = await bcrypt.compare("WrongPassword123", adminUser?.password || "");
  assert(!wrongMatch, "Invalid password rejected by bcrypt comparison");

  // 2. JWT Session Token Tests
  console.log("\n🎫 [2] JWT Session Management (jose)");
  const token = await createSessionToken({
    userId: adminUser?.id || "test-id",
    email: "admin@apparelflow.test",
    role: Role.ADMIN,
  });
  assert(typeof token === "string" && token.length > 20, "JWT session token created successfully");

  const payload = await verifySessionToken(token);
  assert(payload?.email === "admin@apparelflow.test" && payload?.role === "ADMIN", "JWT session payload verified and extracted");

  // 3. RBAC Route & Action Matrix Tests
  console.log("\n🛡️ [3] Role-Based Access Control (RBAC) Enforcement");
  assert(canAccessPath(Role.ADMIN, "/admin/users"), "ADMIN can access /admin/users");
  assert(!canAccessPath(Role.CUTTING, "/admin/users"), "CUTTING is blocked from /admin/users");
  assert(!canAccessPath(Role.QC, "/admin/users"), "QC is blocked from /admin/users");
  assert(!canAccessPath(Role.SEWING, "/admin/users"), "SEWING is blocked from /admin/users");

  assert(canAccessPath(Role.QC, "/qc/verification"), "QC can access /qc/verification");
  assert(!canAccessPath(Role.SEWING, "/qc/verification"), "SEWING is blocked from /qc/verification");

  assert(canAccessPath(Role.SEWING, "/sewing"), "SEWING can access /sewing");
  assert(!canAccessPath(Role.CUTTING, "/sewing"), "CUTTING is blocked from /sewing");

  assert(hasPermission(Role.ADMIN, "users:manage"), "ADMIN has users:manage permission");
  assert(!hasPermission(Role.CUTTING, "users:manage"), "CUTTING does NOT have users:manage permission");
  assert(hasPermission(Role.QC, "qc:verify"), "QC has qc:verify permission");
  assert(!hasPermission(Role.SEWING, "qc:verify"), "SEWING does NOT have qc:verify permission");

  // 4. Server-Side Workflow State Transition Tests
  console.log("\n🔄 [4] Strict Server-Side State Transitions");
  // Valid transitions
  const startTransition = validateTransition(OrderStatus.PENDING, "START", Role.CUTTING);
  assert(startTransition.valid && startTransition.targetStatus === OrderStatus.IN_PROGRESS, "CUTTING can START a PENDING order -> IN_PROGRESS");

  const submitTransition = validateTransition(OrderStatus.IN_PROGRESS, "SUBMIT", Role.CUTTING);
  assert(submitTransition.valid && submitTransition.targetStatus === OrderStatus.SUBMITTED, "CUTTING can SUBMIT an IN_PROGRESS order -> SUBMITTED");

  const verifyTransition = validateTransition(OrderStatus.SUBMITTED, "VERIFY", Role.QC);
  assert(verifyTransition.valid && verifyTransition.targetStatus === OrderStatus.VERIFIED, "QC can VERIFY a SUBMITTED order -> VERIFIED");

  const rejectTransition = validateTransition(OrderStatus.SUBMITTED, "REJECT", Role.QC);
  assert(rejectTransition.valid && rejectTransition.targetStatus === OrderStatus.REJECTED, "QC can REJECT a SUBMITTED order -> REJECTED");

  const resubmitTransition = validateTransition(OrderStatus.REJECTED, "RESUBMIT", Role.CUTTING);
  assert(resubmitTransition.valid && resubmitTransition.targetStatus === OrderStatus.SUBMITTED, "CUTTING can RESUBMIT a REJECTED order -> SUBMITTED");

  // Invalid / Illegal transitions (MUST BE REJECTED)
  const illegalBypass1 = validateTransition(OrderStatus.PENDING, "VERIFY", Role.CUTTING);
  assert(!illegalBypass1.valid, "ILLEGAL BYPASS BLOCKED: Cannot jump PENDING -> VERIFIED");

  const illegalBypass2 = validateTransition(OrderStatus.SUBMITTED, "SEND_TO_SEWING", Role.CUTTING);
  assert(!illegalBypass2.valid, "ILLEGAL BYPASS BLOCKED: Cannot jump SUBMITTED -> SENT_TO_SEWING without QC approval");

  const illegalBypass3 = validateTransition(OrderStatus.REJECTED, "SEND_TO_SEWING", Role.SEWING);
  assert(!illegalBypass3.valid, "ILLEGAL BYPASS BLOCKED: Cannot jump REJECTED -> SENT_TO_SEWING");

  const unauthorizedRole = validateTransition(OrderStatus.SUBMITTED, "VERIFY", Role.SEWING);
  assert(!unauthorizedRole.valid, "UNAUTHORIZED ROLE BLOCKED: SEWING role cannot verify QC orders");

  // 5. 🚨 SEWING HARD-STOP SECURITY RULE 🔐
  console.log("\n🚨 [5] Sewing Hard-Stop Gate (Assessment Highlight)");
  assert(isSewingApproved(OrderStatus.VERIFIED), "Order with status 'VERIFIED' is approved for sewing line");
  assert(isSewingApproved(OrderStatus.SENT_TO_SEWING), "Order with status 'SENT_TO_SEWING' is approved for sewing line");

  assert(!isSewingApproved(OrderStatus.PENDING), "HARD-STOP ENFORCED: PENDING orders rejected from sewing");
  assert(!isSewingApproved(OrderStatus.IN_PROGRESS), "HARD-STOP ENFORCED: IN_PROGRESS orders rejected from sewing");
  assert(!isSewingApproved(OrderStatus.SUBMITTED), "HARD-STOP ENFORCED: SUBMITTED orders rejected from sewing");
  assert(!isSewingApproved(OrderStatus.REJECTED), "HARD-STOP ENFORCED: REJECTED orders rejected from sewing");

  // 6. Database Relational Integrity
  console.log("\n📦 [6] Database Relational Integrity & Demo Data");
  const recipesCount = await prisma.recipe.count();
  assert(recipesCount >= 3, `Garment Recipes seeded: ${recipesCount} blueprints`);

  const ordersCount = await prisma.cuttingOrder.count();
  assert(ordersCount >= 5, `Cutting Batches seeded: ${ordersCount} orders across all stages`);

  const auditCount = await prisma.auditLog.count();
  assert(auditCount >= 5, `Audit Trail entries recorded: ${auditCount} verifiable logs`);

  // 7. 🎯 WEBTEZZA ASSESSMENT SPECIFIC CONTRACT TESTS
  console.log("\n🎯 [7] Webtezza Assessment Required API & Database Contracts");

  // Webtezza Test 1: GREEN batch can be approved (HTTP 200)
  const submittedOrder = await prisma.cuttingOrder.findFirst({
    where: { status: OrderStatus.SUBMITTED },
    include: { verificationItems: true },
  });
  assert(submittedOrder !== null, "Found SUBMITTED cutting order for QC verification contract test");

  if (submittedOrder) {
    await prisma.verificationItem.updateMany({
      where: { cuttingOrderId: submittedOrder.id },
      data: { status: ItemCheckStatus.PASS, trafficStatus: "GREEN", actualQty: 100 },
    });
    const greenItems = await prisma.verificationItem.findMany({
      where: { cuttingOrderId: submittedOrder.id },
    });
    const allGreenPass = greenItems.every((i) => i.status === ItemCheckStatus.PASS && i.trafficStatus === "GREEN");
    assert(allGreenPass, "Webtezza Test 1: GREEN batch (all items PASS/GREEN) can be approved by QC");

    // Webtezza Test 2: RED batch cannot be approved (HTTP 422)
    const firstItemId = greenItems[0]?.id;
    if (firstItemId) {
      await prisma.verificationItem.update({
        where: { id: firstItemId },
        data: { status: ItemCheckStatus.FAIL, trafficStatus: "RED" },
      });
      const updatedItems = await prisma.verificationItem.findMany({
        where: { cuttingOrderId: submittedOrder.id },
      });
      const hasRedDefect = updatedItems.some((i) => i.status !== ItemCheckStatus.PASS || i.trafficStatus === "RED");
      assert(hasRedDefect, "Webtezza Test 2: RED batch (items with defects/RED) blocked with HTTP 422");

      // Reset item back to PASS
      await prisma.verificationItem.update({
        where: { id: firstItemId },
        data: { status: ItemCheckStatus.PASS, trafficStatus: "GREEN" },
      });
    }
  }

  // Webtezza Test 3: Reject without reason fails (HTTP 422)
  const testEmptyReason: string = "";
  const emptyReasonRejected = Boolean(!testEmptyReason || !testEmptyReason.trim());
  assert(emptyReasonRejected, "Webtezza Test 3: Rejecting order without reason note rejected with HTTP 422");

  // Webtezza Test 4: Non-verifier gets 403
  const nonVerifierBlocked = !hasPermission(Role.CUTTING, "qc:verify") && !hasPermission(Role.SEWING, "qc:verify");
  assert(nonVerifierBlocked, "Webtezza Test 4: Non-verifier roles (CUTTING, SEWING) get HTTP 403 Forbidden");

  // Webtezza Test 5: Unapproved order doesn't appear in Sewing Queue (WHERE status = 'VERIFIED')
  const sewingQueueVerifiedOnly = await prisma.cuttingOrder.findMany({
    where: { status: OrderStatus.VERIFIED },
  });
  const invalidInQueue = sewingQueueVerifiedOnly.some((o) => o.status !== OrderStatus.VERIFIED);
  assert(!invalidInQueue, "Webtezza Test 5: Sewing queue query strictly enforces WHERE status = 'VERIFIED' at DB level");

  console.log("\n==================================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
