"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

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
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-slate hover:text-brand-charcoal px-3 py-1.5 rounded-xl border border-brand-light-gray hover:bg-white transition-colors disabled:opacity-60"
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
