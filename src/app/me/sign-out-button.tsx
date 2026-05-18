"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

/**
 * Sign-out button. Editorial small-CTA vocab — outlined plum pill,
 * serif italic, same shape as the inline action buttons inside the
 * policy cards. Hovers to plum-text + plum-border so the destructive-
 * ish intent reads clearly without going coral (we save coral for
 * actually-destructive actions like policy / account deletion).
 */
export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSignOut() {
    if (pending) return;
    startTransition(async () => {
      await fetch("/api/me/sign-out", { method: "POST" });
      router.push("/");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-brand-charcoal/25 hover:border-brand-plum hover:text-brand-plum text-brand-charcoal font-serif italic font-medium text-[13px] md:text-[14px] min-h-[36px] transition-colors disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <LogOut className="w-3.5 h-3.5" />
      )}
      Sign out
    </button>
  );
}
