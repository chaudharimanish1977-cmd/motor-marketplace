import type { MetadataRoute } from "next";

// Only public, indexable URLs go here. Investor, pitch, logo, and the
// user-specific flow pages (upload/report/bid/checkout/policy/renewals/
// thank-you/offer) are excluded — see robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://rightoffer.in",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}
