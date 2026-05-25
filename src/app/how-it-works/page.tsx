/**
 * /how-it-works — non-marketplace customer journey diagram.
 *
 * Phase 1 (audit-only) walk-through, presented as a vertical
 * step-by-step flow. Editorial design: numbered steps in plum,
 * serif body, mono kickers, sage accents on the right margin for
 * what's happening behind the scenes.
 *
 * Demo-gated: only renders when isMarketplaceEnabled() returns true
 * (i.e. on demo.rightoffer.in or preview/dev). Hidden on production
 * rightoffer.in so the public site doesn't carry an internal
 * architecture surface.
 *
 * Linked from /investor (the demo landing) so anyone walking through
 * a persona can also see the journey at a glance.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { isMarketplaceEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "How RightOffer works — Phase 1 journey",
  robots: { index: false, follow: false },
};

interface Step {
  number: string;
  title: string;
  body: string;
  channel?: string;
  technical: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    title: "Customer hands over the policy.",
    body: "Two ways in. Drop the PDF on the website, or forward the insurer's renewal email to a dedicated address. Same audit pipeline catches both.",
    channel: "Web upload — Email forward",
    technical:
      "/upload (Vercel Edge) — review@rightoffer.in → Postmark Inbound → /api/inbound/email (signature-verified webhook)",
  },
  {
    number: "02",
    title: "We read every line.",
    body: "The PDF gets parsed by an LLM that extracts the structured policy — insurer, IDV, NCB, add-ons, vehicle, RTO, premium breakdown, owner details, the works. The same model classifies whether it's a bound policy or an unbound quote.",
    channel: "AI parse",
    technical:
      "Anthropic Claude · src/lib/parser.ts · 5xx-retry with exponential backoff",
  },
  {
    number: "03",
    title: "The audit writes itself.",
    body: "From the parsed policy, we generate a structured report — bottom-line verdict, coverage snapshot table, per-feature insights, key gaps, renewal tips, and an at-a-glance summary. Editorial voice throughout, not a checklist.",
    channel: "Audit report",
    technical:
      "src/lib/report-generator.ts · stored as PolicyReport in Upstash KV · keyed by parsedPolicyId",
  },
  {
    number: "04",
    title: "Report lands two ways.",
    body: "The customer reads the live web view at /report/[id] — full editorial layout with the coverage snapshot at the top, deep editorial sections below, glossary at the bottom. We also email the PDF copy automatically once they verify, and email-forward customers get an inline magic-link in the reply that signs them in with one click.",
    channel: "Web + Email",
    technical:
      "/report/[id] (Next.js server component) · PDF via Puppeteer + Resend · magic-link via 7-day HMAC-signed token",
  },
  {
    number: "05",
    title: "Renewal cliff captured.",
    body: "An inline chip on the report says \"Want a heads-up 45 days before this expires?\" One click subscribes. The email reply carries the same magic-link for customers who never visit the website. Either path writes the same RenewalSubscription row.",
    channel: "In-report chip — Email magic-link",
    technical:
      "POST /api/reminders/subscribe — GET /api/reminders/click/[token] · idempotent · email-only channels for click-based subs",
  },
  {
    number: "06",
    title: "Cron sends the reminders.",
    body: "A daily job (10am IST) checks every active subscription. When today falls inside any subscription's daysBefore checkpoint (default 60, 30, 7 days before expiry), it fires the editorial reminder email with a recap of last year's audit + a CTA to forward the new quote.",
    channel: "Cron",
    technical:
      "vercel.json crons · /api/cron/renewal-reminders · Resend transactional · nudgesFired[] dedupes per checkpoint",
  },
  {
    number: "07",
    title: "Customer comes back.",
    body: "When the renewal quote arrives, they forward it to the same email. We re-run the audit, compare it against last year's policy, and surface what changed. /me holds every audit they've ever uploaded, with reminders, share links, and one-click DPDP delete.",
    channel: "Return loop",
    technical:
      "Multi-doc forwards → /reports (comparator + per-doc annexure) · /me portal · ShareTokens · /api/me/delete (DPDP)",
  },
];

export default async function HowItWorksPage() {
  if (!(await isMarketplaceEnabled())) notFound();

  return (
    <article className="max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-16 font-serif text-brand-charcoal">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-brand-plum font-mono uppercase tracking-[0.12em] text-[10.5px] font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to demo
          </Link>
          <Link
            href="/how-it-works/engineer"
            className="inline-flex items-center gap-1.5 text-sm font-mono uppercase tracking-[0.12em] text-[10.5px] font-bold text-brand-plum hover:underline"
          >
            Engineer view · architecture
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>

        {/* Masthead */}
        <header className="mb-12 pb-6 border-b border-brand-light-gray dark:border-slate-700">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
            · How it works · Phase 1 · audit-only ·
          </div>
          <h1 className="font-serif font-medium text-3xl md:text-[44px] leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
            Forward a policy.{" "}
            <span className="italic text-brand-plum">
              We do the reading.
            </span>
          </h1>
          <p className="mt-4 font-serif italic text-[15.5px] md:text-[16.5px] text-brand-slate leading-[1.55] max-w-2xl">
            Seven steps from customer hand-off to renewal reminder. No
            marketplace, no bidding, no insurer push — just an honest
            read of what they already pay for, and a tap on the shoulder
            before it lapses.
          </p>
        </header>

        {/* Steps */}
        <ol className="space-y-10 list-none p-0 m-0">
          {STEPS.map((step, i) => (
            <StepRow key={step.number} step={step} isLast={i === STEPS.length - 1} />
          ))}
        </ol>

        {/* Closing */}
        <section className="mt-16 pt-8 border-t border-brand-light-gray dark:border-slate-700">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
            · What Phase 2 adds ·
          </div>
          <p className="font-serif italic text-[14.5px] text-brand-slate leading-[1.6] max-w-2xl">
            Phase 2 — marketplace — picks up{" "}
            <span className="not-italic text-brand-charcoal">after</span>{" "}
            the audit. Same upload, same parse, same report. A new CTA
            on the report invites the customer into a curated insurer
            auction. The audit IS the wedge; the marketplace is the
            second act. Everything you walked through above stays
            unchanged the day we flip the marketplace flag on
            production.
          </p>
        </section>

        <footer className="mt-12 pt-6 border-t border-brand-light-gray dark:border-slate-700 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
          <Link
            href="/"
            className="text-brand-plum hover:underline"
          >
            ← Back to demo
          </Link>
          {" · "}
          <Link href="/" className="text-brand-plum hover:underline">
            RightOffer.in
          </Link>
        </footer>
    </article>
  );
}

function StepRow({ step, isLast }: { step: Step; isLast: boolean }) {
  return (
    <li className="relative grid md:grid-cols-[80px_1fr] gap-4 md:gap-7">
      {/* Number + connecting rule */}
      <div className="relative">
        <div className="font-serif italic font-medium text-[44px] md:text-[56px] leading-none text-brand-plum tabular-nums">
          {step.number}
        </div>
        {!isLast && (
          <div
            aria-hidden
            className="absolute left-[18px] md:left-[22px] top-[56px] md:top-[64px] bottom-[-40px] w-px bg-brand-plum/30 hidden md:block"
          />
        )}
      </div>

      {/* Step body */}
      <div className="pb-2">
        <h2 className="font-serif font-medium text-[22px] md:text-[26px] leading-[1.2] tracking-[-0.015em] text-brand-charcoal m-0">
          {step.title}
        </h2>
        {step.channel && (
          <div className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-sage font-bold">
            · {step.channel} ·
          </div>
        )}
        <p className="mt-3 font-serif text-[15px] md:text-[16px] text-brand-charcoal leading-[1.6] max-w-xl">
          {step.body}
        </p>
        <div className="mt-3 pl-3 border-l-2 border-brand-light-gray dark:border-slate-700">
          <p className="font-mono text-[11px] leading-[1.5] text-brand-slate">
            {step.technical}
          </p>
        </div>
      </div>
    </li>
  );
}
