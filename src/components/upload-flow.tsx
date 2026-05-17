"use client";

import { useState } from "react";
import { UploadDropzone } from "@/components/upload-dropzone";
import type { RenewalContext } from "@/app/upload/page";
import type { LifecycleState } from "@/lib/lifecycle-state";
import { ShellOff as ShieldOff } from "@/components/upload-shells/shell-icons";
import { RoadBar } from "@/components/upload-journey/road-bar";
import { SketchCarStatic } from "@/components/sketches";

interface Props {
  isDemo: boolean;
  renewalContext?: RenewalContext | null;
  /** Home-page chip raw value (`pay_less` / `worry_less` / null). The flow
   *  translates it into a pre-filled MidLoadQuestions priority answer and
   *  hands it to the dropzone. */
  priorityChip?: string | null;
  /** Lifecycle state to render the 6-stop Journey in. Server-resolved
   *  from the visitor's session. Defaults to "B" (mid-cycle voice). */
  journeyState?: LifecycleState;
  /** Position of this drop in the visitor's running stack — when > 1,
   *  the Journey copy flips into "Stacking up your N documents" framing.
   *  Defaults to 1. */
  journeyDocCount?: number;
}

const PREVIEW_STOPS = [
  { key: "hello", label: "Hello" },
  { key: "read", label: "Read" },
  { key: "ask", label: "Ask" },
  { key: "preview", label: "Preview" },
  { key: "stitching", label: "Stitch" },
  { key: "destination", label: "Done" },
];

/**
 * Top-level upload flow — Phase 5B editorial reframe.
 *
 * Owns the hero, dropzone, and the "what to expect" road preview.
 * Everything outside the dropzone hides once the parse starts so the
 * 90-second journey stands alone.
 *
 * When `renewalContext` is present (returning customer from /me), the
 * hero is replaced by an editorial Renewal banner with the same brand
 * vocabulary as the rest of the journey.
 */
export function UploadFlow({
  isDemo,
  renewalContext,
  priorityChip,
  journeyState = "B",
  journeyDocCount = 1,
}: Props) {
  const [busy, setBusy] = useState(false);

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {!busy && renewalContext && <RenewalBanner context={renewalContext} />}

      {!busy && !renewalContext && (
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
      )}

      {/* Dropzone — the interactive surface */}
      <UploadDropzone
        demoMode={isDemo}
        onBusyChange={setBusy}
        backHref={renewalContext ? "/me" : isDemo ? "/investor" : "/"}
        priorityChip={priorityChip ?? null}
        journeyState={journeyState}
        journeyDocCount={journeyDocCount}
      />

      {/* What to expect — preview of the road. Hidden while busy so it
       *  doesn't compete with the live Journey above. */}
      {!busy && (
        <>
          <section className="mt-9 md:mt-11">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate text-center mb-3">
              · 2-min journey together · 6 stops · 1 verdict ·
            </div>
            <div className="px-2">
              <RoadBar stops={PREVIEW_STOPS} currentIndex={0} />
            </div>
          </section>

          <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-slate text-center">
            · Free, then and forever · We make money when you renew with
            us · Never before ·
          </p>
        </>
      )}
    </main>
  );
}

function RenewalBanner({ context }: { context: RenewalContext }) {
  const subline = [context.registrationNumber, context.rtoCity]
    .filter(Boolean)
    .join(" · ");

  return (
    <header className="mb-7 md:mb-9">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-plum font-bold mb-3">
        · Renewal review ·
      </div>

      <h1 className="font-serif font-medium text-[32px] md:text-[48px] tracking-[-0.02em] leading-[1.05] text-brand-charcoal m-0 flex items-center gap-3 flex-wrap">
        <span>Renewing your</span>
        <span className="italic text-brand-plum">
          {context.vehicleLabel}.
        </span>
        <span className="text-brand-plum" aria-hidden>
          <SketchCarStatic width={56} color="currentColor" />
        </span>
      </h1>

      {subline && (
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          · {subline} ·
        </div>
      )}

      <p className="mt-4 font-serif italic text-[15px] md:text-lg text-brand-slate max-w-xl leading-[1.55]">
        Drop this year&apos;s renewal quote (or your latest policy) and
        we&apos;ll review what&apos;s changed, what&apos;s missing, and
        where the better offers are.
      </p>
    </header>
  );
}
