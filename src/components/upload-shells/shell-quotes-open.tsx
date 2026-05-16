/**
 * ShellQuotesOpen — returning visitor whose policy is in the renewal
 * window (State A, ≤60 days). The quote market is open. We never re-
 * ask for the policy; we surface it and invite optional quote uploads
 * to compare against.
 *
 * Phase 2 ships the "view existing report / start quote shopping"
 * surface. Phase 3 wires the actual multi-doc stack flow (drop more
 * quotes, run comparator) inside this shell.
 */
"use client";

import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import { SketchPetrolPump } from "@/components/sketches-scenes";
import type { ParsedPolicy } from "@/lib/types";
import type { LifecycleResult } from "@/lib/lifecycle-state";

interface ShellQuotesOpenProps {
  policy: ParsedPolicy;
  lifecycle: LifecycleResult;
}

export function ShellQuotesOpen({ policy, lifecycle }: ShellQuotesOpenProps) {
  const vehicleLabel = `${policy.vehicle.make} ${policy.vehicle.model}`.trim();
  const daysUntil = lifecycle.daysUntilExpiry ?? 0;
  const reportHref = `/report/${policy.id}`;

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Masthead — petrol-pump metaphor lives here per DESIGN-LANGUAGE.md */}
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-3">
        · Renewal window open · {daysUntil} day{daysUntil === 1 ? "" : "s"} ·
      </div>

      <h1 className="font-serif font-medium text-4xl md:text-5xl tracking-[-0.02em] leading-[1.05] text-brand-charcoal m-0">
        Time to{" "}
        <span className="italic text-brand-plum">top up your cover.</span>
      </h1>

      <p className="mt-3 font-serif italic text-base md:text-lg text-brand-slate max-w-xl">
        Your {vehicleLabel} renews in {daysUntil} days. We&apos;ll fetch
        3 fresh quotes from our partners — and you can drop any quotes
        you&apos;ve collected so we stack them all together.
      </p>

      {/* Petrol-pump scene — anchors the renewal moment */}
      <div className="mt-7 rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-5 md:px-7 py-6 flex justify-center text-brand-plum">
        <SketchPetrolPump width={360} color="currentColor" />
      </div>

      {/* Vehicle / insurer summary */}
      <section className="mt-6 rounded-2xl bg-brand-offwhite border border-brand-charcoal/15 px-5 py-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          · Your current cover ·
        </div>
        <div className="mt-1 font-serif font-semibold text-lg tracking-[-0.015em] text-brand-charcoal">
          {vehicleLabel} · {policy.vehicle.yearOfManufacture}
        </div>
        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-brand-slate">
          {policy.insurerName} · {policy.vehicle.rto}
        </div>
      </section>

      {/* Two paths */}
      <div className="mt-7 flex flex-col md:flex-row gap-3 md:gap-4">
        <LoadingLink
          href={reportHref}
          className="flex-1 inline-flex items-center justify-center gap-1 bg-brand-plum text-brand-offwhite px-6 py-3 rounded-full font-serif italic font-medium text-[16px] hover:opacity-90 transition-opacity"
        >
          See your review &amp; offers <span aria-hidden>→</span>
        </LoadingLink>
        <Link
          href={`/upload?fresh=1&renewal=${policy.id}`}
          className="flex-1 inline-flex items-center justify-center gap-1 border border-brand-plum/40 text-brand-plum px-6 py-3 rounded-full font-serif italic font-medium text-[15px] hover:bg-brand-plum/5 transition-colors"
        >
          Drop a quote you&apos;ve collected
        </Link>
      </div>

      <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-sage font-bold text-center">
        · Coming next · Drop multiple quotes &amp; compare side-by-side ·
      </p>
    </main>
  );
}
