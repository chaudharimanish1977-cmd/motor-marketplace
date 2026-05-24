"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  Trophy,
  ChevronsDown,
  Sparkles,
} from "lucide-react";
import { InsurerLogo } from "@/components/insurer-logos";
import { formatINR } from "@/lib/format";
import type { TierSummary, Bid } from "@/lib/types";

/**
 * Live bid feed — animates the bidding wait. The previous version played
 * a scripted sequence with synthetic amounts (currentPremium × tier
 * multipliers), which read believably during the wait but didn't match
 * the real bids the customer saw on the next screen — confusing.
 *
 * Now: the script is only generated AFTER /api/bid returns, using the
 * REAL bid data. While the API is in flight, we show a "reaching out to
 * insurers" stage (insurer chips fade in, no amounts). When real bids
 * arrive, we play a quick 7s auction reveal animation using the actual
 * winning numbers, then trigger the redirect.
 *
 * Total perceived time: API wait (~20-25s) + reveal animation (~7s).
 * The reveal numbers always match the "Pick your coverage level" page
 * because they come from the same data source.
 */

interface Props {
  /** Customer's current premium — used as a fallback label. */
  currentPremium: number;
  /** Vehicle label e.g. "Maruti Wagon R" — shown in headline */
  vehicleLabel?: string;
  /** Set to true once /api/bid returns. */
  apiReturned: boolean;
  /** Real tier+bid data from /api/bid response. Null until apiReturned. */
  realTiers?: TierSummary[] | null;
  /** Called when the reveal animation finishes AND apiReturned is true. */
  onComplete: () => void;
}

interface BidEvent {
  id: number;
  type: "join" | "activity" | "tier-start" | "bid" | "tier-winner" | "summary";
  insurer?: string;
  insurerSlug?: "bharatsure" | "vahana" | "suraksha";
  tier?: 1 | 2 | 3;
  tierLabel?: string;
  amount?: number;
  delta?: number;
  isLowest?: boolean;
  message?: string;
  /** Seconds relative to phase start (waiting phase or reveal phase) */
  timestamp: number;
}

// Ambient "thinking" messages that play during the API wait so the
// auction feed feels alive instead of dead. Cycled in order; each
// emits ~every 1.7s starting after the join phase. Stops the moment
// the API returns and the reveal phase takes over.
const THINKING_MESSAGES: { insurerSlug: "bharatsure" | "vahana" | "suraksha"; verb: string }[] = [
  { insurerSlug: "bharatsure", verb: "connected · pulling your profile" },
  { insurerSlug: "vahana", verb: "connected · pulling your profile" },
  { insurerSlug: "suraksha", verb: "connected · pulling your profile" },
  { insurerSlug: "bharatsure", verb: "analysing claim history" },
  { insurerSlug: "vahana", verb: "verifying NCB with prior insurer" },
  { insurerSlug: "suraksha", verb: "computing IDV-anchored premium" },
  { insurerSlug: "bharatsure", verb: "scoring add-on risk for your vehicle" },
  { insurerSlug: "vahana", verb: "preparing Tier 1 quote (Basic)" },
  { insurerSlug: "suraksha", verb: "preparing Tier 1 quote (Basic)" },
  { insurerSlug: "bharatsure", verb: "preparing Tier 2 quote (Recommended)" },
  { insurerSlug: "vahana", verb: "preparing Tier 2 quote (Recommended)" },
  { insurerSlug: "suraksha", verb: "preparing Tier 3 quote (Super Cover)" },
  { insurerSlug: "bharatsure", verb: "finalising tier ordering" },
  { insurerSlug: "vahana", verb: "submitting bid to auction" },
  { insurerSlug: "suraksha", verb: "submitting bid to auction" },
];

const TIER_LABELS = {
  1: "Basic Cover",
  2: "Recommended Cover",
  3: "Super Cover",
} as const;

const INSURER_SLUGS = ["bharatsure", "vahana", "suraksha"] as const;
type InsurerSlug = (typeof INSURER_SLUGS)[number];

const INSURER_DISPLAY: Record<InsurerSlug, string> = {
  bharatsure: "BharatSure General",
  vahana: "Vahana Insurance",
  suraksha: "Suraksha Motors",
};

/**
 * Pick an insurer slug for the given insurerName (matching by substring).
 * Falls back to a stable hash so unrecognised names still get a logo.
 */
function slugForInsurer(name: string): InsurerSlug {
  const lower = name.toLowerCase();
  if (lower.includes("bharat")) return "bharatsure";
  if (lower.includes("vahana")) return "vahana";
  if (lower.includes("suraksha")) return "suraksha";
  // Hash the name to one of the three for unknown insurers
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return INSURER_SLUGS[Math.abs(h) % INSURER_SLUGS.length];
}

// Phase 1: insurer-join "waiting" events — same regardless of bid data.
function waitingPhaseEvents(): BidEvent[] {
  const out: BidEvent[] = [];
  let id = 0;
  out.push({ id: id++, type: "join", insurerSlug: "bharatsure", insurer: INSURER_DISPLAY.bharatsure, timestamp: 0.6 });
  out.push({ id: id++, type: "join", insurerSlug: "vahana", insurer: INSURER_DISPLAY.vahana, timestamp: 1.3 });
  out.push({ id: id++, type: "join", insurerSlug: "suraksha", insurer: INSURER_DISPLAY.suraksha, timestamp: 2.0 });
  return out;
}

// Phase 2: reveal — generated from the real tier+bid data so amounts
// shown here always match the "Pick your coverage level" screen.
function revealPhaseEvents(
  realTiers: TierSummary[],
  startId: number,
  /** seconds from the start of the reveal phase to begin */
  startAt = 0.2,
): BidEvent[] {
  const out: BidEvent[] = [];
  let id = startId;
  let t = startAt;

  const sortedTiers = [...realTiers].sort((a, b) => a.tier - b.tier);
  for (const tier of sortedTiers) {
    if (!tier.available || tier.bids.length === 0) continue;
    out.push({
      id: id++,
      type: "tier-start",
      tier: tier.tier,
      tierLabel: TIER_LABELS[tier.tier],
      timestamp: t,
    });
    t += 0.5;

    // Show all bids in ascending price order so the winning lowest is last.
    const ordered = [...tier.bids].sort((a, b) => a.grandTotal - b.grandTotal);
    let runningLow = Infinity;
    // Reveal in reverse (highest first) so the "new low" lands on the winner.
    const revealOrder = [...ordered].reverse();
    revealOrder.forEach((bid: Bid, i) => {
      const isLow = bid.grandTotal < runningLow;
      if (isLow) runningLow = bid.grandTotal;
      out.push({
        id: id++,
        type: "bid",
        insurer: bid.insurerName,
        insurerSlug: slugForInsurer(bid.insurerName),
        tier: tier.tier,
        amount: bid.grandTotal,
        isLowest: isLow,
        timestamp: t + i * 0.55,
      });
    });
    t += revealOrder.length * 0.55 + 0.2;

    const winner = ordered[0];
    out.push({
      id: id++,
      type: "tier-winner",
      tier: tier.tier,
      tierLabel: TIER_LABELS[tier.tier],
      insurer: winner.insurerName,
      insurerSlug: slugForInsurer(winner.insurerName),
      amount: winner.grandTotal,
      timestamp: t,
    });
    t += 0.9;
  }

  out.push({
    id: id++,
    type: "summary",
    message: "Auction complete · finalising your offers",
    timestamp: t + 0.2,
  });
  return out;
}

export function LiveBidFeed({
  vehicleLabel,
  apiReturned,
  realTiers,
  onComplete,
}: Props) {
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [activityEvents, setActivityEvents] = useState<BidEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  // Phase 1 events (waiting joins) — always the same; mount-time.
  const waitingEvents = useMemo(() => waitingPhaseEvents(), []);

  // Phase 2 events (reveal) — generated once realTiers arrives.
  const [revealEvents, setRevealEvents] = useState<BidEvent[] | null>(null);
  const revealStartRef = useRef<number | null>(null);

  // Schedule the waiting-phase events from mount.
  useEffect(() => {
    const timeouts = waitingEvents.map((e) =>
      setTimeout(
        () => setRevealedIds((prev) => new Set(prev).add(e.id)),
        e.timestamp * 1000,
      ),
    );
    return () => timeouts.forEach(clearTimeout);
  }, [waitingEvents]);

  // Ambient "thinking" stream — starts ~2.5s after mount (after the 3
  // insurer-join events) and emits a new activity row every 1.7s until
  // the API returns. Cycles through THINKING_MESSAGES, looping if the
  // API takes longer than expected. Keeps the feed feeling alive while
  // /api/bid is in flight (typically 18-25s).
  useEffect(() => {
    if (apiReturned) return;
    let cancelled = false;
    let idx = 0;
    let nextId = 1000; // distinct from waiting / reveal event ids

    const emit = () => {
      if (cancelled) return;
      const msg = THINKING_MESSAGES[idx % THINKING_MESSAGES.length];
      idx += 1;
      const event: BidEvent = {
        id: nextId++,
        type: "activity",
        insurerSlug: msg.insurerSlug,
        insurer: INSURER_DISPLAY[msg.insurerSlug],
        message: msg.verb,
        timestamp: 0,
      };
      setActivityEvents((prev) => [...prev, event]);
      setRevealedIds((prev) => new Set(prev).add(event.id));
    };

    // First activity lands shortly after the last insurer-join.
    const firstTimer = setTimeout(emit, 2500);
    const interval = setInterval(emit, 1700);
    return () => {
      cancelled = true;
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [apiReturned]);

  // When apiReturned + realTiers both ready, build reveal events.
  useEffect(() => {
    if (!apiReturned || !realTiers || revealEvents) return;
    const startId = waitingEvents.length + 100;
    const events = revealPhaseEvents(realTiers, startId);
    setRevealEvents(events);
    revealStartRef.current = performance.now();
  }, [apiReturned, realTiers, revealEvents, waitingEvents.length]);

  // Schedule reveal-phase events relative to reveal-phase start.
  useEffect(() => {
    if (!revealEvents) return;
    const timeouts = revealEvents.map((e) =>
      setTimeout(
        () => setRevealedIds((prev) => new Set(prev).add(e.id)),
        e.timestamp * 1000,
      ),
    );
    return () => timeouts.forEach(clearTimeout);
  }, [revealEvents]);

  // Auto-scroll to latest event.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [revealedIds]);

  // Fire onComplete once the reveal phase finishes.
  useEffect(() => {
    if (!revealEvents || completedRef.current) return;
    const lastEvent = revealEvents[revealEvents.length - 1];
    if (!lastEvent) return;
    const totalRevealMs = (lastEvent.timestamp + 0.7) * 1000;
    const handle = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    }, totalRevealMs);
    return () => clearTimeout(handle);
  }, [revealEvents, onComplete]);

  // Running-lowest summary across revealed real bid events only.
  const runningLowest = useMemo(() => {
    if (!revealEvents) return null;
    const visible = revealEvents.filter(
      (e) => revealedIds.has(e.id) && e.type === "bid" && e.amount,
    );
    if (visible.length === 0) return null;
    return visible.reduce((a, b) => ((a.amount ?? Infinity) < (b.amount ?? Infinity) ? a : b));
  }, [revealEvents, revealedIds]);

  const allEvents = useMemo(
    () => [...waitingEvents, ...activityEvents, ...(revealEvents ?? [])],
    [waitingEvents, activityEvents, revealEvents],
  );

  return (
    <div className="w-full max-w-2xl mx-auto py-2">
      <div className="rounded-2xl border border-brand-light-gray dark:border-slate-700 bg-white shadow-soft overflow-hidden">
        <div className="bg-gradient-to-r from-brand-plum to-brand-sage text-white px-5 py-3.5">
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
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
              {revealEvents ? "Revealing bids" : "Reaching insurers…"}
            </span>
          </div>
        </div>

        {/* Event feed (scrollable) */}
        <div
          ref={scrollRef}
          className="max-h-[380px] overflow-y-auto px-3 py-3 space-y-1.5"
        >
          {allEvents
            .filter((e) => revealedIds.has(e.id))
            .map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          {!revealEvents && (
            <div className="flex items-center gap-2 text-xs text-brand-slate animate-pulse-soft px-2 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-plum" />
              Insurers reviewing your profile…
            </div>
          )}
        </div>

        {runningLowest && (
          <div className="border-t border-brand-light-gray bg-brand-offwhite/60 px-5 py-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-brand-slate">
                <Sparkles className="w-3.5 h-3.5 text-brand-sage" />
                <span>Best price so far</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-brand-charcoal tabular-nums">
                <InsurerLogo
                  insurerName={runningLowest.insurer ?? ""}
                  size={16}
                />
                <span>{runningLowest.insurer}</span>
                <span className="text-brand-sage">
                  {formatINR(runningLowest.amount!)}
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
  if (event.type === "join") {
    return (
      <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-xs">
        <InsurerLogo insurerName={event.insurer ?? ""} size={18} />
        <span className="text-brand-slate">
          <span className="font-semibold text-brand-charcoal">
            {event.insurer}
          </span>{" "}
          joined the auction
        </span>
      </div>
    );
  }

  if (event.type === "activity") {
    return (
      <div className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg text-xs animate-in-bid">
        <InsurerLogo insurerName={event.insurer ?? ""} size={18} />
        <span className="text-brand-slate flex-1">
          <span className="font-semibold text-brand-charcoal">
            {event.insurer}
          </span>{" "}
          {event.message}
        </span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-plum/70 animate-pulse-soft shrink-0" />
      </div>
    );
  }

  if (event.type === "tier-start") {
    return (
      <div className="flex items-center gap-2 py-2.5 mt-2 px-2">
        <div className="h-px flex-1 bg-brand-light-gray" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-charcoal px-2">
          Tier {event.tier} · {event.tierLabel}
        </span>
        <div className="h-px flex-1 bg-brand-light-gray" />
      </div>
    );
  }

  if (event.type === "bid") {
    return (
      <div
        className={clsx(
          "flex items-center gap-2.5 py-2 px-2 rounded-lg text-xs animate-in-bid",
          event.isLowest && "bg-emerald-50/60",
        )}
      >
        <InsurerLogo insurerName={event.insurer ?? ""} size={18} />
        <span className="flex-1 text-brand-charcoal">
          <span className="font-semibold">{event.insurer}</span>{" "}
          <span className="text-brand-slate">bids</span>
        </span>
        <span
          className={clsx(
            "font-bold tabular-nums text-sm shrink-0",
            event.isLowest ? "text-brand-success" : "text-brand-charcoal",
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
    return (
      <div className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg bg-gradient-to-r from-brand-sage/10 to-transparent border-l-2 border-brand-sage text-xs">
        <Trophy className="w-4 h-4 text-brand-sage shrink-0" />
        <span className="flex-1 text-brand-charcoal">
          <span className="font-bold">Tier {event.tier} winner:</span>{" "}
          <span className="font-semibold">{event.insurer}</span>
        </span>
        <span className="font-bold tabular-nums text-sm text-brand-sage shrink-0">
          {formatINR(event.amount!)}
        </span>
      </div>
    );
  }

  if (event.type === "summary") {
    return (
      <div className="flex items-center gap-2.5 py-3 px-2 text-xs animate-pulse-soft">
        <Sparkles className="w-4 h-4 text-brand-charcoal" />
        <span className="font-semibold text-brand-charcoal">
          {event.message}
        </span>
      </div>
    );
  }

  return null;
}
