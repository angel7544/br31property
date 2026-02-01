import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Use NextRequest cookies API which is more robust
  const role = req.cookies.get("sakura_role")?.value || "";
  const session = req.cookies.get("sakura_session")?.value || "";

  const isAdminRoute = pathname.startsWith("/admin");
  const isProtected = isAdminRoute;

  if (isProtected) {
    const allowed = session === "1" && (role === "owner" || role === "staff" || role === "admin");
    if (!allowed) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already authenticated staff/owner/admin, redirect away from login
  if (pathname === "/login" && session === "1" && (role === "owner" || role === "staff" || role === "admin")) {
    const redirectParam = url.searchParams.get("redirect");
    return NextResponse.redirect(new URL(redirectParam || "/admin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
