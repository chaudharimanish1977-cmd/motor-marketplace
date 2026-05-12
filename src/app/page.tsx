import Link from "next/link";
import { ShieldCheck, Sparkles, ArrowRight, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10">
      {/* HERO — fits in a single screen, no scroll needed to act */}
      <section className="max-w-3xl w-full text-center pt-6">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deepblue bg-blue-50 border border-blue-100 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          RightOffer · AI Powered Policy Review
        </span>

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-brand-charcoal leading-[1.05] mb-4">
          Understand your insurance{" "}
          <span className="bg-gradient-to-r from-brand-deepblue to-brand-electricblue bg-clip-text text-transparent">
            before it costs you.
          </span>
        </h1>

        <p className="text-base md:text-lg text-brand-slate max-w-xl mx-auto leading-relaxed mb-7">
          Upload your policy. Get a clear, independent review of what&apos;s
          missing — in{" "}
          <span className="font-semibold text-brand-deepblue">
            under 2 minutes
          </span>
          .
        </p>

        <div className="flex flex-col items-center gap-2.5">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center px-9 py-4 bg-brand-orange hover:brightness-110 text-white font-semibold text-lg rounded-2xl shadow-glow transition-all hover:scale-[1.03]"
          >
            Get my free policy review
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <p className="text-xs text-brand-slate">
            Free · No spam · Independent advice
          </p>
        </div>
      </section>

      {/* TRUST STRIP — one tight row, three brief promises */}
      <section className="max-w-4xl w-full mt-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4">
          <Promise
            icon={Eye}
            title="See what&apos;s missing"
            text="Know your gaps before claim time."
          />
          <Promise
            icon={ShieldCheck}
            title="Avoid claim shocks"
            text="Plain-English clarity on your cover."
          />
          <Promise
            icon={Sparkles}
            title="2-minute AI review"
            text="Personalised to your vehicle &amp; city."
          />
        </div>
      </section>

      {/* TESTIMONIAL — single hero quote, no card grid */}
      <section className="max-w-3xl w-full mt-16">
        <figure className="rounded-3xl bg-gradient-to-br from-white to-brand-offwhite border border-brand-light-gray shadow-soft p-7 md:p-9 text-center">
          <div className="text-3xl text-brand-deepblue/30 leading-none mb-2">
            &ldquo;
          </div>
          <blockquote className="text-base md:text-lg text-brand-charcoal leading-relaxed font-medium">
            Saved me ₹35,000 out of pocket when my claim happened — entirely
            borne by the insurer because of an add-on RightOffer recommended.
            Had I continued with my old policy, that would have been my loss.
          </blockquote>
          <figcaption className="mt-4 text-sm">
            <span className="font-semibold text-brand-charcoal">Arjun M.</span>
            <span className="text-brand-slate"> · Pune · SUV owner</span>
          </figcaption>
        </figure>
      </section>

      <p className="text-xs text-brand-slate/70 mt-16 mb-2 text-center">
        RightOffer · Independent motor insurance reviews · Made for India
      </p>
    </main>
  );
}

function Promise({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 text-left">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-deepblue to-brand-electricblue flex items-center justify-center shadow-soft shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div
          className="font-semibold text-brand-charcoal text-sm"
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <div
          className="text-xs text-brand-slate leading-snug"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      </div>
    </div>
  );
}
