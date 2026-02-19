import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true as const, remaining: max - 1, resetAt: now + windowMs };
  }
  if (current.count >= max) {
    return { ok: false as const, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;
  return { ok: true as const, remaining: max - current.count, resetAt: current.resetAt };
}

function getIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Minimal rate limit on credentials callback
  if (pathname === "/api/auth/callback/credentials" && req.method === "POST") {
    const key = `login:${getIp(req)}`;
    const res = rateLimit(key, 10, 60_000);
    if (!res.ok) {
      return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
    }
  }

  if (pathname.startsWith("/admin")) {
    // Import dynamique : évite le blocage au démarrage sur Windows (next-auth/jwt)
    const { getToken } = await import("next-auth/jwt");
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/auth/callback/credentials"],
};

