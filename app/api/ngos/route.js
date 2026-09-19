import { NextResponse } from "next/server";
import { getAllNGOs, getPlatformFeeInfo } from "@/lib/hedera/contract";

export async function GET() {
  try {
    const [ngos, feeInfo] = await Promise.all([getAllNGOs(), getPlatformFeeInfo()]);
    return NextResponse.json({ ngos, feeInfo });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}