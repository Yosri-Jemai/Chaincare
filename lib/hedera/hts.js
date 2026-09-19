// lib/hedera/hts.js
import {
  TokenId, TokenMintTransaction, TransferTransaction, AccountId,
} from "@hashgraph/sdk";
import { hederaClient } from "./client.js";

const TOKEN_ID = process.env.HTS_NFT_TOKEN_ID;
const OPERATOR_ID = process.env.HEDERA_OPERATOR_ID;

// Hedera caps NFT metadata at 100 bytes. Verify before minting.
const MAX_METADATA_BYTES = 100;

// Convert 0x... EVM address to a Hedera AccountId alias.
function toAccountId(value) {
  if (!value) throw new Error("Missing account id");
  if (value.startsWith("0.0.")) return AccountId.fromString(value);
  if (value.startsWith("0x")) {
    // fromEvmAddress expects the raw hex (no 0x prefix)
    return AccountId.fromEvmAddress(0, 0, value);
  }
  throw new Error("Unrecognized account format: " + value);
}

export async function mintReceiptNft({
  donationId, amount, cause, trackingUrl, donorAddress,
}) {
  // ─────────────────────────────────────────────────────────────
  // Hedera limits on-chain NFT metadata to 100 bytes.
  // Full donation details already live in HCS + the contract,
  // so on-chain we store only a compact pointer.
  // ─────────────────────────────────────────────────────────────
  const metadataObj = {
    d: donationId,                       // "don_ab12cd34"  (~14 bytes)
    t: `/track/${donationId}`,           // tracking pointer (~23 bytes)
  };
  const metadata = JSON.stringify(metadataObj);
  const metadataBytes = Buffer.byteLength(metadata, "utf8");

  console.log(`[hts] metadata payload: ${metadata} (${metadataBytes} bytes)`);

  if (metadataBytes > MAX_METADATA_BYTES) {
    throw new Error(
      `Metadata is ${metadataBytes} bytes but Hedera caps at ${MAX_METADATA_BYTES}. ` +
      `Shorten the fields in lib/hedera/hts.js.`
    );
  }

  // 1. Mint the NFT serial into the treasury (operator account)
  const mint = await new TokenMintTransaction()
    .setTokenId(TokenId.fromString(TOKEN_ID))
    .addMetadata(Buffer.from(metadata, "utf8"))
    .execute(hederaClient);

  const mintReceipt = await mint.getReceipt(hederaClient);
  const serial = mintReceipt.serials[0];
  console.log(`[hts] minted serial #${serial} on token ${TOKEN_ID}`);

  // 2. Try to transfer the NFT to the donor.
  //    If the donor has no native Hedera account for their address,
  //    the transfer fails and the NFT stays in the operator treasury.
  //    That's fine — the HCS event still proves the receipt was minted.
  let transferred = false;
  let transferNote = "Held at treasury";

  try {
    if (donorAddress) {
      const donorId = toAccountId(donorAddress);
      console.log(`[hts] attempting transfer to ${donorId.toString()}`);

      await (
        await new TransferTransaction()
          .addNftTransfer(
            TokenId.fromString(TOKEN_ID),
            serial,
            AccountId.fromString(OPERATOR_ID),
            donorId
          )
          .execute(hederaClient)
      ).getReceipt(hederaClient);

      transferred = true;
      transferNote = `Transferred to ${donorAddress}`;
      console.log(`[hts] ✅ NFT #${serial} transferred to ${donorAddress}`);
    }
  } catch (err) {
    console.warn(`[hts] NFT transfer skipped: ${err.message}`);
    transferNote = `Held at treasury (${err.message})`;
  }

  return {
    serial: serial.toString(),
    tokenId: TOKEN_ID,
    transferred,
    transferNote,
  };
}