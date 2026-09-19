import { NextResponse } from "next/server";
import { submitHcsEvent } from "@/lib/hedera/hcs";
import { mintReceiptNft } from "@/lib/hedera/hts";
import { getDonationOnChain } from "@/lib/hedera/contract";
import { saveDonation } from "@/lib/store";

export async function POST(req) {
  try {
    const { donationId, ngoId, cause, amount, donorAddress, txHash } = await req.json();

    const trackingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/track/${donationId}`;
    const onChain = await getDonationOnChain(donationId);

    await submitHcsEvent({
      v: 1, donationId,
      eventType: "donation_received",
      ngoId, cause,
      amount: Number(onChain.amount),
      currency: "HBAR",
      description: `Donation received for ${cause}`,
      actor: donorAddress,
      timestamp: new Date().toISOString(),
      contractTxId: txHash,
      metadata: {
        donorAddress,
        ngoWallet: onChain.ngoWallet,
        platformFee: onChain.platformFee,
      },
    });

    const nft = await mintReceiptNft({ donationId, amount, cause, trackingUrl, donorAddress });

    await submitHcsEvent({
      v: 1, donationId,
      eventType: "receipt_minted",
      ngoId,
      amount: Number(onChain.amount),
      currency: "HBAR",
      description: "Donation receipt NFT minted",
      actor: process.env.HEDERA_OPERATOR_ID,
      timestamp: new Date().toISOString(),
      contractTxId: txHash,
      metadata: { tokenId: nft.tokenId, serial: nft.serial, donorAddress },
    });

    await saveDonation({
      donationId, ngoId, cause, amount,
      donorAddress, trackingUrl,
      contractTxId: txHash,
      nftSerial: nft.serial,
      createdAt: Date.now(),
    });

    return NextResponse.json({ donationId, trackingUrl, nft });
  } catch (err) {
    console.error("[/api/donate/confirm]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}