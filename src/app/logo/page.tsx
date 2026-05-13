import { RightOfferLogo } from "@/components/logo";

export const metadata = {
  title: "Logo preview — RightOffer",
};

/**
 * Internal preview page for the brand mark. Shows the logo at multiple
 * sizes and against light / dark / brand backgrounds so we can sanity-check
 * before global rollout.
 */
export default function LogoPreview() {
  return (
    <main className="min-h-screen px-4 py-10 max-w-5xl mx-auto space-y-10">
      <header>
        <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-slate mb-2">
          Brand mark · Preview
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-charcoal">
          RightOffer logo
        </h1>
        <p className="text-sm text-brand-slate mt-2 max-w-xl">
          Built as a single React/SVG component. Brand colours locked to
          <code className="mx-1 px-1.5 py-0.5 rounded bg-brand-offwhite text-brand-charcoal">
            #0A2463
          </code>
          (deep blue) and
          <code className="mx-1 px-1.5 py-0.5 rounded bg-brand-offwhite text-brand-charcoal">
            #FF6B35
          </code>
          (orange). Wordmark uses live Inter typography so it stays crisp at
          every size.
        </p>
      </header>

      {/* Full logo — on light background */}
      <section className="rounded-2xl border border-brand-light-gray bg-white p-10 flex flex-col items-center gap-4">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-slate">
          Full logo · light background
        </div>
        <RightOfferLogo className="text-[64px]" />
      </section>

      {/* Full logo — on brand deep blue */}
      <section className="rounded-2xl bg-[#0A2463] p-10 flex flex-col items-center gap-4">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/50">
          Full logo · deep blue background
        </div>
        <div className="bg-white rounded-xl px-8 py-6">
          <RightOfferLogo className="text-[64px]" />
        </div>
      </section>

      {/* Three size variants on a single row */}
      <section className="rounded-2xl border border-brand-light-gray bg-white p-10">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-slate mb-6 text-center">
          Sizes
        </div>
        <div className="flex flex-wrap items-end justify-around gap-8">
          <div className="flex flex-col items-center gap-3">
            <RightOfferLogo className="text-[24px]" />
            <span className="text-[10px] text-brand-slate">24px · header / nav</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <RightOfferLogo className="text-[40px]" />
            <span className="text-[10px] text-brand-slate">40px · default</span>
          </div>
          <div className="flex flex-col items-center gap-3">
            <RightOfferLogo className="text-[80px]" />
            <span className="text-[10px] text-brand-slate">80px · hero</span>
          </div>
        </div>
      </section>

      {/* Wordmark-only (no car) — useful in cramped headers */}
      <section className="rounded-2xl border border-brand-light-gray bg-white p-10 flex flex-col items-center gap-4">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-slate">
          Wordmark only · no car silhouette
        </div>
        <RightOfferLogo wordmarkOnly className="text-[64px]" />
      </section>

      {/* Wordmark without .in — for super tight contexts */}
      <section className="rounded-2xl border border-brand-light-gray bg-white p-10 flex flex-col items-center gap-4">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-slate">
          Wordmark only · without .in TLD
        </div>
        <RightOfferLogo wordmarkOnly hideTld className="text-[64px]" />
      </section>

      {/* Inline in a header-style row to test how it'll look on the actual site */}
      <section className="rounded-2xl bg-white border border-brand-light-gray p-6">
        <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-brand-slate mb-4">
          Header preview
        </div>
        <div className="flex items-center justify-between border-y border-brand-light-gray py-4">
          <RightOfferLogo className="text-[28px]" />
          <div className="flex items-center gap-4 text-sm text-brand-slate">
            <span>Get review</span>
            <span>FAQs</span>
            <span className="font-semibold text-brand-charcoal">Sign in</span>
          </div>
        </div>
      </section>

      <footer className="text-xs text-brand-slate text-center pb-10">
        Preview only — not yet rolled out site-wide. Confirm to ship.
      </footer>
    </main>
  );
}
