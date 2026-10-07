import "dotenv/config";
import { PrismaClient, Role, OrderStatus, ItemCheckStatus, SewingStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const rawUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || "")
  .replace(/^["']|["']$/g, "")
  .trim();
const cleanUrl = rawUrl.replace(/([?&])sslmode=[^&]+(&|$)/, "$1").replace(/[?&]$/, "");

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("🌱 Starting ApparelFlow ERP database seed...");

  // 1. Seed Users
  console.log("👤 Creating seed users...");
  const passwordHash = await bcrypt.hash("ApparelFlow@2026", 10);

  const usersData = [
    {
      email: "admin@apparelflow.test",
      name: "Maddy (Admin)",
      role: Role.ADMIN,
      password: passwordHash,
    },
    {
      email: "cutting@apparelflow.test",
      name: "S.Thenuwara (Cutting Manager)",
      role: Role.CUTTING,
      password: passwordHash,
    },
    {
      email: "qc@apparelflow.test",
      name: "D.Kodithuwakku (Lead QC Inspector)",
      role: Role.QC,
      password: passwordHash,
    },
    {
      email: "sewing@apparelflow.test",
      name: "A.K.Thenuwara (Sewing Line Supervisor)",
      role: Role.SEWING,
      password: passwordHash,
    },
  ];

  const userMap: Record<string, string> = {};

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        password: u.password,
        isActive: true,
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        password: u.password,
        isActive: true,
      },
    });
    userMap[u.role] = user.id;
    console.log(`  ✓ ${u.role}: ${u.email} (Password: ApparelFlow@2026)`);
  }

  // 2. Seed Recipes
  console.log("📐 Creating Garment Recipes & Components...");
  const recipesData = [
    {
      code: "TSHIRT-001",
      name: "Classic Crew Neck T-Shirt",
      description: "100% Combed Cotton 180 GSM Single Jersey T-Shirt with ribbed collar",
      version: "1.2",
      components: [
        { name: "Front Body Panel", code: "TS-FP-01", quantity: 1, unit: "panel" },
        { name: "Back Body Panel", code: "TS-BP-02", quantity: 1, unit: "panel" },
        { name: "Left Sleeve", code: "TS-SL-03", quantity: 1, unit: "panel" },
        { name: "Right Sleeve", code: "TS-SR-04", quantity: 1, unit: "panel" },
        { name: "Neck Rib Collar", code: "TS-NR-05", quantity: 1, unit: "strip" },
      ],
    },
    {
      code: "HOODIE-002",
      name: "Heavyweight Fleece Pullover Hoodie",
      description: "320 GSM Brushed Back Fleece Hoodie with double-layer hood and kangaroo pouch",
      version: "2.0",
      components: [
        { name: "Front Body Panel", code: "HD-FP-01", quantity: 1, unit: "panel" },
        { name: "Back Body Panel", code: "HD-BP-02", quantity: 1, unit: "panel" },
        { name: "Kangaroo Pocket", code: "HD-KP-03", quantity: 1, unit: "panel" },
        { name: "Sleeve Pair", code: "HD-SL-04", quantity: 2, unit: "panel" },
        { name: "Hood Outer Shell", code: "HD-HO-05", quantity: 2, unit: "panel" },
        { name: "Hood Inner Lining", code: "HD-HL-06", quantity: 2, unit: "panel" },
        { name: "Bottom Hem Rib", code: "HD-RB-07", quantity: 1, unit: "strip" },
        { name: "Cuff Ribs Pair", code: "HD-RC-08", quantity: 2, unit: "strip" },
      ],
    },
    {
      code: "POLO-003",
      name: "Pique Cotton Polo Shirt",
      description: "220 GSM Cotton Pique Knit with knit collar and 2-button front placket",
      version: "1.0",
      components: [
        { name: "Front Panel", code: "PL-FP-01", quantity: 1, unit: "panel" },
        { name: "Back Panel", code: "PL-BP-02", quantity: 1, unit: "panel" },
        { name: "Engineered Collar", code: "PL-CL-03", quantity: 1, unit: "piece" },
        { name: "Front Placket Strip", code: "PL-PK-04", quantity: 2, unit: "strip" },
        { name: "Sleeve Pair", code: "PL-SL-05", quantity: 2, unit: "panel" },
        { name: "Sleeve Rib Cuffs", code: "PL-RC-06", quantity: 2, unit: "strip" },
      ],
    },
    {
      code: "REC-BL01",
      name: "Casual Blouse",
      description: "Casual woven blouse (1.8 yards/piece, 5% max wastage cap)",
      version: "1.0",
      components: [
        { name: "Front Body Panel", code: "BL-FP-01", quantity: 1, unit: "panel" },
        { name: "Back Body Panel", code: "BL-BP-02", quantity: 1, unit: "panel" },
        { name: "Sleeves", code: "BL-SL-03", quantity: 2, unit: "panel" },
        { name: "Collar & Stand", code: "BL-CS-04", quantity: 1, unit: "piece" },
        { name: "Sleeve Cuffs", code: "BL-CF-05", quantity: 2, unit: "strip" },
      ],
    },
    {
      code: "REC-CT02",
      name: "Crop Top",
      description: "Athletic/casual crop top (1.1 yards/piece, 8% max wastage cap)",
      version: "1.0",
      components: [
        { name: "Front Chest Panel", code: "CT-FP-01", quantity: 1, unit: "panel" },
        { name: "Back Support Panel", code: "CT-BP-02", quantity: 1, unit: "panel" },
        { name: "Neck Binding Strip", code: "CT-NB-03", quantity: 1, unit: "strip" },
        { name: "Hem Elastic Casing", code: "CT-HC-04", quantity: 1, unit: "strip" },
        { name: "Side Strap Accents", code: "CT-SS-05", quantity: 2, unit: "strip" },
      ],
    },
  ];

  const recipeMap: Record<string, string> = {};

  for (const r of recipesData) {
    const recipe = await prisma.recipe.upsert({
      where: { code: r.code },
      update: {
        name: r.name,
        description: r.description,
        version: r.version,
        isActive: true,
      },
      create: {
        code: r.code,
        name: r.name,
        description: r.description,
        version: r.version,
        isActive: true,
        components: {
          create: r.components,
        },
      },
      include: { components: true },
    });
    recipeMap[r.code] = recipe.id;
    console.log(`  ✓ Recipe: [${recipe.code}] ${recipe.name} (${recipe.components.length} components)`);
  }

  // 3. Seed Realistic Cutting Orders with Workflows
  console.log("✂️ Creating Cutting Orders with QC items & Audit Logs...");

  // Order 1: CO-1001 (SENT_TO_SEWING - In sewing line)
  const order1 = await prisma.cuttingOrder.upsert({
    where: { orderNumber: "CO-1001" },
    update: {},
    create: {
      orderNumber: "CO-1001",
      recipeId: recipeMap["TSHIRT-001"],
      quantity: 500,
      status: OrderStatus.SENT_TO_SEWING,
      notes: "Navy Blue - Lot #NB-892 - Export Order for ZARA EU",
      createdById: userMap[Role.CUTTING],
      verificationItems: {
        create: [
          { itemKey: "FABRIC_SPEC", title: "Fabric Specification & Lot", expectedValue: "180 GSM Single Jersey / Lot #NB-892", actualValue: "182 GSM verified, shade OK", status: ItemCheckStatus.PASS },
          { itemKey: "PANEL_COUNT", title: "Panel Component Count", expectedValue: "500 sets (2,500 panels)", actualValue: "500 complete bundles", status: ItemCheckStatus.PASS },
          { itemKey: "DIMENSIONS", title: "Pattern Measurement Tolerance", expectedValue: "+/- 0.5cm spec margin", actualValue: "+0.2cm within tolerance", status: ItemCheckStatus.PASS },
          { itemKey: "EDGE_QUALITY", title: "Cutting Edge & Notch Alignment", expectedValue: "Clean edges, notch alignment exact", actualValue: "All notches aligned", status: ItemCheckStatus.PASS },
          { itemKey: "BUNDLE_TICKET", title: "Bundle Ticketing & Barcodes", expectedValue: "Barcoded bundle tickets attached", actualValue: "Verified tickets 1 to 20", status: ItemCheckStatus.PASS },
        ],
      },
      auditLogs: {
        create: [
          { userId: userMap[Role.CUTTING], action: "CREATED", details: "Order created for 500 pcs Navy Blue T-Shirts" },
          { userId: userMap[Role.CUTTING], action: "START", details: "Fabric spread and knife cutting commenced" },
          { userId: userMap[Role.CUTTING], action: "SUBMIT", details: "Bundling completed. Handed over to QC station." },
          { userId: userMap[Role.QC], action: "VERIFY", details: "All 5 verification metrics passed. Zero defects." },
          { userId: userMap[Role.ADMIN], action: "SEND_TO_SEWING", details: "Dispatched to Sewing Line #3" },
        ],
      },
      sewingQueueItem: {
        create: {
          status: SewingStatus.IN_PROGRESS,
          targetPieces: 500,
          completedPieces: 280,
          notes: "Line #3 running smoothly at 45 pcs/hr",
          startedAt: new Date(Date.now() - 3600000 * 4),
        },
      },
    },
  });

  // Order 2: CO-1002 (VERIFIED - Approved, Ready for Sewing)
  const order2 = await prisma.cuttingOrder.upsert({
    where: { orderNumber: "CO-1002" },
    update: {},
    create: {
      orderNumber: "CO-1002",
      recipeId: recipeMap["HOODIE-002"],
      quantity: 300,
      status: OrderStatus.VERIFIED,
      notes: "Heather Grey - Lot #HG-411 - Winter Collection",
      createdById: userMap[Role.CUTTING],
      verificationItems: {
        create: [
          { itemKey: "FABRIC_SPEC", title: "Fabric Specification & Lot", expectedValue: "320 GSM Fleece / Lot #HG-411", actualValue: "320 GSM verified", status: ItemCheckStatus.PASS },
          { itemKey: "PANEL_COUNT", title: "Panel Component Count", expectedValue: "300 sets (2,400 panels)", actualValue: "All panels accounted for", status: ItemCheckStatus.PASS },
          { itemKey: "DIMENSIONS", title: "Pattern Measurement Tolerance", expectedValue: "+/- 0.5cm spec margin", actualValue: "Exact match to acrylic template", status: ItemCheckStatus.PASS },
          { itemKey: "EDGE_QUALITY", title: "Cutting Edge & Notch Alignment", expectedValue: "Clean edges, fleece pile undisturbed", actualValue: "Clean cut edges", status: ItemCheckStatus.PASS },
          { itemKey: "BUNDLE_TICKET", title: "Bundle Ticketing & Barcodes", expectedValue: "Barcoded bundle tickets attached", actualValue: "Numbered & tagged", status: ItemCheckStatus.PASS },
        ],
      },
      auditLogs: {
        create: [
          { userId: userMap[Role.CUTTING], action: "CREATED", details: "Cutting order created for 300 Heavyweight Hoodies" },
          { userId: userMap[Role.CUTTING], action: "START", details: "Auto-cutter started" },
          { userId: userMap[Role.CUTTING], action: "SUBMIT", details: "Batch submitted for QC inspection" },
          { userId: userMap[Role.QC], action: "VERIFY", details: "Inspection complete: 100% Passed. Ready for Sewing dispatch." },
        ],
      },
    },
  });

  // Order 3: CO-1003 (SUBMITTED - Currently Waiting for QC Verification)
  const order3 = await prisma.cuttingOrder.upsert({
    where: { orderNumber: "CO-1003" },
    update: {},
    create: {
      orderNumber: "CO-1003",
      recipeId: recipeMap["POLO-003"],
      quantity: 450,
      status: OrderStatus.SUBMITTED,
      notes: "Forest Green - Pique Fabric - Awaiting QC Inspector",
      createdById: userMap[Role.CUTTING],
      verificationItems: {
        create: [
          { itemKey: "FABRIC_SPEC", title: "Fabric Specification & Lot", expectedValue: "220 GSM Pique / Lot #FG-109", status: ItemCheckStatus.PENDING },
          { itemKey: "PANEL_COUNT", title: "Panel Component Count", expectedValue: "450 sets (2,700 pieces)", status: ItemCheckStatus.PENDING },
          { itemKey: "DIMENSIONS", title: "Pattern Measurement Tolerance", expectedValue: "+/- 0.5cm spec margin", status: ItemCheckStatus.PENDING },
          { itemKey: "EDGE_QUALITY", title: "Cutting Edge & Notch Alignment", expectedValue: "Placket notches precise", status: ItemCheckStatus.PENDING },
          { itemKey: "BUNDLE_TICKET", title: "Bundle Ticketing & Barcodes", expectedValue: "Barcoded tickets", status: ItemCheckStatus.PENDING },
        ],
      },
      auditLogs: {
        create: [
          { userId: userMap[Role.CUTTING], action: "CREATED", details: "Created order for 450 pcs Polo Shirts" },
          { userId: userMap[Role.CUTTING], action: "START", details: "Cutting commenced" },
          { userId: userMap[Role.CUTTING], action: "SUBMIT", details: "Submitted to QC bay for verification" },
        ],
      },
    },
  });

  // Order 4: CO-1004 (REJECTED - Returned to Cutting with defect notes)
  const order4 = await prisma.cuttingOrder.upsert({
    where: { orderNumber: "CO-1004" },
    update: {},
    create: {
      orderNumber: "CO-1004",
      recipeId: recipeMap["TSHIRT-001"],
      quantity: 200,
      status: OrderStatus.REJECTED,
      notes: "Crimson Red - Defective Collar Cut - Needs Re-cutting",
      createdById: userMap[Role.CUTTING],
      verificationItems: {
        create: [
          { itemKey: "FABRIC_SPEC", title: "Fabric Specification & Lot", expectedValue: "180 GSM Jersey", actualValue: "180 GSM verified", status: ItemCheckStatus.PASS },
          { itemKey: "PANEL_COUNT", title: "Panel Component Count", expectedValue: "200 complete sets", actualValue: "Short by 12 neck ribs", status: ItemCheckStatus.FAIL, comments: "Collar count mismatch" },
          { itemKey: "DIMENSIONS", title: "Pattern Measurement Tolerance", expectedValue: "+/- 0.5cm spec margin", actualValue: "Sleeve curve -1.2cm off spec", status: ItemCheckStatus.FAIL, comments: "Sleeve curve exceeds tolerance margin" },
          { itemKey: "EDGE_QUALITY", title: "Cutting Edge & Notch Alignment", expectedValue: "Clean edges", actualValue: "Ragged edge on bundle #4", status: ItemCheckStatus.FAIL, comments: "Dull blade caused ragged cut" },
          { itemKey: "BUNDLE_TICKET", title: "Bundle Ticketing & Barcodes", expectedValue: "All bundles labeled", actualValue: "OK", status: ItemCheckStatus.PASS },
        ],
      },
      auditLogs: {
        create: [
          { userId: userMap[Role.CUTTING], action: "CREATED", details: "Order created for 200 Crimson Red T-Shirts" },
          { userId: userMap[Role.CUTTING], action: "START", details: "Cutting started" },
          { userId: userMap[Role.CUTTING], action: "SUBMIT", details: "Submitted to QC" },
          { userId: userMap[Role.QC], action: "REJECT", details: "REJECTED: Measurement discrepancy (-1.2cm on sleeves) & blade fraying. Returned for recutting." },
        ],
      },
    },
  });

  // Order 5: CO-1005 (IN_PROGRESS - On cutting table)
  const order5 = await prisma.cuttingOrder.upsert({
    where: { orderNumber: "CO-1005" },
    update: {},
    create: {
      orderNumber: "CO-1005",
      recipeId: recipeMap["HOODIE-002"],
      quantity: 150,
      status: OrderStatus.IN_PROGRESS,
      notes: "Black Fleece - Spreading layer 18 of 25",
      createdById: userMap[Role.CUTTING],
      auditLogs: {
        create: [
          { userId: userMap[Role.CUTTING], action: "CREATED", details: "Created order for 150 Black Hoodies" },
          { userId: userMap[Role.CUTTING], action: "START", details: "Fabric spreading on Table #2" },
        ],
      },
    },
  });

  console.log("  ✓ Seeded cutting orders: CO-1001, CO-1002, CO-1003, CO-1004, CO-1005");
  console.log("✨ ApparelFlow ERP seed completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
