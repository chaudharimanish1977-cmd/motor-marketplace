import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rightoffer.in"),
  title: "RightOffer — Right insurance, right reasons, in under 2 minutes",
  description:
    "Upload your motor policy and get a clear AI-powered review of what's covered, what's missing, and what to look for at renewal. Independent, India-first, in under 2 minutes.",
  openGraph: {
    title: "RightOffer — Smart car insurance reviews",
    description:
      "Independent AI review of your motor policy in under 2 minutes. Understand coverage gaps before they become out-of-pocket surprises.",
    siteName: "RightOffer",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-brand-offwhite text-brand-charcoal antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
