// lib/store.js
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "donations.json");

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ donations: [] }, null, 2));
  }
}

function readDb() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return { donations: [] };
  }
}

function writeDb(db) {
  ensureFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

export async function saveDonation(record) {
  const db = readDb();
  const idx = db.donations.findIndex((d) => d.donationId === record.donationId);
  if (idx >= 0) db.donations[idx] = record;
  else db.donations.push(record);
  writeDb(db);
}

export async function getAllDonations() {
  return readDb().donations;
}

export async function getDonation(donationId) {
  return readDb().donations.find((d) => d.donationId === donationId);
}

export async function rebuildCacheFromHcs() {
  const topicId = process.env.HCS_TOPIC_ID;
  const mirrorUrl = process.env.MIRROR_NODE_URL;

  const messages = [];
  let next = `${mirrorUrl}/api/v1/topics/${topicId}/messages?limit=100&order=asc`;
  while (next) {
    const res = await fetch(next, { cache: "no-store" });
    if (!res.ok) break;
    const data = await res.json();
    messages.push(...(data.messages ?? []));
    next = data.links?.next ? mirrorUrl + data.links.next : null;
  }

  const byId = new Map();
  for (const m of messages) {
    try {
      const ev = JSON.parse(Buffer.from(m.message, "base64").toString("utf8"));
      if (ev.eventType !== "donation_received") continue;
      byId.set(ev.donationId, {
        donationId: ev.donationId,
        ngoId: ev.ngoId,
        cause: ev.cause ?? "",
        amount: ev.amount,
        donorAddress: ev.actor ?? "",
        trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/track/${ev.donationId}`,
        contractTxId: ev.contractTxId ?? "",
        createdAt: new Date(ev.timestamp).getTime(),
      });
    } catch {}
  }

  const db = { donations: Array.from(byId.values()) };
  writeDb(db);
  return db.donations;
}