import type { MetadataRoute } from "next";
import { isProductionEnvironment } from "@/lib/feature-flags";

// Production robots policy.
//   - Public: landing page (/) and its assets
//   - Private (disallowed): the user flow pages (upload/report/bid/checkout/
//     policy/renewals/thank-you/offer) hold personal data; investor + pitch
//     + logo are internal-facing surfaces; /api is server-only.
//
// Non-production deployments (demo.rightoffer.in, Vercel previews, dev)
// disallow everything — they should never appear in Google's index. The
// marketplace UI is visible on these environments and we don't want it
// confused with the production audit-only product.
export default function robots(): MetadataRoute.Robots {
  // Block all crawling on non-production deployments. Belt-and-braces:
  // demo + preview deployments shouldn't surface in search results even
  // if someone discovers the URL.
  if (!isProductionEnvironment()) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    };
  }

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
