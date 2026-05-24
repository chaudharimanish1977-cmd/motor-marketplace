/**
 * ShellLapsed — returning visitor whose policy has expired (State D).
 *
 * This is the highest-urgency surface in the upload flow. Customer is
 * technically driving without cover; the page interrupts with a sharp
 * warning before offering paths to action:
 *
 *   1. Renew immediately (drop fresh policy / quote)
 *   2. Re-open last review (so they know what they had)
 *
 * No editorial fluff. Calm but direct. Awful-smiley sits at the top —
 * per DESIGN-LANGUAGE.md, that's the canonical metaphor for error /
 * uncovered moments.
 */
"use client";

import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import { CarSmiley } from "@/components/car-smiley";
import type { ParsedPolicy } from "@/lib/types";
import type { LifecycleResult } from "@/lib/lifecycle-state";
import { AlertIcon } from "./shell-icons";

interface ShellLapsedProps {
  policy: ParsedPolicy;
  lifecycle: LifecycleResult;
}

export function ShellLapsed({ policy, lifecycle }: ShellLapsedProps) {
  const vehicleLabel = `${policy.vehicle.make} ${policy.vehicle.model}`.trim();
  const daysLapsed = Math.abs(lifecycle.daysUntilExpiry ?? 0);
  const reportHref = `/report/${policy.id}`;

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Sharp top banner — uncovered moment */}
      <div className="rounded-2xl bg-brand-surface border-l-4 border-brand-sage px-5 md:px-7 py-5 mb-7">
        <div className="flex items-start gap-4">
          <div className="text-brand-sage flex-shrink-0">
            <AlertIcon />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono font-bold text-[10.5px] uppercase tracking-[0.16em] text-brand-sage">
              · Policy lapsed · {daysLapsed} day
              {daysLapsed === 1 ? "" : "s"} ago ·
            </div>
            <p className="mt-2 font-serif text-base md:text-lg text-brand-charcoal leading-[1.45]">
              Your {vehicleLabel} cover expired{" "}
              {daysLapsed === 1 ? "yesterday" : `${daysLapsed} days ago`}.
              You may be driving without insurance right now.
            </p>
          </div>
        </div>
      </div>

      {/* Hero with Awful smiley */}
      <div className="flex flex-col items-center text-center mb-7 text-brand-plum">
        <CarSmiley rating={1} width={140} />
        <h1 className="mt-4 font-serif font-medium text-[28px] md:text-4xl tracking-[-0.02em] leading-[1.1] text-brand-charcoal m-0">
          Let&apos;s get you back{" "}
          <span className="italic text-brand-plum">on cover.</span>
        </h1>
        <p className="mt-3 font-serif italic text-[15px] md:text-base text-brand-slate max-w-md leading-[1.55]">
          Drop a fresh policy or renewal quote and we&apos;ll review it
          immediately. The review pace is faster than usual — about a
          minute — because urgency.
        </p>
      </div>

      {/* Two paths */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4">
        <Link
          href="/upload?fresh=1"
          className="flex-1 inline-flex items-center justify-center gap-1 bg-brand-plum text-brand-offwhite px-6 py-3.5 rounded-full font-serif italic font-medium text-[17px] hover:opacity-90 transition-opacity"
        >
          Upload my new policy <span aria-hidden>→</span>
        </Link>
        <LoadingLink
          href={reportHref}
          className="flex-1 inline-flex items-center justify-center gap-1 border border-brand-plum/40 text-brand-plum px-6 py-3 rounded-full font-serif italic font-medium text-[15px] hover:bg-brand-plum/5 transition-colors"
        >
          See last year&apos;s review
        </LoadingLink>
      </div>

      <p className="mt-6 font-serif italic text-sm text-brand-slate max-w-md mx-auto text-center">
        Driving uninsured carries a fine of up to ₹4,000 + cancellation
        of registration on a second offence. The sooner you renew, the
        less risk you carry.
      </p>
    </main>
  );
}
