import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Send,
  CalendarClock,
  Sparkles,
  Lock,
} from "lucide-react";
import { findById, findOne, Tables } from "@/lib/db";
import type {
  Transaction,
  Bid,
  RFQ,
  ParsedPolicy,
  RenewalSchedule,
  RenewalNudge,
} from "@/lib/types";
import { formatDateShort } from "@/lib/format";
import { isMarketplaceEnabled } from "@/lib/feature-flags";

interface PageProps {
  params: Promise<{ transactionId: string }>;
}

const CHANNEL_META: Record<
  RenewalNudge["channel"],
  { icon: typeof Mail; label: string; colour: string }
> = {
  email: { icon: Mail, label: "Email", colour: "text-brand-plum bg-brand-plum/15" },
  sms: { icon: MessageSquare, label: "SMS", colour: "text-brand-plum bg-brand-plum/15" },
  telegram: { icon: Send, label: "Telegram", colour: "text-sky-600 bg-sky-100" },
  whatsapp: { icon: MessageSquare, label: "WhatsApp", colour: "text-emerald-600 bg-emerald-100" },
};

const PHASE_META: Record<
  RenewalNudge["triggerType"],
  { phase: "pre" | "expiry" | "post" | "lapsed"; label: string }
> = {
  "60_day_pre": { phase: "pre", label: "60 days before" },
  "30_day_pre": { phase: "pre", label: "30 days before" },
  "15_day_pre": { phase: "pre", label: "15 days before" },
  "7_day_pre": { phase: "pre", label: "7 days before" },
  "1_day_pre": { phase: "pre", label: "1 day before" },
  expiry_day: { phase: "expiry", label: "Expiry day" },
  "post_expiry_7": { phase: "post", label: "7 days after expiry" },
  "post_expiry_30": { phase: "post", label: "30 days after expiry" },
  lapsed_recovery: { phase: "lapsed", label: "60+ days after expiry" },
};

export default async function RenewalsPage({ params }: PageProps) {
  // Phase 1 segregation: marketplace transaction history hidden in production until V2.
  if (!(await isMarketplaceEnabled())) notFound();

  const { transactionId } = await params;

  const transaction = await findById<Transaction>(
    Tables.TRANSACTIONS,
    transactionId
  );
  if (!transaction) notFound();

  const bid = await findById<Bid>(Tables.BIDS, transaction.bidId);
  if (!bid) notFound();
  const rfq = await findById<RFQ>(Tables.RFQS, bid.rfqId);
  if (!rfq) notFound();
  const parsedPolicy = await findById<ParsedPolicy>(
    Tables.PARSED_POLICIES,
    rfq.parsedPolicyId
  );
  if (!parsedPolicy) notFound();

  const schedule = await findOne<RenewalSchedule>(
    Tables.RENEWAL_SCHEDULES,
    (s) => s.parsedPolicyId === parsedPolicy.id
  );
  if (!schedule) notFound();

  const sortedNudges = [...schedule.nudges].sort((a, b) =>
    a.scheduledDate.localeCompare(b.scheduledDate)
  );

  // Group by phase for visual separation
  const phaseGroups: Record<string, RenewalNudge[]> = {
    pre: [],
    expiry: [],
    post: [],
    lapsed: [],
  };
  for (const n of sortedNudges) {
    const phase = PHASE_META[n.triggerType].phase;
    phaseGroups[phase].push(n);
  }

  const policyExpiry = new Date(schedule.policyExpiryDate);

  return (
    <div className="min-h-screen bg-brand-offwhite">
      <header className="bg-white border-b border-brand-light-gray">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href={`/policy/${transaction.id}`}
            className="inline-flex items-center gap-1 text-sm text-brand-slate hover:text-brand-charcoal"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to policy
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-plum bg-brand-plum/15 rounded-full">
            <CalendarClock className="w-3.5 h-3.5" />
            Your Renewal Journey
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-charcoal">
            We&apos;ll keep you covered.
          </h1>
          <p className="text-brand-slate max-w-2xl mx-auto">
            Here&apos;s every reminder, nudge, and recovery touchpoint
            we&apos;ll send you over the next 12+ months — across email, SMS,
            and Telegram.{" "}
            <span className="font-semibold">No need to remember anything.</span>
          </p>
        </div>

        {/* Key dates banner */}
        <div className="grid md:grid-cols-3 gap-4">
          <KeyDate
            label="Policy starts"
            date={transaction.issuedAt!}
            highlight="emerald"
          />
          <KeyDate
            label="Policy expires"
            date={schedule.policyExpiryDate}
            highlight="amber"
          />
          <KeyDate
            label="Total nudges scheduled"
            value={`${schedule.nudges.length}`}
            highlight="blue"
          />
        </div>

        {/* Pitch beat: "Behind the scenes" admin reveal */}
        <div className="rounded-2xl border-2 border-dashed border-brand-plum/40 bg-brand-plum/10 p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-plum/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-brand-plum" />
            </div>
            <div className="text-sm text-brand-plum">
              <div className="font-semibold mb-1 flex items-center gap-2">
                The Data Flywheel
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-brand-plum/20 text-brand-plum rounded">
                  Pitch Reveal
                </span>
              </div>
              <p>
                Every parsed policy + every transacted customer becomes a{" "}
                <strong>contactable lead forever.</strong> Even if a customer
                buys elsewhere next year, our lapsed-recovery loop says
                &ldquo;congrats — share your new policy&rdquo; to re-enrich
                their data and re-engage them at the next renewal cycle. This
                is the network effect we&apos;re building.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <PhaseSection
          title="Pre-renewal nudges"
          subtitle="60 / 30 / 15 / 7 / 1 days before expiry"
          nudges={phaseGroups.pre}
          variant="pre"
        />

        <PhaseSection
          title="Expiry day"
          subtitle="Last call to renew"
          nudges={phaseGroups.expiry}
          variant="expiry"
        />

        <PhaseSection
          title="Post-expiry follow-up"
          subtitle="If no renewal yet"
          nudges={phaseGroups.post}
          variant="post"
        />

        <PhaseSection
          title="Lapsed-buyer recovery"
          subtitle="Even if they bought elsewhere — we re-engage"
          nudges={phaseGroups.lapsed}
          variant="lapsed"
          spotlight
        />

        {/* Footer */}
        <div className="bg-brand-offwhite rounded-xl p-4 text-xs text-brand-slate text-center">
          Renewal cadence is shown for the policy expiring on{" "}
          {formatDateShort(policyExpiry.toISOString())}. WhatsApp channel
          plugs in once Business API integration is live (post-MVP).
        </div>
      </main>
    </div>
  );
}

function KeyDate({
  label,
  date,
  value,
  highlight,
}: {
  label: string;
  date?: string;
  value?: string;
  highlight: "emerald" | "amber" | "blue";
}) {
  const colors = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-brand-charcoal/30 bg-brand-plum/10 text-brand-plum",
  }[highlight];
  return (
    <div className={`rounded-xl border-2 p-4 text-center ${colors}`}>
      <div className="text-[10px] uppercase tracking-wider font-bold mb-1">
        {label}
      </div>
      <div className="text-xl font-bold">
        {date ? formatDateShort(date) : value}
      </div>
    </div>
  );
}

function PhaseSection({
  title,
  subtitle,
  nudges,
  variant,
  spotlight = false,
}: {
  title: string;
  subtitle: string;
  nudges: RenewalNudge[];
  variant: "pre" | "expiry" | "post" | "lapsed";
  spotlight?: boolean;
}) {
  if (nudges.length === 0) return null;

  const headerColor = {
    pre: "bg-brand-charcoal",
    expiry: "bg-amber-600",
    post: "bg-brand-sage",
    lapsed: "bg-emerald-600",
  }[variant];

  return (
    <section
      className={`bg-white rounded-2xl border ${
        spotlight ? "border-emerald-300 shadow-lg" : "border-brand-light-gray"
      } overflow-hidden`}
    >
      <div className={`px-6 py-3 ${headerColor} text-white`}>
        <div className="font-bold uppercase tracking-wide text-sm">{title}</div>
        <div className="text-xs opacity-90">{subtitle}</div>
      </div>
      <div className="divide-y divide-brand-light-gray">
        {nudges.map((n) => (
          <NudgeRow key={n.id} nudge={n} />
        ))}
      </div>
    </section>
  );
}

function NudgeRow({ nudge }: { nudge: RenewalNudge }) {
  const channel = CHANNEL_META[nudge.channel];
  const phase = PHASE_META[nudge.triggerType];
  const Icon = channel.icon;
  return (
    <div className="px-6 py-4 flex gap-4">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${channel.colour}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-slate">
              {channel.label}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-brand-slate">
              {phase.label}
            </span>
          </div>
          <span className="text-xs font-mono text-brand-slate">
            {formatDateShort(nudge.scheduledDate)}
          </span>
        </div>
        <div className="font-semibold text-brand-charcoal text-sm mb-1">
          {nudge.subject}
        </div>
        <div className="text-sm text-brand-slate leading-snug">
          {nudge.bodyPreview}
        </div>
      </div>
    </div>
  );
}

void Sparkles; // reserved for future spotlight badge
