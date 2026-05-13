import { RightOfferLogo } from "@/components/logo";
import { Heart } from "lucide-react";

export const metadata = {
  title: "Logo preview — RightOffer",
};

/**
 * Brand mark preview — 6 numbered variants matching the founder-approved
 * reference design. Layout mirrors the source screenshot exactly.
 */
export default function LogoPreview() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-6xl mx-auto">
      {/* 1 — full logo on light background */}
      <Section title="1. FULL LOGO · LIGHT BACKGROUND">
        <div className="flex justify-center py-6">
          <RightOfferLogo className="text-[80px]" />
        </div>
      </Section>

      {/* 2 — full logo on deep blue background */}
      <Section title="2. FULL LOGO · DEEP BLUE BACKGROUND">
        <div className="rounded-2xl bg-[#0A2463] flex justify-center py-12">
          <RightOfferLogo onDark className="text-[80px]" />
        </div>
      </Section>

      {/* 3 — three sizes side by side */}
      <Section title="3. THREE SIZES · LIGHT BACKGROUND (24PX, 40PX, 80PX)">
        <div className="flex flex-wrap items-end justify-around gap-10 py-6">
          <div className="flex flex-col items-center gap-3">
            <RightOfferLogo className="text-[24px]" />
            <div className="text-xs text-brand-slate">24px</div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <RightOfferLogo className="text-[40px]" />
            <div className="text-xs text-brand-slate">40px</div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <RightOfferLogo className="text-[80px]" />
            <div className="text-xs text-brand-slate">80px</div>
          </div>
        </div>
      </Section>

      {/* 4 — wordmark only, no car */}
      <Section title="4. WORDMARK ONLY · NO CAR SILHOUETTE">
        <div className="flex justify-center py-6">
          <RightOfferLogo wordmarkOnly className="text-[80px]" />
        </div>
      </Section>

      {/* 5 — wordmark only, no .in */}
      <Section title="5. WORDMARK ONLY · WITHOUT .IN">
        <div className="flex justify-center py-6">
          <RightOfferLogo wordmarkOnly hideTld className="text-[80px]" />
        </div>
      </Section>

      {/* 6 — header preview with sample nav */}
      <Section title="6. HEADER PREVIEW · INLINE IN ACTUAL SITE HEADER">
        <div className="border-2 border-brand-light-gray rounded-2xl bg-white px-6 py-5 flex items-center gap-10 flex-wrap">
          <RightOfferLogo className="text-[28px] shrink-0" />
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-brand-charcoal flex-1">
            <span>Buy Cars</span>
            <span>Sell Cars</span>
            <span>Compare</span>
            <span>Deals</span>
            <span>Loan</span>
            <span>Insurance</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              className="w-9 h-9 rounded-full border border-brand-light-gray flex items-center justify-center text-brand-slate hover:text-brand-orange hover:border-brand-orange transition-colors"
              aria-label="Saved"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="px-5 py-2 rounded-lg bg-[#0A2463] text-white text-sm font-semibold"
            >
              Login
            </button>
          </div>
        </div>
      </Section>

      <footer className="text-xs text-brand-slate text-center py-8 border-t border-brand-light-gray mt-6">
        Brand colours: #0A2463 (deep blue) · #FF6B35 (orange). Inter Italic
        wordmark. Single React component — drop-in anywhere.
      </footer>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-brand-light-gray py-6">
      <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-charcoal mb-3">
        {title}
      </div>
      {children}
    </section>
  );
}
