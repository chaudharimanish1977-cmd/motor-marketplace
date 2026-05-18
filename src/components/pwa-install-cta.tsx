"use client";

import { useEffect, useState } from "react";
import { Smartphone, Share, Plus, X } from "lucide-react";

/**
 * PWA install affordance. The PWA manifest + icons ship in
 * src/app/manifest.ts + /pwa-icon-{192,512}/route.tsx, so install
 * criteria are already satisfied — this component is just the
 * visible button + the platform-specific UX behind it.
 *
 * Platform support matrix:
 *   Android Chrome / Edge / Brave    one-tap install via beforeinstallprompt
 *   Desktop Chrome / Edge / Brave    same event, native install sheet
 *   iOS Safari (iPhone + iPad)       no API — show a walkthrough modal
 *                                    ("tap Share → Add to Home Screen")
 *   iOS Chrome / Firefox / etc.      WebKit underneath, no PWA install on iOS
 *   Desktop Firefox                  no event fires; hide the button
 *   Already installed                hide entirely (display-mode standalone)
 *
 * Mount where return visits cluster — /me, /report/[id]. Adding to
 * the home page is excess; first-time visitors haven't yet decided
 * whether the product is worth keeping around.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Mode = "hidden" | "android-desktop" | "ios-safari" | "ios-modal-open";

export function PwaInstallCta() {
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already running as installed PWA → don't show anything.
    if (
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      return;
    }
    // iOS Safari quirk: navigator.standalone is true when running
    // from home screen on iOS even before media queries report it.
    if (
      typeof navigator !== "undefined" &&
      (navigator as Navigator & { standalone?: boolean }).standalone
    ) {
      return;
    }

    // Path A — Chromium / Edge fire beforeinstallprompt when install
    // criteria are satisfied. Capture it; show the one-tap button.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("android-desktop");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Path B — iOS Safari: no event ever fires. Detect explicitly and
    // show the walkthrough button. Chrome/Firefox on iOS use the same
    // WebKit engine but reportedly do NOT support add-to-home-screen
    // — restrict to actual Safari.
    const ua = navigator.userAgent;
    const isIOS =
      /iPhone|iPad|iPod/.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    if (isIOS) {
      setMode("ios-safari");
    }

    // If neither path fires we stay hidden. That covers Firefox
    // desktop (no PWA install) + iOS non-Safari + already-installed.

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);

  async function onClickAndroidDesktop() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        // The browser ate the event after use; hide the button so
        // it doesn't sit there looking clickable.
        setMode("hidden");
        setDeferred(null);
      }
      // If dismissed, leave the button visible so they can try again.
    } catch (err) {
      console.error("[pwa] install prompt failed:", err);
    }
  }

  if (mode === "hidden") return null;

  return (
    <section className="mb-8 pl-5 border-l-2 border-brand-sage">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold">
        · Install ·
      </div>
      <h2 className="mt-2 font-serif font-medium text-[20px] md:text-[24px] leading-[1.2] tracking-[-0.01em] text-brand-charcoal m-0">
        Keep RightOffer{" "}
        <span className="italic text-brand-plum">on your home screen.</span>
      </h2>
      <p className="mt-2 font-serif italic text-[14px] md:text-[15px] leading-[1.55] text-brand-slate max-w-md">
        One tap to your saved audits, renewal reminders, and the
        upload form. No app-store roundtrip.
      </p>

      {mode === "android-desktop" && (
        <button
          type="button"
          onClick={onClickAndroidDesktop}
          className="mt-4 inline-flex items-center gap-2 bg-brand-plum text-brand-offwhite px-5 py-2.5 rounded-full font-serif italic font-medium text-[14px] min-h-[40px] hover:opacity-90 transition-opacity"
        >
          <Smartphone className="w-4 h-4" aria-hidden />
          Install the app
        </button>
      )}

      {(mode === "ios-safari" || mode === "ios-modal-open") && (
        <>
          <button
            type="button"
            onClick={() => setMode("ios-modal-open")}
            className="mt-4 inline-flex items-center gap-2 bg-brand-plum text-brand-offwhite px-5 py-2.5 rounded-full font-serif italic font-medium text-[14px] min-h-[40px] hover:opacity-90 transition-opacity"
          >
            <Smartphone className="w-4 h-4" aria-hidden />
            Add to home screen
          </button>
          {mode === "ios-modal-open" && (
            <IosWalkthroughModal onClose={() => setMode("ios-safari")} />
          )}
        </>
      )}
    </section>
  );
}

/** iOS Safari "Add to Home Screen" doesn't have a programmatic
 *  trigger — Apple deliberately requires the user to navigate
 *  Share → Add to Home Screen. We show a 3-step walkthrough
 *  modal so they know exactly what to do. */
function IosWalkthroughModal({ onClose }: { onClose: () => void }) {
  // ESC closes on iPad with bluetooth keyboard. Useful, costs nothing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-elevated p-7 text-left text-brand-charcoal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-offwhite hover:bg-brand-light-gray flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-brand-slate" />
        </button>

        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-sage font-bold mb-2">
          · Add to home screen ·
        </div>
        <h3 className="font-serif font-medium text-[20px] leading-[1.2] tracking-[-0.01em] text-brand-charcoal m-0">
          Three taps on{" "}
          <span className="italic text-brand-plum">Safari.</span>
        </h3>

        <ol className="mt-5 space-y-4 font-serif text-[14.5px] leading-[1.55] text-brand-charcoal">
          <li className="flex gap-3">
            <span className="font-mono text-[11px] font-bold text-brand-plum shrink-0 pt-0.5">
              01
            </span>
            <span>
              Tap the{" "}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-brand-offwhite border border-brand-light-gray rounded text-[12.5px] align-baseline">
                <Share className="w-3.5 h-3.5" aria-hidden />
                Share
              </span>{" "}
              button at the bottom of the screen.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] font-bold text-brand-plum shrink-0 pt-0.5">
              02
            </span>
            <span>
              Scroll and tap{" "}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-brand-offwhite border border-brand-light-gray rounded text-[12.5px] align-baseline">
                <Plus className="w-3.5 h-3.5" aria-hidden />
                Add to Home Screen
              </span>
              .
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[11px] font-bold text-brand-plum shrink-0 pt-0.5">
              03
            </span>
            <span>
              Tap <strong>Add</strong> in the top-right. RightOffer
              lands on your home screen.
            </span>
          </li>
        </ol>

        <p className="mt-5 font-serif italic text-[12.5px] text-brand-slate">
          Works in Safari only. If you&rsquo;re in Chrome or another
          browser on iOS, open this page in Safari first.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full inline-flex items-center justify-center bg-brand-plum text-brand-offwhite px-5 py-2.5 rounded-full font-serif italic font-medium text-[14px] min-h-[40px] hover:opacity-90 transition-opacity"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
