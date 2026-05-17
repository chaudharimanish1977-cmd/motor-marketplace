import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";
import { SocialSignIn } from "./social-signin";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sign in — RightOffer",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ expired?: string; error?: string }>;
}

/**
 * Sign-in landing — Phase 6.2.1 editorial reframe.
 *
 * Bounces signed-in visitors straight to /me. Otherwise renders the
 * Reading Room style sign-in: Garage masthead, serif headline, the
 * official Google + Apple buttons (when configured), magic-link
 * email fallback, "new here?" link to /upload.
 *
 * Visual order, top to bottom:
 *
 *     · THE GARAGE · YOUR REVIEWS ·
 *     Sign in to pick up where you left off.
 *     [ G  Continue with Google ]
 *     [    Continue with Apple  ]
 *     ──── or with email ────
 *     [ email field + magic-link button ]
 *     · New here? Start with a 2-min review →
 *
 * Apple button is conditionally rendered based on env vars so the page
 * doesn't show a non-functional button while we wait on the Developer
 * Program enrolment.
 */
export default async function LoginPage({ searchParams }: PageProps) {
  const email = await getSession();
  if (email) redirect("/me");

  const { expired, error } = await searchParams;
  const showExpiredNotice = expired === "1";
  // NextAuth surfaces OAuth failures via ?error=... on the configured
  // sign-in page. We surface a single friendly line for any of them.
  const showAuthError = !!error;

  // Are the Apple env vars present? Drives whether the Apple button
  // renders. Doesn't matter on the client — this is a server component.
  const appleConfigured = !!(
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  );

  return (
    <main className="min-h-screen bg-brand-offwhite">
      <div className="max-w-md mx-auto px-5 md:px-6 pt-12 md:pt-20 pb-12">
        {/* Masthead */}
        <div className="text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
          · The Garage · Your Reviews ·
        </div>

        {/* Headline */}
        <h1 className="mt-5 md:mt-7 text-center font-serif font-medium text-[34px] md:text-[44px] tracking-[-0.02em] leading-[1.08] text-brand-charcoal m-0">
          Sign in to pick up{" "}
          <span className="italic text-brand-plum">
            where you left off.
          </span>
        </h1>

        {/* Optional notices */}
        {showExpiredNotice && (
          <p className="mt-4 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-plum font-bold">
            · Your sign-in link expired · request a fresh one below ·
          </p>
        )}
        {showAuthError && (
          <p className="mt-4 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-alert font-bold">
            · Sign-in didn&apos;t complete · please try again ·
          </p>
        )}

        {/* Social sign-in buttons (client component — owns the
         *  signIn() call from next-auth/react). */}
        <div className="mt-9 md:mt-11">
          <SocialSignIn showApple={appleConfigured} />
        </div>

        {/* Separator */}
        <div className="mt-7 md:mt-8 flex items-center gap-3">
          <div className="flex-1 border-t border-brand-charcoal/15" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-slate">
            or with email
          </span>
          <div className="flex-1 border-t border-brand-charcoal/15" />
        </div>

        {/* Email magic-link form — kept exactly as before, just placed
         *  inside the editorial frame. */}
        <div className="mt-6 md:mt-7">
          <LoginForm />
        </div>

        {/* New-customer pointer */}
        <div className="mt-9 md:mt-11 text-center">
          <a
            href="/upload"
            className="inline-flex items-center gap-1.5 font-serif italic text-[14px] text-brand-slate hover:text-brand-charcoal transition-colors"
          >
            · New here? Start with a 2-min review{" "}
            <span aria-hidden>→</span> ·
          </a>
        </div>
      </div>
    </main>
  );
}
