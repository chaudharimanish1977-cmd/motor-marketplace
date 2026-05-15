"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RightOfferLogo } from "@/components/logo";

/**
 * Site-wide header — renders the centred RightOffer logo on every public
 * page so the brand builds recognition across the customer journey. The
 * theme toggle (from `<ThemeToggle/>`) lives fixed top-right; the logo
 * sits centered in the page flow so the two don't visually compete.
 *
 * Skipped paths:
 *   /pitch     — investor pitch deck, owns its full-screen UI
 *   /investor  — investor demo entry, has its own banner
 *   /logo      — brand-asset preview page, already shows logos
 *   /api/*     — server routes, no UI
 *
 * Falls back to a `null` render on those paths so layout.tsx can mount
 * this unconditionally and still get the right per-page behaviour.
 */

const SKIP_PREFIXES = ["/pitch", "/logo", "/api"] as const;

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  if (SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  return (
    <header className="relative z-20 w-full flex items-center justify-center px-4 pt-5 md:pt-6 pb-2 print:hidden">
      <Link
        href="/"
        aria-label="RightOffer home"
        className="block w-[140px] md:w-[170px] hover:opacity-90 transition-opacity"
      >
        <RightOfferLogo variant="full-light" />
      </Link>
    </header>
  );
}
