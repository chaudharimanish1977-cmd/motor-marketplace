/**
 * ShellWelcomeBack — returning visitor whose policy is mid-cycle (B)
 * or just-bought (C). We've already reviewed their policy; no need to
 * re-ask. Show a friendly summary card with three jump-buttons:
 *
 *   · Re-open last review   →  /report/<id>
 *   · Refresh review        →  re-runs the journey on the same policy
 *   · Upload a different car →  drops them into the classic dropzone
 */
"use client";

import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import { SketchCar } from "@/components/sketches";
import type { ParsedPolicy } from "@/lib/types";
import type { LifecycleResult } from "@/lib/lifecycle-state";
import { ClockIcon } from "./shell-icons";

interface ShellWelcomeBackProps {
  policy: ParsedPolicy;
  lifecycle: LifecycleResult;
}

export function ShellWelcomeBack({ policy, lifecycle }: ShellWelcomeBackProps) {
  const vehicleLabel = `${policy.vehicle.make} ${policy.vehicle.model}`.trim();
  const daysUntil = lifecycle.daysUntilExpiry;
  const reportHref = `/report/${policy.id}`;

  // State-specific welcome copy
  const subhead =
    lifecycle.state === "C"
      ? "Fresh policy on file — your review's saved for the year."
      : typeof daysUntil === "number"
        ? `Mid-cycle — ${daysUntil} days till renewal.`
        : "Mid-cycle — your review's on file.";

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Masthead kicker */}
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
        · Welcome back · No. {policy.policyNumber.slice(-3) || "—"} ·
      </div>

      <h1 className="font-serif font-medium text-3xl md:text-5xl tracking-[-0.02em] leading-[1.08] text-brand-charcoal m-0">
        Good to see your{" "}
        <span className="italic text-brand-plum">
          {policy.vehicle.make}.
        </span>
      </h1>

      <p className="mt-3 font-serif italic text-[15px] md:text-lg text-brand-slate max-w-xl leading-[1.55]">
        {subhead}
      </p>

      {/* Summary card */}
      <section className="mt-7 rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-5 md:px-7 py-6">
        <div className="flex items-center gap-5">
          <div className="text-brand-plum flex-shrink-0 hidden sm:block">
            <SketchCar width={160} color="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
              · Your last review ·
            </div>
            <div className="mt-1 font-serif font-semibold text-xl md:text-2xl tracking-[-0.015em] text-brand-charcoal truncate">
              {vehicleLabel} · {policy.vehicle.yearOfManufacture}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-slate">
              {policy.insurerName} · {policy.vehicle.rto}
            </div>
            {typeof daysUntil === "number" && (
              <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-plum font-bold">
                <ClockIcon />
                <span>
                  Renewal in {daysUntil} day{daysUntil === 1 ? "" : "s"}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Three actions */}
      <div className="mt-7 flex flex-col md:flex-row flex-wrap items-stretch md:items-center gap-3 md:gap-4">
        <LoadingLink
          href={reportHref}
          className="flex-1 md:flex-none inline-flex items-center justify-center gap-1 bg-brand-plum text-brand-offwhite px-6 py-3 rounded-full font-serif italic font-medium text-[16px] hover:opacity-90 transition-opacity"
        >
          Re-open last review <span aria-hidden>→</span>
        </LoadingLink>
        <LoadingLink
          href={`/upload?renewal=${policy.id}`}
          className="flex-1 md:flex-none inline-flex items-center justify-center gap-1 border border-brand-plum/40 text-brand-plum px-6 py-3 rounded-full font-serif italic font-medium text-[15px] hover:bg-brand-plum/5 transition-colors"
        >
          Refresh review
        </LoadingLink>
        <Link
          href="/upload?fresh=1"
          className="flex-1 md:flex-none inline-flex items-center justify-center font-serif italic text-[14px] text-brand-slate hover:text-brand-charcoal transition-colors py-2"
        >
          Different car →
        </Link>
      </div>

      <p className="mt-6 font-serif italic text-sm text-brand-slate max-w-md">
        Reviews are kept for a year. We&apos;ll send a renewal reminder
        45 days before your policy expires.
      </p>
    </main>
  );
}
