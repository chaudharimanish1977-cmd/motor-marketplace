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

  const initialAnswers: MidLoadAnswers = {
    annualKm: params?.get("km") ?? undefined,
    drivenBy: params?.get("drv") ?? undefined,
    otherCars: params?.get("oc") ?? undefined,
    priority: params?.get("pri") ?? undefined,
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

        <div className="text-center max-w-md mx-auto pt-12">
          {/* HERO: quirky vertical — big emoji on top, message pill below */}
          {validStart !== undefined && (
            <div className="mb-6">
              <TimeComparison layout="vertical" />
            </div>
          )}

          {/* Compact spinner + heading */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative inline-block">
              <Loader2 className="w-10 h-10 animate-spin text-brand-navy" />
              <Sparkles className="w-4 h-4 text-brand-gold absolute top-0 right-0 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base md:text-lg font-bold text-brand-ink">
                Generating your personalised report
              </h1>
              <p className="text-slate-600 text-xs mt-0.5">
                Reading your policy · curating recommendations for your car.
              </p>
            </div>
          </div>
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
