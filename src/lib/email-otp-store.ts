/**
 * Email-keyed OTP storage for the report-gate verification flow.
 *
 * Mirror of lib/otp-store.ts but keyed by email instead of mobile.
 * Kept separate so the existing mobile-keyed flow (used by the older
 * report-download gate) stays untouched. They can co-exist
 * indefinitely without collision because the key prefixes differ.
 *
 * Storage: Vercel KV in prod (10-minute TTL), in-memory Map in dev.
 */

import { kv } from "@vercel/kv";

const useKv = !!process.env.KV_REST_API_URL;
const TTL_SECONDS = 10 * 60;

export interface PendingEmailOtp {
  /** 4-digit code as string (preserves leading zeros). */
  code: string;
  /** Optional WhatsApp number captured at the gate alongside email. */
  whatsapp?: string;
  /** ISO timestamp the gate form was submitted (treated as DPDP consent). */
  consentAt: string;
}

interface MemoryEntry extends PendingEmailOtp {
  expiresAt: number;
}
const memoryStore = new Map<string, MemoryEntry>();

function key(email: string): string {
  return `mm:email-otp:${email.toLowerCase().trim()}`;
}

export async function storeEmailOtp(
  email: string,
  entry: PendingEmailOtp
): Promise<void> {
  if (useKv) {
    await kv.set(key(email), entry, { ex: TTL_SECONDS });
    return;
  }
  memoryStore.set(email.toLowerCase().trim(), {
    ...entry,
    expiresAt: Date.now() + TTL_SECONDS * 1000,
  });
}

export async function readEmailOtp(
  email: string
): Promise<PendingEmailOtp | null> {
  if (useKv) {
    return (await kv.get<PendingEmailOtp>(key(email))) ?? null;
  }
  const entry = memoryStore.get(email.toLowerCase().trim());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(email.toLowerCase().trim());
    return null;
  }
  return {
    code: entry.code,
    whatsapp: entry.whatsapp,
    consentAt: entry.consentAt,
  };
}

export async function clearEmailOtp(email: string): Promise<void> {
  if (useKv) {
    await kv.del(key(email));
    return;
  }
  memoryStore.delete(email.toLowerCase().trim());
}

/** 4-digit OTP code, leading zeros preserved. */
export function generateEmailOtpCode(): string {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
}
