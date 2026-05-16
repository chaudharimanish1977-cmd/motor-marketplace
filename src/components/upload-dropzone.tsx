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
  FolderOpen,
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
import {
  EmailCaptureForm,
  type EmailCapturePayload,
} from "@/components/email-capture-form";

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
  /** Pre-known email if the visitor already has a session (either full
   *  magic-link session or upload session from earlier in this browser).
   *  When set, the email-capture form is skipped — no point asking for
   *  what we already have. Server-resolved in /upload/page.tsx. */
  knownEmail?: string;
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
  documentType: "policy" | "quote";
  viewUrl: string;
}

export function UploadDropzone({
  demoMode = false,
  onBusyChange,
  backHref = "/",
  knownEmail,
}: UploadDropzoneProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<UploadError | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [lastDoc, setLastDoc] = useState<ParsedDoc | null>(null);
  // How many parses have completed in this session. Surfaces a small
  // "2 documents uploaded this session" counter on the Done screen so
  // a returning quote-comparator user can see what's accumulating.
  const [uploadCount, setUploadCount] = useState(0);

  // Email-capture state. needsEmail starts true unless the parent
  // passed knownEmail (already-signed-in or already-claimed in this
  // browser). Once the customer submits + the claim succeeds we
  // flip to false and the form stops appearing for subsequent
  // uploads in the same session.
  const [needsEmail, setNeedsEmail] = useState(!knownEmail);
  // Holds the email payload if the customer submitted BEFORE parse
  // finished. As soon as parse returns the doc ID, we fire the claim
  // with this payload + the new doc ID.
  const [queuedClaim, setQueuedClaim] = useState<EmailCapturePayload | null>(
    null
  );
  // Briefly true after a successful claim — drives the green "Saved"
  // banner in the form before it unmounts.
  const [claimed, setClaimed] = useState(false);

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

        setLastDoc({
          id: data.id,
          vehicleLabel: vehicleLabel || "your document",
          documentType,
          viewUrl: `/report/${data.id}?${fullQuery}`,
        });
        setUploadCount((n) => n + 1);
        setState("done");
        // Reset survey answers so a second upload doesn't carry the first
        // upload's chip selections into its report query.
        answersRef.current = {};
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

  /**
   * Fire the actual claim call against /api/upload-session/claim.
   * Centralised so both "submit after parse finishes" and "submit
   * during parse, fire-on-completion" paths converge here.
   */
  const runClaim = useCallback(
    async (payload: EmailCapturePayload, docIds: string[]) => {
      const res = await fetch("/api/upload-session/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: payload.email,
          whatsapp: payload.whatsapp,
          docIds,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Couldn't save email — try again.");
      }
      // Flip the form's local "claimed" state — drives the brief green
      // banner, then `needsEmail` flipping false unmounts the form
      // entirely on the next render.
      setClaimed(true);
      // Skip the email form on any subsequent uploads in this session.
      // Small delay so the green confirmation has time to register.
      setTimeout(() => {
        setNeedsEmail(false);
        setClaimed(false);
      }, 1200);
    },
    []
  );

  /**
   * onClaim handler passed to <EmailCaptureForm>. If the parse is
   * still in flight (no doc ID yet), queue the payload — useEffect
   * below will fire the claim once `lastDoc` becomes available.
   * Otherwise call immediately with the known doc ID.
   */
  const handleEmailSubmit = useCallback(
    async (payload: EmailCapturePayload) => {
      if (lastDoc) {
        await runClaim(payload, [lastDoc.id]);
      } else {
        // Defer until parse finishes — useEffect will fire it.
        setQueuedClaim(payload);
      }
    },
    [lastDoc, runClaim]
  );

  // Fire queued claim once parse delivers a doc ID.
  useEffect(() => {
    if (!queuedClaim || !lastDoc) return;
    let cancelled = false;
    (async () => {
      try {
        await runClaim(queuedClaim, [lastDoc.id]);
      } catch (err) {
        // Surface back to the form via a quick state nudge — the
        // form itself has its own error display when onClaim throws.
        // We do the catch here to prevent unhandled rejection.
        if (!cancelled) console.error("[upload] Claim failed:", err);
      } finally {
        if (!cancelled) setQueuedClaim(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queuedClaim, lastDoc, runClaim]);

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

        {/* Email capture — mandatory in the customer flow, skipped when
            knownEmail is set (already-signed-in or already-claimed in
            this browser). Submission can happen before parse finishes
            — the parent queues the claim and fires it once the doc
            ID is available. */}
        {needsEmail && (
          <EmailCaptureForm onClaim={handleEmailSubmit} claimed={claimed} />
        )}

        {/* Productive use of the parse wait — 4 quick taps */}
        <MidLoadQuestions onChange={handleAnswersChange} />
      </div>
    );
  }

  // ---------- Done — success card with two CTAs ----------
  if (state === "done" && lastDoc) {
    const isQuote = lastDoc.documentType === "quote";
    return (
      <div className="space-y-4">
        <div className="relative rounded-3xl bg-white border border-brand-light-gray shadow-soft p-6 md:p-8">
          <BackChip href={backHref} />
          <div className="flex flex-col items-center text-center pt-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="mt-4 text-xl md:text-2xl font-bold text-brand-charcoal tracking-tight">
              {isQuote ? "Quote analysed" : "Policy analysed"}
            </h2>
            <p className="mt-1.5 text-sm text-brand-slate">
              <span className="font-semibold text-brand-charcoal">
                {lastDoc.vehicleLabel}
              </span>
              {" · "}
              {isQuote ? "Renewal quote" : "Insurance policy"}
            </p>

            <div className="mt-7 w-full max-w-md space-y-2">
              <LoadingLink
                href={lastDoc.viewUrl}
                spinnerPosition="right"
                className="block w-full py-3.5 text-center font-bold rounded-2xl bg-brand-orange hover:brightness-110 text-white shadow-glow transition-all"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  View {isQuote ? "quote analysis" : "report"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </LoadingLink>
              <button
                type="button"
                onClick={() => {
                  // Soft reset for "Add another": clear per-upload state,
                  // keep uploadCount so the counter accumulates across docs.
                  setState("idle");
                  setError(null);
                  setPreview(null);
                  setLastDoc(null);
                  setStartedAt(null);
                  // Survey answers already reset on parse success.
                }}
                className="block w-full py-3 text-center font-semibold rounded-2xl bg-white border-2 border-brand-deepblue text-brand-deepblue hover:bg-blue-50 transition-all"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add another document
                </span>
              </button>
              <LoadingLink
                href="/me"
                spinnerPosition="right"
                className="block w-full py-2.5 text-center text-sm font-semibold text-brand-slate hover:text-brand-charcoal"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" />
                  View all my documents
                </span>
              </LoadingLink>
            </div>

            {uploadCount > 1 && (
              <p className="mt-5 text-[11px] text-brand-slate/80">
                {uploadCount} documents uploaded this session
              </p>
            )}
          </div>
        </div>

        {/* If the customer never submitted email during parse, the form
            shows here on the Done card too — last-chance capture before
            they navigate away. */}
        {needsEmail && (
          <EmailCaptureForm onClaim={handleEmailSubmit} claimed={claimed} />
        )}
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
        <div className="rounded-2xl border-2 border-brand-orange/40 bg-gradient-to-br from-orange-50 to-white p-5 shadow-soft">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-deepblue hover:brightness-110 text-white text-sm font-semibold shadow-soft transition-all"
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
