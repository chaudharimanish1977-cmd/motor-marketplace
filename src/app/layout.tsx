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
  title: "Motor Marketplace — Smart Car Insurance for India",
  description:
    "Upload your motor policy, get an AI-powered review of coverage gaps, and the best curated renewal offers from leading insurers — in under a minute.",
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
