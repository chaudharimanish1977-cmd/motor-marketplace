/**
 * Email-only magic-link sign-in form.
 *
 * Phase 6.2.1 reframe — editorial styling to sit cleanly under the
 * official Google / Apple buttons:
 *   · Plum-pill submit button (matches the journey's CTA family)
 *   · Hairline input border + plum focus
 *   · Sage success state (no emerald boxes)
 *   · Coral error tint (real brand-alert) — used sparingly
 *
 * Submits to /api/auth/request-link which always returns a generic
 * success (preventing email enumeration), so the UI shows the
 * "check your inbox" confirmation regardless of whether the email
 * is actually registered.
 */
"use client";

import { useState, type FormEvent } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErrorMsg(data.error ?? "Couldn't send the link. Try again.");
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setErrorMsg(
        "Network error. Check your connection and try again."
      );
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="text-center">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brand-sage font-bold">
          · Check your inbox ·
        </div>
        <p className="mt-3 font-serif italic text-[14px] md:text-[15px] text-brand-slate leading-[1.55]">
          If <span className="not-italic text-brand-charcoal">{email}</span>{" "}
          is linked to a policy, we just sent you a sign-in link. It works
          for 15 minutes.
        </p>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setErrorMsg(null);
          }}
          className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-plum hover:opacity-80 font-bold transition-opacity"
        >
          · Use a different email ·
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate font-bold mb-1.5">
          Email address
        </span>
        <input
          type="email"
          required
          autoFocus
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3 font-serif text-[15px] text-brand-charcoal placeholder:text-brand-slate/50 bg-brand-offwhite border border-brand-charcoal/15 rounded-full focus:outline-none focus:border-brand-plum focus:ring-2 focus:ring-brand-plum/15 transition-colors"
        />
      </label>
      {errorMsg && (
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-alert font-bold text-center">
          · {errorMsg} ·
        </p>
      )}
      <button
        type="submit"
        disabled={state === "sending" || !email}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3 rounded-full font-serif italic font-medium text-[15px] min-h-[44px] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {state === "sending"
          ? "Sending the link…"
          : "Email me a sign-in link"}
      </button>
    </form>
  );
}
