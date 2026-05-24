/**
 * Soft brand-color radial blobs sitting behind page content.
 *
 * Adds depth to wide desktop layouts where a centred max-w-3xl hero
 * otherwise leaves large empty bands either side. Three blobs in the
 * brand palette (deep blue / electric blue / orange) at low opacity,
 * blurred so they read as ambient colour wash, not solid shapes.
 *
 * Fixed-position + z-0 + pointer-events:none so they never interfere
 * with scrolling, clicks, or page content. Hidden in print.
 *
 * Used by the marketing / public surfaces: home page, demo,
 * and similar pages that want the same ambient brand feel.
 */
export function BrandBlobs() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden print:hidden"
    >
      <div className="absolute -top-32 -left-32 w-[42rem] h-[42rem] rounded-full bg-brand-navy/10 dark:bg-brand-navy/30 blur-3xl" />
      <div className="absolute -top-20 right-[-10%] w-[34rem] h-[34rem] rounded-full bg-brand-navy/10 dark:bg-brand-navy/25 blur-3xl" />
      <div className="absolute bottom-[-15%] left-[20%] w-[36rem] h-[36rem] rounded-full bg-brand-olive/8 dark:bg-brand-olive/15 blur-3xl" />
    </div>
  );
}
