// app/api/stats/route.js
import { NextResponse } from "next/server";
import { getAllDonations } from "@/lib/store";
import { getDonationOnChain } from "@/lib/hedera/contract";

export async function GET() {
  try {
    const cached = await getAllDonations();

    // Fetch the authoritative amount from the contract for each donation
    const states = await Promise.all(
      cached.map((d) => getDonationOnChain(d.donationId).catch(() => null))
    );

    let totalDonated = 0;
    let totalReleased = 0;
    let inEscrow = 0;

    for (const s of states) {
      if (!s) continue;
      const amt = Number(s.amount) || 0;
      const rel = Number(s.released) || 0;
      totalDonated += amt;
      totalReleased += rel;
      inEscrow += Math.max(0, amt - rel);
    }

    return NextResponse.json({
      donations: cached.length,
      totalDonated: +totalDonated.toFixed(4),
      totalReleased: +totalReleased.toFixed(4),
      inEscrow: +inEscrow.toFixed(4),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}