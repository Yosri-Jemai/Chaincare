import { NextResponse } from "next/server";
import { submitHcsEvent } from "@/lib/hedera/hcs";
import { releaseFundsOnChain } from "@/lib/hedera/contract";

export async function POST(req) {
  try {
    const { donationId, eventType, description, amount, ngoId, metadata } =
      await req.json();

    let contractTxId = null;

    if (
      (eventType === "funds_used" || eventType === "distribution_completed") &&
      amount
    ) {
      const { txHash } = await releaseFundsOnChain({
        donationId,
        amountHbar: amount,
        reason: description,
      });
      contractTxId = txHash;
    }

    await submitHcsEvent({
      v: 1, donationId, eventType,
      ngoId: ngoId ?? "ngo_alpha",
      amount: amount ?? 0,
      currency: "HBAR",
      description,
      actor: process.env.HEDERA_OPERATOR_ID,
      timestamp: new Date().toISOString(),
      contractTxId,
      metadata: metadata ?? {},
    });

    return NextResponse.json({ ok: true, contractTxId });
  } catch (err) {
    console.error("[/api/ngo-update]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}