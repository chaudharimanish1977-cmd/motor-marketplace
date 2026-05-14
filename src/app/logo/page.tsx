import { RightOfferLogo } from "@/components/logo";

export const metadata = {
  title: "Logo preview — RightOffer",
};

/**
 * Brand mark preview — 8 variants from the founder-supplied
 * "RightOffer Brand SVG Pack" PDF, rendered exactly as shipped.
 */
export default function LogoPreview() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-6xl mx-auto">
      {/* 1 — full logo on light background */}
      <Section title="1. FULL LOGO · LIGHT BACKGROUND">
        <div className="flex justify-center py-6">
          <div className="w-[640px] max-w-full">
            <RightOfferLogo variant="full-light" />
          </div>
        </div>
      </Section>

      {/* 2 — full logo on deep blue background */}
      <Section title="2. FULL LOGO · DEEP BLUE BACKGROUND">
        <div className="flex justify-center py-6">
          <div className="w-[700px] max-w-full">
            <RightOfferLogo variant="full-dark" />
          </div>
        </div>
      </Section>

      {/* 3 — three sizes side by side */}
      <Section title="3. THREE SIZES · LIGHT BACKGROUND (24PX, 40PX, 80PX)">
        <div className="flex flex-wrap items-end justify-around gap-10 py-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-[180px]">
              <RightOfferLogo variant="nav-24" />
            </div>
            <div className="text-xs text-brand-slate">24px · nav</div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-[300px]">
              <RightOfferLogo variant="default-40" />
            </div>
            <div className="text-xs text-brand-slate">40px · default</div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-[520px] max-w-full">
              <RightOfferLogo variant="hero-80" />
            </div>
            <div className="text-xs text-brand-slate">80px · hero</div>
          </div>
        </div>
      </Section>

      {/* 4 — wordmark only, with .in */}
      <Section title="4. WORDMARK ONLY · WITH .IN">
        <div className="flex justify-center py-6">
          <div className="w-[520px] max-w-full">
            <RightOfferLogo variant="wordmark" />
          </div>
        </div>
      </Section>

      {/* 5 — wordmark only, without .in */}
      <Section title="5. WORDMARK ONLY · WITHOUT .IN">
        <div className="flex justify-center py-6">
          <div className="w-[420px] max-w-full">
            <RightOfferLogo variant="wordmark-plain" />
          </div>
        </div>
      </Section>

      {/* 6 — header preview with sample nav */}
      <Section title="6. HEADER PREVIEW · INLINE IN ACTUAL SITE HEADER">
        <div className="py-6">
          <RightOfferLogo variant="header" />
        </div>
      </Section>

      <footer className="text-xs text-brand-slate text-center py-8 border-t border-brand-light-gray mt-6">
        Brand colours: #0A2463 (deep blue) · #FF6B35 (orange). Arial italic 700
        wordmark · all 8 variants reproduced from the founder-supplied SVG pack.
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
