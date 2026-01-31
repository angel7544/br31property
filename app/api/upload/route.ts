import { NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string | null) || "uploads";
    if (!file) return NextResponse.json({ ok: false, error: "file required" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const res: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder }, (error: any, result: any) => {
        if (error) reject(error);
        else resolve(result);
      });
      stream.end(buffer);
    });

    return NextResponse.json({ ok: true, url: res.secure_url, public_id: res.public_id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "upload failed" }, { status: 500 });
  }
}

