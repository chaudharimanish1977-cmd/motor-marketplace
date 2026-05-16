/**
 * Upload-page routing decision — figures out which shell to render
 * based on the visitor's session and the lifecycle state of any
 * policies they've already uploaded.
 *
 * Server-only — reads cookies + DB. Called from `/upload/page.tsx`.
 *
 * Decision matrix:
 *
 *   No session OR no docs              → ShellFirstTime
 *   Has docs, no policy on file        → ShellFirstTime (only quotes; we
 *                                        still need a policy to ground
 *                                        the comparison on)
 *   Primary policy state = A           → ShellQuotesOpen
 *   Primary policy state = B           → ShellWelcomeBack
 *   Primary policy state = C           → ShellWelcomeBack
 *   Primary policy state = D           → ShellLapsed
 *
 * "Primary policy" = the most recently-uploaded `documentType === "policy"`
 * row in the visitor's session. Quotes are excluded because their dates
 * describe an *offer*, not the customer's actual cover.
 */

import "server-only";
import { findById, Tables } from "@/lib/db";
import type { ParsedPolicy } from "@/lib/types";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import { getAnonymousSession } from "@/lib/anonymous-session";
import {
  computeLifecycleState,
  type LifecycleResult,
  type LifecycleState,
} from "@/lib/lifecycle-state";

/**
 * The five shells `/upload` can render. Phase 2 wires all five; Phase 3
 * adds the multi-doc stack inside ShellQuotesOpen.
 */
export type UploadShell =
  | "first-time"
  | "welcome-back"
  | "quotes-open"
  | "fresh-policy"
  | "lapsed";

export interface UploadRoutingDecision {
  shell: UploadShell;
  /** Why we picked this shell — surfaced in debug builds + analytics. */
  reason: string;
  /** The vehicle / policy we'll show the visitor. null on first-time. */
  primaryPolicy: ParsedPolicy | null;
  /** Lifecycle of the primary policy. null on first-time. */
  lifecycle: LifecycleResult | null;
  /** Returning visitor? (i.e. has at least one parsed doc in session) */
  isReturning: boolean;
}

/**
 * Resolve the routing decision for the current request. Called from
 * the server component at `/upload`.
 */
export async function resolveUploadRouting(
  now: Date = new Date()
): Promise<UploadRoutingDecision> {
  const policies = await loadVisitorPolicies();
  const isReturning = policies.length > 0;

  // First-time visitor (or returning with zero stored policies).
  if (!isReturning) {
    return {
      shell: "first-time",
      reason: "No prior documents in session.",
      primaryPolicy: null,
      lifecycle: null,
      isReturning: false,
    };
  }

  // Pick the primary policy: most-recent `documentType === "policy"`.
  const primary = pickPrimaryPolicy(policies);

  if (!primary) {
    return {
      shell: "first-time",
      reason: "Visitor has quotes on file but no policy — need a policy first.",
      primaryPolicy: null,
      lifecycle: null,
      isReturning: true,
    };
  }

  const lifecycle = computeLifecycleState(
    { startDate: primary.odPeriodStart, endDate: primary.odPeriodEnd },
    now
  );

  const shell = shellForState(lifecycle.state);
  return {
    shell,
    reason: lifecycle.reason,
    primaryPolicy: primary,
    lifecycle,
    isReturning: true,
  };
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

function shellForState(state: LifecycleState): UploadShell {
  switch (state) {
    case "A":
      return "quotes-open";
    case "B":
      return "welcome-back";
    case "C":
      return "welcome-back";
    case "D":
      return "lapsed";
  }
}

/**
 * Pick the policy we'll surface to the visitor. Quotes are excluded
 * (they describe an offer, not actual cover). Among policies, we pick
 * the one with the most recent `uploadedAt` — newer uploads represent
 * fresher state. (Phase 4 may need a more nuanced rule once /me
 * supports multi-vehicle households; for now the most-recent policy
 * is the right anchor.)
 */
function pickPrimaryPolicy(policies: ParsedPolicy[]): ParsedPolicy | null {
  const onlyPolicies = policies.filter(
    (p) => (p.documentType ?? "policy") === "policy"
  );
  if (onlyPolicies.length === 0) return null;
  return onlyPolicies.sort((a, b) =>
    (b.uploadedAt ?? "").localeCompare(a.uploadedAt ?? "")
  )[0];
}

/**
 * Pull every ParsedPolicy referenced by the visitor's sessions.
 * Sessions are checked in order of trust (full → upload → anonymous);
 * doc IDs are de-duped before fetching.
 */
async function loadVisitorPolicies(): Promise<ParsedPolicy[]> {
  const [fullSession, uploadSession, anonSession] = await Promise.all([
    getSession(),
    getUploadSession(),
    getAnonymousSession(),
  ]);

  const docIds = new Set<string>();
  if (uploadSession?.docs) uploadSession.docs.forEach((id) => docIds.add(id));
  if (anonSession?.docs) anonSession.docs.forEach((id) => docIds.add(id));
  // Full session may not carry doc IDs directly (it's a magic-link
  // email identity); upload-session is the doc-list carrier post-verify.

  if (docIds.size === 0) {
    // Even with no doc IDs but a verified email, treat as first-time
    // for now — Phase 4 will add a /me-style lookup by email.
    void fullSession;
    return [];
  }

  const results = await Promise.all(
    Array.from(docIds).map((id) =>
      findById<ParsedPolicy>(Tables.PARSED_POLICIES, id).catch(() => null)
    )
  );
  return results.filter((p): p is ParsedPolicy => p !== null);
}
