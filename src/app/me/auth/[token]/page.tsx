import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { verifyToken } from "@/lib/email-token";
import { setSession } from "@/lib/session";
import { BrandBlobs } from "@/components/brand-blobs";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Signing you in — RightOffer",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

/**
 * Magic-link consumer. Verifies the signed token, sets the session
 * cookie, and bounces the user into /me.
 *
 * If the token is invalid (signature mismatch, expired, wrong type),
 * we render an "expired link" card with a button to request a fresh
 * one — never silently fail, never redirect to login with no context.
 */
export default async function MagicLinkConsumer({ params }: PageProps) {
  const { token } = await params;
  const payload = verifyToken(token, "login");

  if (!payload) {
    return (
      <>
        <BrandBlobs />
        <main className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-soft border border-brand-light-gray p-8 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl border bg-amber-50 text-amber-600 border-amber-200 flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-brand-charcoal tracking-tight">
              Sign-in link expired
            </h1>
            <p className="mt-3 text-sm text-brand-slate leading-relaxed">
              For your security, sign-in links work for 15 minutes only.
              Request a new one and we&rsquo;ll send it right over.
            </p>
            <Link
              href="/me/login"
              className="mt-6 inline-flex items-center justify-center px-6 py-2.5 bg-brand-charcoal hover:brightness-110 text-white font-semibold text-sm rounded-xl transition-all"
            >
              Get a fresh link
            </Link>
          </div>
        </main>
      </>
    );
  }

  await setSession(payload.s);
  redirect("/me");
}
