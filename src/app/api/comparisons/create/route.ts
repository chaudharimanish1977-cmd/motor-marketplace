import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import {
  appendRow,
  findById,
  findOne,
  Tables,
} from "@/lib/db";
import { generateReport } from "@/lib/report-generator";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import {
  computeRCP,
  scoreAgainstRcp,
} from "@/lib/recommended-coverage-profile";
import type {
  ComparisonReport,
  ComparisonQuoteScore,
  ComparisonRcpSnapshot,
  ComparisonVerdict,
  ParsedPolicy,
  PolicyReport,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Schema = z.object({
  policyId: z.string().uuid().optional(),
  quoteIds: z.array(z.string().uuid()).min(1).max(10),
});

/**
 * Create a ComparisonReport — the persistent Right Offer comparator
 * output.
 *
 * Inputs (one of):
 *   - policyId + quoteIds[]   → Feature 3 (full Renewal Right Offer)
 *   - quoteIds[] only         → Feature 2 (Quote Comparison standalone)
 *
 * Either an existing PolicyReport drives the RCP, OR the report
 * generator is run on the first quote to produce a baseline RCP
 * (the quote stands in for the customer's profile). The RCP is
 * snapshot-captured into the ComparisonReport so it stays stable
 * even if the source report regenerates later.
 *
 * Auction (M4) hasn't been wired yet — the verdict here only weighs
 * the customer's uploaded quotes against the RCP. M4 will extend
 * `verdict` to factor in any future partner-network input too.
 *
 * Auth:
 *   - Session required.
 *   - Every referenced policy/quote must belong to the session email
 *     (owner.email match OR a subscription link). No partial creates
 *     — single cross-account ID fails the whole request with 404.
 */
export async function POST(request: NextRequest) {
  // Accept either full session OR upload session — the comparator is
  // a legitimate same-session action right after upload, and asking
  // the customer to wait for a magic-link click before they can run
  // a comparison would kill conversion.
  const fullSessionEmail = await getSession();
  const uploadSession = fullSessionEmail
    ? null
    : await getUploadSession();
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

  // Load all referenced docs + verify ownership.
  const allIds = [...new Set([body.policyId, ...body.quoteIds].filter(Boolean))] as string[];
  const docs: ParsedPolicy[] = [];
  const uploadScope = uploadSession
    ? new Set(uploadSession.docs)
    : null;
  for (const id of allIds) {
    const p = await findById<ParsedPolicy>(Tables.PARSED_POLICIES, id);
    if (!p) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Ownership: owner.email match. (Subscription-only ownership is rare
    // here since the customer just uploaded these; keep the check simple.)
    if ((p.owner?.email ?? "").toLowerCase() !== target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Upload-session: additionally scope to docs in this browser's
    // cookie. Full session sees everything owned by the email.
    if (uploadScope && !uploadScope.has(p.id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    docs.push(p);
  }

  const policyDoc = body.policyId
    ? docs.find((d) => d.id === body.policyId)
    : undefined;
  const quoteDocs = body.quoteIds
    .map((qid) => docs.find((d) => d.id === qid))
    .filter((d): d is ParsedPolicy => !!d);

  if (quoteDocs.length === 0) {
    return NextResponse.json(
      { error: "No quotes to compare" },
      { status: 400 }
    );
  }

  // Choose the "anchor" record for RCP generation. Prefer the policy
  // (richer profile data), fall back to the first quote.
  const anchor = policyDoc ?? quoteDocs[0];
  const anchorReport = await loadOrGenerateReport(anchor);
  const rcpFull = computeRCP(anchor, anchorReport);

  // Snapshot the RCP onto the comparison so it stays stable.
  const rcpSnapshot: ComparisonRcpSnapshot = {
    requiredAddOns: rcpFull.requiredAddOns,
    optionalAddOns: rcpFull.optionalAddOns,
    idv: rcpFull.idv,
    requiredAddOnsPremiumTotal: rcpFull.requiredAddOnsPremiumTotal,
  };

  // Score each quote against the RCP.
  const quoteScores: ComparisonQuoteScore[] = quoteDocs.map((q) => {
    const addOnNames = (q.addOns ?? []).map((a) => a.name);
    const result = scoreAgainstRcp(addOnNames, rcpFull);
    return {
      quoteId: q.id,
      insurerName: q.insurerName,
      grandTotal: q.premium?.grandTotal ?? 0,
      missingRequired: result.missingRequired,
      extraNonRcp: result.extraNonRcp,
      isRcpComplete: result.isRcpComplete,
      isExactlyRcp: result.isExactlyRcp,
    };
  });

  const verdict = computeVerdict({ quoteScores });

  const vehicleLabel =
    `${anchor.vehicle.make} ${anchor.vehicle.model}`.trim() || "your car";

  const now = new Date().toISOString();
  const comparison: ComparisonReport = {
    id: randomUUID(),
    customerEmail: target,
    vehicleLabel,
    policyId: body.policyId,
    quoteIds: body.quoteIds,
    rcp: rcpSnapshot,
    quoteScores,
    verdict,
    createdAt: now,
    updatedAt: now,
  };

  await appendRow<ComparisonReport>(Tables.COMPARISONS, comparison);

  return NextResponse.json({ id: comparison.id, verdict });
}

async function loadOrGenerateReport(
  policy: ParsedPolicy
): Promise<PolicyReport> {
  const existing = await findOne<PolicyReport>(
    Tables.REPORTS,
    (r) => r.parsedPolicyId === policy.id
  );
  if (existing) return existing;
  const fresh = await generateReport(policy);
  await appendRow<PolicyReport>(Tables.REPORTS, fresh);
  return fresh;
}

/**
 * Compute the verdict purely from RCP-scored customer quotes. M4 will
 * extend this signature to also consider auction bids.
 *
 * Verdict logic (Right Offer rule):
 *   - If any quote is isExactlyRcp AND it's the cheapest such option:
 *       "take_existing" → tell the customer to take that quote.
 *   - Else if at least one quote is isRcpComplete (RCP coverage met,
 *     but has padding): "take_existing" with a note about over-coverage.
 *     We'd still pitch the lean version, but until M4 wires the
 *     auction we don't have a "lean" option to offer.
 *   - Else (no quote covers the full RCP): "needs_attention" — the
 *     customer should ask their insurer to add the missing items.
 */
function computeVerdict({
  quoteScores,
}: {
  quoteScores: ComparisonQuoteScore[];
}): ComparisonVerdict {
  if (quoteScores.length === 0) {
    return {
      type: "needs_attention",
      headline: "No quotes to compare yet.",
      body: "Upload at least one renewal quote and we'll score it against the Right Offer profile for your car.",
    };
  }

  // Best "exactly RCP" option (no missing, no padding) — cheapest wins.
  const exactlyRcp = quoteScores
    .filter((q) => q.isExactlyRcp)
    .sort((a, b) => a.grandTotal - b.grandTotal);
  if (exactlyRcp.length > 0) {
    const winner = exactlyRcp[0];
    return {
      type: "take_existing",
      headline: `${winner.insurerName} is the Right Offer for you.`,
      body: `This quote covers every recommendation for your car at ₹${winner.grandTotal.toLocaleString(
        "en-IN"
      )} — no missing essentials, no padding. Take it directly from ${winner.insurerName}; you've done your homework.`,
      recommendedQuoteId: winner.quoteId,
    };
  }

  // RCP-complete but with padding — still recommend, flag the padding.
  const rcpComplete = quoteScores
    .filter((q) => q.isRcpComplete)
    .sort((a, b) => a.grandTotal - b.grandTotal);
  if (rcpComplete.length > 0) {
    const winner = rcpComplete[0];
    return {
      type: "take_existing",
      headline: `${winner.insurerName} covers everything you need — with a couple of extras.`,
      body: `This quote includes every Right Offer essential plus ${winner.extraNonRcp.join(
        ", "
      )} which we wouldn't have added. If the price difference is small, it's still a fine choice — ask your insurer whether they'll drop the extras at renewal.`,
      recommendedQuoteId: winner.quoteId,
    };
  }

  // None of the quotes cover the full RCP — surface the gap.
  const aggregateMissing = new Set<string>();
  for (const q of quoteScores) {
    for (const m of q.missingRequired) aggregateMissing.add(m);
  }
  return {
    type: "needs_attention",
    headline: "None of these quotes cover what we recommend for your car.",
    body: `Every quote is missing at least one essential: ${[
      ...aggregateMissing,
    ].join(
      ", "
    )}. Ask your insurer to add the missing items. If they can't, the gap is genuine — we'll watch the market and flag better options as they come up.`,
  };
}
