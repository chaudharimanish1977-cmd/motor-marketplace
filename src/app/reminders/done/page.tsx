/**
 * Confirmation landing for the email-reply "Remind me" magic-link.
 *
 * The /api/reminders/click route redirects here after creating /
 * activating the subscription. We render a thin editorial confirmation
 * — no auth required, no chrome, just a clean "done" page.
 *
 * Status flavours from ?status= query:
 *   - ok        → "Done. We'll write to you before [date]."
 *   - expired   → "That link has expired." + forward suggestion
 *   - not-found → "We couldn't find that policy." (rare; means the
 *                  policy was deleted between email-send and click)
 *   - error     → "Something went wrong." (generic, log inspected)
 *
 * Robots: noindex,nofollow — same as other transactional landings.
 */

import Link from "next/link";

export const metadata = {
  title: "Renewal reminder — RightOffer",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    vehicle?: string;
    date?: string;
  }>;
}

function formatNiceDate(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export default async function RemindersDonePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const status = sp.status ?? "ok";
  const vehicle = sp.vehicle;
  const niceDate = formatNiceDate(sp.date);

  const isOk = status === "ok";
  const isExpired = status === "expired";

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <article className="max-w-md w-full text-center font-serif text-brand-charcoal">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-brand-sage font-bold mb-4">
            {isOk ? "· Reminder on ·" : "· Renewal reminder ·"}
          </div>

          {isOk ? (
            <>
              <h1 className="font-serif font-medium text-2xl md:text-3xl leading-[1.1] tracking-[-0.02em] m-0">
                You&rsquo;re on the{" "}
                <span className="italic text-brand-plum">list</span>.
              </h1>
              <p className="mt-4 font-serif italic text-[15px] text-brand-slate leading-[1.55]">
                {vehicle && niceDate ? (
                  <>
                    We&rsquo;ll write to you 60, 30 and 7 days before your{" "}
                    <span className="text-brand-charcoal not-italic">
                      {vehicle}
                    </span>{" "}
                    cover ends on{" "}
                    <span className="text-brand-charcoal not-italic whitespace-nowrap">
                      {niceDate}
                    </span>
                    .
                  </>
                ) : (
                  <>
                    We&rsquo;ll write to you 60, 30 and 7 days before this
                    policy expires.
                  </>
                )}
              </p>
              <p className="mt-6 font-serif italic text-[13.5px] text-brand-slate leading-[1.55]">
                You can pause or change the schedule any time from{" "}
                <Link
                  href="/me"
                  className="underline decoration-brand-plum/40 underline-offset-2 hover:decoration-brand-plum hover:text-brand-plum text-brand-plum"
                >
                  /me
                </Link>
                .
              </p>
            </>
          ) : isExpired ? (
            <>
              <h1 className="font-serif font-medium text-2xl md:text-3xl leading-[1.1] tracking-[-0.02em] m-0">
                That link has{" "}
                <span className="italic text-brand-plum">expired</span>.
              </h1>
              <p className="mt-4 font-serif italic text-[15px] text-brand-slate leading-[1.55]">
                Forward your policy to{" "}
                <a
                  href="mailto:review@rightoffer.in"
                  className="text-brand-plum"
                >
                  review@rightoffer.in
                </a>{" "}
                again and I&rsquo;ll send a fresh audit + reminder link.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-serif font-medium text-2xl md:text-3xl leading-[1.1] tracking-[-0.02em] m-0">
                We hit a{" "}
                <span className="italic text-brand-plum">snag</span>.
              </h1>
              <p className="mt-4 font-serif italic text-[15px] text-brand-slate leading-[1.55]">
                Something went wrong setting up that reminder. Open{" "}
                <Link
                  href="/me"
                  className="underline decoration-brand-plum/40 underline-offset-2 hover:decoration-brand-plum hover:text-brand-plum text-brand-plum"
                >
                  /me
                </Link>{" "}
                to set it up directly, or reply to the audit email and
                I&rsquo;ll sort it.
              </p>
            </>
          )}
        </article>
    </main>
  );
}
