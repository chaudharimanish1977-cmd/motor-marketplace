"use client";

import { useParams, useSearchParams } from "next/navigation";
import { TimeComparison } from "@/components/time-comparison";
import { StopwatchChip } from "@/components/stopwatch-chip";
import { TypewriterCycle } from "@/components/typewriter";
import {
  MidLoadQuestions,
  midLoadStorageKey,
  type MidLoadAnswers,
} from "@/components/mid-load-questions";

// Messages the typewriter cycles through. First entry is the static
// hero — the rest narrate what the system is actually doing so the wait
// reads as progress, not stalling. No spinner needed: the live caret +
// rotating progress text is the "we're working" cue.
const REPORT_MESSAGES = [
  "Generating your personalised report",
  "Reading every line of your policy",
  "Identifying your coverage and add-ons",
  "Verifying IDV and No-Claim Bonus",
  "Looking for gaps in your protection",
  "Curating recommendations for your car",
];

export default function Loading() {
  const params = useSearchParams();
  const route = useParams();
  const reportId = typeof route?.id === "string" ? route.id : "";

  const fromParam = params?.get("from");
  const startedAt = fromParam ? parseInt(fromParam, 10) : NaN;
  const validStart =
    Number.isFinite(startedAt) && startedAt > 0 ? startedAt : undefined;

  const initialAnswers: MidLoadAnswers = {
    annualKm: params?.get("km") ?? undefined,
    drivenBy: params?.get("drv") ?? undefined,
    otherCars: params?.get("oc") ?? undefined,
    priority: params?.get("pri") ?? undefined,
    pastClaims: params?.get("pc") ?? undefined,
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="relative max-w-2xl mx-auto rounded-3xl bg-white border border-brand-light-gray shadow-soft p-6">
        {validStart !== undefined && (
          <div
            className="absolute top-3 right-3 z-10 rounded-full bg-white shadow-soft"
            style={{ padding: 2 }}
          >
            <StopwatchChip startedAt={validStart} size={54} />
          </div>
        )}

        <div className="text-center max-w-md mx-auto pt-8 pb-2">
          {/* HERO — typewriter cycle is the work-in-progress cue (no spinner).
           *   The customer sees us actively narrating what we're doing, so
           *   the wait feels like progress rather than a stall. */}
          <h1 className="text-xl md:text-2xl font-bold text-brand-charcoal min-h-[2.2em] leading-snug">
            <TypewriterCycle
              messages={REPORT_MESSAGES}
              typeSpeed={38}
              eraseSpeed={22}
              holdMs={1500}
              caretClassName="bg-brand-olive"
            />
          </h1>

          {/* Subtext — static, slow read */}
          <p className="text-sm text-brand-slate mt-3 leading-relaxed">
            Curating recommendations specific to your vehicle and city.
          </p>

          {/* TimeComparison "while you wait" banner — demoted to bottom as a
           *  small playful accent. flex-col-reverse so the message reads
           *  first and the emoji sits below it. */}
          {validStart !== undefined && (
            <div className="mt-8">
              <TimeComparison layout="vertical" className="flex-col-reverse" />
            </div>
          )}
        </div>
      </div>

      {/* Unanswered questions — keep filling them in while the report bakes */}
      {reportId && (
        <div className="max-w-2xl mx-auto mt-4">
          <MidLoadQuestions
            initialAnswers={initialAnswers}
            persistKey={midLoadStorageKey(reportId)}
            skipAnswered
          />
        </div>
      )}
    </div>
  );
}
