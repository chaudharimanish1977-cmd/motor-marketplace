import Link from "next/link";
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  HelpCircle,
} from "lucide-react";
import { RenewalPreview } from "@/components/renewal-preview";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Eyebrow */}
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deepblue bg-blue-50 border border-blue-100 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            RightOffer AI Powered Policy Review
          </span>
        </div>

        {/* Hero */}
        <div className="space-y-5">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-brand-charcoal leading-[1.05]">
            Understand your insurance
            <br />
            <span className="bg-gradient-to-r from-brand-deepblue to-brand-electricblue bg-clip-text text-transparent">
              before it costs you.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-brand-slate max-w-2xl mx-auto leading-relaxed">
            Most car owners don&apos;t know what&apos;s missing in their
            policy until a claim goes wrong. Upload your policy and get a
            clear, independent review of what&apos;s strong, what&apos;s
            missing, and what to look for at renewal —{" "}
            <span className="font-semibold text-brand-deepblue">
              in under 2 minutes
            </span>
            .
          </p>
        </div>

        {/* Primary CTA */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center px-9 py-4 bg-brand-orange hover:brightness-110 text-white font-semibold text-lg rounded-2xl shadow-glow transition-all hover:scale-[1.03]"
          >
            Get My Free Policy Review
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <p className="text-sm text-brand-slate">
            Free • No spam • Your policy data stays private
          </p>
        </div>

        {/* Value props strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 max-w-3xl mx-auto">
          <ValueProp
            icon={Eye}
            title="See what's missing"
            description="Know the gaps in your current policy before they turn into out-of-pocket surprises at claim time."
          />
          <ValueProp
            icon={ShieldCheck}
            title="Avoid claim shocks"
            description="Get clarity on what your policy actually covers, in plain English — not insurer-speak."
          />
          <ValueProp
            icon={Sparkles}
            title="RightOffer AI Powered"
            description="Under-2-minute analysis personalised to your vehicle, your city, and your driving profile."
          />
        </div>
      </div>

      {/* Why customers love us — placeholder testimonials, expanded in Batch B */}
      <Testimonials />

      {/* Renewal flywheel teaser */}
      <RenewalPreview />

      {/* Soft FAQ / trust block */}
      <section className="mt-20 max-w-3xl w-full">
        <div className="rounded-3xl bg-gradient-to-br from-brand-offwhite to-white border border-brand-light-gray p-7 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-brand-deepblue" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-brand-charcoal mb-2">
                Why does this matter?
              </h3>
              <p className="text-sm text-brand-slate leading-relaxed">
                Motor insurance is one of those decisions you make in 5
                minutes and live with for a year. Most policies have hidden
                gaps — like missing engine cover, depreciation deductions, or
                low IDV — that quietly cost you ₹20,000 to ₹2,00,000 when a
                claim happens. A 2-minute review now can save you a painful
                surprise later.
              </p>
            </div>
          </div>
        </div>
      </section>

      <p className="text-xs text-brand-slate/70 pt-16 text-center max-w-md">
        RightOffer · Independent motor insurance reviews · Made for India
      </p>
    </main>
  );
}

function ValueProp({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-brand-deepblue to-brand-electricblue flex items-center justify-center shadow-soft">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-brand-charcoal">{title}</h3>
      <p className="text-sm text-brand-slate leading-relaxed">{description}</p>
    </div>
  );
}

// ============================================================================
// Testimonials — placeholder; full content + animation comes in Batch B (#4)
// ============================================================================

function Testimonials() {
  const stories = [
    {
      quote:
        "RightOffer flagged that my engine protector was missing. Two months later when my car got water-logged in the monsoon, the entire ₹85,000 repair was covered by the insurer. Without their advice I'd have paid it out of pocket.",
      author: "Nikhil R.",
      city: "Mumbai · Hatchback owner",
    },
    {
      quote:
        "I was about to auto-renew with my old insurer. The review showed my IDV was undervalued by ₹2.4 lakh. Switched to a properly-priced policy at the same premium. Right advice by the RightOffer team.",
      author: "Priya S.",
      city: "Bengaluru · Sedan owner",
    },
    {
      quote:
        "Saved me ₹35,000 out of pocket when my claim happened — the entire amount was borne by the insurer because of an add-on RightOffer recommended. Had I continued with my old policy, that would have been my loss.",
      author: "Arjun M.",
      city: "Pune · SUV owner",
    },
  ];
  return (
    <section className="mt-24 max-w-5xl w-full">
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-success bg-emerald-50 border border-emerald-100 rounded-full mb-4">
          <ShieldCheck className="w-3 h-3" />
          Why customers trust us
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-brand-charcoal tracking-tight">
          Peace of mind, before the claim happens
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {stories.map((s) => (
          <figure
            key={s.author}
            className="rounded-2xl bg-white border border-brand-light-gray p-6 shadow-soft flex flex-col"
          >
            <blockquote className="text-sm text-brand-charcoal leading-relaxed flex-1">
              &ldquo;{s.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-4 pt-4 border-t border-brand-light-gray">
              <div className="font-semibold text-brand-charcoal text-sm">
                {s.author}
              </div>
              <div className="text-xs text-brand-slate">{s.city}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
