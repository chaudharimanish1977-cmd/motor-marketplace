import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/session";
import { getUploadSession } from "@/lib/upload-session";
import { readTable, Tables } from "@/lib/db";
import type { ParsedPolicy } from "@/lib/types";
import { BrandBlobs } from "@/components/brand-blobs";
import { INSIGHT_CATALOGUE } from "@/lib/insights/catalogue";
import {
  buildCustomerContext,
  matchAllInsights,
} from "@/lib/insights/matcher";
import type { Insight } from "@/lib/insights/types";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your insights — RightOffer",
  robots: { index: false, follow: false },
};

/**
 * /me/insights — the customer's continuous engagement feed.
 *
 * Matches every authored insight in the catalogue against the
 * customer's policies and driving profile, then renders the matched
 * set as an editorial feed (newest first). Multi-car customers see
 * insights across all their vehicles, deduped by insight id.
 *
 * No "since last visit" semantics in v1 — we just show every match.
 * Layered in v1.5 when we add the digest email and need to track
 * what's been delivered.
 *
 * Editorial vocabulary throughout — mono kickers, serif body, plum
 * accents. Matches the rest of the product.
 */
export default async function InsightsPage() {
  const fullSessionEmail = await getSession();
  const uploadSession = fullSessionEmail ? null : await getUploadSession();
  const sessionEmail = fullSessionEmail ?? uploadSession?.email ?? null;
  if (!sessionEmail) redirect("/me/login?next=/me/insights");

  const target = sessionEmail.toLowerCase();
  const allPolicies = await readTable<ParsedPolicy>(Tables.PARSED_POLICIES);
  const mine = allPolicies.filter(
    (p) => (p.owner?.email ?? "").toLowerCase() === target
  );

  // For multi-car customers we build a context per policy, run the
  // matcher per context, and dedupe by insight id. Customer with a
  // CNG car AND a diesel sees insights for both.
  const matchedById = new Map<string, Insight>();
  for (const policy of mine) {
    const ctx = buildCustomerContext(policy);
    for (const insight of matchAllInsights(INSIGHT_CATALOGUE, ctx)) {
      if (!matchedById.has(insight.id)) {
        matchedById.set(insight.id, insight);
      }
    }
  }
  const matched = Array.from(matchedById.values()).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-screen px-5 md:px-6 py-10 md:py-14">
        <article className="max-w-2xl mx-auto font-serif text-brand-charcoal">
          {/* Back link */}
          <Link
            href="/me"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-brand-slate hover:text-brand-charcoal transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to your portal
          </Link>

          {/* Masthead */}
          <header className="border-b border-brand-charcoal/15 pb-5 mt-5 mb-10">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
              · Reading Room · Insights for your car ·
            </div>
            <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
              What&rsquo;s changed{" "}
              <span className="italic text-brand-plum">for you</span>
            </h1>
            <p className="mt-3 font-serif italic text-[15px] md:text-[17px] leading-[1.55] text-brand-slate max-w-xl">
              We watch the market, the weather, and the regulator — and
              flag the moves that matter to <em>your</em> policy and{" "}
              <em>your</em> car. Monthly by default; urgent ones land
              when they can&rsquo;t wait.
            </p>
          </header>

          {/* Feed */}
          {matched.length === 0 ? (
            <EmptyState hasPolicies={mine.length > 0} />
          ) : (
            <div className="space-y-12">
              {matched.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}

          {/* Footer note */}
          <footer className="mt-16 pt-6 border-t border-brand-charcoal/15">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate text-center">
              · Insights are tailored to your policy &amp; driving profile · Not generic content ·
            </p>
          </footer>
        </article>
      </main>
    </>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const date = new Date(insight.publishedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <section
      id={insight.id}
      className="relative scroll-mt-20"
    >
      {/* Kicker */}
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
          · {insight.kicker} ·
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          {date}
          {insight.urgent && (
            <span className="ml-2 font-bold text-brand-alert">
              · Urgent
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="mt-2 md:mt-3 font-serif font-medium text-[26px] md:text-[34px] leading-[1.1] tracking-[-0.015em] text-brand-charcoal m-0">
        {insight.title}
      </h2>

      {/* One-liner */}
      <p className="mt-3 font-serif italic text-[16px] md:text-[17px] leading-[1.55] text-brand-plum max-w-xl">
        {insight.oneLiner}
      </p>

      {/* Hairline */}
      <div className="mt-5 md:mt-6 border-t border-brand-charcoal/15" />

      {/* Body */}
      <div
        className="mt-5 md:mt-6 insight-body font-serif text-[15.5px] md:text-[16.5px] leading-[1.7] text-brand-charcoal max-w-xl space-y-4 [&>p]:m-0 [&>ul]:m-0 [&>ul]:list-none [&>ul]:pl-0 [&>ul>li]:pl-4 [&>ul>li]:border-l-2 [&>ul>li]:border-brand-charcoal/15 [&>ul>li]:my-2 [&_a]:text-brand-plum [&_a]:underline [&_a]:decoration-brand-plum/40 hover:[&_a]:decoration-brand-plum"
        dangerouslySetInnerHTML={{ __html: insight.body }}
      />

      {/* Attachment link */}
      {insight.reportAttach && (
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          · Linked to your{" "}
          {insight.reportAttach.section === "gaps"
            ? `${insight.reportAttach.gap} gap`
            : insight.reportAttach.section === "renewal"
              ? "renewal section"
              : "report summary"}
          {" · "}
          <Link
            href="/me"
            className="text-brand-plum hover:underline"
          >
            See it in your report
          </Link>
        </p>
      )}
    </section>
  );
}

function EmptyState({ hasPolicies }: { hasPolicies: boolean }) {
  return (
    <div className="border-l-2 border-brand-charcoal/20 pl-5 py-2">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-slate font-bold">
        · Quiet for now ·
      </div>
      {hasPolicies ? (
        <p className="mt-2 font-serif italic text-[16px] md:text-[17px] leading-[1.55] text-brand-slate max-w-xl">
          We don&rsquo;t have anything market-moving for your specific car
          right now. Insights are published when something genuinely
          affects <em>your</em> policy — not a generic newsletter.
        </p>
      ) : (
        <p className="mt-2 font-serif italic text-[16px] md:text-[17px] leading-[1.55] text-brand-slate max-w-xl">
          Upload a policy first so we know what to watch for you.{" "}
          <Link href="/upload" className="text-brand-plum hover:underline">
            Start your audit →
          </Link>
        </p>
      )}
    </div>
  );
}

