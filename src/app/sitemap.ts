import type { MetadataRoute } from "next";
import { CITIES } from "@/lib/cities";
import { VEHICLES } from "@/lib/vehicles";

// Only public, indexable URLs go here. Investor, pitch, logo, and the
// user-specific flow pages (upload/report/bid/checkout/policy/renewals/
// thank-you/offer) are excluded — see robots.ts.
//
// SEO landing pages: every city profile in src/lib/cities.ts and every
// vehicle profile in src/lib/vehicles.ts gets a sitemap entry. Adding
// a new entry to either array auto-registers the route here.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const baseEntries: MetadataRoute.Sitemap = [
    {
      url: "https://rightoffer.in",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://rightoffer.in/about",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://rightoffer.in/glossary",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://rightoffer.in/sample-review",
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://rightoffer.in/insurance",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const cityEntries: MetadataRoute.Sitemap = CITIES.map((c) => ({
    url: `https://rightoffer.in/insurance/city/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const vehicleEntries: MetadataRoute.Sitemap = VEHICLES.map((v) => ({
    url: `https://rightoffer.in/insurance/car/${v.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...baseEntries, ...cityEntries, ...vehicleEntries];
}
