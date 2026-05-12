import Link from "next/link";
import { ArrowLeft, Shield, Sparkles } from "lucide-react";
import { UploadDropzone } from "@/components/upload-dropzone";

export const metadata = {
  title: "Upload Your Policy — RightOffer",
};

interface PageProps {
  searchParams: Promise<{ demo?: string }>;
}

export default async function UploadPage({ searchParams }: PageProps) {
  const { demo } = await searchParams;
  const isDemo = demo === "1";

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <Link
        href={isDemo ? "/investor" : "/"}
        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-navy mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <div className="space-y-3 mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-navy bg-blue-100 rounded-full">
          <Sparkles className="w-3 h-3" />
          Step 1 of {isDemo ? "3" : "2"}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-ink">
          Upload Your Current Policy
        </h1>
        <p className="text-slate-600 text-lg">
          We&apos;ll read it in{" "}
          <span className="font-semibold text-brand-deepblue">
            under 2 minutes
          </span>{" "}
          and tell you exactly what&apos;s strong, what&apos;s missing, and
          what to look for at renewal.
        </p>
      </div>

      <UploadDropzone demoMode={isDemo} />

      <div className="mt-8 flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <Shield className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-600">
          <p className="font-medium text-slate-900 mb-1">
            Your data stays private.
          </p>
          <p>
            We use your policy only to generate this review and send you
            renewal reminders. Never shared with insurers without your explicit
            consent.
          </p>
        </div>
      </div>
    </main>
  );
}
