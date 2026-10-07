import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const rawUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || "")
  .replace(/^["']|["']$/g, "")
  .trim();

if (!rawUrl) {
  console.error("❌ CRITICAL ERROR: Neither DIRECT_URL nor DATABASE_URL environment variable is set on Vercel!");
}

const cleanUrl = rawUrl.replace(/([?&])sslmode=[^&]+(&|$)/, "$1").replace(/[?&]$/, "");

const pool = new Pool({
  connectionString: cleanUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
