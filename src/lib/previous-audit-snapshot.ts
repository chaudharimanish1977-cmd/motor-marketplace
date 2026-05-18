/**
 * Build the PreviousAuditSnapshot consumed by renewal-reminder and
 * annual-re-audit emails.
 *
 * Shared by three callers so the snapshot shape (verdict copy, score
 * thresholds, at-risk computation, gap-title selection) stays
 * consistent across:
 *   · src/app/api/cron/renewal-reminders/route.ts
 *   · src/app/api/cron/annual-reaudit/route.ts
 *   · src/app/api/me/reminders/[id]/test/route.ts (and any future
 *     preview/test endpoint)
 *
 * The verdict copy intentionally mirrors the on-card verdict shown in
 * /api/share-card and /api/report-card so a customer sees the same
 * language across surfaces — email, share card, and the live report.
 */

import { computeCoverageScore } from "@/lib/coverage-score";
import { totalMoneyAtRisk } from "@/lib/claim-scenarios";
import { formatINR } from "@/lib/format";
import type { ParsedPolicy, PolicyReport } from "@/lib/types";
import type { PreviousAuditSnapshot } from "@/lib/email-sender";

/** Returns null when the inputs don't carry enough data to build a
 *  meaningful snapshot (e.g. report missing, no gaps in the report).
 *  Callers should fall back to the un-enriched email in that case. */
export function buildPreviousAuditSnapshot(
  parsedPolicy: ParsedPolicy,
  report: PolicyReport | null | undefined,
  reportUrl: string
): PreviousAuditSnapshot | null {
  if (!report) return null;

  const vehicleAge = Math.max(
    0,
    new Date().getFullYear() - (parsedPolicy.vehicle.yearOfManufacture || 0)
  );
  const gapTitles = report.keyGaps.items.map((g) => g.title);
  const moneyAtRisk = totalMoneyAtRisk(
    gapTitles,
    parsedPolicy.idv,
    vehicleAge
  );
  const coverage = computeCoverageScore(parsedPolicy, report);

  return {
    verdictLabel: verdictLabel(coverage.score),
    coverageScore: coverage.score,
    atRiskInr: moneyAtRisk.total > 0 ? formatINR(moneyAtRisk.total) : "",
    atRiskCount: moneyAtRisk.count,
    topGapTitles: gapTitles.slice(0, 3),
    reportUrl,
  };
}

/** Same verdict scale used on the share/report OG cards. Keeping the
 *  copy here means an A/B test of the wording happens in one place. */
function verdictLabel(score: number): string {
  if (score >= 85) return "Excellent — strong cover across the board.";
  if (score >= 70) return "Good — solid base with a couple of opportunities.";
  if (score >= 50) return "Decent — meaningful gaps worth closing.";
  if (score >= 30) return "Gaps to watch — claim-time exposure is real.";
  return "Critical — major gaps in current cover.";
}
