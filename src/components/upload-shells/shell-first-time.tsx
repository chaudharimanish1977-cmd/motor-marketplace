/**
 * ShellFirstTime — the editorial upload landing for first-time visitors.
 *
 * Phase 5B reframe:
 *
 *   · Hero matches the home-page voice (Newsreader serif + plum italic
 *     accent + mono trust-line kicker), so the home → upload transition
 *     no longer feels like two different products.
 *   · Below the dropzone, a tiny preview of the road bar shows the
 *     6-stop journey ahead — sets pacing expectations without
 *     demanding attention.
 *   · "No sales calls. Ever." stays as a sage mono masthead — it's the
 *     single most important trust beat at this moment.
 *
 * The actual dropzone tile is rendered by UploadDropzone, whose visuals
 * were rebuilt in lockstep to use the same editorial vocabulary
 * (plum dashed border, ink-line sketch, serif copy).
 */
"use client";

import { UploadDropzone } from "@/components/upload-dropzone";
import { ShellOff as ShieldOff } from "@/components/upload-shells/shell-icons";
import { RoadBar } from "@/components/upload-journey/road-bar";

const PREVIEW_STOPS = [
  { key: "hello", label: "Hello" },
  { key: "read", label: "Read" },
  { key: "ask", label: "Ask" },
  { key: "preview", label: "Preview" },
  { key: "stitching", label: "Stitch" },
  { key: "destination", label: "Done" },
];

export interface ShellFirstTimeProps {
  isDemo: boolean;
  priorityChip: string | null;
}

export function ShellFirstTime({ isDemo, priorityChip }: ShellFirstTimeProps) {
  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Hero */}
      <header className="mb-7 md:mb-9">
        <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
          <ShieldOff />
          <span>· No sales calls. Ever. ·</span>
        </div>

        <h1 className="font-serif font-medium text-[34px] md:text-[52px] tracking-[-0.02em] leading-[1.05] text-brand-charcoal m-0">
          Drop your policy.{" "}
          <span className="italic text-brand-plum">
            Let&apos;s take a 2-min journey together.
          </span>
        </h1>

        <p className="mt-4 font-serif italic text-[15px] md:text-lg text-brand-slate max-w-xl leading-[1.55]">
          Strong points, missing essentials, and what to look for at
          renewal — all in one editorial review. Free, no login.
        </p>
      </header>

      {/* Dropzone — the actual interactive surface */}
      <UploadDropzone
        demoMode={isDemo}
        backHref="/"
        priorityChip={priorityChip}
      />

      {/* What to expect — preview of the road. Tiny, calm, sets
       *  pacing expectations without screaming for attention. */}
      <section className="mt-9 md:mt-11">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate text-center mb-3">
          · 2-min journey together · 6 stops · 1 verdict ·
        </div>
        <div className="px-2">
          <RoadBar stops={PREVIEW_STOPS} currentIndex={0} />
        </div>
      </section>

      {/* Footnote */}
      <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-slate text-center">
        · Free, then and forever · We make money when you renew with us · Never before ·
      </p>
    </main>
  );
}
