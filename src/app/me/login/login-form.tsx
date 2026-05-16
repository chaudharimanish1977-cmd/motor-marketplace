"use client";

import { useState, type FormEvent } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

/**
 * Email-only sign-in form. Submits to /api/auth/request-link which
 * always returns a generic success (preventing email enumeration), so
 * the UI just shows a "check your inbox" confirmation regardless of
 * whether the email is actually registered.
 *
 * Resending is allowed after a brief client-side cooldown so a
 * mistyped email or a user who never received the mail can try again.
 */
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
      setErrorMsg("Network error. Check your connection and try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-2xl border bg-emerald-50 text-emerald-600 border-emerald-200 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="font-semibold text-brand-charcoal">Check your inbox</div>
        <p className="text-sm text-brand-slate leading-relaxed">
          If <span className="font-medium text-brand-charcoal">{email}</span> is
          linked to a policy, we just sent you a sign-in link. It works for 15
          minutes.
        </p>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setErrorMsg(null);
          }}
          className="mt-2 text-xs text-brand-navy hover:underline font-semibold"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="block text-xs font-semibold text-brand-charcoal mb-1.5">
          Email address
        </span>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-slate/70" />
          <input
            type="email"
            required
            autoFocus
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-brand-light-gray bg-white focus:outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/15 transition-colors"
          />
        </div>
      </label>
      {errorMsg && (
        <p className="text-xs text-red-600 leading-relaxed">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={state === "sending" || !email}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-brand-charcoal hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all"
      >
        {state === "sending" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Email me a sign-in link"
        )}
      </button>
    </form>
  );
}
