"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import {
  ArrowLeft,
  Upload,
  FileText,
  RefreshCw,
  CheckCircle2,
  Plus,
  ArrowRight,
} from "lucide-react";
import clsx from "clsx";
import { CircularJourneyLoader } from "@/components/circular-journey-loader";
import { StopwatchChip } from "@/components/stopwatch-chip";
import {
  MidLoadQuestions,
  answersToQuery,
  type MidLoadAnswers,
} from "@/components/mid-load-questions";

type UploadState = "idle" | "uploading" | "parsing" | "done" | "error";

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

function TimerChip({ startedAt }: { startedAt: number }) {
  return (
    <div
      className="absolute top-3 right-3 z-10 rounded-full bg-white shadow-soft print:hidden"
      style={{ padding: 2 }}
    >
      <StopwatchChip startedAt={startedAt} size={54} />
    </div>
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
}: UploadDropzoneProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<UploadError | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [lastDoc, setLastDoc] = useState<ParsedDoc | null>(null);
  // Accumulated list of every doc parsed in this browser session.
  // Drives the multi-doc Done card (count + per-type breakdown +
  // single "See my reports" CTA). Survives "Add another" clicks
  // because we don't reset it there — only the per-upload state
  // (preview, startedAt, error) clears.
  const [uploadedDocs, setUploadedDocs] = useState<ParsedDoc[]>([]);
  const uploadCount = uploadedDocs.length;

  // Refs so the async parse closure always reads the latest survey answers
  // and timestamp without needing them in the deps array.
  const answersRef = useRef<MidLoadAnswers>({});
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
          setState("error");
          setError({
            headline:
              errBody.headline ?? "Couldn't analyse this",
            body:
              errBody.body ??
              errBody.error ??
              "Try uploading the original PDF from your insurer.",
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

        const newDoc: ParsedDoc = {
          id: data.id,
          vehicleLabel: vehicleLabel || "your document",
          insurerName: parsed.insurerName ?? "",
          documentType,
          viewUrl: `/report/${data.id}?${fullQuery}`,
        };
        setLastDoc(newDoc);
        setUploadedDocs((docs) => [...docs, newDoc]);
        setState("done");
        // answersRef intentionally NOT reset — see onDrop note above.
        // Survey answers persist so a second upload skips already-
        // answered questions via MidLoadQuestions's skipAnswered prop.
      } catch (err) {
        setState("error");
        setError({
          headline: "Connection hiccup 📡",
          body:
            err instanceof Error
              ? err.message
              : "Couldn't reach our servers. Give it another shot in a sec.",
        });
      }
    },
    [demoMode]
  );

  const handleAnswersChange = useCallback((a: MidLoadAnswers) => {
    answersRef.current = a;
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

  // ---------- Loader (uploading / parsing) ----------
  if (state === "uploading" || state === "parsing") {
    return (
      <div className="space-y-4">
        <div className="relative rounded-3xl bg-white border border-brand-light-gray shadow-soft p-6">
          <BackChip href={backHref} />
          {startedAt !== null && <TimerChip startedAt={startedAt} />}
          <CircularJourneyLoader
            vehicleLabel={preview?.vehicleLabel ?? undefined}
            registrationNumber={preview?.registrationNumber ?? undefined}
            rtoCity={preview?.rtoCity ?? undefined}
            vehicleAgeYears={preview?.ageYears ?? undefined}
            vehicleMake={preview?.make ?? undefined}
            vehicleModel={preview?.model ?? undefined}
            stage="parsing"
            startedAt={startedAt ?? undefined}
            primaryText="Reading your policy"
            etaText="Usually under 2 minutes"
          />
        </div>

        {/* Productive use of the parse wait — 4 quick taps. Persisted
            across uploads: if the customer already answered any
            questions on a prior upload, the survey jumps past them.
            Once all 4 are done the component renders a tight "all set"
            card instead of the carousel. */}
        <MidLoadQuestions
          key={`midload-${uploadCount}`}
          onChange={handleAnswersChange}
          initialAnswers={answersRef.current}
          skipAnswered
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
            "border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all bg-white",
            isDragActive
              ? "border-brand-navy bg-brand-navy/10 scale-[1.01]"
              : "border-brand-light-gray hover:border-brand-navy/60 hover:bg-brand-offwhite/40"
          )}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto text-brand-slate/70" />
          <div className="mt-4 space-y-1">
            <p className="text-lg font-semibold text-brand-charcoal">
              Drop your policy PDF here
            </p>
            <p className="text-sm text-brand-slate">
              or click to browse from your computer
            </p>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-brand-slate/70">
            <FileText className="w-4 h-4" />
            PDF only · max 10 MB
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-brand-coral/40 bg-gradient-to-br from-brand-coral/10 to-white p-5 shadow-soft">
          <div className="text-lg md:text-xl font-bold text-brand-charcoal leading-snug">
            {error.headline}
          </div>
          <div className="text-sm text-brand-slate mt-1.5 leading-relaxed">
            {error.body}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
                setState("idle");
                open();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy hover:brightness-110 text-white text-sm font-semibold shadow-soft transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Try another file
            </button>
            <span className="text-xs text-brand-slate">
              Private car PDFs only · max 10 MB
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
