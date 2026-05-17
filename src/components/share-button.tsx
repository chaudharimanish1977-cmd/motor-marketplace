"use client";

/**
 * ShareButton — the customer-facing "forward this audit" affordance
 * shipped in Phase 7d.3.
 *
 * Two share modes from a single editorial trigger:
 *   1. "Share on WhatsApp" → opens wa.me/?text=… with a pre-filled
 *      message that includes the customer's at-risk number as social
 *      proof + the depersonalized /share/[token] URL.
 *   2. "Copy link" → copies the same /share/[token] URL to clipboard.
 *
 * Both modes lazily mint the share token via /api/share/create/[id]
 * on first interaction (idempotent server-side, so repeated taps
 * don't accumulate dead tokens). The token is reused on subsequent
 * clicks within the session.
 *
 * What the recipient sees on /share/[token] is depersonalized — no
 * owner name / plate / email / mobile / address. Just the vehicle
 * profile, verdict, at-risk number, top gap titles. Safe to forward
 * to a colleague or post in a family group chat.
 */

import { useState } from "react";
import { Share2, Copy, Check, Loader2 } from "lucide-react";

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
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureToken(): Promise<string | null> {
    if (token) return token;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/share/create/${reportId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(
          body.error ??
            "Couldn't generate a share link. Try again or email hello@rightoffer.in."
        );
        return null;
      }
      const body = (await res.json()) as { token: string };
      setToken(body.token);
      return body.token;
    } catch {
      setError("Network error. Try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function shareUrl(t: string): string {
    if (typeof window === "undefined") return `/share/${t}`;
    return `${window.location.origin}/share/${t}`;
  }

  function whatsappText(t: string): string {
    const parts = [
      "I just got a free RightOffer audit on my motor insurance.",
      vehicleLabel ? `${vehicleLabel} — ${atRiskTotalLabel ?? "real exposure"} at risk in mine.` : null,
      "Worth running yours through it (2 minutes, no sales calls):",
      shareUrl(t),
    ].filter(Boolean);
    return parts.join("\n\n");
  }

  async function onCopy() {
    const t = await ensureToken();
    if (!t) return;
    try {
      await navigator.clipboard.writeText(shareUrl(t));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("Clipboard blocked — long-press the link below to copy.");
    }
  }

  async function onWhatsApp() {
    const t = await ensureToken();
    if (!t) return;
    const url = `https://wa.me/?text=${encodeURIComponent(whatsappText(t))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-4 print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onWhatsApp}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-brand-success/40 hover:border-brand-success text-brand-charcoal hover:text-brand-success font-serif italic font-medium text-[14px] md:text-[15px] min-h-[40px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Share2 className="w-3.5 h-3.5" />
          )}
          Share on WhatsApp
        </button>
        <button
          type="button"
          onClick={onCopy}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[14px] md:text-[15px] min-h-[40px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Link copied
            </>
          ) : busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
      {error && (
        <p className="mt-2 font-serif italic text-[13px] text-brand-alert">
          {error}
        </p>
      )}
    </div>
  );
}
