import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readTable, writeTable, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import type {
  Bid,
  ParsedPolicy,
  PolicyReport,
  RenewalSchedule,
  RenewalSubscription,
  RFQ,
  Transaction,
} from "@/lib/types";

export const runtime = "nodejs";

// Sanity cap so a malformed client can't ask us to delete tens of
// thousands of rows in one call. Real usage tops out at maybe 15-20
// duplicates per group in our worst observed case.
const Schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

/**
 * Delete specific parsed-policy records (and their dependents).
 *
 * Replaces the earlier single-ID endpoint. The portal sends an array
 * because a card can represent a group of duplicate parses and the
 * customer should be able to pick which specific records to remove
 * (e.g. delete the misclassified renewal-notice from the group,
 * keep the bound-policy one).
 *
 * Auth:
 *   1. Session required.
 *   2. EVERY id in the request must belong to the customer — owner.email
 *      match OR they hold a subscription targeting it. Any cross-account
 *      id fails the whole request (404 — no partial deletes).
 *
 * Cascade per id: reports / rfqs / bids / transactions / renewal
 * schedules + subscriptions whose parent record(s) are in the delete
 * set. Mirror of /api/me/delete's fan-out, scoped to the requested
 * subset rather than the whole account.
 *
 * Order of writes: leaves-first so an interrupted run prefers
 * orphaned children to orphaned parents on retry.
 */
export async function POST(request: NextRequest) {
  const sessionEmail = await getSession();
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const target = sessionEmail.toLowerCase();

  let body: { ids: string[] };
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

  const [
    policies,
    reports,
    rfqs,
    bids,
    transactions,
    schedules,
    subscriptions,
  ] = await Promise.all([
    readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
    readTable<PolicyReport>(Tables.REPORTS),
    readTable<RFQ>(Tables.RFQS),
    readTable<Bid>(Tables.BIDS),
    readTable<Transaction>(Tables.TRANSACTIONS),
    readTable<RenewalSchedule>(Tables.RENEWAL_SCHEDULES),
    readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
  ]);

  // Customer-owned policy IDs (owner.email OR via subscription).
  const ownedViaOwner = new Set(
    policies
      .filter((p) => (p.owner?.email ?? "").toLowerCase() === target)
      .map((p) => p.id)
  );
  const ownedViaSub = new Set(
    subscriptions
      .filter((s) => (s.customerEmail ?? "").toLowerCase() === target)
      .map((s) => s.parsedPolicyId)
  );
  const customerPolicyIds = new Set([...ownedViaOwner, ...ownedViaSub]);

  // Validate every requested id is owned. Fail the whole batch on a
  // single mismatch — no partial deletes (avoids ambiguous outcomes
  // and stops "delete-by-guess" probes from succeeding piecewise).
  const requested = new Set(body.ids);
  for (const id of requested) {
    if (!customerPolicyIds.has(id)) {
      // 404 (not 403) to keep cross-account probing useless.
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  // Fan out via parsedPolicyId, rfqId, bidId.
  const policyIdsToDelete = requested;
  const rfqIdsToDelete = new Set(
    rfqs
      .filter((r) => policyIdsToDelete.has(r.parsedPolicyId))
      .map((r) => r.id)
  );
  const bidIdsToDelete = new Set(
    bids.filter((b) => rfqIdsToDelete.has(b.rfqId)).map((b) => b.id)
  );

  const counts = {
    policies: 0,
    reports: 0,
    rfqs: 0,
    bids: 0,
    transactions: 0,
    schedules: 0,
    subscriptions: 0,
  };

  const nextPolicies = policies.filter((p) => {
    if (policyIdsToDelete.has(p.id)) {
      counts.policies++;
      return false;
    }
    return true;
  });
  const nextReports = reports.filter((r) => {
    if (policyIdsToDelete.has(r.parsedPolicyId)) {
      counts.reports++;
      return false;
    }
    return true;
  });
  const nextRfqs = rfqs.filter((r) => {
    if (rfqIdsToDelete.has(r.id)) {
      counts.rfqs++;
      return false;
    }
    return true;
  });
  const nextBids = bids.filter((b) => {
    if (bidIdsToDelete.has(b.id)) {
      counts.bids++;
      return false;
    }
    return true;
  });
  const nextTransactions = transactions.filter((t) => {
    if (rfqIdsToDelete.has(t.rfqId) || bidIdsToDelete.has(t.bidId)) {
      counts.transactions++;
      return false;
    }
    return true;
  });
  const nextSchedules = schedules.filter((s) => {
    if (policyIdsToDelete.has(s.parsedPolicyId)) {
      counts.schedules++;
      return false;
    }
    return true;
  });
  const nextSubscriptions = subscriptions.filter((s) => {
    if (policyIdsToDelete.has(s.parsedPolicyId)) {
      counts.subscriptions++;
      return false;
    }
    return true;
  });

  await writeTable(Tables.TRANSACTIONS, nextTransactions);
  await writeTable(Tables.BIDS, nextBids);
  await writeTable(Tables.RFQS, nextRfqs);
  await writeTable(Tables.REPORTS, nextReports);
  await writeTable(Tables.RENEWAL_SCHEDULES, nextSchedules);
  await writeTable(Tables.RENEWAL_SUBSCRIPTIONS, nextSubscriptions);
  await writeTable(Tables.PARSED_POLICIES, nextPolicies);

  return NextResponse.json({ ok: true, deleted: counts });
}
