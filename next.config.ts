import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse, puppeteer-core + @sparticuz/chromium use Node native modules
  // / native binaries — keep them external from the bundler so Vercel can
  // load them at runtime instead of trying to inline a Chromium build.
  serverExternalPackages: [
    "pdf-parse",
    "puppeteer",
    "puppeteer-core",
    "@sparticuz/chromium",
  ],

  // Strict mode for better React 19 / future-proofing
  reactStrictMode: true,
};

export default nextConfig;
