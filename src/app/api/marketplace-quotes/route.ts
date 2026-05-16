/**
 * Marketplace quotes API — returns the 3 synthetic RightOffer offers
 * for a given anchor policy.
 *
 * Server-only generation. Deterministic, idempotent — same policy ID
 * always returns the same 3 offers. Drives the marketplace panel in
 * ShellQuotesOpen (State A) and any future client-side refresh.
 *
 * Auth model:
 *   - The anchor policy must belong to the caller's session.
 *   - Accepts either the full magic-link session OR the upload session
 *     (post-parse, pre-magic-link). Mirrors /api/comparisons/create.
 *
 * Phase 3 — synthetic only. Real partner integration is a future
 * milestone; every offer is flagged `isIndicative: true`.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { findById, Tables } from "@/lib/db";
import type { ParsedPolicy } from "@/lib/types";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import { generateMarketplaceOffers } from "@/lib/marketplace-offers";

export const runtime = "nodejs";
export const maxDuration = 10;

const Schema = z.object({
  policyId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const fullSessionEmail = await getSession();
  const uploadSession = fullSessionEmail ? null : await getUploadSession();
  const sessionEmail = fullSessionEmail ?? uploadSession?.email ?? null;
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const target = sessionEmail.toLowerCase();

  let body: z.infer<typeof Schema>;
  try {
    const raw = await request.json();
    body = Schema.parse(raw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const anchor = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    body.policyId
  );
  if (!anchor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ownership: the anchor's owner.email must match the session email,
  // and (when only upload-session is available) the doc must be in the
  // visitor's scoped doc list.
  const owns = (anchor.owner?.email ?? "").toLowerCase() === target;
  const inScope =
    uploadSession === null || uploadSession.docs.includes(anchor.id);
  if (!owns || !inScope) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const offers = generateMarketplaceOffers(anchor);
  return NextResponse.json({ offers });
}
