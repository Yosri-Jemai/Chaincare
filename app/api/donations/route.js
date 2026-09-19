import { NextResponse } from "next/server";
import { getAllDonations } from "@/lib/store";

export async function GET() {
  const donations = await getAllDonations();
  return NextResponse.json(donations);
}