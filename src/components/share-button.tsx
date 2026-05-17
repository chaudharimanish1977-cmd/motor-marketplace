"use client";

/**
 * ShareButton — the customer-facing "forward this audit" affordance
 * shipped in Phase 7d.3.
 *
 * Single share mode (WhatsApp-only as of the post-launch mobile fix):
 *   "Share on WhatsApp" → opens wa.me/?text=… with a pre-filled
 *   message that includes the customer's at-risk number as social
 *   proof + the depersonalized /share/[token] URL.
 *
 * Why no "Copy link" affordance: clipboard behavior in mobile in-app
 * WebViews (Instagram, Gmail, WhatsApp's own browser) is unreliable
 * even with the execCommand fallback. The pre-filled WhatsApp message
 * already carries the link as plain text, so the recipient — or the
 * sharer — can long-press to copy it from there if needed.
 *
 * Mobile gesture discipline (iOS Safari is strict):
 *   - The share token is MINTED ON MOUNT via useEffect, not lazily on
 *     click. So when the user actually taps Share, the click handler
 *     is fully synchronous: no `await fetch(...)` between the gesture
 *     and the window.open call. iOS Safari blocks popups when the
 *     call sits behind an async boundary after the user gesture.
 *
 * What the recipient sees on /share/[token] is depersonalized — no
 * owner name / plate / email / mobile / address. Just the vehicle
 * profile, verdict, at-risk number, top gap titles.
 */

import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";

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
  const [info, setInfo] = useState<string | null>(null);

  // Mint the share token on mount so the click handler is gesture-
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

  function onWhatsApp() {
    // Fully synchronous — no async barrier between click and window.open
    if (!token) {
      setInfo("Hang on — preparing your link…");
      window.setTimeout(() => setInfo(null), 1500);
      return;
    }
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappText(token))}`;
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
      <button
        type="button"
        onClick={onWhatsApp}
        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-brand-success/40 hover:border-brand-success text-brand-charcoal hover:text-brand-success font-serif italic font-medium text-[14px] md:text-[15px] min-h-[40px] transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share on WhatsApp
      </button>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
        · Shared page is depersonalised · No name, plate, email, or address ·
      </p>
      {info && (
        <p className="mt-2 font-serif italic text-[12.5px] text-brand-slate break-all">
          {info}
        </p>
      )}
    </div>
  );
}
