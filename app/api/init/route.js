import { NextResponse } from "next/server";
import { rebuildCacheFromHcs } from "@/lib/store";

export async function GET() {
  try {
    const donations = await rebuildCacheFromHcs();
    return NextResponse.json({ ok: true, count: donations.length });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}