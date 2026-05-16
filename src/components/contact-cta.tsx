"use client";

import { useState } from "react";
import { ArrowRight, Mail, Copy, Check, X } from "lucide-react";
import clsx from "clsx";

const CONTACT_EMAIL = "hello@rightoffer.in";

interface Props {
  /** Visible label on the trigger button. */
  label?: string;
  /** Tailwind class for the trigger button surface. Default = orange CTA. */
  buttonClassName?: string;
  /** Footnote shown under the trigger. */
  footnote?: string;
}

/**
 * Replacement for the bare `mailto:` CTA. mailto silently fails on devices
 * without a configured mail client (most desktop browsers) — this opens an
 * inline panel with copy-to-clipboard email + WhatsApp deep link, so every
 * user has a working path to reach us regardless of platform.
 */
export function ContactCTA({
  label = "Talk to a RightOffer advisor",
  buttonClassName,
  footnote,
}: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be blocked in some contexts (insecure origins, etc).
      // Fallback: select the email text via a temporary input.
      const tmp = document.createElement("input");
      tmp.value = CONTACT_EMAIL;
      document.body.appendChild(tmp);
      tmp.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // give up — the email is visible on screen, user can copy manually
      }
      document.body.removeChild(tmp);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          "inline-flex items-center gap-2 px-8 py-4 font-bold rounded-2xl shadow-glow hover:scale-105 hover:brightness-110 transition-all",
          buttonClassName ??
            "bg-brand-olive text-white"
        )}
      >
        {label}
        <ArrowRight className="w-5 h-5" />
      </button>
      {footnote && (
        <p className="text-white/70 text-xs mt-4 max-w-md mx-auto">
          {footnote}
        </p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-elevated p-7 text-left text-brand-charcoal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-offwhite hover:bg-brand-light-gray flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-brand-slate" />
            </button>

            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-navy mb-1">
              Talk to a RightOffer advisor
            </div>
            <h2 className="text-xl font-bold mb-2">
              We&apos;ll help you make sense of this report
            </h2>
            <p className="text-sm text-brand-slate mb-5 leading-relaxed">
              Reach out and a real human will respond within 24 hours — no bots,
              no upsell, no obligation.
            </p>

            {/* Email row */}
            <div className="flex items-center gap-2 p-3 rounded-xl border border-brand-light-gray bg-brand-offwhite">
              <Mail className="w-5 h-5 text-brand-navy shrink-0" />
              <span className="flex-1 font-mono text-sm font-semibold text-brand-charcoal truncate">
                {CONTACT_EMAIL}
              </span>
              <button
                type="button"
                onClick={copyEmail}
                className={clsx(
                  "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors",
                  copied
                    ? "bg-brand-success text-white"
                    : "bg-brand-navy text-white hover:brightness-110"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-brand-slate mt-4 text-center">
              We never share your details. Independent advice only.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
