// app/api/nft/[donationId]/route.js
import { NextResponse } from "next/server";
import QRCode from "qrcode";

// Resolve a Hedera account ID → its EVM address
async function resolveAccountEvmAddress(accountId) {
  try {
    const res = await fetch(
      `${process.env.MIRROR_NODE_URL}/api/v1/accounts/${accountId}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.evm_address) return data.evm_address;
    if (data.alias) {
      const hex = Buffer.from(data.alias, "base64").toString("hex");
      if (hex.length === 40) return "0x" + hex;
    }
    return null;
  } catch {
    return null;
  }
}

// Scan the NFT collection for the one whose metadata points to this donationId.
// The metadata is a small JSON like { d: "don_xxx", t: "/track/don_xxx" }.
async function findNftByDonationId(donationId) {
  const tokenId = process.env.NEXT_PUBLIC_HTS_NFT_TOKEN_ID;
  let next = `${process.env.MIRROR_NODE_URL}/api/v1/tokens/${tokenId}/nfts?limit=100&order=desc`;

  while (next) {
    const res = await fetch(next, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();

    for (const nft of data.nfts ?? []) {
      try {
        const meta = JSON.parse(
          Buffer.from(nft.metadata, "base64").toString("utf8")
        );
        if (meta.d === donationId || meta.donationId === donationId) {
          return nft;
        }
      } catch {
        // skip malformed metadata
      }
    }

    next = data.links?.next
      ? process.env.MIRROR_NODE_URL + data.links.next
      : null;
  }
  return null;
}

export async function GET(req, { params }) {
  try {
    const { donationId } = await params;
    const { searchParams } = new URL(req.url);
    const viewer = searchParams.get("viewer");

    const tokenId = process.env.NEXT_PUBLIC_HTS_NFT_TOKEN_ID;
    const trackingUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/track/${donationId}`;

    // Find the NFT by scanning on-chain metadata — no cache dependency
    const nft = await findNftByDonationId(donationId);

    if (!nft) {
      return NextResponse.json(
        { error: "No NFT minted for this donation yet" },
        { status: 404 }
      );
    }

    const serial = nft.serial_number;
    const owner = nft.account_id ?? null;
    const ownerEvm = owner ? await resolveAccountEvmAddress(owner) : null;

    let metadata = null;
    try {
      metadata = JSON.parse(
        Buffer.from(nft.metadata, "base64").toString("utf8")
      );
    } catch {}

    // Determine ownership
    let ownership = "disconnected";
    if (!viewer) {
      ownership = "disconnected";
    } else if (!owner || !ownerEvm) {
      ownership = "unresolved";
    } else if (ownerEvm.toLowerCase() === viewer.toLowerCase()) {
      ownership = "owner";
    } else {
      ownership = "other";
    }

    // QR is generated only for the owner — non-owners get everything else
    let qrDataUrl = null;
    if (ownership === "owner") {
      qrDataUrl = await QRCode.toDataURL(trackingUrl, {
        width: 400,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
    }

    return NextResponse.json({
      tokenId,
      serial: String(serial),
      owner,
      ownerEvm,
      ownership,
      metadata,
      trackingUrl,
      qrDataUrl,
      indexed: true,
    });
  } catch (err) {
    console.error("[/api/nft]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}