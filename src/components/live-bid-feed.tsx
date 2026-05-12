"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  Trophy,
  ChevronsDown,
  Sparkles,
} from "lucide-react";
import { InsurerLogo } from "@/components/insurer-logos";
import { formatINR } from "@/lib/format";

/**
 * Live bid feed — replaces the static loader during the bidding wait.
 * Plays a scripted sequence of synthetic auction events while the real
 * /api/bid call runs in parallel. Customer watches the marketplace happen.
 *
 * Why scripted not real-time-from-API: the API generates 9 bids in a single
 * Claude call (~22s); we'd need streaming to do real-time. For the demo the
 * scripted feed is more dramatic and predictable. The redirect to results
 * waits for both the script to finish AND the API to return.
 */

interface Props {
  /** Customer's current premium — used to seed plausible synthetic bids */
  currentPremium: number;
  /** Vehicle label e.g. "Maruti Wagon R" — used in headline */
  vehicleLabel?: string;
  /** When true, the real API has returned and we can transition */
  apiReturned: boolean;
  /** Called when the script finishes AND apiReturned is true */
  onComplete: () => void;
}

interface BidEvent {
  id: number;
  type: "join" | "tier-start" | "bid" | "tier-winner" | "summary";
  insurer?: "bharatsure" | "vahana" | "suraksha";
  tier?: 1 | 2 | 3;
  tierLabel?: string;
  amount?: number;
  delta?: number;
  isLowest?: boolean;
  message?: string;
  timestamp: number; // seconds since start
}

const INSURER_NAMES = {
  bharatsure: "BharatSure General",
  vahana: "Vahana Insurance",
  suraksha: "Suraksha Motors",
} as const;

const TIER_LABELS = {
  1: "Basic Cover",
  2: "Recommended Cover",
  3: "Super Cover",
} as const;

// Multipliers vs current premium for synthetic bids (kept close to what the
// real LLM tends to produce, so visible numbers don't feel disconnected)
const TIER_MULTIPLIERS: Record<1 | 2 | 3, [number, number]> = {
  1: [0.92, 1.05], // Basic: slightly below to at-current
  2: [1.1, 1.35], // Recommended: +10-35%
  3: [1.4, 2.2], // Super: +40-120%
};

function generateScript(currentPremium: number): BidEvent[] {
  const events: BidEvent[] = [];
  let id = 0;

  // Deterministic-ish jitter from premium (so re-renders don't shuffle)
  const seed = currentPremium % 1000;
  const jitter = (i: number, range: number) =>
    Math.round((((seed * (i + 1) * 13) % 100) / 100) * range) - range / 2;

  // 0-3s: insurers join
  events.push({ id: id++, type: "join", insurer: "bharatsure", timestamp: 0.8 });
  events.push({ id: id++, type: "join", insurer: "vahana", timestamp: 1.6 });
  events.push({ id: id++, type: "join", insurer: "suraksha", timestamp: 2.3 });

  // Tier 1 auction (4-9s)
  events.push({
    id: id++,
    type: "tier-start",
    tier: 1,
    tierLabel: TIER_LABELS[1],
    timestamp: 3.6,
  });
  const tier1Mults = TIER_MULTIPLIERS[1];
  const t1Bids: { insurer: "bharatsure" | "vahana" | "suraksha"; amount: number }[] = [
    {
      insurer: "bharatsure",
      amount: roundTo(currentPremium * (1.02 + jitter(1, 0.04)), 10),
    },
    {
      insurer: "vahana",
      amount: roundTo(currentPremium * (0.94 + jitter(2, 0.04)), 10),
    },
    {
      insurer: "suraksha",
      amount: roundTo(currentPremium * (0.98 + jitter(3, 0.04)), 10),
    },
  ];
  // Clamp into Tier 1 range
  for (const b of t1Bids) {
    b.amount = clamp(
      b.amount,
      currentPremium * tier1Mults[0],
      currentPremium * tier1Mults[1]
    );
    b.amount = roundTo(b.amount, 10);
  }
  let t1Low = Infinity;
  t1Bids.forEach((b, i) => {
    const isLow = b.amount < t1Low;
    if (isLow) t1Low = b.amount;
    events.push({
      id: id++,
      type: "bid",
      insurer: b.insurer,
      tier: 1,
      amount: b.amount,
      isLowest: isLow,
      timestamp: 4.5 + i * 1.2,
    });
  });
  const t1Winner = t1Bids.reduce((a, b) => (a.amount < b.amount ? a : b));
  events.push({
    id: id++,
    type: "tier-winner",
    tier: 1,
    tierLabel: TIER_LABELS[1],
    insurer: t1Winner.insurer,
    amount: t1Winner.amount,
    timestamp: 8.5,
  });

  // Tier 2 auction (9.5-15s)
  events.push({
    id: id++,
    type: "tier-start",
    tier: 2,
    tierLabel: TIER_LABELS[2],
    timestamp: 9.8,
  });
  const t2Bids = [
    {
      insurer: "bharatsure" as const,
      amount: roundTo(currentPremium * (1.21 + jitter(4, 0.04)), 10),
    },
    {
      insurer: "vahana" as const,
      amount: roundTo(currentPremium * (1.13 + jitter(5, 0.04)), 10),
    },
    {
      insurer: "suraksha" as const,
      amount: roundTo(currentPremium * (1.16 + jitter(6, 0.04)), 10),
    },
  ];
  for (const b of t2Bids) {
    b.amount = clamp(
      b.amount,
      currentPremium * TIER_MULTIPLIERS[2][0],
      currentPremium * TIER_MULTIPLIERS[2][1]
    );
    b.amount = roundTo(b.amount, 10);
  }
  let t2Low = Infinity;
  t2Bids.forEach((b, i) => {
    const isLow = b.amount < t2Low;
    if (isLow) t2Low = b.amount;
    events.push({
      id: id++,
      type: "bid",
      insurer: b.insurer,
      tier: 2,
      amount: b.amount,
      isLowest: isLow,
      timestamp: 10.7 + i * 1.2,
    });
  });
  const t2Winner = t2Bids.reduce((a, b) => (a.amount < b.amount ? a : b));
  events.push({
    id: id++,
    type: "tier-winner",
    tier: 2,
    tierLabel: TIER_LABELS[2],
    insurer: t2Winner.insurer,
    amount: t2Winner.amount,
    timestamp: 14.6,
  });

  // Tier 3 auction (16-21s)
  events.push({
    id: id++,
    type: "tier-start",
    tier: 3,
    tierLabel: TIER_LABELS[3],
    timestamp: 15.9,
  });
  const t3Bids = [
    {
      insurer: "bharatsure" as const,
      amount: roundTo(currentPremium * (1.78 + jitter(7, 0.06)), 10),
    },
    {
      insurer: "vahana" as const,
      amount: roundTo(currentPremium * (1.65 + jitter(8, 0.06)), 10),
    },
    {
      insurer: "suraksha" as const,
      amount: roundTo(currentPremium * (1.7 + jitter(9, 0.06)), 10),
    },
  ];
  for (const b of t3Bids) {
    b.amount = clamp(
      b.amount,
      currentPremium * TIER_MULTIPLIERS[3][0],
      currentPremium * TIER_MULTIPLIERS[3][1]
    );
    b.amount = roundTo(b.amount, 10);
  }
  let t3Low = Infinity;
  t3Bids.forEach((b, i) => {
    const isLow = b.amount < t3Low;
    if (isLow) t3Low = b.amount;
    events.push({
      id: id++,
      type: "bid",
      insurer: b.insurer,
      tier: 3,
      amount: b.amount,
      isLowest: isLow,
      timestamp: 16.8 + i * 1.2,
    });
  });
  const t3Winner = t3Bids.reduce((a, b) => (a.amount < b.amount ? a : b));
  events.push({
    id: id++,
    type: "tier-winner",
    tier: 3,
    tierLabel: TIER_LABELS[3],
    insurer: t3Winner.insurer,
    amount: t3Winner.amount,
    timestamp: 20.6,
  });

  // Final summary
  events.push({
    id: id++,
    type: "summary",
    message: "Auction complete · finalising your offers",
    timestamp: 21.4,
  });

  return events;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function roundTo(n: number, to: number): number {
  return Math.round(n / to) * to;
}

const TOTAL_DURATION_SEC = 22.5;

export function LiveBidFeed({
  currentPremium,
  vehicleLabel,
  apiReturned,
  onComplete,
}: Props) {
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const script = useState(() => generateScript(currentPremium))[0];

  // Schedule each event reveal
  useEffect(() => {
    const timeouts = script.map((event) =>
      setTimeout(
        () => {
          setRevealedIds((prev) => new Set(prev).add(event.id));
        },
        event.timestamp * 1000
      )
    );
    return () => timeouts.forEach(clearTimeout);
  }, [script]);

  // Elapsed counter
  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const e = (Date.now() - start) / 1000;
      setElapsed(Math.min(e, TOTAL_DURATION_SEC));
      if (e >= TOTAL_DURATION_SEC) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to latest event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [revealedIds]);

  // Trigger onComplete when both script finished and API returned
  useEffect(() => {
    if (completedRef.current) return;
    const scriptDone = elapsed >= TOTAL_DURATION_SEC - 0.3;
    if (scriptDone && apiReturned) {
      completedRef.current = true;
      // Brief pause for the "Auction complete" message to settle
      setTimeout(() => onComplete(), 700);
    }
  }, [elapsed, apiReturned, onComplete]);

  // Track running-lowest across tiers for the summary line
  const runningLowest = (() => {
    const visibleBids = script
      .filter((e) => revealedIds.has(e.id) && e.type === "bid" && e.amount)
      .map((e) => ({ insurer: e.insurer!, amount: e.amount!, tier: e.tier! }));
    if (visibleBids.length === 0) return null;
    return visibleBids.reduce((a, b) => (a.amount < b.amount ? a : b));
  })();

  const progressPct = Math.min(100, (elapsed / TOTAL_DURATION_SEC) * 100);

  return (
    <div className="w-full max-w-2xl mx-auto py-2">
      {/* Header card */}
      <div className="rounded-2xl border border-brand-light-gray bg-white shadow-soft overflow-hidden">
        {/* Title strip */}
        <div className="bg-gradient-to-r from-brand-deepblue to-brand-electricblue text-white px-5 py-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 animate-pulse-soft" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Auction live
              </span>
              {vehicleLabel && (
                <span className="text-xs opacity-80 hidden sm:inline">
                  · {vehicleLabel}
                </span>
              )}
            </div>
            <div className="text-xs font-mono tabular-nums opacity-90">
              {formatTime(elapsed)} / {formatTime(TOTAL_DURATION_SEC)}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2.5 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Event feed (scrollable) */}
        <div
          ref={scrollRef}
          className="max-h-[380px] overflow-y-auto px-3 py-3 space-y-1.5"
        >
          {script
            .filter((e) => revealedIds.has(e.id))
            .map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          {/* Pulse for "next event coming" if not done yet */}
          {revealedIds.size < script.length && (
            <div className="flex items-center gap-2 text-xs text-brand-slate animate-pulse-soft px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
              Receiving next bid...
            </div>
          )}
        </div>

        {/* Running lowest summary */}
        {runningLowest && (
          <div className="border-t border-brand-light-gray bg-brand-offwhite/60 px-5 py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-brand-slate">
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                <span>Best price so far</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-brand-charcoal tabular-nums">
                <InsurerLogo
                  insurerName={INSURER_NAMES[runningLowest.insurer]}
                  size={16}
                />
                <span>{INSURER_NAMES[runningLowest.insurer]}</span>
                <span className="text-brand-orange">
                  {formatINR(runningLowest.amount)}
                </span>
                <span className="text-[10px] text-brand-slate font-normal">
                  · Tier {runningLowest.tier}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-brand-slate/70 mt-3">
        9 bids · 3 insurers × 3 tiers · You&apos;ll see all of them on the next
        screen
      </p>
    </div>
  );
}

// ============================================================================
// Individual event row
// ============================================================================

function EventRow({ event }: { event: BidEvent }) {
  const ts = formatTime(event.timestamp);

  if (event.type === "join") {
    const name = INSURER_NAMES[event.insurer!];
    return (
      <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-xs">
        <span className="font-mono tabular-nums text-brand-slate/70 shrink-0 w-9">
          {ts}
        </span>
        <InsurerLogo insurerName={name} size={18} />
        <span className="text-brand-slate">
          <span className="font-semibold text-brand-charcoal">{name}</span>{" "}
          joined the auction
        </span>
      </div>
    );
  }

  if (event.type === "tier-start") {
    return (
      <div className="flex items-center gap-2 py-2.5 mt-2 px-2">
        <div className="h-px flex-1 bg-brand-light-gray" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-deepblue px-2">
          Tier {event.tier} · {event.tierLabel}
        </span>
        <div className="h-px flex-1 bg-brand-light-gray" />
      </div>
    );
  }

  if (event.type === "bid") {
    const name = INSURER_NAMES[event.insurer!];
    return (
      <div
        className={clsx(
          "flex items-center gap-2.5 py-2 px-2 rounded-lg text-xs animate-in-bid",
          event.isLowest && "bg-emerald-50/60"
        )}
      >
        <span className="font-mono tabular-nums text-brand-slate/70 shrink-0 w-9">
          {ts}
        </span>
        <InsurerLogo insurerName={name} size={18} />
        <span className="flex-1 text-brand-charcoal">
          <span className="font-semibold">{name}</span>{" "}
          <span className="text-brand-slate">bids</span>
        </span>
        <span
          className={clsx(
            "font-bold tabular-nums text-sm shrink-0",
            event.isLowest ? "text-brand-success" : "text-brand-charcoal"
          )}
        >
          {formatINR(event.amount!)}
        </span>
        {event.isLowest && (
          <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-brand-success text-white rounded shrink-0">
            <ChevronsDown className="w-2.5 h-2.5" />
            New low
          </span>
        )}
      </div>
    );
  }

  if (event.type === "tier-winner") {
    const name = INSURER_NAMES[event.insurer!];
    return (
      <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg bg-gradient-to-r from-brand-orange/10 to-transparent border-l-2 border-brand-orange text-xs">
        <Trophy className="w-4 h-4 text-brand-orange shrink-0" />
        <span className="flex-1 text-brand-charcoal">
          <span className="font-bold">Tier {event.tier} winner:</span>{" "}
          <span className="font-semibold">{name}</span>
        </span>
        <span className="font-bold tabular-nums text-sm text-brand-orange shrink-0">
          {formatINR(event.amount!)}
        </span>
      </div>
    );
  }

  if (event.type === "summary") {
    return (
      <div className="flex items-center gap-2.5 py-3 px-2 text-xs animate-pulse-soft">
        <Sparkles className="w-4 h-4 text-brand-deepblue" />
        <span className="font-semibold text-brand-deepblue">
          {event.message}
        </span>
      </div>
    );
  }

  return null;
}

function formatTime(s: number): string {
  const mm = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
}
