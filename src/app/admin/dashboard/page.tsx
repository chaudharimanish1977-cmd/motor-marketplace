/**
 * /admin/dashboard — single-page founder dashboard.
 *
 * Reads the latest snapshot from KV (singleton row in
 * ADMIN_DASHBOARD_SNAPSHOTS) and renders all 10 categories. Snapshot
 * is refreshed by:
 *   · Vercel cron every 3h between 9am-9pm IST
 *   · Manual "Refresh now" button (this page)
 *
 * Founder-email gated — anyone else gets a 404. The not-found-spoofing
 * pattern matches /api/admin/health: we don't advertise this URL.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { Tables, findById, writeTable } from "@/lib/db";
import { getSession } from "@/lib/session";
import { computeAdminDashboardSnapshot } from "@/lib/admin-dashboard";
import type { AdminDashboardSnapshot } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { RefreshButton } from "./refresh-button";

const FOUNDER_EMAIL = "chaudharimanish1977@gmail.com";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
export const metadata = {
  title: "Dashboard — RightOffer",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.toLowerCase() !== FOUNDER_EMAIL) {
    notFound();
  }

  // Read the most-recent snapshot. If none exists yet (first visit
  // before the cron has fired), compute one inline and write it so
  // subsequent loads are fast.
  let snapshot = await findById<AdminDashboardSnapshot>(
    Tables.ADMIN_DASHBOARD_SNAPSHOTS,
    "latest"
  );
  if (!snapshot) {
    snapshot = await computeAdminDashboardSnapshot();
    await writeTable(Tables.ADMIN_DASHBOARD_SNAPSHOTS, [snapshot]);
  }

  const computedAt = new Date(snapshot.computedAt);

  return (
    <article className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* Masthead */}
      <header className="mb-10 pb-5 border-b border-brand-light-gray dark:border-slate-700">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-2">
              · RightOffer · Dashboard ·
            </div>
            <h1 className="font-serif font-medium text-3xl md:text-[40px] leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
              The <span className="italic text-brand-plum">numbers</span>{" "}
              so far.
            </h1>
          </div>
          <RefreshButton />
        </div>
        <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
          Last computed · {computedAt.toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
            timeZoneName: "short",
          })}
          {" · "}
          {snapshot.computedDurationMs}ms compute
          {" · "}
          Refresh: cron every 3h (9am–9pm IST) + manual
        </p>
      </header>

      <div className="space-y-12">
        {/* ── 1. Top-line volume ───────────────────────────────────── */}
        <Section number="01" title="Volume">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat
              label="Total audits"
              value={snapshot.volume.totalAudits.toLocaleString("en-IN")}
              sublabel="all time"
            />
            <Stat
              label="Last 7 days"
              value={snapshot.volume.audits7d.toLocaleString("en-IN")}
            />
            <Stat
              label="Last 30 days"
              value={snapshot.volume.audits30d.toLocaleString("en-IN")}
            />
            <Stat
              label="Unique customers"
              value={snapshot.volume.totalCustomers.toLocaleString("en-IN")}
            />
            <Stat
              label="Unique vehicles"
              value={snapshot.volume.uniqueVehicles.toLocaleString("en-IN")}
            />
            <Stat
              label="Returning customers"
              value={snapshot.volume.multiAuditCustomers.toLocaleString("en-IN")}
              sublabel="2+ audits"
            />
            <Stat
              label="Active reminders"
              value={snapshot.dpdp.activeSubscriptions.toLocaleString("en-IN")}
            />
            <Stat
              label="Unsubscribed"
              value={snapshot.dpdp.unsubscribedSubscriptions.toLocaleString("en-IN")}
            />
          </div>
          <SparkBar series={snapshot.volume.perDay30d} />
        </Section>

        {/* ── 2. Coverage breadth ──────────────────────────────────── */}
        <Section number="02" title="Coverage breadth">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            <Stat
              label="Insurers"
              value={snapshot.breadth.insurerCount.toLocaleString("en-IN")}
              sublabel="distinct"
            />
            <Stat
              label="Make/Model combos"
              value={snapshot.breadth.makeModelCount.toLocaleString("en-IN")}
            />
            <Stat
              label="RTOs covered"
              value={snapshot.breadth.rtoCount.toLocaleString("en-IN")}
            />
            <Stat
              label="Policy : Quote"
              value={`${snapshot.breadth.policyCount} : ${snapshot.breadth.quoteCount}`}
            />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <RankList
              title="Top insurers"
              items={snapshot.breadth.topInsurers.map((i) => ({
                label: i.name,
                count: i.count,
              }))}
            />
            <RankList
              title="Top makes / models"
              items={snapshot.breadth.topMakeModels.map((i) => ({
                label: i.name,
                count: i.count,
              }))}
            />
            <RankList
              title="Top RTOs"
              items={snapshot.breadth.topRtos.map((i) => ({
                label: i.rto,
                count: i.count,
              }))}
            />
          </div>
          {(snapshot.breadth.oldestExpiry || snapshot.breadth.newestExpiry) && (
            <p className="mt-5 font-serif italic text-[13px] text-brand-slate">
              Policy vintage range:{" "}
              {snapshot.breadth.oldestExpiry
                ? formatDate(snapshot.breadth.oldestExpiry)
                : "—"}{" "}
              → {snapshot.breadth.newestExpiry
                ? formatDate(snapshot.breadth.newestExpiry)
                : "—"}
            </p>
          )}
        </Section>

        {/* ── 3. Audit content insights ────────────────────────────── */}
        <Section number="03" title="Audit content">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            <Stat
              label="₹ at risk identified"
              value={formatINR(snapshot.content.totalAtRiskInr)}
              sublabel="across all audits"
              placeholder={snapshot.content.atRiskInrPlaceholder}
            />
            <Stat
              label="Avg gaps / policy"
              value={snapshot.content.avgGapsPerPolicy.toFixed(1)}
            />
            <Stat
              label="Median IDV"
              value={formatINR(snapshot.content.medianIdv)}
            />
            <Stat
              label="Median premium"
              value={formatINR(snapshot.content.medianPremium)}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <RankList
              title="Top gap categories"
              items={snapshot.content.topGapCategories.map((g) => ({
                label: g.category,
                count: g.count,
              }))}
            />
            <PlaceholderBlock
              title="Coverage score distribution"
              show={snapshot.content.coverageScorePlaceholder}
              body="Wire CoverageScore band onto PolicyReport at gen-time, then this fills in (excellent / good / below average / critical)."
            />
          </div>
        </Section>

        {/* ── 4. Customer signal ───────────────────────────────────── */}
        <Section number="04" title="Customer signal">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <Stat
              label="Avg rating"
              value={
                snapshot.signal.avgRating !== null
                  ? `${snapshot.signal.avgRating.toFixed(1)} / 5`
                  : "—"
              }
              sublabel={`${snapshot.signal.totalRatings} ratings`}
              placeholder={snapshot.signal.ratingPlaceholder}
            />
            <Stat
              label="Renewal opt-in rate"
              value={`${snapshot.signal.renewalOptInRate.toFixed(1)}%`}
              sublabel="of customers"
            />
            <Stat
              label="Returning customer rate"
              value={`${snapshot.signal.returningCustomerRate.toFixed(1)}%`}
              sublabel="2+ audits / total"
            />
          </div>
          {snapshot.signal.ratingPlaceholder && (
            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
              · Ratings table not wired yet — capture from /thank-you or
              /me post-audit feedback ·
            </p>
          )}
        </Section>

        {/* ── 5. Channel mix ───────────────────────────────────────── */}
        <Section number="05" title="Channel mix">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat
              label="Web uploads"
              value={snapshot.channels.webUpload.toLocaleString("en-IN")}
            />
            <Stat
              label="Email forwards"
              value={snapshot.channels.emailForward.toLocaleString("en-IN")}
            />
            <Stat
              label="Multi-doc forwards"
              value={snapshot.channels.multiDocForwards.toLocaleString("en-IN")}
              sublabel="2+ docs / forward"
            />
            <Stat
              label="Multi-vehicle forwards"
              value={snapshot.channels.multiVehicleForwards.toLocaleString("en-IN")}
              sublabel="distinct vehicles"
            />
            <Stat
              label="WhatsApp share-backs"
              value={snapshot.channels.whatsappShareback.toString()}
              placeholder={snapshot.channels.whatsappShareBackPlaceholder}
            />
          </div>
          {snapshot.channels.whatsappShareBackPlaceholder && (
            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
              · WhatsApp share-back tracking pending — instrument when
              WhatsApp leg (Insights v1.6) lands ·
            </p>
          )}
        </Section>

        {/* ── 6. Operational health ────────────────────────────────── */}
        <Section number="06" title="Operational health">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat
              label="P50 audit"
              value={snapshot.ops.p50AuditMs !== null ? `${snapshot.ops.p50AuditMs}ms` : "—"}
              placeholder={snapshot.ops.timingsPlaceholder}
            />
            <Stat
              label="P90 audit"
              value={snapshot.ops.p90AuditMs !== null ? `${snapshot.ops.p90AuditMs}ms` : "—"}
              placeholder={snapshot.ops.timingsPlaceholder}
            />
            <Stat
              label="Audit success rate"
              value={
                snapshot.ops.auditSuccessRate !== null
                  ? `${snapshot.ops.auditSuccessRate.toFixed(1)}%`
                  : "—"
              }
              placeholder={snapshot.ops.successRatePlaceholder}
            />
            <Stat
              label="Sentry events (7d)"
              value={snapshot.ops.sentryEvents7d?.toString() ?? "—"}
              placeholder={snapshot.ops.sentryPlaceholder}
            />
          </div>
          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
            · Timings + success rate need PARSED_POLICIES instrumented with
            durations · Sentry needs API access ·
          </p>
        </Section>

        {/* ── 7. Funnel (placeholder) ──────────────────────────────── */}
        <Section number="07" title="Funnel conversion">
          <PlaceholderBlock
            title="Upload → verify → report → subscribe → share"
            show={true}
            body={snapshot.funnel.note}
          />
        </Section>

        {/* ── 8. Editorial engagement ──────────────────────────────── */}
        <Section number="08" title="Editorial engagement">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <Stat
              label="MidLoadQuestions answered"
              value={snapshot.editorialEngagement.midLoadQuestionsAnswered.toLocaleString("en-IN")}
              placeholder={snapshot.editorialEngagement.placeholder}
              sublabel="customers who engaged"
            />
          </div>
          {snapshot.editorialEngagement.placeholder && (
            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
              · Persist drivingProfile answers on ParsedPolicy (today
              they&rsquo;re ephemeral, threaded via URL query params) ·
            </p>
          )}
        </Section>

        {/* ── 9. Forward-channel trust ─────────────────────────────── */}
        <Section number="09" title="Forward-channel trust">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <Stat
              label="Customers · 2+ forwards"
              value={snapshot.forwardTrust.customersWith2PlusForwards.toLocaleString("en-IN")}
              sublabel="came back"
            />
            <Stat
              label="Customers · 3+ forwards"
              value={snapshot.forwardTrust.customersWith3PlusForwards.toLocaleString("en-IN")}
              sublabel="repeat trust"
            />
          </div>
          <p className="mt-4 font-serif italic text-[13.5px] text-brand-slate">
            Counted as distinct 30-min forward batches per customer email.
            Multi-doc forwards in a single batch don&rsquo;t count separately.
          </p>
        </Section>

        {/* ── 10. DPDP compliance ──────────────────────────────────── */}
        <Section number="10" title="DPDP compliance">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat
              label="Consented customers"
              value={snapshot.dpdp.consentedCustomers.toLocaleString("en-IN")}
              sublabel="dpdpConsentGivenAt set"
            />
            <Stat
              label="Active subscriptions"
              value={snapshot.dpdp.activeSubscriptions.toLocaleString("en-IN")}
            />
            <Stat
              label="Unsubscribed"
              value={snapshot.dpdp.unsubscribedSubscriptions.toLocaleString("en-IN")}
            />
            <Stat
              label="Deletion requests"
              value={snapshot.dpdp.deletionRequestsHandled.toString()}
              placeholder={snapshot.dpdp.deletionPlaceholder}
            />
          </div>
          {snapshot.dpdp.deletionPlaceholder && (
            <p className="mt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
              · Wire an audit log on /api/me/delete to count deletion
              requests handled ·
            </p>
          )}
        </Section>
      </div>

      <footer className="mt-16 pt-6 border-t border-brand-light-gray dark:border-slate-700 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
        <Link
          href="/"
          className="text-brand-plum hover:underline"
        >
          ← Back to RightOffer
        </Link>
        {" · "}
        <Link
          href="/api/admin/health"
          className="text-brand-plum hover:underline"
        >
          /api/admin/health
        </Link>
      </footer>
    </article>
  );
}

// ============================================================================
// Section + Stat + RankList helpers
// ============================================================================

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-5">
        <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-brand-sage">
          · {number} ·
        </span>
        <h2 className="font-serif font-semibold text-xl md:text-2xl tracking-[-0.015em] text-brand-charcoal m-0">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  sublabel,
  placeholder = false,
}: {
  label: string;
  value: string;
  sublabel?: string;
  placeholder?: boolean;
}) {
  return (
    <div
      className={
        placeholder
          ? "pl-4 border-l-2 border-brand-slate/30 opacity-70"
          : "pl-4 border-l-2 border-brand-plum/30"
      }
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate mb-1">
        {label}
      </div>
      <div className="font-serif font-medium text-2xl md:text-3xl tabular-nums leading-none text-brand-charcoal">
        {value}
        {placeholder && (
          <span className="ml-2 align-middle font-mono text-[9px] uppercase tracking-[0.12em] font-bold text-brand-sage bg-brand-sage/15 px-1.5 py-0.5 rounded">
            soon
          </span>
        )}
      </div>
      {sublabel && (
        <div className="mt-1 font-serif italic text-[12.5px] text-brand-slate">
          {sublabel}
        </div>
      )}
    </div>
  );
}

function RankList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  if (items.length === 0) {
    return (
      <div className="pl-4 border-l-2 border-brand-slate/20">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate mb-2">
          {title}
        </div>
        <p className="font-serif italic text-[13px] text-brand-slate">
          No data yet.
        </p>
      </div>
    );
  }
  return (
    <div className="pl-4 border-l-2 border-brand-plum/30">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate mb-2">
        {title}
      </div>
      <ol className="space-y-1">
        {items.map((item, i) => (
          <li
            key={item.label + i}
            className="flex items-baseline justify-between gap-3 font-serif text-[13.5px] text-brand-charcoal"
          >
            <span className="truncate">{item.label || "(unknown)"}</span>
            <span className="font-mono tabular-nums text-brand-slate text-[12px] shrink-0">
              {item.count}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PlaceholderBlock({
  title,
  show,
  body,
}: {
  title: string;
  show: boolean;
  body: string;
}) {
  if (!show) return null;
  return (
    <div className="pl-4 border-l-2 border-brand-slate/30 opacity-80">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate mb-2">
        {title}{" "}
        <span className="ml-1 font-mono text-[9px] uppercase tracking-[0.12em] font-bold text-brand-sage bg-brand-sage/15 px-1.5 py-0.5 rounded">
          soon
        </span>
      </div>
      <p className="font-serif italic text-[13px] text-brand-slate leading-[1.55]">
        {body}
      </p>
    </div>
  );
}

/**
 * SparkBar — small inline bar chart of the per-day 30-day series.
 * Pure CSS via flex + height percent; no SVG/Chart.js dependency.
 */
function SparkBar({
  series,
}: {
  series: Array<{ date: string; count: number }>;
}) {
  const max = series.reduce((m, s) => Math.max(m, s.count), 1);
  return (
    <div className="mt-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate mb-2">
        Audits / day · last 30
      </div>
      <div className="flex items-end gap-1 h-20 bg-brand-light-gray/30 dark:bg-slate-800/40 rounded-md p-1.5">
        {series.map((s) => (
          <div
            key={s.date}
            title={`${s.date} · ${s.count}`}
            className="flex-1 bg-brand-plum/70 rounded-sm min-h-[2px]"
            style={{
              height: `${(s.count / max) * 100}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[9.5px] uppercase tracking-[0.1em] text-brand-slate">
        <span>{series[0]?.date.slice(5) ?? ""}</span>
        <span>{series[series.length - 1]?.date.slice(5) ?? ""}</span>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
