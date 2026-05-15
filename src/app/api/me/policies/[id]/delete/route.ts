import { NextRequest, NextResponse } from "next/server";
import {
  findById,
  readTable,
  writeTable,
  Tables,
} from "@/lib/db";
import { getSession } from "@/lib/session";
import { policyGroupKey } from "@/lib/policy-group";
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

/**
 * Delete one policy card from the customer's portal.
 *
 * "One card" = one group (a card represents a group of duplicate
 * parses of the same physical document — see policy-group.ts). So
 * this endpoint removes EVERY parsed policy in the same group as the
 * named ID, along with everything that fanned out from those policies:
 * reports, RFQs, bids (via rfqIds), transactions, renewal schedules,
 * and renewal subscriptions.
 *
 * Auth:
 *   1. Session required.
 *   2. Named policy must belong to the signed-in customer — either
 *      owner.email matches, or the customer has a subscription on it.
 *   3. Cascade only touches rows that ALSO belong to the customer —
 *      no chance of nuking a stranger's data by guessing IDs.
 *
 * Mirrors the cascade order from /api/me/delete (leaves-first writes
 * so an interrupted run prefers orphaned children to orphaned parents
 * on retry). No cross-table transactions in the prototype KV layer —
 * good enough at investor-demo scale.
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const sessionEmail = await getSession();
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const target = sessionEmail.toLowerCase();

  const { id } = await context.params;
  const named = await findById<ParsedPolicy>(Tables.PARSED_POLICIES, id);
  if (!named) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  // Customer-owned policy IDs: anything where they own the parse OR
  // they have a subscription targeting it.
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

  if (!customerPolicyIds.has(named.id)) {
    // 404 (not 403) to keep cross-account probing useless.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Identify the group: all customer policies sharing the named one's
  // group key. Includes duplicate parses hidden behind the card.
  const targetGroupKey = policyGroupKey(named);
  const policyIdsToDelete = new Set(
    policies
      .filter(
        (p) =>
          customerPolicyIds.has(p.id) && policyGroupKey(p) === targetGroupKey
      )
      .map((p) => p.id)
  );

  // Fan out via parsedPolicyId, rfqId, bidId.
  const rfqIdsToDelete = new Set(
    rfqs.filter((r) => policyIdsToDelete.has(r.parsedPolicyId)).map((r) => r.id)
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

  // Leaves-first write order. The customer's user record + email
  // stay untouched — they keep their account, only this one record
  // disappears.
  await writeTable(Tables.TRANSACTIONS, nextTransactions);
  await writeTable(Tables.BIDS, nextBids);
  await writeTable(Tables.RFQS, nextRfqs);
  await writeTable(Tables.REPORTS, nextReports);
  await writeTable(Tables.RENEWAL_SCHEDULES, nextSchedules);
  await writeTable(Tables.RENEWAL_SUBSCRIPTIONS, nextSubscriptions);
  await writeTable(Tables.PARSED_POLICIES, nextPolicies);

  return NextResponse.json({ ok: true, deleted: counts });
}
