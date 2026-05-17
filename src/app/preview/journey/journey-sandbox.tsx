/**
 * JourneySandbox — internal harness for previewing the 6-stop Journey
 * without uploading a real PDF.
 *
 * Controls (top strip):
 *   · State A / B / C / D — picks lifecycle copy
 *   · Vehicle preset — Audi A6 (the dev-test sample), or default
 *   · Doc count 1 / 2 — toggles multi-doc framing in State A
 *   · Days override — overrides daysUntilExpiry (handy for State A
 *                     edge cases like "today" / "tomorrow")
 *   · Parse done — flips parseComplete so Stitching can release
 *   · Error — injects a parse-error and renders the recovery card
 *   · Reset — re-mounts the Journey so it restarts at Hello
 *
 * The Journey is mounted in a "no auto-redirect" config — onComplete
 * just shows a confirmation chip instead of navigating, so we can
 * preview Destination without losing the sandbox.
 */
"use client";

import { useState } from "react";
import {
  Journey,
  type JourneyParseError,
} from "@/components/upload-journey/journey";
import type { LifecycleState } from "@/lib/lifecycle-state";

const PRESETS = {
  audiA6: {
    vehicleLabel: "Audi A6",
    insurerName: "HDFC ERGO",
  },
  honda: {
    vehicleLabel: "Honda City",
    insurerName: "ICICI Lombard",
  },
  generic: {
    vehicleLabel: "your car",
    insurerName: undefined,
  },
} as const;

type PresetKey = keyof typeof PRESETS;

type JumpPhase =
  | "auto"
  | "hello"
  | "read"
  | "ask"
  | "preview"
  | "stitching"
  | "destination";

export function JourneySandbox() {
  const [state, setState] = useState<LifecycleState>("A");
  const [preset, setPreset] = useState<PresetKey>("audiA6");
  const [docCount, setDocCount] = useState<number>(1);
  const [daysOverride, setDaysOverride] = useState<number | null>(0);
  const [parseDone, setParseDone] = useState(false);
  const [errorOn, setErrorOn] = useState(false);
  const [journeyKey, setJourneyKey] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [jumpTo, setJumpTo] = useState<JumpPhase>("auto");
  // Dev-only — backdates the journey's "startedAt" so the Destination
  // footer can be verified against both regimes (<120s fast, >120s
  // traffic). null = use real mount time (default fallback line).
  const [simulatedElapsedMs, setSimulatedElapsedMs] = useState<
    number | null
  >(null);

  const ctx = {
    vehicleLabel: PRESETS[preset].vehicleLabel,
    insurerName: PRESETS[preset].insurerName,
    docCount,
    daysUntilExpiry: daysOverride,
  };

  const parseError: JourneyParseError | null = errorOn
    ? {
        headline: "Couldn't read this PDF.",
        body: "Try uploading the original PDF from your insurer — the one with the IRDAI header.",
      }
    : null;

  const reset = () => {
    setJourneyKey((k) => k + 1);
    setParseDone(false);
    setErrorOn(false);
    setCompleted(false);
  };

  return (
    <div>
      {/* Controls strip */}
      <div className="rounded-2xl bg-brand-surface border border-brand-charcoal/15 px-4 py-3.5 mb-6 space-y-3">
        <ControlRow label="State">
          {(["A", "B", "C", "D"] as LifecycleState[]).map((s) => (
            <Chip
              key={s}
              active={state === s}
              onClick={() => setState(s)}
            >
              {s}
            </Chip>
          ))}
        </ControlRow>

        <ControlRow label="Vehicle">
          {(Object.keys(PRESETS) as PresetKey[]).map((p) => (
            <Chip
              key={p}
              active={preset === p}
              onClick={() => setPreset(p)}
            >
              {PRESETS[p].vehicleLabel}
            </Chip>
          ))}
        </ControlRow>

        <ControlRow label="Doc count">
          {[1, 2].map((n) => (
            <Chip
              key={n}
              active={docCount === n}
              onClick={() => setDocCount(n)}
            >
              {n}
            </Chip>
          ))}
        </ControlRow>

        <ControlRow label="Days to expiry">
          {[0, 1, 7, 30, 45].map((d) => (
            <Chip
              key={d}
              active={daysOverride === d}
              onClick={() => setDaysOverride(d)}
            >
              {d}d
            </Chip>
          ))}
          <Chip
            active={daysOverride === -12}
            onClick={() => setDaysOverride(-12)}
          >
            −12d (lapsed)
          </Chip>
        </ControlRow>

        <ControlRow label="Simulate">
          <Chip active={parseDone} onClick={() => setParseDone((v) => !v)}>
            Parse done
          </Chip>
          <Chip active={errorOn} onClick={() => setErrorOn((v) => !v)}>
            Inject error
          </Chip>
          <Chip onClick={reset}>↻ Restart</Chip>
        </ControlRow>

        <ControlRow label="Simulated elapsed">
          <Chip
            active={simulatedElapsedMs === null}
            onClick={() => {
              setSimulatedElapsedMs(null);
              setJourneyKey((k) => k + 1);
            }}
          >
            Live
          </Chip>
          <Chip
            active={simulatedElapsedMs === 87_000}
            onClick={() => {
              setSimulatedElapsedMs(87_000);
              setJourneyKey((k) => k + 1);
            }}
          >
            1m 27s (fast)
          </Chip>
          <Chip
            active={simulatedElapsedMs === 110_000}
            onClick={() => {
              setSimulatedElapsedMs(110_000);
              setJourneyKey((k) => k + 1);
            }}
          >
            1m 50s (fast)
          </Chip>
          <Chip
            active={simulatedElapsedMs === 151_000}
            onClick={() => {
              setSimulatedElapsedMs(151_000);
              setJourneyKey((k) => k + 1);
            }}
          >
            2m 31s (traffic)
          </Chip>
        </ControlRow>

        <ControlRow label="Jump to stop">
          {(
            [
              "auto",
              "hello",
              "read",
              "ask",
              "preview",
              "stitching",
              "destination",
            ] as JumpPhase[]
          ).map((p) => (
            <Chip
              key={p}
              active={jumpTo === p}
              onClick={() => {
                setJumpTo(p);
                // Re-key the Journey so it remounts with the new
                // initialPhase. Clear parse-state so the new mount
                // starts fresh.
                setJourneyKey((k) => k + 1);
                setCompleted(false);
              }}
            >
              {p}
            </Chip>
          ))}
        </ControlRow>

        {completed && (
          <div className="text-[12px] font-mono uppercase tracking-[0.12em] text-brand-plum">
            · onComplete fired · (would navigate to /report/[id] in prod) ·
          </div>
        )}
      </div>

      {/* The Journey itself, mounted inside the same shell the dropzone uses */}
      <div className="rounded-3xl bg-brand-offwhite border border-brand-charcoal/10 p-6 md:p-10">
        <Journey
          key={journeyKey}
          state={state}
          context={ctx}
          parseComplete={parseDone}
          parseError={parseError}
          initialPhase={jumpTo === "auto" ? undefined : jumpTo}
          startedAt={
            simulatedElapsedMs !== null
              ? Date.now() - simulatedElapsedMs
              : undefined
          }
          onComplete={() => setCompleted(true)}
          onRetry={reset}
          onAbandon={reset}
        />
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate text-center">
        · Sandbox · auto-advance timings are live — restart to reset clocks ·
      </p>
    </div>
  );
}

function ControlRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate w-24 shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1 rounded-full border font-mono text-[10.5px] uppercase tracking-[0.08em] transition-colors ${
        active
          ? "border-brand-plum bg-brand-plum/10 text-brand-plum"
          : "border-brand-charcoal/20 text-brand-slate hover:border-brand-charcoal/50 hover:text-brand-charcoal"
      }`}
    >
      {children}
    </button>
  );
}
