import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { BrandBlobs } from "@/components/brand-blobs";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Sign in — RightOffer",
  robots: { index: false, follow: false },
};

/**
 * Sign-in landing. If the user already has a valid session cookie,
 * bounce them straight into /me — no point making them re-authenticate.
 */
export default async function LoginPage() {
  const email = await getSession();
  if (email) redirect("/me");

  return (
    <>
      <BrandBlobs />
      <main className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
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
