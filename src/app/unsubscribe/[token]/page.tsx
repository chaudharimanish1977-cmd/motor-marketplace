import Link from "next/link";
import { CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { verifyToken } from "@/lib/email-token";
import { findById, updateById, Tables } from "@/lib/db";
import type {
  ParsedPolicy,
  RenewalSubscription,
} from "@/lib/types";
import { BrandBlobs } from "@/components/brand-blobs";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Unsubscribe — RightOffer",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * One-click unsubscribe landing page. Reachable only via a signed link
 * RightOffer puts in every customer-facing reminder email (the reminder
 * cron is the next PR — this page already works the moment that ships).
 *
 * Flow:
 *   1. Verify the HMAC-signed token (no DB lookup needed to check authenticity).
 *   2. Resolve the subscription row; flip status to "unsubscribed" if it
 *      isn't already (idempotent — safe for email-client prefetchers).
 *   3. Render a confirmation page that names the vehicle so the user knows
 *      exactly which reminder stream they just turned off.
 *
 * The page itself is `noindex` — these are personal links that should never
 * surface in search results.
 */
export default async function UnsubscribePage({ params }: PageProps) {
  const { token } = await params;
  const payload = verifyToken(token, "unsub");

  if (!payload) {
    return (
      <Shell>
        <Card
          tone="warn"
          title="Link expired or invalid"
          body="This unsubscribe link is no longer valid. If you're still getting reminders, just reply to any RightOffer email — a real person reads every one and will turn them off for you."
          actionLabel="Back to RightOffer"
          actionHref="/"
        />
      </Shell>
    );
  }

  const sub = await findById<RenewalSubscription>(
    Tables.RENEWAL_SUBSCRIPTIONS,
    payload.s
  );

  // Subscription deleted upstream (e.g. data scrub). Still show success —
  // from the customer's perspective they're not subscribed, which is the
  // only thing they actually care about.
  if (!sub) {
    return (
      <Shell>
        <Card
          tone="ok"
          title="You're not subscribed"
          body="We don't have any active reminders for this address. You won't hear from us about renewals."
          actionLabel="Back to RightOffer"
          actionHref="/"
        />
      </Shell>
    );
  }

  // Look up the vehicle so the confirmation copy can name it. Best-effort
  // — if the parsed policy was deleted we just omit the vehicle line.
  let vehicleLabel = "";
  const policy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    sub.parsedPolicyId
  );
  if (policy) {
    vehicleLabel = `${policy.vehicle.make} ${policy.vehicle.model}`.trim();
  }

  // Idempotent flip. Email security scanners (Outlook ATP, Mimecast, etc.)
  // routinely pre-fetch links from inbound mail — doing the action on GET
  // is fine as long as repeated calls produce the same result.
  if (sub.status === "active") {
    await updateById<RenewalSubscription>(
      Tables.RENEWAL_SUBSCRIPTIONS,
      sub.id,
      {
        status: "unsubscribed",
        unsubscribedAt: new Date().toISOString(),
      }
    );
  }

  return (
    <Shell>
      <Card
        tone="ok"
        title="You're unsubscribed"
        body={
          vehicleLabel
            ? `We won't email you any more renewal reminders for your ${vehicleLabel}. If you change your mind, just upload your policy again any time.`
            : "We won't email you any more renewal reminders. If you change your mind, just upload your policy again any time."
        }
        actionLabel="Back to RightOffer"
        actionHref="/"
      />
    </Shell>
  );
}

// ----------------------------------------------------------------------------
// Layout pieces
// ----------------------------------------------------------------------------

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </>
  );
}

function Card({
  tone,
  title,
  body,
  actionLabel,
  actionHref,
}: {
  tone: "ok" | "warn";
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}) {
  const Icon = tone === "ok" ? CheckCircle2 : AlertCircle;
  const iconWrap =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
      : "bg-amber-50 text-amber-600 border-amber-200";

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-brand-light-gray p-8 text-center">
      <div
        className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center ${iconWrap}`}
      >
        <Icon className="w-7 h-7" />
      </div>
      <h1 className="mt-5 text-2xl font-bold text-brand-charcoal tracking-tight">
        {title}
      </h1>
      <p className="mt-3 text-sm text-brand-slate leading-relaxed">
        {body}
      </p>
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-brand-slate/70">
        <Mail className="w-3.5 h-3.5" />
        <span>Questions? Reply to any RightOffer email.</span>
      </div>
      <Link
        href={actionHref}
        className="mt-6 inline-flex items-center justify-center px-6 py-2.5 bg-brand-charcoal hover:brightness-110 text-white font-semibold text-sm rounded-xl transition-all"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
