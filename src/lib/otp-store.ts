/**
 * Short-lived OTP storage.
 *
 * Production: Vercel KV with a per-key TTL (10 minutes). Each pending
 * registration is stored under `mm:otp:<mobile>` so the verify endpoint can
 * look it up and atomically delete on success.
 *
 * Local dev (no KV env vars): in-memory Map with timeout-based expiry.
 * Fine for solo developer testing; not safe across server restarts.
 */

import { kv } from "@vercel/kv";

const useKv = !!process.env.KV_REST_API_URL;
const TTL_SECONDS = 10 * 60; // 10 minutes

export interface PendingOtp {
  /** 4-digit OTP code as a string (preserves leading zeros) */
  code: string;
  /** Email the user signed up with (where the OTP was sent) */
  email: string;
  /** Timestamp the consent box was ticked (ISO) */
  consentAt: string;
}

interface MemoryEntry extends PendingOtp {
  expiresAt: number;
}
const memoryStore = new Map<string, MemoryEntry>();

function key(mobile: string): string {
  return `mm:otp:${mobile}`;
}

export async function storeOtp(
  mobile: string,
  entry: PendingOtp
): Promise<void> {
  if (useKv) {
    await kv.set(key(mobile), entry, { ex: TTL_SECONDS });
    return;
  }
  memoryStore.set(mobile, {
    ...entry,
    expiresAt: Date.now() + TTL_SECONDS * 1000,
  });
}

export async function readOtp(mobile: string): Promise<PendingOtp | null> {
  if (useKv) {
    const stored = await kv.get<PendingOtp>(key(mobile));
    return stored ?? null;
  }
  const entry = memoryStore.get(mobile);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(mobile);
    return null;
  }
  return { code: entry.code, email: entry.email, consentAt: entry.consentAt };
}

export async function clearOtp(mobile: string): Promise<void> {
  if (useKv) {
    await kv.del(key(mobile));
    return;
  }
  memoryStore.delete(mobile);
}

/** Generate a random 4-digit OTP as a string, preserving leading zeros. */
export function generateOtpCode(): string {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
}
