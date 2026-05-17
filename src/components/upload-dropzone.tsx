"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  ArrowRight,
} from "lucide-react";
import { SketchCarStatic } from "@/components/sketches";
import clsx from "clsx";
import {
  answersToQuery,
  priorityFromChipParam,
  type MidLoadAnswers,
} from "@/components/mid-load-questions";
import { Journey } from "@/components/upload-journey/journey";
import type { JourneyAnswers } from "@/lib/journey-copy";
import type { LifecycleState } from "@/lib/lifecycle-state";

type UploadState = "idle" | "uploading" | "parsing" | "done";

interface UploadError {
  headline: string;
  body: string;
}

interface PreviewData {
  vehicleLabel: string | null;
  registrationNumber: string | null;
  rtoCity: string | null;
  ageYears: number | null;
  make: string | null;
  model: string | null;
}

interface UploadDropzoneProps {
  /** When true, redirects pass `demo=1` so the report page renders the full
   *  investor flow (bid CTAs, etc). Customer view leaves it false. */
  demoMode?: boolean;
  /** Notify parent when the dropzone enters/leaves the busy (loading) state. */
  onBusyChange?: (busy: boolean) => void;
  /** Where the in-card Back chevron should link to. Default `/`. */
  backHref?: string;
  /** Home-page chip raw value (`pay_less` / `worry_less` / null). When
   *  present, the MidLoadQuestions priority answer is pre-filled so the
   *  user doesn't see that question during parsing. */
  priorityChip?: string | null;
  /** Lifecycle state to render the 5-act Journey in. Default "B". */
  journeyState?: LifecycleState;
  /** Document position within the visitor's running stack. When > 1
   *  the Journey copy flips into multi-doc framing. Default 1. */
  journeyDocCount?: number;
}

function BackChip({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="absolute top-3 left-3 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-brand-light-gray text-brand-slate hover:text-brand-charcoal shadow-soft transition-colors print:hidden"
      aria-label="Back"
    >
      <ArrowLeft className="w-4 h-4" />
    </Link>
  );
}

/**
 * Editorial timer caption shown in the journey card's top-right
 * during the parsing run:
 *
 *     · 14s · STILL READING ·
 *
 * Rendered INLINE (not absolutely positioned) inside a flex header
 * row so it never overlaps the conversational masthead below. Once
 * the journey arrives at Destination, the dropzone passes `endedAt`
 * and the timer freezes at that moment + swaps "Still reading" →
 * "Drive complete".
 */
function TimerChip({
  startedAt,
  endedAt,
}: {
  startedAt: number;
  endedAt?: number | null;
}) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (endedAt) return; // frozen — no need to tick
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [endedAt]);
  const cutoff = endedAt ?? now;
  const elapsed = Math.max(0, Math.floor((cutoff - startedAt) / 1000));
  const display =
    elapsed < 60
      ? `${elapsed}s`
      : `${Math.floor(elapsed / 60)}m ${(elapsed % 60)
          .toString()
          .padStart(2, "0")}s`;
  return (
    <div
      className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-slate print:hidden whitespace-nowrap"
      aria-label={`Elapsed time ${display}`}
    >
      <span
        className={`font-bold tabular-nums ${
          endedAt ? "text-brand-sage" : "text-brand-plum"
        }`}
      >
        {display}
      </span>
      <span className="mx-1.5">·</span>
      <span>{endedAt ? "Drive complete" : "Still reading"}</span>
    </div>
  );
}

/**
 * Inline back-arrow used in the journey card's header row. Separate
 * from the absolute-positioned `BackChip` used on the idle dropzone
 * tile (which works fine there because it doesn't share vertical
 * space with anything).
 */
function InlineBackArrow({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-brand-light-gray text-brand-slate hover:text-brand-charcoal shadow-soft transition-colors print:hidden"
      aria-label="Back"
    >
      <ArrowLeft className="w-4 h-4" />
    </Link>
  );
}

/**
 * Result of a single successful parse — stored so the "Done" screen
 * can offer a "View report" CTA pointing at the just-parsed document.
 * Reset (along with `state`) when the user picks "Add another."
 */
interface ParsedDoc {
  id: string;
  vehicleLabel: string;
  insurerName: string;
  documentType: "policy" | "quote";
  viewUrl: string;
}

export function UploadDropzone({
  demoMode = false,
  onBusyChange,
  backHref = "/",
  priorityChip = null,
  journeyState = "B",
  journeyDocCount = 1,
}: UploadDropzoneProps) {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<UploadError | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [lastDoc, setLastDoc] = useState<ParsedDoc | null>(null);
  // Journey hand-off: once /api/parse completes, the report URL lands
  // here; the Journey component holds the customer in the 5-act
  // experience and fires onComplete only after both parse + minimum-
  // duration are satisfied. onComplete pushes to this URL.
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  // Wall-clock moment the journey arrived at Destination. Set via
  // Journey's onArrival callback. Drives the editorial timer freeze
  // so the elapsed count stops at the official "we made it" moment.
  const [arrivedAt, setArrivedAt] = useState<number | null>(null);
  // Accumulated list of every doc parsed in this browser session.
  // Drives the multi-doc Done card (count + per-type breakdown +
  // single "See my reports" CTA). Survives "Add another" clicks
  // because we don't reset it there — only the per-upload state
  // (preview, startedAt, error) clears.
  const [uploadedDocs, setUploadedDocs] = useState<ParsedDoc[]>([]);
  const uploadCount = uploadedDocs.length;

  // Refs so the async parse closure always reads the latest survey answers
  // and timestamp without needing them in the deps array.
  // Pre-seed the answers with the home-page chip selection (if any) so
  // the MidLoadQuestions carousel can skip the priority question entirely.
  const answersRef = useRef<MidLoadAnswers>({
    priority: priorityFromChipParam(priorityChip) ?? undefined,
  });
  const t0Ref = useRef<number>(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const t0 = Date.now();
      t0Ref.current = t0;
      // NOTE: deliberately NOT resetting answersRef here. The
      // mid-load survey captures customer-level attributes (annual
      // km, who drives, etc.) which are stable across documents.
      // Asking again on each upload reads as "we don't remember you."
      setStartedAt(t0);
      setArrivedAt(null);
      setError(null);
      setState("uploading");

      // Build the FormData once; reuse for both preview + full parse
      const buildFormData = () => {
        const fd = new FormData();
        fd.append("file", file);
        return fd;
      };

      try {
        // Step 1: Fast regex preview to personalise the loader (~1s)
        fetch("/api/parse-preview", {
          method: "POST",
          body: buildFormData(),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.preview) {
              setPreview({
                vehicleLabel: data.preview.vehicleLabel,
                registrationNumber: data.preview.registrationNumber,
                rtoCity: data.preview.rto,
                ageYears: data.preview.ageYears,
                make: data.preview.make,
                model: data.preview.model,
              });
            }
          })
          .catch(() => {
            // Preview is best-effort — silent failure is OK
          });

        // Move to parsing state shortly after upload starts
        setTimeout(() => {
          setState((s) => (s === "uploading" ? "parsing" : s));
        }, 1200);

        // Step 2: Full LLM parse (~30s)
        const res = await fetch("/api/parse", {
          method: "POST",
          body: buildFormData(),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          // Don't unmount the Journey — leave state as "parsing" and
          // let the Journey absorb the error via parseError. The
          // editorial-style ActError card replaces the active act and
          // gives the customer a clean retry path without yanking
          // them back to the dropzone.
          setError({
            headline:
              errBody.headline ?? "Couldn't read this PDF.",
            body:
              errBody.body ??
              errBody.error ??
              "Try uploading the original PDF from your insurer — the one with the IRDAI header.",
          });
          return;
        }

        const data = await res.json();

        // Compose the report URL once so "View report" picks it up below.
        const baseQuery = `from=${t0Ref.current}${demoMode ? "&demo=1" : ""}`;
        const ansQuery = answersToQuery(answersRef.current);
        const fullQuery = ansQuery ? `${baseQuery}&${ansQuery}` : baseQuery;
        const parsed = data.parsed ?? {};
        const documentType: "policy" | "quote" =
          parsed.documentType === "quote" ? "quote" : "policy";
        const vehicleLabel = parsed.vehicle
          ? `${parsed.vehicle.make ?? ""} ${parsed.vehicle.model ?? ""}`.trim()
          : "";

        const viewUrl = `/report/${data.id}?${fullQuery}`;
        const newDoc: ParsedDoc = {
          id: data.id,
          vehicleLabel: vehicleLabel || "your document",
          insurerName: parsed.insurerName ?? "",
          documentType,
          viewUrl,
        };
        setLastDoc(newDoc);
        setUploadedDocs((docs) => [...docs, newDoc]);
        // Hand off to the Journey: state stays as "parsing" so the
        // 5-act sequence keeps rendering. reportUrl signals "parse done";
        // the Journey decides when to actually navigate (hold-to-90s).
        setReportUrl(viewUrl);
        // answersRef intentionally NOT reset — see onDrop note above.
        // Survey answers persist so a second upload skips already-
        // answered questions on a repeat upload.
      } catch (err) {
        // Same Journey-absorption pattern as the !res.ok branch above
        // — keep the editorial frame and recover via ActError.
        setError({
          headline: "Connection hiccup.",
          body:
            err instanceof Error
              ? err.message
              : "Couldn't reach our servers. Give it another shot in a second.",
        });
      }
    },
    [demoMode]
  );

  const handleAnswersChange = useCallback((a: MidLoadAnswers) => {
    answersRef.current = a;
  }, []);

  // The Journey component captures two single-select answers (past
  // claims + what worries you most). Map them onto the existing
  // MidLoadAnswers shape so the downstream report URL query and
  // localStorage persistence keep working with no schema change.
  const handleJourneyAnswersChange = useCallback((a: JourneyAnswers) => {
    answersRef.current = {
      ...answersRef.current,
      pastClaims: a.pastClaims,
      // `worry` is a new dimension; carry it through the `priority`
      // slot for now since both feed the same personalisation engine.
      // Phase 2 can split them apart cleanly.
      priority: a.worry ?? answersRef.current.priority,
    };
  }, []);

  // Mirror the busy state to the parent so it can hide page chrome (heading,
  // privacy footer) while the loader or success card is showing. The done
  // state keeps the chrome hidden so the success card stands alone.
  useEffect(() => {
    const busy =
      state === "uploading" || state === "parsing" || state === "done";
    onBusyChange?.(busy);
  }, [state, onBusyChange]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    noClick: false,
    disabled: state === "uploading" || state === "parsing",
  });

  // ---------- Loader (uploading / parsing) — the 6-stop Journey ----------
  // The Journey self-paces through Hello → Read → Ask → Preview →
  // Stitching → Destination over ~90 seconds. The road bar at the top
  // of the frame shows progress spatially; the car icon glides between
  // milestone flags on each transition. The final Destination beat is
  // tap-to-advance so the customer arrives at /report/[id] when they
  // hit "See the verdict" (or after a 30s fallback).
  if (state === "uploading" || state === "parsing") {
    return (
      <div className="relative rounded-3xl bg-brand-offwhite border border-brand-charcoal/10 p-5 md:p-10">
        {/* Inline header row — back arrow + elapsed timer. Replaces the
         *  previous absolute overlays, which on mobile collided
         *  horizontally with the conversational masthead below
         *  ("Let's take a 2-min test drive together"). Inline keeps
         *  everything in its own vertical band; masthead now sits
         *  cleanly below this row with no overlap risk. */}
        <div className="flex items-center justify-between gap-3 mb-4 md:mb-6 min-h-[36px]">
          <InlineBackArrow href={backHref} />
          {startedAt !== null && !error ? (
            <TimerChip startedAt={startedAt} endedAt={arrivedAt} />
          ) : (
            <span aria-hidden />
          )}
        </div>
        <Journey
          state={journeyState}
          context={{
            vehicleLabel: preview?.vehicleLabel ?? undefined,
            docCount: journeyDocCount,
          }}
          parseComplete={!!reportUrl}
          parseError={error}
          startedAt={startedAt ?? undefined}
          onAnswersChange={handleJourneyAnswersChange}
          onArrival={(ts) => setArrivedAt(ts)}
          onComplete={() => {
            if (reportUrl) router.push(reportUrl);
          }}
          onRetry={() => {
            // Recover in place — clear the error and reopen the picker.
            // The Journey unmounts because state goes back to idle, and
            // the dropzone tile re-renders with the file picker open.
            setError(null);
            setState("idle");
            setPreview(null);
            setStartedAt(null);
            setArrivedAt(null);
            open();
          }}
          onAbandon={() => {
            setError(null);
            setState("idle");
            setPreview(null);
            setStartedAt(null);
            setArrivedAt(null);
          }}
        />
      </div>
    );
  }

  // ---------- Done — success card with summary + CTAs ----------
  if (state === "done" && lastDoc) {
    const policies = uploadedDocs.filter((d) => d.documentType === "policy");
    const quotes = uploadedDocs.filter((d) => d.documentType === "quote");
    const isMulti = uploadedDocs.length > 1;

    // Reset just per-upload state for the "Add another" path. Keeps
    // uploadedDocs intact so the running summary survives.
    const resetForNext = () => {
      setState("idle");
      setError(null);
      setPreview(null);
      setLastDoc(null);
      setStartedAt(null);
      setReportUrl(null);
      setArrivedAt(null);
    };

    return (
      <div className="space-y-4">
        <div className="relative rounded-3xl bg-white border border-brand-light-gray shadow-soft p-6 md:p-8">
          <BackChip href={backHref} />
          <div className="flex flex-col items-center text-center pt-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            {isMulti ? (
              <>
                <h2 className="mt-4 text-xl md:text-2xl font-bold text-brand-charcoal tracking-tight">
                  {uploadedDocs.length} documents analysed
                </h2>
                <p className="mt-1.5 text-sm text-brand-slate">
                  {policies.length > 0 && (
                    <>
                      <span className="font-semibold text-brand-charcoal">
                        {policies.length}{" "}
                        {policies.length === 1 ? "Policy" : "Policies"}
                      </span>
                      {quotes.length > 0 ? " · " : ""}
                    </>
                  )}
                  {quotes.length > 0 && (
                    <span className="font-semibold text-brand-charcoal">
                      {quotes.length}{" "}
                      {quotes.length === 1 ? "Quote" : "Quotes"}
                    </span>
                  )}
                </p>
                {/* Compact list of what was uploaded */}
                <ul className="mt-3 text-[11px] text-brand-slate space-y-0.5 max-w-md">
                  {uploadedDocs.map((d) => (
                    <li key={d.id}>
                      <span className="font-medium text-brand-charcoal">
                        {d.documentType === "policy" ? "Policy" : "Quote"}
                      </span>
                      {d.insurerName ? ` · ${d.insurerName}` : ""}
                      {d.vehicleLabel ? ` · ${d.vehicleLabel}` : ""}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2 className="mt-4 text-xl md:text-2xl font-bold text-brand-charcoal tracking-tight">
                  {lastDoc.documentType === "quote"
                    ? "Quote analysed"
                    : "Policy analysed"}
                </h2>
                <p className="mt-1.5 text-sm text-brand-slate">
                  <span className="font-semibold text-brand-charcoal">
                    {lastDoc.vehicleLabel}
                  </span>
                  {" · "}
                  {lastDoc.documentType === "quote"
                    ? "Renewal quote"
                    : "Insurance policy"}
                </p>
              </>
            )}

            <div className="mt-7 w-full max-w-md space-y-2">
              <LoadingLink
                href="/reports"
                spinnerPosition="right"
                className="block w-full py-3.5 text-center font-bold rounded-2xl bg-brand-olive hover:brightness-110 text-white shadow-glow transition-all"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  See {isMulti ? "my reports" : "my report"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </LoadingLink>
              <button
                type="button"
                onClick={resetForNext}
                className="block w-full py-3 text-center font-semibold rounded-2xl bg-white border-2 border-brand-navy text-brand-navy hover:bg-brand-navy/10 transition-all"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add another document
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <BackChip href={backHref} />
        <div
          {...getRootProps()}
          className={clsx(
            "border-2 border-dashed rounded-3xl px-6 md:px-10 py-10 md:py-14 text-center cursor-pointer transition-all",
            isDragActive
              ? "border-brand-plum bg-brand-plum/8 scale-[1.005]"
              : "border-brand-plum/35 bg-brand-offwhite hover:border-brand-plum/70 hover:bg-brand-plum/[0.03]"
          )}
        >
          <input {...getInputProps()} />

          {/* Kicker */}
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
            · Stop 0 · The drop ·
          </div>

          {/* Sketch — the car driving in from the left */}
          <div className="mt-4 flex justify-center text-brand-plum animate-roadhover">
            <SketchCarStatic width={120} color="currentColor" />
          </div>

          {/* Headline + sub */}
          <h2 className="mt-5 font-serif font-medium text-2xl md:text-[34px] leading-[1.12] tracking-[-0.018em] text-brand-charcoal m-0">
            Drop your policy{" "}
            <span className="italic text-brand-plum">PDF here.</span>
          </h2>
          <p className="mt-2 font-serif italic text-[14px] md:text-base text-brand-slate max-w-md mx-auto leading-[1.5]">
            Or tap anywhere on this card to browse — we&apos;ll be reading
            within the second.
          </p>

          {/* Trust strip */}
          <div className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
            <span>· PDF only ·</span>
            <span>·</span>
            <span>Up to 10 MB ·</span>
            <span>·</span>
            <span>Original insurer file works best ·</span>
          </div>
        </div>

        {/* DPDP consent disclosure — action-based consent. By dropping a
         *  file (or tapping the card to browse), the customer is giving
         *  free, informed consent to our Privacy Policy. The wording
         *  below makes that linkage explicit and offers a one-tap path
         *  to read the policy. Same pattern Indian fintechs (Cred,
         *  Razorpay) use; defensible under DPDP §6 action-based consent
         *  with prominent notice. */}
        <p className="mt-4 font-serif italic text-[12.5px] text-brand-slate text-center max-w-md mx-auto leading-[1.55]">
          By dropping your policy here, you agree to our{" "}
          <Link
            href="/privacy"
            className="text-brand-plum underline decoration-brand-plum/40 hover:decoration-brand-plum transition-colors"
          >
            Privacy Policy
          </Link>{" "}
          — we&apos;ll review your file, never sell your data, and
          never make sales calls.
        </p>
      </div>

      {/* Failure UX is now handled inline inside the Journey via the
       *  editorial ActError card — the dropzone idle state never shows
       *  an error block of its own. */}
    </div>
  );
}
