import type { MetadataRoute } from "next";

/**
 * Web App Manifest — Next.js app/manifest.ts convention serves this
 * at /manifest.webmanifest and Next.js auto-includes the <link
 * rel="manifest"> tag in <head> across every page.
 *
 * Makes RightOffer installable as a PWA — "Add to Home Screen" on
 * Chrome Android (auto-banner when criteria met), Chrome desktop
 * (address-bar install icon). Safari iOS doesn't fire the install
 * prompt event; iOS users add manually via the Share menu, so we
 * may layer an iOS-specific hint UI later (v1.1).
 *
 * Display mode: "standalone" — when installed, the app opens
 * without the browser chrome (URL bar, tabs) so customers feel
 * like they're in a native app, not a browser tab.
 *
 * Icon sizes: 192 + 512 are both required by Chrome's installable
 * criteria. Served from /pwa-icon-192 and /pwa-icon-512 (separate
 * route handlers — Next.js only allows one icon.tsx per directory).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RightOffer — Motor insurance review",
    short_name: "RightOffer",
    description:
      "Independent motor insurance audit for Indian car owners. Free, in under 2 minutes. No sales calls.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfbf6", // brand-offwhite (light mode)
    theme_color: "#3a1e3d", // brand-plum
    orientation: "portrait-primary",
    categories: ["finance", "utilities", "productivity"],
    lang: "en-IN",
    icons: [
      {
        src: "/pwa-icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        // Same 512×512 image marked maskable — lets Android draw it
        // inside its various adaptive-icon shapes (circle, squircle,
        // teardrop) without cropping our visible content. Our icon
        // sits in a plum tile with the car centred + plenty of
        // padding, so it works as either "any" or "maskable".
        src: "/pwa-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
