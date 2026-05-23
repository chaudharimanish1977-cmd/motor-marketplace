/**
 * MarketplaceCta — the entry point from /report/[id] into the
 * marketplace bid flow (/bid/[id]).
 *
 * Conditional rendering — appears ONLY when the marketplace is
 * enabled for the current request:
 *   · demo.rightoffer.in/report/<id>  → CTA visible (host-based gate)
 *   · rightoffer.in/report/<id>       → CTA hidden (Phase 1 promise)
 *   · local dev / preview deploys     → CTA visible (default-on env)
 *   · printMode=true (PDF render)     → CTA hidden (PDFs ship to all
 *                                       customers; the PDF must not
 *                                       promise what the URL doesn't
 *                                       deliver to that recipient)
 *
 * Same gate as /bid/[id] itself — both call isMarketplaceEnabled, so
 * the CTA can never lead to a 404, and vice versa. When V2 ships and
 * marketplace flips ON in production, the CTA appears on rightoffer.in
 * with zero code change.
 *
 * Editorial styling matches the rest of the report — mono kicker +
 * serif italic body + plum CTA button.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isMarketplaceEnabled } from "@/lib/feature-flags";

interface Props {
  parsedPolicyId: string;
  /** When true (PDF render) the CTA is suppressed regardless of
   *  marketplace flag — PDFs are shared / archived / forwarded and
   *  shouldn't promise a flow the recipient may not have access to. */
  printMode?: boolean;
}

export async function MarketplaceCta({ parsedPolicyId, printMode }: Props) {
  if (printMode) return null;
  const enabled = await isMarketplaceEnabled();
  if (!enabled) return null;

  return (
    <section className="mb-12 pl-5 border-l-2 border-brand-plum">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-plum font-bold mb-2">
        &middot; Want a real quote on this bundle? &middot;
      </div>
      <p className="font-serif text-[15px] md:text-[16px] leading-[1.55] text-brand-charcoal max-w-xl m-0 mb-5">
        We&rsquo;ll RFQ your recommended cover to insurers on our panel and
        bring back ranked offers in under a minute. No commitment &mdash;
        just see what&rsquo;s available.
      </p>
      <Link
        href={`/bid/${parsedPolicyId}`}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-plum text-brand-offwhite hover:brightness-110 font-serif font-semibold text-[15px] rounded-lg transition-all"
      >
        Get curated offers
        <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
      </Link>
    </section>
  );
}
