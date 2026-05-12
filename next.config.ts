import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse and puppeteer use Node native modules - keep them external from the bundler
  serverExternalPackages: ["pdf-parse", "puppeteer"],

  // Strict mode for better React 19 / future-proofing
  reactStrictMode: true,
};

export default nextConfig;
