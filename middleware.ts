import { NextResponse } from "next/server";

export function middleware(req: Request) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  const cookies = (req as any).cookies ?? undefined;
  // Fallback: parse cookie header manually to support Edge runtime
  const cookieHeader = (req as any).headers?.get?.("cookie") || "";
  const parsed: Record<string, string> = {};
  cookieHeader.split(";").forEach((pair: string) => {
    const [k, v] = pair.split("=");
    if (k && v) parsed[k.trim()] = decodeURIComponent(v.trim());
  });

  const role = cookies?.get?.("sakura_role")?.value || parsed["sakura_role"] || "";
  const session = cookies?.get?.("sakura_session")?.value || parsed["sakura_session"] || "";

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

