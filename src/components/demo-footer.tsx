/**
 * DemoFooter — global nav footer mounted on every demo subdomain page.
 *
 * Renders only when isMarketplaceEnabled() returns true (i.e. the
 * request is hitting demo.rightoffer.in, a Vercel preview build, or
 * local dev). Returns null on production rightoffer.in so the public
 * site doesn't pick up demo-only links.
 *
 * The links match the cluster shown beneath the /investor primary
 * CTA — but mounted globally so investors can navigate Demo ↔
 * Customer view ↔ Engineer view ↔ Dashboard from any page without
 * routing back through /investor first.
 *
 * Visual style: small editorial hairline footer with mono links,
 * sits at the bottom of every demo page. Print-hidden so it never
 * lands in PDF renders.
 */

import Link from "next/link";
import { isMarketplaceEnabled } from "@/lib/feature-flags";

const LINKS: Array<{ href: string; label: string }> = [
  { href: "/investor", label: "Demo home" },
  { href: "/upload?demo=1", label: "Upload a policy" },
  { href: "/how-it-works", label: "Customer view" },
  { href: "/how-it-works/engineer", label: "Engineer view" },
  { href: "/admin/dashboard", label: "Live dashboard" },
];

export async function DemoFooter() {
  if (!(await isMarketplaceEnabled())) return null;

  return (
    <footer
      role="contentinfo"
      className="relative z-10 mt-16 border-t border-brand-light-gray dark:border-slate-700 bg-brand-offwhite print:hidden"
    >
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-6 md:py-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
            · RightOffer demo ·
          </div>
          <nav className="flex items-center gap-x-5 gap-y-2 flex-wrap">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-[10.5px] uppercase tracking-[0.14em] font-bold text-brand-plum hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-4 font-serif italic text-[12px] text-brand-slate leading-[1.55] max-w-2xl">
          The live demo of the audit-only product (Phase 1) plus the
          marketplace surfaces that ship with V2. The public site at{" "}
          <Link
            href="https://rightoffer.in"
            className="text-brand-plum hover:underline not-italic"
          >
            rightoffer.in
          </Link>{" "}
          serves the audit-only flow without the marketplace.
        </p>
      </div>
    </footer>
  );
}
