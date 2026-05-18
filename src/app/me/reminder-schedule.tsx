"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import clsx from "clsx";

/**
 * Per-subscription reminder controls. Editorial vocab throughout —
 * mono kickers, serif body, hairline rules, no card frames.
 *
 * Two modes:
 *   - Summary (default): mono kicker · list of upcoming fire dates
 *     with a small "Sent" mark on fired ones. Two top-right actions:
 *     "Send test" and "Edit".
 *   - Editor: hairline-bordered panel with mono kicker and serif-
 *     bodied checkbox rows for [60, 45, 30, 15, 7, 3, 1] days before
 *     expiry + channel toggles (Email always available; WhatsApp
 *     "coming soon"). Save disabled until at least one checkpoint
 *     AND one channel are ticked.
 */

const CHECKPOINT_OPTIONS = [60, 45, 30, 15, 7, 3, 1] as const;
type Channel = "email" | "whatsapp";

interface Props {
  subscriptionId: string;
  policyExpiryDate: string;
  daysBefore: number[];
  nudgesFired: number[];
  channels: Channel[];
  paused: boolean;
}

export function ReminderSchedule({
  subscriptionId,
  policyExpiryDate,
  daysBefore,
  nudgesFired,
  channels,
  paused,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(
    () => new Set(daysBefore)
  );
  const [pickedChannels, setPickedChannels] = useState<Set<Channel>>(
    () => new Set(channels)
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<{
    kind: "ok" | "err";
    msg: string;
  } | null>(null);
  const [testPending, startTestTransition] = useTransition();

  const expiryMs = useMemo(
    () => new Date(policyExpiryDate).getTime(),
    [policyExpiryDate]
  );

  // ─── Test send — works from either mode ───
  function onTestSend() {
    if (testPending) return;
    setTestFeedback(null);
    startTestTransition(async () => {
      try {
        const res = await fetch(
          `/api/me/reminders/${subscriptionId}/test`,
          { method: "POST" }
        );
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          to?: string;
        };
        if (!res.ok) {
          setTestFeedback({
            kind: "err",
            msg: data.error ?? "Couldn't send the test.",
          });
          return;
        }
        setTestFeedback({
          kind: "ok",
          msg: `Test email sent to ${data.to ?? "your inbox"}.`,
        });
      } catch {
        setTestFeedback({ kind: "err", msg: "Network error." });
      }
    });
  }

  // ─── Summary mode ───
  if (!editing) {
    const visiblePicks = [...daysBefore].sort((a, b) => b - a);
    return (
      <div className={clsx("space-y-2", paused && "opacity-60")}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-sage">
            · Schedule ·
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onTestSend}
              disabled={testPending}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-brand-slate hover:text-brand-charcoal transition-colors disabled:opacity-60"
            >
              {testPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Send test
            </button>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-brand-plum hover:underline"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          </div>
        </div>
        <ul className="font-serif text-[13px] text-brand-charcoal space-y-1">
          {visiblePicks.map((d) => {
            const dateLabel = formatFireDate(expiryMs, d);
            const fired = nudgesFired.includes(d);
            return (
              <li
                key={d}
                className="flex items-baseline gap-2 leading-snug"
              >
                <span className="font-mono text-[12px] tabular-nums w-[6rem] shrink-0 text-brand-charcoal">
                  {dateLabel}
                </span>
                <span className="font-serif italic text-[12.5px] text-brand-slate">
                  · {d}d before
                </span>
                {fired && (
                  <span className="ml-1 inline-flex items-center gap-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] font-bold text-brand-success">
                    <CheckCircle2 className="w-3 h-3" />
                    Sent
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <ChannelsLine channels={channels} />
        {testFeedback &&
          (testFeedback.kind === "ok" ? (
            <div className="mt-2 pl-3 border-l-2 border-brand-success/60 space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] font-bold text-brand-success">
                · {testFeedback.msg} ·
              </p>
              <p className="font-serif italic text-[12px] text-brand-slate leading-relaxed">
                Can&rsquo;t find it? Check Promotions, Updates, or Spam.
                If it&rsquo;s there, drag it to your Primary inbox (or
                add{" "}
                <span className="not-italic font-mono">
                  hello@rightoffer.in
                </span>{" "}
                to your contacts) so future reminders come straight to
                your inbox.
              </p>
            </div>
          ) : (
            <p className="font-serif italic text-[12px] text-brand-alert leading-relaxed">
              {testFeedback.msg}
            </p>
          ))}
      </div>
    );
  }

  // ─── Editor mode ───
  function toggleCheckpoint(d: number) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  function toggleChannel(c: Channel) {
    setPickedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  }

  const canSave =
    picked.size > 0 && pickedChannels.size > 0 && !pending;

  function onSave() {
    if (!canSave) return;
    setError(null);
    const daysBeforeArr = Array.from(picked).sort((a, b) => b - a);
    const channelsArr = Array.from(pickedChannels);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/me/reminders/${subscriptionId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            daysBefore: daysBeforeArr,
            channels: channelsArr,
          }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(data.error ?? "Couldn't save — try again.");
          return;
        }
        setEditing(false);
        router.refresh();
      } catch {
        setError("Network error.");
      }
    });
  }

  function onCancel() {
    setPicked(new Set(daysBefore));
    setPickedChannels(new Set(channels));
    setEditing(false);
    setError(null);
  }

  return (
    <div className="pl-4 border-l-2 border-brand-plum space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-plum">
          · Reminder schedule ·
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="text-brand-slate hover:text-brand-charcoal transition-colors disabled:opacity-60"
          aria-label="Close editor"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="font-serif italic text-[13px] text-brand-slate leading-relaxed">
        Pick the days before expiry on which we should remind you.
      </p>

      <div className="space-y-1">
        {CHECKPOINT_OPTIONS.map((d) => {
          const checked = picked.has(d);
          const fired = nudgesFired.includes(d);
          return (
            <label
              key={d}
              className={clsx(
                "flex items-center gap-2.5 py-1.5 cursor-pointer border-b border-brand-charcoal/10 last:border-b-0",
                pending && "opacity-60 cursor-not-allowed"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleCheckpoint(d)}
                className="w-3.5 h-3.5 accent-brand-plum"
              />
              <span className="font-mono font-bold tabular-nums w-10 shrink-0 text-[12px] text-brand-charcoal">
                {d}d
              </span>
              <span className="font-serif italic text-[12.5px] text-brand-slate tabular-nums">
                {formatFireDate(expiryMs, d)}
              </span>
              {fired && (
                <span className="ml-auto inline-flex items-center gap-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] font-bold text-brand-success">
                  <CheckCircle2 className="w-3 h-3" />
                  Already sent
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* Channels */}
      <div className="pt-3 border-t border-brand-charcoal/15 space-y-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-brand-sage">
          · Where we send ·
        </div>
        <div className="space-y-1">
          <ChannelOption
            channel="email"
            label="Email"
            icon={Mail}
            badge={null}
            checked={pickedChannels.has("email")}
            onToggle={() => toggleChannel("email")}
          />
          <ChannelOption
            channel="whatsapp"
            label="WhatsApp"
            icon={MessageCircle}
            badge="Coming soon"
            checked={pickedChannels.has("whatsapp")}
            onToggle={() => toggleChannel("whatsapp")}
          />
        </div>
        <p className="pt-1 font-serif italic text-[12px] text-brand-slate leading-relaxed">
          WhatsApp delivery isn&rsquo;t live yet — we&rsquo;ll switch
          it on as soon as our Business API approval comes through.
          You can tick it now and we&rsquo;ll honour it from day one.
        </p>
      </div>

      {error && (
        <p className="font-serif italic text-[12px] text-brand-alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="font-serif italic text-[13px] text-brand-slate hover:text-brand-charcoal px-3 py-2 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="inline-flex items-center gap-1.5 bg-brand-plum text-brand-offwhite px-4 py-2 rounded-full font-serif italic font-medium text-[13px] min-h-[36px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving…
            </>
          ) : (
            "Save schedule"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ───

function ChannelOption({
  label,
  icon: Icon,
  badge,
  checked,
  onToggle,
}: {
  channel: Channel;
  label: string;
  icon: typeof Mail;
  badge: string | null;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer border-b border-brand-charcoal/10 last:border-b-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-3.5 h-3.5 accent-brand-plum"
      />
      <Icon className="w-3.5 h-3.5 text-brand-slate" />
      <span className="font-serif text-[13px] text-brand-charcoal">
        {label}
      </span>
      {badge && (
        <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em] font-bold text-brand-plum">
          · {badge} ·
        </span>
      )}
    </label>
  );
}

function ChannelsLine({ channels }: { channels: Channel[] }) {
  if (!channels.length) return null;
  return (
    <div className="flex items-center gap-2 pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-brand-slate">
      <span className="font-bold">Via</span>
      {channels.includes("email") && (
        <span className="inline-flex items-center gap-1">
          <Mail className="w-3 h-3" />
          Email
        </span>
      )}
      {channels.includes("whatsapp") && (
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="w-3 h-3" />
          WhatsApp
          <span className="text-brand-charcoal/40">(soon)</span>
        </span>
      )}
    </div>
  );
}

function formatFireDate(expiryMs: number, daysBefore: number): string {
  const fireMs = expiryMs - daysBefore * 24 * 60 * 60 * 1000;
  const d = new Date(fireMs);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
