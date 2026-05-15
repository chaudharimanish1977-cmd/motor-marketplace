import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getSession } from "@/lib/session";
import { BrandBlobs } from "@/components/brand-blobs";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sign in — RightOffer",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ expired?: string }>;
}

/**
 * Sign-in landing. If the user already has a valid session cookie,
 * bounce them straight into /me — no point making them re-authenticate.
 *
 * The `?expired=1` flag is set when the magic-link route handler
 * (/me/auth/[token]) rejected a token. We render a friendly notice
 * above the form so the user knows the previous link expired and just
 * needs to request a fresh one.
 */
export default async function LoginPage({ searchParams }: PageProps) {
  const email = await getSession();
  if (email) redirect("/me");

  const { expired } = await searchParams;
  const showExpiredNotice = expired === "1";

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-4">
          {showExpiredNotice && (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-soft p-4 flex items-start gap-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-brand-charcoal text-sm">
                  Sign-in link expired
                </div>
                <p className="text-xs text-brand-slate mt-1 leading-relaxed">
                  For your security, links work for 15 minutes only. Request a
                  fresh one below and we&rsquo;ll send it right over.
                </p>
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-soft border border-brand-light-gray p-8">
            <h1 className="text-2xl font-bold text-brand-charcoal tracking-tight text-center">
              Sign in to your policies
            </h1>
            <p className="mt-2 text-sm text-brand-slate text-center leading-relaxed">
              No password. We&rsquo;ll email you a link that signs you in.
            </p>
            <div className="mt-6">
              <LoginForm />
            </div>
            <p className="mt-5 text-[11px] text-brand-slate/70 text-center leading-relaxed">
              Only the email address you used when you uploaded a policy will
              work. New here?{" "}
              <a
                href="/upload"
                className="text-brand-deepblue hover:underline font-semibold"
              >
                Upload your policy
              </a>{" "}
              to get started.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
