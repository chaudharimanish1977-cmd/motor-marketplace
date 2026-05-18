"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Site-wide header — Reading Room edition.
 *
 * Renders the editorial wordmark (italic serif "r" + small-caps RightOffer
 * + sage "CAR" pill) and a discreet sign-in entry on every internal
 * surface. The home page mounts its own brand row (V7Brand in app/page.tsx)
 * with full nav, so we skip rendering here on "/" to avoid stacking.
 *
 * Skipped paths:
 *   "/"        — home page has its own V7Brand row
 *   /pitch     — investor pitch deck, owns its full-screen UI
 *   /logo      — brand-asset preview page, already shows logos
 *   /api/*     — server routes, no UI
 *
 * The portal-link is hidden on /me (where it'd be redundant — you're
 * already inside it).
 */

const SKIP_PREFIXES = ["/pitch", "/logo", "/api"] as const;
const SKIP_EXACT = ["/"] as const;
const HIDE_PORTAL_LINK_ON = ["/me"] as const;

interface Props {
  signedIn?: boolean;
}

export function SiteHeader({ signedIn = false }: Props) {
  const pathname = usePathname() ?? "";
  if (
    SKIP_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    )
  ) {
    return null;
  }
  if (SKIP_EXACT.some((p) => pathname === p)) {
    return null;
  }

  const hidePortalLink = HIDE_PORTAL_LINK_ON.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  return (
    <header className="relative z-20 w-full px-6 md:px-12 pt-5 pb-3 print:hidden">
      <div className="relative flex items-center justify-between gap-4">
        {/* Reading Room wordmark — italic serif r + small-caps RightOffer
         *  + sage CAR pill, all text, no SVG. Links to /. */}
        <Link
          href="/"
          aria-label="RightOffer home"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <span
            className="font-serif italic font-semibold text-xl leading-none text-brand-plum"
            aria-hidden
          >
            r
          </span>
          <span
            className="font-serif font-medium text-base leading-none text-brand-charcoal tracking-tight"
            style={{ fontVariant: "small-caps" }}
          >
            RightOffer
          </span>
          <span className="px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-[0.12em] bg-brand-sage text-brand-offwhite rounded-sm">
            CAR
          </span>
          <span className="sr-only">RightOffer Car</span>
        </Link>

        <div className="flex items-center gap-4 md:gap-5">
          <Link
            href="/about"
            className="hidden md:inline-flex items-center font-serif italic text-sm text-brand-slate hover:text-brand-charcoal transition-colors"
          >
            About
          </Link>
          {!hidePortalLink && (
            <Link
              href="/me"
              className="inline-flex items-center gap-1.5 font-serif italic text-sm text-brand-slate hover:text-brand-charcoal transition-colors"
            >
              {signedIn ? "My policies" : "Sign in"}
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
