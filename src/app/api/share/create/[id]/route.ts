import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { appendRow, findById, findOne, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import type { ParsedPolicy, ShareToken } from "@/lib/types";

/**
 * POST /api/share/create/[id]  — mint a public share token for the
 * report (Phase 7d.3).
 *
 * The token is the only thing exposed on the resulting /share/[token]
 * URL. The page that resolves it renders a depersonalized preview only
 * (vehicle profile, verdict, at-risk number, top gaps) — never the
 * owner name, plate, email, mobile, or address.
 *
 * Idempotent: if the customer has already minted a token for this
 * report and it isn't revoked, we return the existing one. Lets the
 * "Copy share link" UI feel snappy + avoids accumulating dead tokens
 * when the customer repeatedly opens the share menu.
 *
 * Auth gate: full session OR upload-session that owns the doc, same as
 * the PDF + card routes.
 */

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    id
  );
  if (!parsedPolicy) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Auth — mirrors the PDF + card routes
  const [fullSessionEmail, uploadSession] = await Promise.all([
    getSession(),
    getUploadSession(),
  ]);
  const ownerEmail = (parsedPolicy.owner?.email ?? "").toLowerCase();
  const sessionEmail = (fullSessionEmail ?? "").toLowerCase();
  const fullSessionOk = !!sessionEmail && sessionEmail === ownerEmail;
  const uploadSessionOk =
    !!uploadSession && uploadSession.docs.includes(id);
  if (!fullSessionOk && !uploadSessionOk) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Reuse an existing non-revoked token if present (idempotency).
  const existing = await findOne<ShareToken>(
    Tables.SHARE_TOKENS,
    (t) => t.parsedPolicyId === id && !t.revoked
  );
  if (existing) {
    return NextResponse.json({ token: existing.id, reused: true });
  }

  // Mint a fresh token. 16 bytes of random → 22-char URL-safe base64;
  // collision-resistant enough that we don't need to check uniqueness.
  const tokenId = randomBytes(16)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  // Owner email for revocation control: prefer the parsed-policy owner
  // (canonical), fall back to the session email if missing.
  const recordedOwner =
    ownerEmail || sessionEmail || "anonymous";

  const fresh: ShareToken = {
    id: tokenId,
    parsedPolicyId: id,
    ownerEmail: recordedOwner,
    createdAt: new Date().toISOString(),
    viewCount: 0,
    revoked: false,
  };
  await appendRow<ShareToken>(Tables.SHARE_TOKENS, fresh);

  return NextResponse.json({ token: tokenId, reused: false });
}
