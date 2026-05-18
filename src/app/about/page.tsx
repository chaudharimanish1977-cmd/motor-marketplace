/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import { SketchCarStatic } from "@/components/sketches";

export const metadata: Metadata = {
  title: "Aryan — the analyst at RightOffer",
  description:
    "Aryan is RightOffer's analyst — the careful reader behind every audit. Independent, never selling, only working for you.",
};

/**
 * /about — the character page for Aryan. Aryan is RightOffer's
 * analyst persona: the careful, independent reader who looks at
 * every uploaded policy and writes the audit the customer sees.
 *
 * Honest about what he is (the system + the founder's voice) without
 * pretending to be a person you'll meet for coffee. The page is
 * editorial — a piece of writing the customer can read in 90 seconds
 * and come away knowing what we are, what we won't do, and how to
 * find us.
 */
export default function AboutPage() {
  return (
    <article className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-10 md:py-14 font-serif text-brand-charcoal">
      {/* Masthead */}
      <header className="border-b border-brand-charcoal/15 pb-5 mb-10">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-3">
          · Reading Room · About ·
        </div>
        <h1 className="font-serif font-medium text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] text-brand-charcoal m-0">
          Hello — I&rsquo;m{" "}
          <span className="italic text-brand-plum">Aryan.</span>
        </h1>
        <p className="mt-3 font-serif italic text-[15px] md:text-[17px] leading-[1.55] text-brand-slate max-w-xl">
          The analyst at RightOffer. I read your policy line by line so
          you don&rsquo;t have to. This is who I am, and what
          I won&rsquo;t do.
        </p>
      </header>

      {/* Sketch */}
      <div className="text-brand-plum mb-10 flex justify-center md:justify-start">
        <SketchCarStatic width={120} color="currentColor" />
      </div>

      {/* The story */}
      <div className="space-y-6 text-[16px] md:text-[17px] leading-[1.65] max-w-xl">
        <p>
          Most people who'd read your motor insurance policy line by
          line work for an insurance company. That changes what they
          see — and what they tell you.
        </p>

        <p>
          I don't work for an insurance company. I work for you.
        </p>

        <p>
          I&rsquo;m the analyst at RightOffer — a careful reader of
          everything you upload, the brain that runs the checks, the
          friend at the cocktail party who actually knows insurance
          and will tell you straight what your policy is missing.
        </p>

        <p>
          When you drop a policy here, I&rsquo;ll read every line of
          it. I&rsquo;ll check what you&rsquo;re paying for, what
          you&rsquo;re not, where the gaps are, whether the{" "}
          <Link
            href="/glossary#idv"
            className="italic text-brand-plum hover:underline"
          >
            IDV
          </Link>{" "}
          is fair, what to ask your insurer for at renewal. I&rsquo;ll
          write it up for you in plain English. No salesy padding, no
          jargon for the sake of jargon.
        </p>

        <p>
          When the market moves — when monsoon arrives early, when an
          insurer launches an add-on that matters for your car, when
          premiums shift in your city — I&rsquo;ll come back to you
          with what changed and why it matters for{" "}
          <em className="italic text-brand-plum">your</em> policy. Not
          a generic newsletter. A note from someone who already knows
          what you drive and where you park.
        </p>

        <p>
          I&rsquo;ll do all of this on the same terms, every time:
          free for you, no sales calls, no data sold to third parties.
          Ever.
        </p>
      </div>

      {/* Three principles — editorial pull-block */}
      <section className="mt-12 pl-5 border-l-2 border-brand-plum max-w-xl">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] font-bold text-brand-plum">
          · Three things I stand by ·
        </div>
        <ol className="mt-5 space-y-5 font-serif text-[15.5px] md:text-[16px] leading-[1.65] text-brand-charcoal">
          <li className="flex gap-3">
            <span className="font-mono text-[12px] font-bold text-brand-plum shrink-0 pt-0.5">
              01
            </span>
            <span>
              <strong className="font-semibold">I work only for you.</strong>{" "}
              I don&rsquo;t take referral fees from insurers, I
              don&rsquo;t sell leads, I don&rsquo;t recommend a
              product because it pays me better. The audit is what
              the audit says — nothing more.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[12px] font-bold text-brand-plum shrink-0 pt-0.5">
              02
            </span>
            <span>
              <strong className="font-semibold">I show my work.</strong>{" "}
              Every gap, every strength, every IDV verdict carries a
              "Show our work" trail. If I claim something about your
              policy, I&rsquo;ll show you the line items that led
              there. If you ever doubt me, the receipts are right
              under the recommendation.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-[12px] font-bold text-brand-plum shrink-0 pt-0.5">
              03
            </span>
            <span>
              <strong className="font-semibold">I stay quiet between renewals.</strong>{" "}
              I won&rsquo;t spam you. I&rsquo;ll come back when
              there&rsquo;s something real to say — a market move
              that affects your car, a regulatory change worth
              knowing, a renewal window opening up. The default
              setting is silence.
            </span>
          </li>
        </ol>
      </section>

      {/* Honesty beat — what I am, what I'm not */}
      <section className="mt-12 pl-5 border-l-2 border-brand-charcoal/25 max-w-xl">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] font-bold text-brand-slate">
          · While we&rsquo;re being honest ·
        </div>
        <p className="mt-3 font-serif italic text-[14.5px] md:text-[15px] text-brand-slate leading-relaxed">
          I&rsquo;m a system, not a single person — built and tuned by
          the founders of RightOffer to read insurance the way they
          would, every time. But the editorial voice you read is
          theirs, the checks I run are ones they wrote, and the email
          you&rsquo;ll get from me is one a real human at RightOffer
          is on the other end of. Reply to it and someone will write
          back.
        </p>
      </section>

      {/* Quiet sign-off */}
      <section className="mt-12 max-w-xl">
        <p className="font-serif italic text-[16px] md:text-[18px] text-brand-charcoal leading-relaxed">
          Drop your policy. I&rsquo;ll read it for you.
        </p>
        <Link
          href="/upload"
          className="mt-5 inline-flex items-center justify-center gap-1.5 bg-brand-plum text-brand-offwhite px-7 py-3.5 rounded-full font-serif italic font-medium text-[16px] min-h-[48px] hover:opacity-90 transition-opacity"
        >
          Start my audit <span aria-hidden>→</span>
        </Link>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
          · Free · Under 2 minutes · No sales calls ·
        </p>
      </section>

      {/* Footer — back to home */}
      <footer className="mt-16 pt-6 border-t border-brand-charcoal/15 font-mono text-[10.5px] uppercase tracking-[0.14em] text-brand-slate text-center">
        <Link href="/" className="text-brand-plum hover:underline">
          ← Back to RightOffer
        </Link>
      </footer>
    </article>
  );
}
