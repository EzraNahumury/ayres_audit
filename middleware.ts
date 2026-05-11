import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

// Map routes to permission keys
const routePermissions: Record<string, string> = {
  "/dashboard/connect": "connect_wa",
  "/dashboard/audital-work": "audital_work",
  "/dashboard/cs-distribution": "audital_work",
  "/dashboard/sales": "data_customer",
  "/dashboard/agent": "ayres_agent",
  "/dashboard/roles": "roles",
  "/dashboard/person-cs": "audital_work",
  "/dashboard/ai-settings": "ai_settings",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (pathname.startsWith("/dashboard") || pathname === "/") {
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const permissions = user.permissions || [];
    if (permissions.includes("all")) return NextResponse.next();

    for (const [route, perm] of Object.entries(routePermissions)) {
      if (pathname.startsWith(route) && !permissions.includes(perm)) {
        const firstAllowed = Object.entries(routePermissions).find(([, p]) => permissions.includes(p));
        if (firstAllowed) {
          return NextResponse.redirect(new URL(firstAllowed[0], request.url));
        }
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
