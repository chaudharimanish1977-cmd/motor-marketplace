import { notFound, redirect } from "next/navigation";
import { findById, Tables } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import type {
  ComparisonReport,
  ParsedPolicy,
} from "@/lib/types";
import { formatINR } from "@/lib/format";
import { BrandBlobs } from "@/components/brand-blobs";
import { LoadingLink } from "@/components/loading-link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Comparison — RightOffer",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Comparison report page — Right Offer comparator output (editorial).
 *
 * Section order:
 *   1. Vehicle / context masthead
 *   2. RCP (what we recommend for this car)
 *   3. Your uploaded quotes — hairline rows, each scored against RCP
 *   4. Lapsed-policy caring nudge (only when the anchor policy has
 *      expired)
 *   5. Verdict — editorial pull-quote in functional palette
 *   6. Back-to-portal link
 *
 * Editorial vocabulary throughout — mono kickers, serif body, hairline
 * rules, functional palette (sage / plum / alert / slate / success).
 * No card frames, no shadows, no emerald / amber / rose leakage.
 *
 * Marketplace teasers ("RightOffer auction", "Reserve a RightOffer
 * pick" CTA) were retired — V1 doesn't promise what we don't deliver.
 */
export default async function ComparisonPage({ params }: PageProps) {
  const { id } = await params;

  const fullSessionEmail = await getSession();
  const uploadSession = fullSessionEmail ? null : await getUploadSession();
  const sessionEmail = fullSessionEmail ?? uploadSession?.email ?? null;
  if (!sessionEmail) {
    redirect(
      `/me/login?next=${encodeURIComponent(`/comparison/${id}`)}`
    );
  }

  const comparison = await findById<ComparisonReport>(
    Tables.COMPARISONS,
    id
  );
  if (!comparison) notFound();
  if (
    (comparison.customerEmail ?? "").toLowerCase() !==
    sessionEmail.toLowerCase()
  ) {
    notFound();
  }
  if (uploadSession) {
    const allowedDocs = new Set(uploadSession.docs);
    const allInScope = comparison.quoteIds.every((q) => allowedDocs.has(q));
    if (!allInScope) notFound();
  }

  const quoteDocs: ParsedPolicy[] = [];
  for (const qid of comparison.quoteIds) {
    const q = await findById<ParsedPolicy>(Tables.PARSED_POLICIES, qid);
    if (q) quoteDocs.push(q);
  }

  const anchorPolicy = comparison.policyId
    ? await findById<ParsedPolicy>(
        Tables.PARSED_POLICIES,
        comparison.policyId
      )
    : null;
  const anchorLapsed =
    !!anchorPolicy &&
    new Date(anchorPolicy.odPeriodEnd).getTime() < Date.now();

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-screen px-5 md:px-6 py-10 md:py-14">
        <article className="max-w-3xl mx-auto font-serif text-brand-charcoal space-y-12">
          <Header comparison={comparison} />
          <RcpBlock comparison={comparison} />
          <QuotesBlock comparison={comparison} quoteDocs={quoteDocs} />
          {anchorLapsed && anchorPolicy && (
            <LapsedPolicyNudge anchorPolicy={anchorPolicy} />
          )}
          <VerdictBlock comparison={comparison} quoteDocs={quoteDocs} />
          <CtaRow />
        </article>
      </main>
    </>
  );
}

// ----------------------------------------------------------------------------
// Header — masthead
// ----------------------------------------------------------------------------
function Header({ comparison }: { comparison: ComparisonReport }) {
  return (
    <header className="border-b border-brand-charcoal/15 pb-5">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
        · Reading Room · Right Offer comparison ·
      </div>
      <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
        {comparison.vehicleLabel}
      </h1>
      <p className="mt-3 font-serif italic text-[15px] md:text-[16px] text-brand-slate leading-relaxed max-w-xl">
        {comparison.quoteIds.length}{" "}
        {comparison.quoteIds.length === 1 ? "quote" : "quotes"} scored
        against the Right Offer profile for this car
        {comparison.policyId ? " · anchored on your current policy" : ""}
        .
      </p>
    </header>
  );
}

// ----------------------------------------------------------------------------
// RCP block — what we recommend
// ----------------------------------------------------------------------------
function RcpBlock({ comparison }: { comparison: ComparisonReport }) {
  const { rcp } = comparison;
  return (
    <section>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-sage">
        · What we recommend ·
      </div>
      <h2 className="mt-2 font-serif font-medium text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
        The Right Offer profile for{" "}
        <span className="italic text-brand-plum">
          your {comparison.vehicleLabel}
        </span>
        .
      </h2>
      <p className="mt-3 font-serif italic text-[14.5px] md:text-[15px] text-brand-slate leading-relaxed max-w-xl">
        The coverage we believe is right for your car &amp; profile —
        every quote below is scored against this.
      </p>

      <div className="mt-6 border-t border-brand-charcoal/15">
        <div className="pt-5 flex items-baseline justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-charcoal">
            · Required add-ons ·
          </div>
          <div className="font-mono text-[10px] text-brand-slate tabular-nums">
            ~ {formatINR(rcp.requiredAddOnsPremiumTotal)}/yr together
          </div>
        </div>

        {rcp.requiredAddOns.length === 0 ? (
          <p className="mt-3 font-serif italic text-[13.5px] text-brand-slate">
            No specific add-ons strictly required for your profile.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-brand-charcoal/10">
            {rcp.requiredAddOns.map((a) => (
              <li key={a.name} className="py-3 flex items-start gap-3">
                <span
                  aria-hidden
                  className="shrink-0 w-5 text-center font-mono text-[14px] font-bold text-brand-success leading-snug"
                >
                  ✓
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="font-serif font-semibold text-[15px] md:text-[16px] text-brand-charcoal">
                      {a.name}
                    </div>
                    <div className="font-mono text-[11px] tabular-nums text-brand-slate">
                      ~ {formatINR(a.estimatedAnnualPremium)}/yr
                    </div>
                  </div>
                  <div className="mt-0.5 font-serif italic text-[13.5px] text-brand-slate leading-snug">
                    {a.why}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rcp.idv.note && (
        <p className="mt-5 pl-4 border-l-2 border-brand-plum/40 font-serif italic text-[13.5px] md:text-[14px] text-brand-slate leading-relaxed max-w-xl">
          <span className="not-italic font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-brand-plum">
            · IDV · {formatINR(rcp.idv.current)} ·
          </span>{" "}
          {rcp.idv.note}
        </p>
      )}
    </section>
  );
}

// ----------------------------------------------------------------------------
// Quotes block — hairline rows, no card frames
// ----------------------------------------------------------------------------
function QuotesBlock({
  comparison,
  quoteDocs,
}: {
  comparison: ComparisonReport;
  quoteDocs: ParsedPolicy[];
}) {
  const quoteById = new Map(quoteDocs.map((q) => [q.id, q]));

  return (
    <section>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-plum">
        · Your quotes ·{" "}
        <span className="text-brand-slate tabular-nums">
          {comparison.quoteIds.length}
        </span>{" "}
        ·
      </div>
      <h2 className="mt-2 font-serif font-medium text-[24px] md:text-[28px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
        Scored against the profile.
      </h2>

      <div className="mt-5 border-t border-brand-charcoal/15">
        {comparison.quoteScores.map((score) => {
          const doc = quoteById.get(score.quoteId);
          return (
            <QuoteCard
              key={score.quoteId}
              score={score}
              doc={doc ?? null}
            />
          );
        })}
      </div>
    </section>
  );
}

function QuoteCard({
  score,
  doc,
}: {
  score: ComparisonReport["quoteScores"][number];
  doc: ParsedPolicy | null;
}) {
  // Editorial status — mono kicker in functional palette, no rounded
  // pill, no light tint. Same vocab as the /me PolicyCard status.
  const status = score.isExactlyRcp
    ? { label: "Exactly right", cls: "text-brand-success" }
    : score.isRcpComplete
      ? { label: "Covers + extras", cls: "text-brand-plum" }
      : { label: "Missing essentials", cls: "text-brand-alert" };

  return (
    <article className="py-6 md:py-7 border-b border-brand-charcoal/10 last:border-b-0">
      {/* Top row — insurer + status + premium */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-serif font-semibold text-[20px] md:text-[22px] tracking-[-0.01em] text-brand-charcoal leading-tight">
            {score.insurerName}
          </div>
          {doc?.policyNumber && (
            <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
              {doc.policyNumber}
            </div>
          )}
          <div
            className={`mt-2 font-mono text-[10px] uppercase tracking-[0.16em] font-bold ${status.cls}`}
          >
            · {status.label} ·
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brand-slate">
            · Premium ·
          </div>
          <div className="mt-0.5 font-serif font-semibold text-[22px] md:text-[26px] tabular-nums text-brand-charcoal leading-none">
            {formatINR(score.grandTotal)}
          </div>
        </div>
      </div>

      {/* Missing required */}
      {score.missingRequired.length > 0 && (
        <div className="mt-4 pl-4 border-l-2 border-brand-alert">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-alert">
            · Missing essentials ·
          </div>
          <ul className="mt-1.5 space-y-1">
            {score.missingRequired.map((m) => (
              <li
                key={m}
                className="flex items-baseline gap-2 font-serif text-[13.5px] md:text-[14px] text-brand-charcoal"
              >
                <span
                  aria-hidden
                  className="font-mono text-[12px] font-bold text-brand-alert leading-snug"
                >
                  ✕
                </span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Extras / over-coverage */}
      {score.extraNonRcp.length > 0 && (
        <div className="mt-4 pl-4 border-l-2 border-brand-plum/40">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-plum">
            · Extras you didn&rsquo;t need to buy ·
          </div>
          <ul className="mt-1.5 space-y-1">
            {score.extraNonRcp.map((e) => (
              <li
                key={e}
                className="flex items-baseline gap-2 font-serif italic text-[13.5px] md:text-[14px] text-brand-slate"
              >
                <span
                  aria-hidden
                  className="font-mono text-[12px] text-brand-plum leading-snug not-italic"
                >
                  ›
                </span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* RCP-complete cheer */}
      {score.isExactlyRcp && (
        <p className="mt-4 pl-4 border-l-2 border-brand-success/60 font-serif italic text-[13.5px] md:text-[14px] text-brand-charcoal leading-relaxed">
          <span className="not-italic font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-success">
            · Right Offer ·
          </span>{" "}
          Covers every Right Offer essential — no missing items, no
          padding.
        </p>
      )}
    </article>
  );
}

// ----------------------------------------------------------------------------
// Lapsed-policy caring nudge
// ----------------------------------------------------------------------------
function LapsedPolicyNudge({ anchorPolicy }: { anchorPolicy: ParsedPolicy }) {
  const vehicleLabel =
    `${anchorPolicy.vehicle.make} ${anchorPolicy.vehicle.model}`.trim() ||
    "your car";
  const expiry = new Date(anchorPolicy.odPeriodEnd);
  const daysSinceExpiry = Math.max(
    1,
    Math.floor((Date.now() - expiry.getTime()) / (24 * 60 * 60 * 1000))
  );
  return (
    <section className="pl-5 border-l-2 border-brand-alert">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-alert">
        · A gentle nudge ·
      </div>
      <h3 className="mt-2 font-serif font-medium text-[24px] md:text-[28px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
        We hope your{" "}
        <span className="italic text-brand-plum">{vehicleLabel}</span>{" "}
        is still covered.
      </h3>
      <p className="mt-3 font-serif text-[14.5px] md:text-[15.5px] leading-[1.6] text-brand-charcoal max-w-xl">
        Your last policy with us shows as lapsed{" "}
        <span className="font-mono text-[12px] text-brand-slate tabular-nums">
          ({daysSinceExpiry} {daysSinceExpiry === 1 ? "day" : "days"} ago)
        </span>
        . If you&rsquo;ve renewed elsewhere — welcome, that&rsquo;s
        fine — drop the new policy here and we&rsquo;ll review it.
        If you haven&rsquo;t renewed yet, please get cover first;
        third-party insurance is mandatory by law.
      </p>
      <div className="mt-5 flex items-center gap-3 flex-wrap">
        <LoadingLink
          href={`/upload?renewal=${anchorPolicy.id}`}
          spinnerPosition="right"
          className="inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[15px] min-h-[44px] hover:opacity-90 transition-opacity"
        >
          Upload my new policy <span aria-hidden>→</span>
        </LoadingLink>
        <LoadingLink
          href="/upload"
          spinnerPosition="right"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[13px] md:text-[14px] min-h-[36px] transition-colors"
        >
          Help me get covered <span aria-hidden>→</span>
        </LoadingLink>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------------
// Verdict — editorial pull-quote
// ----------------------------------------------------------------------------
function VerdictBlock({
  comparison,
  quoteDocs,
}: {
  comparison: ComparisonReport;
  quoteDocs: ParsedPolicy[];
}) {
  const { verdict } = comparison;
  // Editorial tone mapping — replaces the emerald/amber/navy tint
  // cards with functional palette left-rules. take_existing = strong
  // win (success), rightoffer_pitch = our pick (plum), anything else
  // = needs attention (alert).
  const tone =
    verdict.type === "take_existing"
      ? "success"
      : verdict.type === "rightoffer_pitch"
        ? "plum"
        : "alert";
  const ruleCls =
    tone === "success"
      ? "border-brand-success"
      : tone === "plum"
        ? "border-brand-plum"
        : "border-brand-alert";
  const kickerCls =
    tone === "success"
      ? "text-brand-success"
      : tone === "plum"
        ? "text-brand-plum"
        : "text-brand-alert";

  const recommendedQuote = verdict.recommendedQuoteId
    ? quoteDocs.find((q) => q.id === verdict.recommendedQuoteId)
    : null;

  return (
    <section className={`pl-5 border-l-4 ${ruleCls}`}>
      <div
        className={`font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold ${kickerCls}`}
      >
        · Right Offer verdict ·
      </div>
      <h3 className="mt-2 font-serif font-medium text-[26px] md:text-[32px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
        {verdict.headline}
      </h3>
      <p className="mt-3 font-serif text-[14.5px] md:text-[15.5px] leading-[1.6] text-brand-charcoal max-w-xl">
        {verdict.body}
      </p>
      {recommendedQuote && (
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
          · Recommended option · {recommendedQuote.insurerName}
          {recommendedQuote.policyNumber
            ? ` · ${recommendedQuote.policyNumber}`
            : ""}{" "}
          ·
        </p>
      )}
    </section>
  );
}

// ----------------------------------------------------------------------------
// CTA row — back to portal only (Reserve a RightOffer pick retired)
// ----------------------------------------------------------------------------
function CtaRow() {
  return (
    <div className="flex items-center justify-center pt-2">
      <LoadingLink
        href="/me"
        spinnerPosition="right"
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[13px] md:text-[14px] min-h-[36px] transition-colors"
      >
        Back to my portal <span aria-hidden>→</span>
      </LoadingLink>
    </div>
  );
}
