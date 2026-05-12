"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { TimeComparison } from "@/components/time-comparison";
import { StopwatchChip } from "@/components/stopwatch-chip";
import {
  MidLoadQuestions,
  midLoadStorageKey,
  type MidLoadAnswers,
} from "@/components/mid-load-questions";

export default function Loading() {
  const params = useSearchParams();
  const route = useParams();
  const reportId = typeof route?.id === "string" ? route.id : "";

  const fromParam = params?.get("from");
  const startedAt = fromParam ? parseInt(fromParam, 10) : NaN;
  const validStart =
    Number.isFinite(startedAt) && startedAt > 0 ? startedAt : undefined;

  // Phase-1 answers came in via URL — pre-populate so those questions don't
  // re-appear on this screen.
  const initialAnswers: MidLoadAnswers = {
    annualKm: params?.get("km") ?? undefined,
    drivenBy: params?.get("drv") ?? undefined,
    otherCars: params?.get("oc") ?? undefined,
    priority: params?.get("pri") ?? undefined,
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      {/* Loader card — same architecture as the upload card so the user feels
       *  continuity: stopwatch top-right, hero centre, questions below. */}
      <div className="relative max-w-2xl mx-auto rounded-3xl bg-white border border-brand-light-gray shadow-soft p-6">
        {validStart !== undefined && (
          <div
            className="absolute top-3 right-3 z-10 rounded-full bg-white shadow-soft"
            style={{ padding: 2 }}
          >
            <StopwatchChip startedAt={validStart} size={54} />
          </div>
        )}

        <div className="text-center max-w-md mx-auto">
          {validStart !== undefined && (
            <div className="mb-4">
              <TimeComparison />
            </div>
          )}

          <div className="relative inline-block mb-4">
            <Loader2 className="w-12 h-12 animate-spin text-brand-navy" />
            <Sparkles className="w-5 h-5 text-brand-gold absolute top-0 right-0 animate-pulse" />
          </div>

          <h1 className="text-lg md:text-xl font-bold text-brand-ink">
            Generating your personalised report
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Reading your policy and curating recommendations specific to your
            vehicle, location, and coverage gaps.
          </p>
        </div>
      </div>

      {/* Questions carousel — keeps going from where phase-1 left off. Only
       *  unanswered questions are shown; new answers persist to localStorage
       *  and the report page merges them in once it renders. */}
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
