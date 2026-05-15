import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { DesktopAmbientArt } from "@/components/desktop-ambient-art";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/session";
// TopLoader temporarily disabled — first attempt with the nextjs-toploader
// package + the in-tree replacement both correlate with a client-side
// exception on /report in production. Pulling it out entirely while we
// isolate the root cause. Click feedback can be re-added later via a
// per-page <Link>-prefetch + button-level loading state.

// Inline script that runs before React hydrates. Reads the saved theme from
// localStorage and applies the `dark` class to <html> so there's no flash of
// the wrong theme on first paint. Default is light when nothing is saved.
const themeInitScript = `(function(){try{var t=localStorage.getItem('ro-theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Manrope is used for the RightOffer wordmark. Google ships it upright only;
// italic is browser-synthesised via `font-style: italic` on each <text>.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["800"],
});

/**
 * SEO copy targets:
 *   Title       ≤ 60 chars (Google truncates around 580px ≈ 55–60 chars)
 *   Description ≈ 150–160 chars (truncation sweet spot across devices)
 *   Both should mention the core noun ("motor insurance / car insurance")
 *   and the differentiator ("free, independent, AI, 2 minutes").
 */
const TITLE = "RightOffer — AI Motor Insurance Review in Under 2 Minutes";
const DESCRIPTION =
  "Upload your motor insurance policy for a free, independent AI review. Spot coverage gaps, get add-on advice, and find better renewal offers — in 2 minutes.";
const SITE_URL = "https://rightoffer.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — RightOffer",
  },
  description: DESCRIPTION,
  applicationName: "RightOffer",
  authors: [{ name: "RightOffer", url: SITE_URL }],
  creator: "RightOffer",
  publisher: "RightOffer",
  keywords: [
    "car insurance India",
    "motor insurance review",
    "AI insurance review",
    "policy review",
    "car insurance renewal",
    "motor insurance comparison",
    "insurance add-ons",
    "coverage gaps",
    "independent insurance advice",
    "RightOffer",
  ],
  category: "finance",
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "RightOffer",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@rightoffer",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

// JSON-LD structured data — helps Google understand the entity (Organization)
// and the site (WebSite). Increases the chance of rich/sitelinks results.
const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "RightOffer",
  url: SITE_URL,
  logo: `${SITE_URL}/icon`,
  description:
    "Independent, AI-powered motor insurance review and renewal helper for Indian car owners.",
  areaServed: { "@type": "Country", name: "India" },
  email: "hello@rightoffer.in",
  foundingDate: "2026",
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RightOffer",
  url: SITE_URL,
  description: DESCRIPTION,
  inLanguage: "en-IN",
  publisher: {
    "@type": "Organization",
    name: "RightOffer",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionEmail = await getSession();
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-brand-offwhite text-brand-charcoal antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {/* TopLoader removed pending diagnosis — see import comment. */}
        <DesktopAmbientArt />
        <ThemeToggle />
        <div className="relative z-10">
          <SiteHeader signedIn={!!sessionEmail} />
          {children}
        </div>
      </body>
    </html>
  );
}
