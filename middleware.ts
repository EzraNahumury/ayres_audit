import { NextRequest, NextResponse } from "next/server";

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip login page, API routes, static files
  if (pathname === "/login" || pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  // Check auth cookie
  const token = request.cookies.get("auth_token")?.value;

  if (pathname.startsWith("/dashboard") || pathname === "/") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Decode token & check permissions
    try {
      const user = JSON.parse(Buffer.from(token, "base64").toString());
      const permissions: string[] = user.permissions || [];

      // Super Admin / "all" permission = access everything
      if (permissions.includes("all")) return NextResponse.next();

      // Check route-specific permission
      for (const [route, perm] of Object.entries(routePermissions)) {
        if (pathname.startsWith(route) && !permissions.includes(perm)) {
          // Redirect to first allowed page
          const firstAllowed = Object.entries(routePermissions).find(([, p]) => permissions.includes(p));
          if (firstAllowed) {
            return NextResponse.redirect(new URL(firstAllowed[0], request.url));
          }
          return NextResponse.redirect(new URL("/login", request.url));
        }
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
