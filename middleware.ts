import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "apparelflow_session";
const JWT_SECRET_STRING = process.env.AUTH_SECRET || "fallback-secret-for-apparelflow-erp-development-2026";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/admin": ["ADMIN"],
  "/admin/users": ["ADMIN"],
  "/recipes": ["ADMIN", "CUTTING", "QC"],
  "/recipes/new": ["ADMIN", "CUTTING"],
  "/cutting": ["ADMIN", "CUTTING", "QC"],
  "/cutting/orders": ["ADMIN", "CUTTING", "QC"],
  "/cutting/orders/new": ["ADMIN", "CUTTING"],
  "/qc": ["ADMIN", "QC"],
  "/qc/verification": ["ADMIN", "QC"],
  "/sewing": ["ADMIN", "SEWING"],
  "/dashboard": ["ADMIN", "CUTTING", "QC", "SEWING"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets & internal next paths bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/test-db") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  let userPayload: { userId: string; email: string; role: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userPayload = payload as unknown as { userId: string; email: string; role: string };
    } catch {
      userPayload = null;
    }
  }

  // If user is on /login
  if (pathname === "/login") {
    if (userPayload) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Root path redirect
  if (pathname === "/") {
    if (userPayload) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If user is unauthenticated on protected pages or APIs
  if (!userPayload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, req.url));
  }

  // Check role-based route permissions for web pages
  for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
      if (!allowedRoles.includes(userPayload.role)) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { success: false, message: `Forbidden: Role '${userPayload.role}' lacks access to this resource.` },
            { status: 403 }
          );
        }
        // Redirect to dashboard with forbidden toast indicator
        return NextResponse.redirect(new URL("/dashboard?forbidden=true", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
