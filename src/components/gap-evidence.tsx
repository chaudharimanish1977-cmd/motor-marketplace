"use client";

/**
 * GapEvidenceDisclosure — the "Show our work" collapsible affordance
 * that lives on each gap card in §02 What's Missing (Phase 7c).
 *
 * Renders the deterministic check trail produced by
 * `buildGapEvidence()` plus an industry benchmark line. Default
 * collapsed; expands inline on click. No card frame, no shadow —
 * editorial discipline that matches the surrounding ReportSection
 * vocabulary (mono kickers, serif body, plum / sage / alert
 * functional palette).
 *
 * Print mode: pass `printMode` to render expanded by default with no
 * toggle, so the saved PDF carries the full audit trail. The customer
 * forwarding their report doesn't need to interact to reveal the
 * audit transparency.
 */

import { useState } from "react";
import type { GapEvidence, AuditCheck } from "@/lib/audit-checks";

export function GapEvidenceDisclosure({
  evidence,
  printMode = false,
}: {
  evidence: GapEvidence;
  printMode?: boolean;
}) {
  const [open, setOpen] = useState(printMode);
  // Once the customer has interacted with the toggle (opened or
  // closed it at least once), we stop the attention pulse on the
  // icon. The pulse is a discovery cue, not a permanent state —
  // calling it back to attention every render would be obnoxious.
  const [interacted, setInteracted] = useState(false);

  return (
    <div className="mt-1">
      {/* Toggle — quiet, editorial. The `+` icon breathes gently
          (attention-pulse) when the disclosure has never been opened
          on this view, so the customer's eye catches the affordance.
          Pulse pauses after first interaction. Hidden in print mode
          (content is already expanded for the PDF). */}
      {!printMode && (
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setInteracted(true);
          }}
          aria-expanded={open}
          className="group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-brand-plum hover:text-brand-charcoal transition-colors print:hidden"
        >
          <span
            aria-hidden
            className={`text-brand-plum/80 ${
              !open && !interacted ? "animate-attention-pulse" : ""
            }`}
          >
            {open ? "−" : "+"}
          </span>
          <span>{open ? "Hide our work" : "Show our work"}</span>
        </button>
      )}

      {open && (
        <div className="mt-3 pl-4 border-l-2 border-brand-charcoal/15 space-y-3">
          {/* Kicker */}
          <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
            · Our checks ·
          </div>

          {/* Check list */}
          <ul className="space-y-2.5">
            {evidence.checks.map((check, i) => (
              <CheckRow key={i} check={check} />
            ))}
          </ul>

          {/* Industry benchmark line — only when we have one */}
          {evidence.benchmark && (
            <div className="pt-2 border-t border-brand-charcoal/10">
              <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] font-bold text-brand-plum">
                · Industry benchmark ·
              </div>
              <p className="mt-1.5 font-serif italic text-[13.5px] md:text-[14px] leading-[1.55] text-brand-charcoal">
                {evidence.benchmark.statement}
              </p>
              <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-brand-slate">
                Source · {evidence.benchmark.source}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Single check row — glyph + label + evidence body.
 *
 * Glyph semantics:
 *   - flag    → coral exclamation (this check fired; it's a reason the gap exists)
 *   - pass    → sage check (we ran the check; it didn't flag)
 *   - neutral → slate dot (informational fact; no judgement)
 *
 * These are the same functional palette tokens the rest of the report
 * uses, so the customer's eye doesn't need to retrain across surfaces.
 */
function CheckRow({ check }: { check: AuditCheck }) {
  const glyph =
    check.result === "flag"
      ? {
          char: "!",
          cls: "text-brand-alert font-black",
        }
      : check.result === "pass"
        ? {
            char: "✓",
            cls: "text-brand-success",
          }
        : { char: "·", cls: "text-brand-slate" };

  return (
    <li className="flex gap-2.5 items-start">
      <span
        className={`shrink-0 w-4 inline-flex items-center justify-center font-mono text-[12px] leading-none pt-[2px] ${glyph.cls}`}
        aria-hidden
      >
        {glyph.char}
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-serif font-semibold text-[13.5px] md:text-[14px] text-brand-charcoal leading-snug">
          {check.label}
        </div>
        <div className="mt-0.5 font-serif text-[13px] md:text-[13.5px] text-brand-slate leading-snug">
          {check.evidence}
        </div>
      </div>
    </li>
  );
}
