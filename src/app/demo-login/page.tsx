/**
 * /demo-login — password gate for demo.rightoffer.in + rightoffer.in/investor.
 *
 * Tiny editorial form. Anyone hitting a gated path without the
 * `ro-demo-pass` cookie lands here via middleware redirect with a
 * `?next=<path>` query param. Submits to /api/demo-auth (POST) which
 * sets the cookie + redirects to `next`.
 *
 * Wrong password → /demo-login?next=...&error=1. Right password →
 * the gated path, with the cookie now sticky for 30 days.
 */

import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Demo access — RightOffer",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function DemoLoginPage({ searchParams }: PageProps) {
  const { next, error } = await searchParams;
  const nextSafe = sanitizeNext(next);
  // If they're already in (e.g. they typed /demo-login directly while
  // holding a valid cookie), kick them straight to next. Done via
  // middleware before this page ever renders, but covers stale links.
  if (!error && !next) {
    // No referrer / no error context — bounce home so the URL doesn't
    // sit in browser history.
    redirect("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-brand-offwhite">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
            · RightOffer · Demo access ·
          </div>
          <h1 className="font-serif font-medium text-3xl md:text-4xl leading-[1.1] tracking-[-0.02em] text-brand-charcoal m-0">
            One <span className="italic text-brand-plum">password</span>{" "}
            stands between you and the demo.
          </h1>
          <p className="mt-3 font-serif italic text-[14px] text-brand-slate leading-[1.55]">
            The demo carries product walkthroughs and live numbers we
            keep off the public site. Enter the shared password to
            continue.
          </p>
        </div>

        <form
          action="/api/demo-auth"
          method="post"
          className="space-y-4"
          autoComplete="off"
        >
          <input type="hidden" name="next" value={nextSafe} />
          <label className="block">
            <span className="block font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate font-bold mb-2">
              · Password ·
            </span>
            <input
              type="password"
              name="password"
              required
              autoFocus
              className="w-full px-4 py-3 border-2 border-brand-light-gray dark:border-slate-600 rounded-lg font-mono text-[15px] tracking-wide focus:outline-none focus:border-brand-plum"
              placeholder="·· ·· ·· ··"
            />
          </label>
          {error && (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-brand-alert font-bold">
              · Wrong password. Try again. ·
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-brand-plum hover:brightness-110 text-white font-serif italic font-medium text-[15px] shadow-glow transition-all"
          >
            Enter the demo →
          </button>
        </form>

        <p className="mt-8 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate">
          ·{" "}
          <Link
            href="https://rightoffer.in"
            className="text-brand-plum hover:underline"
          >
            Public site →
          </Link>{" "}
          ·
        </p>
      </div>
    </main>
  );
}

/** Only accept same-origin relative paths starting with "/". Anything
 *  else gets coerced to "/" so an attacker can't redirect-bomb through
 *  the next param. */
function sanitizeNext(raw: string | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/"; // protocol-relative URL guard
  return raw;
}
