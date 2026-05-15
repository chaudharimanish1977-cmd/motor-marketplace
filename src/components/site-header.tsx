"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, FolderOpen } from "lucide-react";
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
 *
 * Top-right corner shows a "Sign in" / "My policies" link so customers
 * can always reach their portal. We don't read auth state here (this is
 * a client component); the portal page itself handles the redirect to
 * /me/login if there's no session — so the same link works for both
 * signed-in and signed-out users.
 */

const SKIP_PREFIXES = ["/pitch", "/logo", "/api"] as const;
const HIDE_PORTAL_LINK_ON = ["/me"] as const;

interface Props {
  signedIn?: boolean;
}

export function SiteHeader({ signedIn = false }: Props) {
  const pathname = usePathname() ?? "";
  if (SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  const hidePortalLink = HIDE_PORTAL_LINK_ON.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  return (
    <header className="relative z-20 w-full px-4 pt-5 md:pt-6 pb-2 print:hidden">
      <div className="relative flex items-center justify-center">
        <Link
          href="/"
          aria-label="RightOffer home"
          className="block w-[140px] md:w-[170px] hover:opacity-90 transition-opacity"
        >
          <RightOfferLogo variant="full-light" />
        </Link>
        {!hidePortalLink && (
          <Link
            href="/me"
            className="absolute right-0 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-slate hover:text-brand-charcoal px-3 py-1.5 rounded-xl border border-brand-light-gray bg-white/70 backdrop-blur-sm hover:bg-white transition-colors"
          >
            {signedIn ? (
              <>
                <FolderOpen className="w-3.5 h-3.5" />
                My policies
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5" />
                Sign in
              </>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
