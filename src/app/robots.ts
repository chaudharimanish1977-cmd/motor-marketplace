import type { MetadataRoute } from "next";

// Production robots policy.
//   - Public: landing page (/) and its assets
//   - Private (disallowed): the user flow pages (upload/report/bid/checkout/
//     policy/renewals/thank-you/offer) hold personal data; investor + pitch
//     + logo are internal-facing surfaces; /api is server-only.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",
          "/upload",
          "/report/",
          "/bid/",
          "/offer/",
          "/checkout/",
          "/comparison/",
          "/policy/",
          "/renewals/",
          "/thank-you",
          "/investor",
          "/pitch",
          "/logo",
        ],
      },
    ],
    sitemap: "https://rightoffer.in/sitemap.xml",
    host: "https://rightoffer.in",
  };
}
