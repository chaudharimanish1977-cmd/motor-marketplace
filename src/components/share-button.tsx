"use client";

/**
 * ShareButton — the customer-facing "forward this audit" affordance
 * shipped in Phase 7d.3 (with mobile gesture fixes).
 *
 * Two share modes from a single editorial trigger pair:
 *   1. "Share on WhatsApp" → opens wa.me/?text=… with a pre-filled
 *      message that includes the customer's at-risk number as social
 *      proof + the depersonalized /share/[token] URL.
 *   2. "Copy link" → puts the same /share/[token] URL on the clipboard.
 *
 * Mobile gesture discipline (important — iOS Safari is strict):
 *   - The share token is MINTED ON MOUNT via useEffect, not lazily on
 *     click. So when the user actually taps Share / Copy, the click
 *     handler is fully synchronous: no `await fetch(...)` between the
 *     gesture and the clipboard / window.open call. iOS Safari blocks
 *     clipboard.writeText and popups when the call sits behind an
 *     async boundary after the user gesture.
 *   - The clipboard call uses a "user-select textarea + execCommand"
 *     fallback path when navigator.clipboard isn't available (older
 *     in-app browsers, e.g. some Instagram / Twitter WebViews). The
 *     textarea is rendered offscreen and the gesture is preserved.
 *   - Both buttons stay enabled while the token is in-flight; if the
 *     user is faster than the network, they see a one-second "Hang
 *     on…" beat instead of a disabled button.
 *
 * What the recipient sees on /share/[token] is depersonalized — no
 * owner name / plate / email / mobile / address. Just the vehicle
 * profile, verdict, at-risk number, top gap titles.
 */

import { useEffect, useRef, useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

interface Props {
  reportId: string;
  /** Used in the WhatsApp message body — gives the recipient a number
   *  to anchor on ("₹X at risk on my policy"). */
  atRiskTotalLabel?: string;
  /** Vehicle make+model used in the WhatsApp message body. */
  vehicleLabel?: string;
}

export function ShareButton({
  reportId,
  atRiskTotalLabel,
  vehicleLabel,
}: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  // Mint the share token on mount so the click handlers are gesture-
  // pure. /api/share/create is idempotent: repeated mounts return the
  // same token, so we don't accumulate dead rows on re-render.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/share/create/${reportId}`, {
          method: "POST",
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          if (!cancelled) {
            setTokenError(
              body.error ??
                "Couldn't generate a share link. Refresh the page or email hello@rightoffer.in."
            );
          }
          return;
        }
        const body = (await res.json()) as { token: string };
        if (!cancelled) setToken(body.token);
      } catch {
        if (!cancelled) setTokenError("Network error. Try refreshing.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  function shareUrl(t: string): string {
    if (typeof window === "undefined") return `/share/${t}`;
    return `${window.location.origin}/share/${t}`;
  }

  function whatsappText(t: string): string {
    const parts = [
      "I just got a free RightOffer audit on my motor insurance.",
      vehicleLabel
        ? `${vehicleLabel} — ${atRiskTotalLabel ?? "real exposure"} at risk in mine.`
        : null,
      "Worth running yours through it (2 minutes, no sales calls):",
      shareUrl(t),
    ].filter(Boolean);
    return parts.join("\n\n");
  }

  // Hidden textarea fallback for clipboard. Some iOS WebViews and
  // older Safari versions don't expose navigator.clipboard; the
  // textarea + execCommand("copy") path still works there because
  // we keep the call inside the synchronous gesture handler.
  const fallbackInputRef = useRef<HTMLTextAreaElement | null>(null);

  function onCopy() {
    // Fully synchronous — no async barrier between gesture and clipboard
    if (!token) {
      setInfo("Hang on — preparing your link…");
      window.setTimeout(() => setInfo(null), 1500);
      return;
    }
    const url = shareUrl(token);

    // Try the modern API first
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      navigator.clipboard.writeText(url).then(
        () => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 3000);
        },
        () => execCommandFallback(url)
      );
      return;
    }
    execCommandFallback(url);
  }

  function execCommandFallback(url: string) {
    const ta = fallbackInputRef.current;
    if (!ta) {
      setInfo(`Long-press to copy: ${url}`);
      return;
    }
    ta.value = url;
    ta.focus();
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } else {
      setInfo(`Long-press to copy: ${url}`);
    }
  }

  function onWhatsApp() {
    // Same gesture discipline — no await between click and window.open
    if (!token) {
      setInfo("Hang on — preparing your link…");
      window.setTimeout(() => setInfo(null), 1500);
      return;
    }
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappText(token))}`;
    // On iOS/Android Chrome, top.location is the most reliable way to
    // open wa.me without popup-blocker interference. window.open works
    // in most cases but falls back gracefully through this assignment.
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      // Popup blocked → navigate the current tab instead (WhatsApp will
      // intercept the wa.me URL and either open the app or its web UI).
      window.location.href = url;
    }
  }

  // Outright failure to mint a token — render disabled state with the
  // server's error message so the customer can email us.
  if (tokenError) {
    return (
      <div className="mt-4 print:hidden">
        <p className="font-serif italic text-[13px] text-brand-alert">
          {tokenError}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onWhatsApp}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-brand-success/40 hover:border-brand-success text-brand-charcoal hover:text-brand-success font-serif italic font-medium text-[14px] md:text-[15px] min-h-[40px] transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share on WhatsApp
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[14px] md:text-[15px] min-h-[40px] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Link copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy share link
            </>
          )}
        </button>
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
        · Shared page is depersonalised · No name, plate, email, or address ·
      </p>
      {info && (
        <p className="mt-2 font-serif italic text-[12.5px] text-brand-slate break-all">
          {info}
        </p>
      )}
      {/* Offscreen textarea used by the execCommand("copy") fallback
          on older iOS Safari / in-app WebViews where
          navigator.clipboard isn't available. Positioned absolutely so
          it doesn't take any visible space. */}
      <textarea
        ref={fallbackInputRef}
        aria-hidden
        tabIndex={-1}
        readOnly
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "1px",
          height: "1px",
          opacity: 0,
        }}
      />
    </div>
  );
}
