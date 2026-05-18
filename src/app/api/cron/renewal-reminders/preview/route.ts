import { NextRequest, NextResponse } from "next/server";
import { readTable, Tables } from "@/lib/db";
import type {
  ParsedPolicy,
  PolicyReport,
  RenewalSubscription,
} from "@/lib/types";
import { policyGroupKey } from "@/lib/policy-group";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

const FOUNDER_EMAIL = "chaudharimanish1977@gmail.com";

/**
 * Read-only preview of what /api/cron/renewal-reminders WOULD do
 * right now if it fired. Returns a JSON breakdown of:
 *   · which subscriptions would send (and at which checkpoint)
 *   · which would skip (and why)
 *   · which checkpoints are scheduled for upcoming days
 *
 * Side-effect-free: doesn't send mail, doesn't update nudgesFired.
 * Safe to hit from a browser tab any time.
 *
 * Auth: either Vercel-cron bearer (`Authorization: Bearer <CRON_SECRET>`)
 * OR session-as-founder (so it's browser-callable for the owner).
 * Anyone else gets 401.
 */
export async function GET(request: NextRequest) {
  // Path A — cron / curl with bearer token
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  const isCron = secret && auth === `Bearer ${secret}`;

  // Path B — signed-in founder hitting from browser
  let isFounder = false;
  if (!isCron) {
    const sessionEmail = await getSession();
    isFounder =
      !!sessionEmail &&
      sessionEmail.toLowerCase() === FOUNDER_EMAIL.toLowerCase();
  }

  if (!isCron && !isFounder) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = Date.now();

    const [subs, policies, reports] = await Promise.all([
      readTable<RenewalSubscription>(Tables.RENEWAL_SUBSCRIPTIONS),
      readTable<ParsedPolicy>(Tables.PARSED_POLICIES),
      readTable<PolicyReport>(Tables.REPORTS),
    ]);
    const policyById = new Map(policies.map((p) => [p.id, p]));
    const reportByPolicyId = new Map(
      reports.map((r) => [r.parsedPolicyId, r])
    );

    const wouldSend: WouldSendRow[] = [];
    const wouldSkip: WouldSkipRow[] = [];
    const upcoming: UpcomingRow[] = [];
    const sendKeys = new Set<string>();

    for (const sub of subs) {
      if (sub.status !== "active") {
        wouldSkip.push({
          subscriptionId: sub.id,
          email: sub.customerEmail,
          reason: `status=${sub.status}`,
        });
        continue;
      }
      const wantsEmail = (sub.channels ?? ["email"]).includes("email");
      if (!wantsEmail) {
        wouldSkip.push({
          subscriptionId: sub.id,
          email: sub.customerEmail,
          reason: "email not in channels",
        });
        continue;
      }

      const policy = policyById.get(sub.parsedPolicyId);
      if (!policy) {
        wouldSkip.push({
          subscriptionId: sub.id,
          email: sub.customerEmail,
          reason: "parsed policy missing",
        });
        continue;
      }
      if ((policy.documentType ?? "policy") === "quote") {
        wouldSkip.push({
          subscriptionId: sub.id,
          email: sub.customerEmail,
          reason: "linked document is a quote",
        });
        continue;
      }

      const daysUntilExpiry = Math.ceil(
        (new Date(sub.policyExpiryDate).getTime() - now) /
          (24 * 60 * 60 * 1000)
      );
      if (daysUntilExpiry < 0) {
        wouldSkip.push({
          subscriptionId: sub.id,
          email: sub.customerEmail,
          reason: `expired ${-daysUntilExpiry}d ago`,
        });
        continue;
      }

      const checkpoint = pickCheckpoint(
        daysUntilExpiry,
        sub.daysBefore,
        sub.nudgesFired ?? []
      );
      const vehicleLabel =
        `${policy.vehicle.make} ${policy.vehicle.model}`.trim();
      const hasReport = reportByPolicyId.has(policy.id);

      if (checkpoint === null) {
        // Not due today, but useful to surface the next-due checkpoint
        // so the founder can see what's lined up over the coming week.
        const nextCp = pickNextUpcoming(
          daysUntilExpiry,
          sub.daysBefore,
          sub.nudgesFired ?? []
        );
        if (nextCp !== null) {
          upcoming.push({
            subscriptionId: sub.id,
            email: sub.customerEmail,
            vehicleLabel,
            daysUntilExpiry,
            nextCheckpoint: nextCp,
            firesInDays: daysUntilExpiry - nextCp,
          });
        }
        continue;
      }

      const dedupeKey = `${sub.customerEmail.toLowerCase()}|${policyGroupKey(policy)}|${checkpoint}`;
      if (sendKeys.has(dedupeKey)) {
        wouldSkip.push({
          subscriptionId: sub.id,
          email: sub.customerEmail,
          reason: `duplicate of already-queued (cp=${checkpoint})`,
        });
        continue;
      }
      sendKeys.add(dedupeKey);

      wouldSend.push({
        subscriptionId: sub.id,
        email: sub.customerEmail,
        vehicleLabel,
        checkpoint,
        daysUntilExpiry,
        hasReport,
      });
    }

    return NextResponse.json({
      ok: true,
      now: new Date(now).toISOString(),
      summary: {
        totalSubs: subs.length,
        wouldSend: wouldSend.length,
        wouldSkip: wouldSkip.length,
        upcoming: upcoming.length,
      },
      wouldSend,
      wouldSkip,
      upcoming: upcoming
        .sort((a, b) => a.firesInDays - b.firesInDays)
        .slice(0, 50),
    });
  } catch (err) {
    console.error("[cron/renewal-reminders/preview] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

interface WouldSendRow {
  subscriptionId: string;
  email: string;
  vehicleLabel: string;
  checkpoint: number;
  daysUntilExpiry: number;
  hasReport: boolean;
}

interface WouldSkipRow {
  subscriptionId: string;
  email: string;
  reason: string;
}

interface UpcomingRow {
  subscriptionId: string;
  email: string;
  vehicleLabel: string;
  daysUntilExpiry: number;
  nextCheckpoint: number;
  firesInDays: number;
}

/** Mirrors the picker in /api/cron/renewal-reminders/route.ts. */
function pickCheckpoint(
  daysUntilExpiry: number,
  daysBefore: number[],
  alreadyFired: number[]
): number | null {
  const due = daysBefore
    .filter((cp) => cp >= daysUntilExpiry)
    .filter((cp) => !alreadyFired.includes(cp))
    .sort((a, b) => a - b);
  return due[0] ?? null;
}

/** Next checkpoint that isn't yet due (cp < daysUntilExpiry) and
 *  hasn't already fired. Returns the largest such checkpoint, which
 *  is the one that fires soonest. */
function pickNextUpcoming(
  daysUntilExpiry: number,
  daysBefore: number[],
  alreadyFired: number[]
): number | null {
  const future = daysBefore
    .filter((cp) => cp < daysUntilExpiry)
    .filter((cp) => !alreadyFired.includes(cp))
    .sort((a, b) => b - a);
  return future[0] ?? null;
}
