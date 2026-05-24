import { NextResponse } from "next/server";
import {
  readTable,
  writeTable,
  Tables,
} from "@/lib/db";
import { clearSession, getSession } from "@/lib/session";
import type {
  Bid,
  ParsedPolicy,
  PolicyReport,
  RenewalSchedule,
  RenewalSubscription,
  RFQ,
  ShareToken,
  Transaction,
  User,
} from "@/lib/types";

export const runtime = "nodejs";

/**
 * DPDP self-service: delete every row tied to the signed-in email.
 *
 * Right-to-erasure under India's Digital Personal Data Protection Act
 * 2023 — a customer can ask for their data to be removed, and we must
 * comply without forcing them through support. This endpoint does
 * exactly that, then logs them out.
 *
 * Cascade order (fan-out from the email):
 *   1. Identify rows owned by this email:
 *        users.email
 *        renewal_subscriptions.customerEmail
 *        parsed_policies.owner.email
 *      Collect every parsedPolicyId touched by the above.
 *   2. Fan out via parsedPolicyId to:
 *        reports.parsedPolicyId
 *        rfqs.parsedPolicyId          -> rfqIds
 *        renewal_schedules.parsedPolicyId
 *   3. Fan out via rfqIds to:
 *        bids.rfqId                   -> bidIds
 *        transactions.rfqId
 *   4. Fan out via bidIds to:
 *        transactions.bidId (already collected via rfqId, dedupe)
 *
 * Then we rewrite each table with the offending rows filtered out.
 * Single-pass per table for clarity — totally fine at prototype scale,
 * if we outgrow the file-style "read whole table, filter, write" model
 * we'd swap in a real DB anyway.
 *
 * The session cookie is cleared LAST so an interrupted run (e.g. KV
 * write timeout) leaves the user signed in and able to retry — vs.
 * orphaning them on a signed-out shell with their data half-deleted.
 */
export async function POST() {
  const sessionEmail = await getSession();
  if (!sessionEmail) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const target = sessionEmail.toLowerCase();

  const [
    users,
    policies,
    reports,
    rfqs,
    bids,
    transactions,
    schedules,
    subscriptions,
    shareTokens,
  ] = await Promise.all([
    readTable<User>(Tables.USERS),
    readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
    readTable<PolicyReport>(Tables.REPORTS),
    readTable<RFQ>(Tables.RFQS),
    readTable<Bid>(Tables.BIDS),
    readTable<Transaction>(Tables.TRANSACTIONS),
    readTable<RenewalSchedule>(Tables.RENEWAL_SCHEDULES),
    readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
    readTable<ShareToken>(Tables.SHARE_TOKENS),
  ]);

  // -------- Step 1: identify the policy IDs owned by this email --------
  const userIdsToDelete = new Set(
    users.filter((u) => (u.email ?? "").toLowerCase() === target).map((u) => u.id)
  );

  const policyIdsFromOwner = new Set(
    policies
      .filter((p) => (p.owner?.email ?? "").toLowerCase() === target)
      .map((p) => p.id)
  );
  const policyIdsFromSubs = new Set(
    subscriptions
      .filter((s) => (s.customerEmail ?? "").toLowerCase() === target)
      .map((s) => s.parsedPolicyId)
  );
  const policyIdsToDelete = new Set([
    ...policyIdsFromOwner,
    ...policyIdsFromSubs,
  ]);

  // -------- Step 2: fan out from parsedPolicyId --------
  const rfqIdsToDelete = new Set(
    rfqs.filter((r) => policyIdsToDelete.has(r.parsedPolicyId)).map((r) => r.id)
  );

  // -------- Step 3: fan out from rfqId --------
  const bidIdsToDelete = new Set(
    bids.filter((b) => rfqIdsToDelete.has(b.rfqId)).map((b) => b.id)
  );

  // -------- Step 4: rewrite each table with offenders removed --------
  const counts = {
    users: 0,
    policies: 0,
    reports: 0,
    rfqs: 0,
    bids: 0,
    transactions: 0,
    schedules: 0,
    subscriptions: 0,
    shareTokens: 0,
  };

  const nextUsers = users.filter((u) => {
    if (userIdsToDelete.has(u.id)) {
      counts.users++;
      return false;
    }
    return true;
  });

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
    // Match by rfqId OR bidId for safety — older transactions might be
    // orphaned of one or the other depending on the flow they came from.
    if (
      rfqIdsToDelete.has(t.rfqId) ||
      bidIdsToDelete.has(t.bidId) ||
      userIdsToDelete.has(t.userId)
    ) {
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
    if (
      (s.customerEmail ?? "").toLowerCase() === target ||
      policyIdsToDelete.has(s.parsedPolicyId)
    ) {
      counts.subscriptions++;
      return false;
    }
    return true;
  });

  // Share tokens — keyed on ownerEmail (lowercased) + parsedPolicyId.
  // Either match counts: a token from this user is gone, and any
  // token pointing at a deleted policy is also gone. The /share/[token]
  // recipient surface depersonalises but the row still carries
  // parsedPolicyId, so DPDP erasure requires we drop both shapes.
  const nextShareTokens = shareTokens.filter((tok) => {
    if (
      (tok.ownerEmail ?? "").toLowerCase() === target ||
      policyIdsToDelete.has(tok.parsedPolicyId)
    ) {
      counts.shareTokens++;
      return false;
    }
    return true;
  });

  // Persist all tables. We don't have transactions across tables in the
  // prototype KV layer — a partial failure here would leave the data in
  // a half-deleted state, but the next retry would converge it. Order
  // is leaves-first so an interrupted run prefers orphaned children to
  // orphaned parents (less surprising on retry).
  await writeTable(Tables.SHARE_TOKENS, nextShareTokens);
  await writeTable(Tables.TRANSACTIONS, nextTransactions);
  await writeTable(Tables.BIDS, nextBids);
  await writeTable(Tables.RFQS, nextRfqs);
  await writeTable(Tables.REPORTS, nextReports);
  await writeTable(Tables.RENEWAL_SCHEDULES, nextSchedules);
  await writeTable(Tables.RENEWAL_SUBSCRIPTIONS, nextSubscriptions);
  await writeTable(Tables.PARSED_POLICIES, nextPolicies);
  await writeTable(Tables.USERS, nextUsers);

  await clearSession();

  return NextResponse.json({ ok: true, deleted: counts });
}
