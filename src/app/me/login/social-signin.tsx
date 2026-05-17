/**
 * Social sign-in buttons — Google + Apple with official branding.
 *
 * Phase 6.2.1 lock-in: we use the providers' published button assets
 * (multicoloured Google G, monochrome Apple logo, San Francisco /
 * Roboto typography) so the buttons read as familiar one-tap sign-in
 * everywhere. No editorial restyling here — being legible matters
 * more than being on-brand on this single button.
 *
 * Copy is "Continue with X" per Google's + Apple's published branding
 * guidance (both explicitly allow "Continue" as a verb variant).
 *
 * When the customer taps, NextAuth's `signIn()` redirects to the
 * provider, runs the OAuth dance, then returns to /api/auth/callback/X.
 * Our signIn callback in lib/auth-config.ts writes the ro-session
 * cookie and the customer lands on /me.
 */
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

interface SocialSignInProps {
  /** When false, the Apple button is hidden — used while we wait on
   *  the Apple Developer Program enrolment. */
  showApple: boolean;
}

export function SocialSignIn({ showApple }: SocialSignInProps) {
  const [pending, setPending] = useState<"google" | "apple" | null>(null);

  const go = (provider: "google" | "apple") => {
    setPending(provider);
    // signIn() handles the redirect — we don't await here. If it ever
    // bounces back to /me/login?error=... we surface the error notice
    // server-side from the page component.
    void signIn(provider, { callbackUrl: "/me" });
  };

  return (
    <div className="space-y-3">
      {/* Google */}
      <button
        type="button"
        onClick={() => go("google")}
        disabled={pending !== null}
        aria-label="Continue with Google"
        className="w-full inline-flex items-center justify-center gap-3 h-11 px-4 rounded-md bg-white border border-[#dadce0] hover:bg-[#f8f9fa] disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium text-[14px] tracking-[0.005em] text-[#3c4043] shadow-[0_1px_2px_rgba(60,64,67,0.06)] font-sans"
      >
        <GoogleGlyph />
        <span>
          {pending === "google" ? "Opening Google…" : "Continue with Google"}
        </span>
      </button>

      {/* Apple — only when env is wired */}
      {showApple && (
        <button
          type="button"
          onClick={() => go("apple")}
          disabled={pending !== null}
          aria-label="Continue with Apple"
          className="w-full inline-flex items-center justify-center gap-2.5 h-11 px-4 rounded-md bg-black hover:bg-[#1a1a1a] disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium text-[14px] tracking-[0.005em] text-white font-sans"
        >
          <AppleGlyph />
          <span>
            {pending === "apple" ? "Opening Apple…" : "Continue with Apple"}
          </span>
        </button>
      )}
    </div>
  );
}

/* ─── Provider glyphs (official assets, inlined as SVG) ─────────────── */

/**
 * Google "G" — the official multicoloured logo per Google's brand
 * guidelines for sign-in buttons. Inlined SVG so we don't ship an
 * additional network request just for one icon.
 */
function GoogleGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.874 2.6836-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.8595-3.0477.8595-2.3445 0-4.3286-1.5832-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.9641 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.9641 10.71z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6714 5.1627 6.6555 3.5795 9 3.5795z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * Apple logo — official monochrome glyph per Apple's HIG sign-in
 * button guidelines (white on black, San Francisco–style label).
 */
function AppleGlyph() {
  return (
    <svg
      width="16"
      height="18"
      viewBox="0 0 16 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      fill="currentColor"
    >
      <path d="M13.394 9.519c.022 2.418 2.122 3.222 2.146 3.232-.018.058-.336 1.146-1.108 2.27-.668.972-1.36 1.94-2.452 1.96-1.073.02-1.418-.636-2.642-.636-1.225 0-1.608.616-2.624.656-1.054.04-1.857-1.05-2.53-2.018C2.81 12.99 1.762 9.295 3.171 6.79c.7-1.246 1.95-2.034 3.31-2.054 1.034-.02 2.012.696 2.644.696.632 0 1.819-.86 3.067-.734.522.022 1.991.21 2.935 1.586-.076.046-1.752 1.022-1.733 3.025zM11.18 3.42c.557-.674.932-1.612.83-2.546-.802.032-1.772.534-2.348 1.208-.517.598-.97 1.553-.848 2.47.893.07 1.81-.454 2.366-1.132z" />
    </svg>
  );
}
