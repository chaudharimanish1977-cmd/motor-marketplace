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
import { isMarketplaceEnabled } from "@/lib/feature-flags";
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
  // Demo-gated: visible on demo.rightoffer.in (where marketplace is on)
  // and Vercel preview / dev builds. Production rightoffer.in returns
  // 404 — we don't want random visitors landing on a metrics surface
  // that leaks customer aggregates. When task #28 (demo password
  // protection) lands, this page inherits that gate automatically.
  if (!(await isMarketplaceEnabled())) notFound();

  // Founder-only affordances. Non-founder visitors on demo (typically
  // investors walking through) can VIEW the snapshot but can't trigger
  // a manual refresh (expensive read on KV). The cron keeps the data
  // fresh on its own.
  const session = await getSession();
  const isFounder =
    !!session && session.toLowerCase() === FOUNDER_EMAIL;

  // Read the most-recent snapshot. If none exists yet (first visit
  // before the cron has fired) OR the stored snapshot was written by
  // an older schema version that's missing v2 fields, recompute and
  // overwrite. Self-healing: deploys that introduce new fields
  // auto-upgrade the snapshot on first page load.
  const stored = await findById<AdminDashboardSnapshot>(
    Tables.ADMIN_DASHBOARD_SNAPSHOTS,
    "latest"
  );
  const isStaleSchema =
    !stored ||
    stored.breadth?.makeCount === undefined ||
    stored.breadth?.topMakes === undefined ||
    stored.channels?.unknownChannel === undefined;
  let snapshot: AdminDashboardSnapshot;
  if (isStaleSchema) {
    snapshot = await computeAdminDashboardSnapshot();
    await writeTable(Tables.ADMIN_DASHBOARD_SNAPSHOTS, [snapshot]);
  } else {
    snapshot = stored as AdminDashboardSnapshot;
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
          {isFounder && <RefreshButton />}
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
        <Section
          number="01"
          title="Volume"
          description="Raw counts of audits, customers, vehicles, and active renewal subscriptions. The growth chart at the bottom shows how audits-per-day moved over the last 30 days."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat
              label="Total audits"
              value={snapshot.volume.totalAudits.toLocaleString("en-IN")}
              sublabel="all time"
              description="One audit = one ParsedPolicy row. Includes both bound policies and renewal quotes."
            />
            <Stat
              label="Last 7 days"
              value={snapshot.volume.audits7d.toLocaleString("en-IN")}
              description="Audits where uploadedAt is within the last 7 calendar days."
            />
            <Stat
              label="Last 30 days"
              value={snapshot.volume.audits30d.toLocaleString("en-IN")}
              description="Audits where uploadedAt is within the last 30 days."
            />
            <Stat
              label="Unique customers"
              value={snapshot.volume.totalCustomers.toLocaleString("en-IN")}
              description="Total User rows — one per verified email."
            />
            <Stat
              label="Unique vehicles"
              value={snapshot.volume.uniqueVehicles.toLocaleString("en-IN")}
              description="Distinct vehicles after dedup. Keyed by registration number; falls back to make+model+year+RTO if registration missing."
            />
            <Stat
              label="Returning customers"
              value={snapshot.volume.multiAuditCustomers.toLocaleString("en-IN")}
              sublabel="2+ audits"
              description="Customers (by owner.email) with more than one ParsedPolicy on file — proxy for engagement."
            />
            <Stat
              label="Active reminders"
              value={snapshot.dpdp.activeSubscriptions.toLocaleString("en-IN")}
              description="RenewalSubscription rows with status='active'. Each row is one policy subscribed to renewal nudges."
            />
            <Stat
              label="Unsubscribed"
              value={snapshot.dpdp.unsubscribedSubscriptions.toLocaleString("en-IN")}
              description="RenewalSubscription rows with status='unsubscribed' (customer clicked one-click unsub in a reminder email)."
            />
          </div>
          <SparkBar series={snapshot.volume.perDay30d} />
        </Section>

        {/* ── 2. Coverage breadth ──────────────────────────────────── */}
        <Section
          number="02"
          title="Coverage breadth"
          description="How many distinct insurers, vehicle makes, make+model combos, and RTOs we've parsed at least one document for. All names are canonicalised — 'Tata AIG' and 'Tata AIG General Insurance Company Limited' merge into one bucket; 'MH 02', 'MH-02', 'MH02' merge into one RTO."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            <Stat
              label="Insurers"
              value={snapshot.breadth.insurerCount.toLocaleString("en-IN")}
              sublabel="distinct"
              description="Unique insurer names after stripping suffixes like 'General Insurance Co Ltd'."
            />
            <Stat
              label="Vehicle makes"
              value={snapshot.breadth.makeCount.toLocaleString("en-IN")}
              sublabel="brands"
              description="Distinct brands — Maruti, Honda, Tata, etc. — across all audits."
            />
            <Stat
              label="Make/Model combos"
              value={snapshot.breadth.makeModelCount.toLocaleString("en-IN")}
              description="Distinct make+model pairs — Maruti Swift, Honda City, Tata Nexon, etc."
            />
            <Stat
              label="RTOs covered"
              value={snapshot.breadth.rtoCount.toLocaleString("en-IN")}
              description="Distinct RTO codes (proxy for cities/regions). Format-normalised so 'MH 02' and 'MH-02' count once."
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            <Stat
              label="Policies"
              value={snapshot.breadth.policyCount.toLocaleString("en-IN")}
              description="Documents classified as bound policies."
            />
            <Stat
              label="Quotes"
              value={snapshot.breadth.quoteCount.toLocaleString("en-IN")}
              description="Documents classified as unbound renewal quotes."
            />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RankList
              title="Top insurers"
              items={snapshot.breadth.topInsurers.map((i) => ({
                label: i.name,
                count: i.count,
              }))}
            />
            <RankList
              title="Top makes"
              items={snapshot.breadth.topMakes.map((i) => ({
                label: i.name,
                count: i.count,
              }))}
            />
            <RankList
              title="Top make + model"
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
        <Section
          number="03"
          title="Audit content"
          description="What the audits actually surface — money at risk, gap counts, value distributions. Gap categories are canonicalised so 'Zero Depreciation Cover Missing', 'Zero Depreciation Not Available', and 'Zero Dep' all merge into one bucket."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-6">
            <Stat
              label="₹ at risk identified"
              value={formatINR(snapshot.content.totalAtRiskInr)}
              sublabel="across all audits"
              placeholder={snapshot.content.atRiskInrPlaceholder}
              description="Sum of estimated annual premium across every essential-tagged add-on that's missing from a customer's current policy. Defensible proxy for 'what they'd pay in a worst-case claim event if those gaps stayed open'."
            />
            <Stat
              label="Avg gaps / policy"
              value={snapshot.content.avgGapsPerPolicy.toFixed(1)}
              description="Mean count of items in report.keyGaps.items across all reports that have any."
            />
            <Stat
              label="Median IDV"
              value={formatINR(snapshot.content.medianIdv)}
              description="Middle Insured Declared Value across all parsed policies — the customer's stated car value."
            />
            <Stat
              label="Median premium"
              value={formatINR(snapshot.content.medianPremium)}
              description="Middle Grand-Total premium customers are currently paying."
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
        <Section
          number="04"
          title="Customer signal"
          description="Direct customer-side indicators: how customers rated the audit, how many subscribed to renewal reminders, how many came back for a second audit."
        >
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
              description="5-point rating average. Captured today via /thank-you star widget but not yet persisted to a Ratings table."
            />
            <Stat
              label="Renewal opt-in rate"
              value={`${snapshot.signal.renewalOptInRate.toFixed(1)}%`}
              sublabel="of customers"
              description="Customers with at least one active RenewalSubscription divided by total customer count. Strong indicator of value perception."
            />
            <Stat
              label="Returning customer rate"
              value={`${snapshot.signal.returningCustomerRate.toFixed(1)}%`}
              sublabel="2+ audits / total"
              description="Customers who came back for a second audit. Early proxy for product stickiness."
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
        <Section
          number="05"
          title="Channel mix"
          description="Which channel each audit arrived through. Web uploads land via /upload; email forwards arrive via Postmark on review@rightoffer.in and run the same audit pipeline. Both write the same ParsedPolicy shape — only the `source` field differs."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat
              label="Web uploads"
              value={snapshot.channels.webUpload.toLocaleString("en-IN")}
              description="Policies parsed via the /upload web dropzone."
            />
            <Stat
              label="Email forwards"
              value={snapshot.channels.emailForward.toLocaleString("en-IN")}
              description="Policies parsed from inbound email forwards to review@rightoffer.in (Postmark)."
            />
            <Stat
              label="Unknown channel"
              value={snapshot.channels.unknownChannel.toLocaleString("en-IN")}
              placeholder={snapshot.channels.unknownChannel > 0}
              description="Legacy policies parsed before the source field was added (2026-05-25). New audits stamp the source, so this count will only shrink."
            />
            <Stat
              label="WhatsApp share-backs"
              value={snapshot.channels.whatsappShareback.toString()}
              placeholder={snapshot.channels.whatsappShareBackPlaceholder}
              description="Audits triggered when customers forward their report card back via WhatsApp — pending the WhatsApp Business API leg (Insights v1.6)."
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-5">
            <Stat
              label="Multi-doc forwards"
              value={snapshot.channels.multiDocForwards.toLocaleString("en-IN")}
              sublabel="2+ docs / forward batch"
              description="Email-forward batches where the customer attached 2 or more PDFs (e.g. current policy + renewal quote). Clustered by 30-minute window per sender email."
            />
            <Stat
              label="Multi-vehicle forwards"
              value={snapshot.channels.multiVehicleForwards.toLocaleString("en-IN")}
              sublabel="distinct vehicles in batch"
              description="Multi-doc batches where 2+ different vehicles appear — household forwards with multiple cars."
            />
          </div>
        </Section>

        {/* ── 6. Operational health ────────────────────────────────── */}
        <Section
          number="06"
          title="Operational health"
          description="System-side reliability: how fast audits process, what fraction succeed, and the error count surfaced by Sentry."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat
              label="P50 audit"
              value={snapshot.ops.p50AuditMs !== null ? `${snapshot.ops.p50AuditMs}ms` : "—"}
              placeholder={snapshot.ops.timingsPlaceholder}
              description="Median end-to-end audit processing time (extract → classify → parse → generate report)."
            />
            <Stat
              label="P90 audit"
              value={snapshot.ops.p90AuditMs !== null ? `${snapshot.ops.p90AuditMs}ms` : "—"}
              placeholder={snapshot.ops.timingsPlaceholder}
              description="90th percentile — i.e., 90% of audits complete in less than this time."
            />
            <Stat
              label="Audit success rate"
              value={
                snapshot.ops.auditSuccessRate !== null
                  ? `${snapshot.ops.auditSuccessRate.toFixed(1)}%`
                  : "—"
              }
              placeholder={snapshot.ops.successRatePlaceholder}
              description="Percentage of audit attempts that complete without rejection. Excludes intentional rejections (scanned image, two-wheeler, etc.)."
            />
            <Stat
              label="Sentry events (7d)"
              value={snapshot.ops.sentryEvents7d?.toString() ?? "—"}
              placeholder={snapshot.ops.sentryPlaceholder}
              description="Count of exceptions captured by Sentry in the last 7 days. Lower is better; 0 is healthy."
            />
          </div>
        </Section>

        {/* ── 7. Funnel (placeholder) ──────────────────────────────── */}
        <Section
          number="07"
          title="Funnel conversion"
          description="Per-step conversion across the customer journey. Requires event tracking via PostHog or similar — gated on H1 from the launch checklist."
        >
          <PlaceholderBlock
            title="Upload → verify → report → subscribe → share"
            show={true}
            body={snapshot.funnel.note}
          />
        </Section>

        {/* ── 8. Editorial engagement ──────────────────────────────── */}
        <Section
          number="08"
          title="Editorial engagement"
          description="How deeply customers engage with the product surface — not just upload-and-leave. Tracks customers who answered the optional MidLoadQuestions (parking habits, past claims, renewal priorities)."
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <Stat
              label="MidLoadQuestions answered"
              value={snapshot.editorialEngagement.midLoadQuestionsAnswered.toLocaleString("en-IN")}
              placeholder={snapshot.editorialEngagement.placeholder}
              sublabel="customers who engaged"
              description="Customers who answered at least one driving-profile question during the upload journey. Today these answers are threaded via URL query params and not persisted — needs ParsedPolicy.drivingProfile field."
            />
          </div>
        </Section>

        {/* ── 9. Forward-channel trust ─────────────────────────────── */}
        <Section
          number="09"
          title="Forward-channel trust"
          description="Customers who came back and forwarded a second (or third) policy. Counted as distinct 30-min forward batches per sender email — multi-doc forwards in a single batch don't count separately."
        >
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <Stat
              label="Customers · 2+ forwards"
              value={snapshot.forwardTrust.customersWith2PlusForwards.toLocaleString("en-IN")}
              sublabel="came back"
              description="Distinct customers who triggered 2 or more forward batches over time. Strong trust signal — they kept us in mind."
            />
            <Stat
              label="Customers · 3+ forwards"
              value={snapshot.forwardTrust.customersWith3PlusForwards.toLocaleString("en-IN")}
              sublabel="repeat trust"
              description="Customers with 3+ forward batches. Highest-engagement segment."
            />
          </div>
        </Section>

        {/* ── 10. DPDP compliance ──────────────────────────────────── */}
        <Section
          number="10"
          title="DPDP compliance"
          description="Tracks compliance posture under India's Digital Personal Data Protection Act, 2023: explicit consent capture, active subscriptions, unsubscribes, deletion requests handled."
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Stat
              label="Consented customers"
              value={snapshot.dpdp.consentedCustomers.toLocaleString("en-IN")}
              sublabel="dpdpConsentGivenAt set"
              description="User rows where the customer has explicitly given DPDP consent at signup or first upload."
            />
            <Stat
              label="Active subscriptions"
              value={snapshot.dpdp.activeSubscriptions.toLocaleString("en-IN")}
              description="RenewalSubscription rows with status='active'."
            />
            <Stat
              label="Unsubscribed"
              value={snapshot.dpdp.unsubscribedSubscriptions.toLocaleString("en-IN")}
              description="Customers who clicked the one-click unsubscribe link in a reminder email. 0 = no opt-outs yet."
            />
            <Stat
              label="Deletion requests"
              value={snapshot.dpdp.deletionRequestsHandled.toString()}
              placeholder={snapshot.dpdp.deletionPlaceholder}
              description="Count of /api/me/delete requests handled. Requires an audit log on the delete endpoint to track historically."
            />
          </div>
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
  description,
  children,
}: {
  number: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-brand-sage">
          · {number} ·
        </span>
        <h2 className="font-serif font-semibold text-xl md:text-2xl tracking-[-0.015em] text-brand-charcoal m-0">
          {title}
        </h2>
      </div>
      {description && (
        <p className="font-serif italic text-[13.5px] text-brand-slate mb-5 max-w-2xl leading-[1.55]">
          {description}
        </p>
      )}
      {children}
    </section>
  );
}

function Stat({
  label,
  value,
  sublabel,
  description,
  placeholder = false,
}: {
  label: string;
  value: string;
  sublabel?: string;
  description?: string;
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
      {description && (
        <div className="mt-1.5 font-serif text-[11.5px] text-brand-slate/80 leading-snug">
          {description}
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
