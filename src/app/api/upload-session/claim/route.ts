import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findById, updateById, Tables } from "@/lib/db";
import { setUploadSession, getUploadSession } from "@/lib/upload-session";
import { getSession } from "@/lib/session";
import { sendMagicLinkEmail } from "@/lib/email-sender";
import { buildMagicLinkUrl } from "@/lib/email-token";
import type { ParsedPolicy } from "@/lib/types";

export const runtime = "nodejs";

const SITE_URL = "https://rightoffer.in";

const Schema = z.object({
  email: z.string().email("Invalid email"),
  /** Indian mobile (10 digits starting 6-9). Optional — captured for
   *  future WhatsApp delivery, not blocked on. */
  whatsapp: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile")
    .optional(),
  /** Parsed-policy IDs the customer has uploaded so far in this
   *  browser session. Server stamps owner.email on each + adds them
   *  to the upload-session cookie. May be empty if the first parse
   *  hasn't finished yet — client will call again with the id once
   *  it has it. */
  docIds: z.array(z.string().uuid()).max(20).optional(),
});

/**
 * Capture the customer's email (+ optional WhatsApp) at /upload time,
 * set the scoped upload-session cookie, stamp the doc(s) with the
 * email, and queue the magic-link email (the real verification path).
 *
 * No verification required to set the upload-session cookie — the
 * threat model is scoped: an impersonator can only access docs in
 * their own browser's cookie. Full /me / cross-device access still
 * requires clicking the magic link.
 *
 * Idempotent: re-calling with the same email merges new docIds into
 * the existing cookie. Different email overwrites (no merge — would
 * defeat the scoping).
 */
export async function POST(request: NextRequest) {
  let body: z.infer<typeof Schema>;
  try {
    const raw = await request.json();
    body = Schema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Please enter a valid email." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  const whatsapp = body.whatsapp;

  // If the customer is ALREADY fully signed in, the upload session
  // is redundant. We still stamp the docs with the session email so
  // they land in /me, but skip cookie work + skip the magic-link
  // send (they're already signed in).
  const fullSessionEmail = await getSession();
  const effectiveEmail = fullSessionEmail ?? email;

  // Stamp every doc passed in the request with the effective email.
  // Filtered to docs that look "fresh" (owner.email empty or matching
  // the email being claimed) so a malicious caller can't overwrite
  // someone else's policy by guessing IDs.
  const requestedDocIds = body.docIds ?? [];
  const stampedDocIds: string[] = [];
  for (const id of requestedDocIds) {
    const doc = await findById<ParsedPolicy>(Tables.PARSED_POLICIES, id);
    if (!doc) continue;
    const existing = (doc.owner?.email ?? "").toLowerCase();
    // Stamp if doc is unowned OR already owned by this email
    // (idempotent reclaim from same browser).
    if (existing && existing !== effectiveEmail) continue;
    await updateById<ParsedPolicy>(Tables.PARSED_POLICIES, id, {
      owner: { ...doc.owner, email: effectiveEmail },
    });
    stampedDocIds.push(id);
  }

  if (!fullSessionEmail) {
    // Merge with any existing upload-session docs from this browser.
    const existing = await getUploadSession();
    const mergedDocs =
      existing && existing.email === email
        ? Array.from(new Set([...existing.docs, ...stampedDocIds]))
        : stampedDocIds;
    await setUploadSession(email, mergedDocs, whatsapp);

    // Queue magic link (no await — best-effort; failure shouldn't
    // block the session). Wraps a try/catch so a Resend hiccup
    // doesn't surface to the client as a save failure.
    try {
      const url = buildMagicLinkUrl(email, SITE_URL);
      await sendMagicLinkEmail({ to: email, url });
    } catch (err) {
      console.error("[upload-session/claim] Magic link send failed:", err);
      // Continue — the session is set, customer can request a fresh
      // link from /me/login later if the original didn't arrive.
    }
  }

  return NextResponse.json({
    ok: true,
    email: effectiveEmail,
    stampedCount: stampedDocIds.length,
    alreadySignedIn: !!fullSessionEmail,
  });
}
