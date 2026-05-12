"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, FileText, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { CircularJourneyLoader } from "@/components/circular-journey-loader";
import { StopwatchChip } from "@/components/stopwatch-chip";
import {
  MidLoadQuestions,
  answersToQuery,
  type MidLoadAnswers,
} from "@/components/mid-load-questions";

type UploadState = "idle" | "uploading" | "parsing" | "done" | "error";

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

export function UploadDropzone({
  demoMode = false,
  onBusyChange,
  backHref = "/",
}: UploadDropzoneProps) {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

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
      answersRef.current = {};
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
          const err = await res.json();
          throw new Error(err.error || "Failed to analyse policy");
        }

        const data = await res.json();
        setState("done");

        // Redirect immediately — never gate on the survey. Pass whatever
        // answers the user has set so far (zero to four). The report page
        // simply doesn't render the chips when no answers are present.
        const baseQuery = `from=${t0Ref.current}${demoMode ? "&demo=1" : ""}`;
        const ansQuery = answersToQuery(answersRef.current);
        const fullQuery = ansQuery ? `${baseQuery}&${ansQuery}` : baseQuery;
        router.push(`/report/${data.id}?${fullQuery}`);
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [router, demoMode]
  );

  const handleAnswersChange = useCallback((a: MidLoadAnswers) => {
    answersRef.current = a;
  }, []);

  // Mirror the busy state to the parent so it can hide page chrome (heading,
  // privacy footer) while the loader is running.
  useEffect(() => {
    const busy =
      state === "uploading" || state === "parsing" || state === "done";
    onBusyChange?.(busy);
  }, [state, onBusyChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: state === "uploading" || state === "parsing",
  });

  if (state === "uploading" || state === "parsing" || state === "done") {
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
            primaryText={
              state === "done"
                ? "Loading your report"
                : "Reading your policy"
            }
            etaText={
              state !== "done" ? "Usually under 2 minutes" : undefined
            }
          />
        </div>

        {/* Productive use of the parse wait — 4 quick taps, never blocks redirect */}
        <MidLoadQuestions onChange={handleAnswersChange} />
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
              ? "border-brand-deepblue bg-blue-50/40 scale-[1.01]"
              : "border-brand-light-gray hover:border-brand-electricblue/60 hover:bg-brand-offwhite/40"
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
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">
              Couldn&apos;t analyse your policy
            </p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
