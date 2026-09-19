import { NextResponse } from "next/server";
import { readHcsEvents } from "@/lib/hedera/hcs";
import { getDonationOnChain } from "@/lib/hedera/contract";

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const all = await readHcsEvents(500);
    const timeline = all
      .filter((e) => e.donationId === id)
      .sort((a, b) =>
        String(a.consensusTimestamp).localeCompare(String(b.consensusTimestamp))
      );

    let onChain = null;
    try { onChain = await getDonationOnChain(id); } catch {}

    return NextResponse.json({ donationId: id, onChain, timeline });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}