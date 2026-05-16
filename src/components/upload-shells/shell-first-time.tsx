/**
 * ShellFirstTime — the classic upload entry for visitors with no
 * documents in session. Renders the existing UploadDropzone untouched.
 *
 * Wrapped in a thin shell so the page can swap to other shells purely
 * by routing decision (no per-state branching inside the dropzone
 * itself).
 */
"use client";

import { UploadDropzone } from "@/components/upload-dropzone";
import { ShellOff as ShieldOff } from "@/components/upload-shells/shell-icons";

export interface ShellFirstTimeProps {
  isDemo: boolean;
  priorityChip: string | null;
}

export function ShellFirstTime({ isDemo, priorityChip }: ShellFirstTimeProps) {
  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      <div className="space-y-2 mb-6">
        <h1 className="font-serif font-medium text-4xl md:text-5xl tracking-[-0.02em] leading-[1.05] text-brand-charcoal">
          Upload your{" "}
          <span className="italic text-brand-plum">current policy.</span>
        </h1>
        <p className="font-serif italic text-base text-brand-slate max-w-xl">
          We&apos;ll read it in under 2 minutes — and tell you what&apos;s
          strong, what&apos;s missing, and what to look for at renewal.
        </p>
        <div className="inline-flex items-center gap-1.5 mt-3 font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
          <ShieldOff />
          <span>· No sales calls. Ever. ·</span>
        </div>
      </div>

      <UploadDropzone
        demoMode={isDemo}
        backHref="/"
        priorityChip={priorityChip}
      />
    </main>
  );
}
