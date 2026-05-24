"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { TrendingDown, TrendingUp, Users, ArrowRight } from "lucide-react";
import type { CoverageScore as ScoreData } from "@/lib/coverage-score";

interface Props {
  score: ScoreData;
}

const BAND_THEME: Record<
  ScoreData["band"],
  { ring: string; text: string; chip: string; gradient: string }
> = {
  critical: {
    ring: "stroke-red-500",
    text: "text-red-600",
    chip: "bg-red-100 text-red-700 border-red-200",
    gradient: "from-red-50 to-white",
  },
  "below-average": {
    ring: "stroke-amber-500",
    text: "text-amber-600",
    chip: "bg-amber-100 text-amber-800 border-amber-200",
    gradient: "from-amber-50 to-white",
  },
  good: {
    ring: "stroke-blue-500",
    text: "text-brand-charcoal",
    chip: "bg-brand-charcoal/15 text-brand-charcoal border-brand-charcoal/30",
    gradient: "from-brand-charcoal/10 to-white",
  },
  excellent: {
    ring: "stroke-brand-success",
    text: "text-brand-success",
    chip: "bg-emerald-100 text-emerald-700 border-emerald-200",
    gradient: "from-emerald-50 to-white",
  },
};

export function CoverageScoreCard({ score }: Props) {
  const theme = BAND_THEME[score.band];
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate counter from 0 to actual score
  useEffect(() => {
    const target = score.score;
    if (target <= 0) {
      setAnimatedScore(0);
      return;
    }
    const duration = 1400;
    const steps = 40;
    let current = 0;
    const id = setInterval(() => {
      current = Math.min(current + target / steps, target);
      setAnimatedScore(Math.round(current));
      if (current >= target) clearInterval(id);
    }, duration / steps);
    return () => clearInterval(id);
  }, [score.score]);

  // SVG dial: 220-degree arc (-110° to +110°)
  // Use circumference math for stroke-dasharray
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  // Arc spans 220° (from 0°=-110° offset). Active range = 220° of full circle = 220/360
  const arcLength = (220 / 360) * circumference;
  const progress = (animatedScore / 100) * arcLength;

  const versusPeer = score.score - score.peerAverage;
  const aboveAverage = versusPeer >= 0;

  return (
    <section
      className={clsx(
        "relative rounded-3xl border-2 border-brand-light-gray bg-gradient-to-br shadow-soft p-6 md:p-8 overflow-hidden",
        theme.gradient
      )}
    >
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        {/* Radial dial */}
        <div className="relative shrink-0">
          <svg
            width="200"
            height="180"
            viewBox="0 0 200 180"
            className="overflow-visible"
          >
            {/* Background arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              strokeWidth="14"
              className="stroke-brand-light-gray"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              transform="rotate(160 100 100)"
            />
            {/* Foreground (score) arc */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              strokeWidth="14"
              className={theme.ring}
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
              transform="rotate(160 100 100)"
              style={{ transition: "stroke-dasharray 0.05s ease-out" }}
            />
            {/* Hash marks at 0, 25, 50, 75, 100 */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const angle = (160 + (pct / 100) * 220) * (Math.PI / 180);
              const r1 = radius - 18;
              const r2 = radius - 11;
              const x1 = 100 + r1 * Math.cos(angle);
              const y1 = 100 + r1 * Math.sin(angle);
              const x2 = 100 + r2 * Math.cos(angle);
              const y2 = 100 + r2 * Math.sin(angle);
              return (
                <line
                  key={pct}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  opacity="0.5"
                />
              );
            })}
          </svg>
          {/* Centre number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-2">
            <div className={clsx("text-6xl font-bold tabular-nums leading-none", theme.text)}>
              {animatedScore}
            </div>
            <div className="text-xs uppercase tracking-[0.15em] font-semibold text-brand-slate mt-1">
              out of 100
            </div>
          </div>
        </div>

        {/* Right side: label + headline + peer comparison */}
        <div className="flex-1 text-center md:text-left">
          <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-brand-slate mb-2">
            Your Coverage Score
          </div>
          <span
            className={clsx(
              "inline-block px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full border",
              theme.chip
            )}
          >
            {score.label}
          </span>
          <h2 className="text-lg md:text-xl font-bold text-brand-charcoal mt-3 leading-snug">
            {score.headline}
          </h2>

          {/* Peer comparison */}
          <div className="mt-4 flex items-center gap-2 text-sm text-brand-slate justify-center md:justify-start">
            <Users className="w-4 h-4 shrink-0" />
            <span>
              <span className="font-semibold text-brand-charcoal">
                {score.peerVehicleCount.toLocaleString("en-IN")}+
              </span>{" "}
              similar vehicles in {score.peerCity} score{" "}
              <span className="font-semibold text-brand-charcoal tabular-nums">
                {score.peerAverage}
              </span>{" "}
              on average
            </span>
          </div>
          <div
            className={clsx(
              "mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
              aboveAverage
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            )}
          >
            {aboveAverage ? (
              <>
                <TrendingUp className="w-3 h-3" />
                You&apos;re {versusPeer} points above peer average
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" />
                You&apos;re {Math.abs(versusPeer)} points below peer average
              </>
            )}
          </div>

          {/* CTA — fix the gaps */}
          {score.band !== "excellent" && (
            <a
              href="#gaps"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-charcoal hover:text-brand-sage transition-colors"
            >
              See what&apos;s missing and how to fix it
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
