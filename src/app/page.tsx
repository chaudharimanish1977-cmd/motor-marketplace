import Link from "next/link";
import { ShieldCheck, Sparkles, ArrowRight, Eye } from "lucide-react";
import { TestimonialCarousel } from "@/components/testimonial-carousel";
import { RightOfferLogo } from "@/components/logo";

// Header (logo + theme toggle) is mounted globally from layout.tsx via
// <SiteHeader/>. The page just renders the hero + sections + footer.

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      {/* Soft brand-color radial blobs sitting behind everything — adds depth
       *  to the desktop layout where the centred hero would otherwise leave
       *  large empty bands either side. Light + dark-mode safe via tailwind
       *  utility opacities. Pointer-events:none so they never block clicks. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden"
      >
        <div className="absolute -top-32 -left-32 w-[42rem] h-[42rem] rounded-full bg-brand-deepblue/10 dark:bg-brand-deepblue/30 blur-3xl" />
        <div className="absolute -top-20 right-[-10%] w-[34rem] h-[34rem] rounded-full bg-brand-electricblue/10 dark:bg-brand-electricblue/25 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[20%] w-[36rem] h-[36rem] rounded-full bg-brand-orange/8 dark:bg-brand-orange/15 blur-3xl" />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center px-4 py-2 md:py-4">
        {/* HERO — fits in a single screen, no scroll needed to act */}
        <section className="max-w-3xl w-full text-center pt-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deepblue bg-blue-50 border border-blue-100 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            India&apos;s Independent Policy Reviewer · No Sales Calls
          </span>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-brand-charcoal leading-[1.05] mb-4">
            Understand your insurance{" "}
            <span className="bg-gradient-to-r from-brand-deepblue to-brand-electricblue bg-clip-text text-transparent">
              before it costs you.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-brand-charcoal font-semibold max-w-xl mx-auto leading-snug mb-3">
            Most people sell insurance.{" "}
            <span className="text-brand-orange">We help you decide.</span>
          </p>

          <p className="text-sm md:text-base text-brand-slate max-w-xl mx-auto leading-relaxed mb-7">
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

        {/* TESTIMONIAL CAROUSEL — auto-rotating, dot nav, hover to pause */}
        <TestimonialCarousel />

        {/* FOOTER — bookends the page: small wordmark on top, punchy tagline
         *  beneath, then a quiet legal/copyright line. Replaces the previous
         *  forgettable "RightOffer · Independent motor insurance reviews ·
         *  Made for India" string with the trust promise from the top pill. */}
        <footer className="mt-20 mb-6 flex flex-col items-center gap-3 text-center">
          <div className="w-[140px] opacity-75">
            <RightOfferLogo variant="wordmark" />
          </div>
          <p className="text-sm font-semibold text-brand-charcoal max-w-md">
            Independent. No sales calls. Just honest advice.
          </p>
          <p className="text-[11px] text-brand-slate/70">
            © 2026 RightOffer · hello@rightoffer.in · Made for India
          </p>
        </footer>
      </main>
    </>
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
