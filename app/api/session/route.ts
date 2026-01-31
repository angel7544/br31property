import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const role = body?.role as string | undefined;
  if (!role) {
    return NextResponse.json({ ok: false, error: "role required" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sakura_role", role, { path: "/", httpOnly: false, sameSite: "lax" });
  res.cookies.set("sakura_session", "1", { path: "/", httpOnly: false, sameSite: "lax" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sakura_role", "", { path: "/", httpOnly: false, sameSite: "lax", maxAge: 0 });
  res.cookies.set("sakura_session", "", { path: "/", httpOnly: false, sameSite: "lax", maxAge: 0 });
  return res;
}

