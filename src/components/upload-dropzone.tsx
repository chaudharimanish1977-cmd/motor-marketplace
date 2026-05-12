"use client";

import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { Upload, FileText, AlertCircle } from "lucide-react";
import clsx from "clsx";
import { CircularJourneyLoader } from "@/components/circular-journey-loader";
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
}

export function UploadDropzone({ demoMode = false }: UploadDropzoneProps) {
  const router = useRouter();
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  // Mid-load survey state. Both halves (parse done, answers done) must
  // resolve before we redirect — whichever finishes first waits.
  const [parsedId, setParsedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<MidLoadAnswers | null>(null);
  const t0Ref = useRef<number>(0);

  // Trigger redirect once BOTH parse and answers have landed.
  const tryRedirect = useCallback(
    (id: string | null, ans: MidLoadAnswers | null) => {
      if (!id || !ans) return;
      const baseQuery = `from=${t0Ref.current}${demoMode ? "&demo=1" : ""}`;
      const ansQuery = answersToQuery(ans);
      const fullQuery = ansQuery ? `${baseQuery}&${ansQuery}` : baseQuery;
      router.push(`/report/${id}?${fullQuery}`);
    },
    [router, demoMode]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const t0 = Date.now();
      t0Ref.current = t0;
      setStartedAt(t0);
      setFileName(file.name);
      setError(null);
      setParsedId(null);
      setAnswers(null);
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

        // Step 2: Full LLM parse + report generation (~30s)
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
        setParsedId(data.id);
        // Defer to micro-task so React commits parsedId before tryRedirect reads it.
        setTimeout(() => tryRedirect(data.id, answers), 0);
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [tryRedirect, answers]
  );

  const handleAnswersComplete = useCallback(
    (a: MidLoadAnswers) => {
      setAnswers(a);
      tryRedirect(parsedId, a);
    },
    [parsedId, tryRedirect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: state === "uploading" || state === "parsing",
  });

  if (state === "uploading" || state === "parsing" || state === "done") {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl bg-white border border-brand-light-gray shadow-soft p-6">
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
                ? "Done — loading your report..."
                : preview?.vehicleLabel
                  ? "Analysing your policy"
                  : "Reading your policy"
            }
            etaText={
              state !== "done" ? "Usually under 2 minutes" : undefined
            }
          />
          {fileName && (
            <div className="text-center text-[11px] text-brand-slate/70 mt-2">
              {fileName}
            </div>
          )}
        </div>

        {/* Productive use of the parse wait — collect 4 personalisation Qs */}
        <MidLoadQuestions onComplete={handleAnswersComplete} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
