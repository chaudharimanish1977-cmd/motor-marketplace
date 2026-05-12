"use client";

import { useSearchParams } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { ElapsedTimer } from "@/components/elapsed-timer";

export default function Loading() {
  const params = useSearchParams();
  const fromParam = params?.get("from");
  const startedAt = fromParam ? parseInt(fromParam, 10) : NaN;
  const validStart =
    Number.isFinite(startedAt) && startedAt > 0 ? startedAt : undefined;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative inline-block">
          <Loader2 className="w-16 h-16 animate-spin text-brand-navy" />
          <Sparkles className="w-6 h-6 text-brand-gold absolute top-0 right-0 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-brand-ink">
            Generating your personalised report...
          </h1>
          <p className="text-slate-600 text-sm">
            Reading your policy and curating recommendations specific to your
            vehicle, location, and coverage gaps.
          </p>
        </div>

        {validStart !== undefined && (
          <div className="pt-2">
            <ElapsedTimer
              startedAt={validStart}
              size="lg"
              className="text-brand-deepblue"
            />
          </div>
        )}
      </div>
    </div>
  );
}
