import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DesktopAmbientArt } from "@/components/desktop-ambient-art";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rightoffer.in"),
  title: "RightOffer — A simpler way to choose insurance",
  description:
    "Upload your motor policy. Get a clear, independent AI review of what's covered, what's missing, and what to look for at renewal — in under 2 minutes. Most people sell insurance. We help you decide.",
  openGraph: {
    title: "RightOffer — A simpler way to choose insurance",
    description:
      "Independent AI review of your motor policy in under 2 minutes. Most people sell insurance. We help you decide.",
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
        <DesktopAmbientArt />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
