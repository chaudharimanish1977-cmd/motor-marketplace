"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
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
 * Per-subscription reminder controls. Two modes:
 *
 *   - Summary (default): one-line list of upcoming fire dates with a
 *     small ✓ on checkpoints that already fired. Two top-right
 *     actions: "Send test email" (preview without waiting for cron)
 *     and "Edit" (toggle into editor mode).
 *
 *   - Editor: a checkbox grid for [60, 45, 30, 15, 7, 3, 1] days
 *     before expiry + channel toggles (Email always available;
 *     WhatsApp marked "coming soon" — saves to DB so the rails are
 *     ready once WhatsApp delivery is wired up). Save disabled
 *     until at least one checkpoint AND one channel are ticked.
 *
 * The PATCH endpoint handles cascading across all sibling subs in
 * the same policy group, so the user only ever sees / acts on one
 * schedule per car-period.
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

  // -----------------------------------------------------------
  // Test send — works from either mode, no edit required.
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // Summary mode
  // -----------------------------------------------------------
  if (!editing) {
    const visiblePicks = [...daysBefore].sort((a, b) => b - a);
    return (
      <div className={clsx("space-y-1.5", paused && "opacity-60")}>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-slate">
          <Calendar className="w-3 h-3" />
          Schedule
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onTestSend}
              disabled={testPending}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-slate hover:text-brand-charcoal transition-colors disabled:opacity-60"
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
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand-navy hover:underline"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          </div>
        </div>
        <ul className="text-[11px] text-brand-charcoal/90 space-y-0.5">
          {visiblePicks.map((d) => {
            const dateLabel = formatFireDate(expiryMs, d);
            const fired = nudgesFired.includes(d);
            return (
              <li
                key={d}
                className="flex items-center gap-1.5 leading-snug"
              >
                <span className="tabular-nums w-[5.5rem] shrink-0">
                  {dateLabel}
                </span>
                <span className="text-brand-slate/80">
                  · {d}d before
                </span>
                {fired && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-emerald-700 text-[10px] font-semibold">
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
            <div className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 space-y-1">
              <p className="text-[11px] text-emerald-800 font-semibold leading-relaxed">
                {testFeedback.msg}
              </p>
              <p className="text-[10px] text-emerald-900/80 leading-relaxed">
                Can&rsquo;t find it? Check{" "}
                <strong>Promotions</strong>, <strong>Updates</strong>, or{" "}
                <strong>Spam</strong>. If it&rsquo;s there, drag it to your
                Primary inbox (or add{" "}
                <span className="font-mono">hello@rightoffer.in</span> to your
                contacts) so future reminders come straight to your inbox.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-red-600 leading-relaxed">
              {testFeedback.msg}
            </p>
          ))}
      </div>
    );
  }

  // -----------------------------------------------------------
  // Editor mode
  // -----------------------------------------------------------
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
    <div className="rounded-xl border border-brand-light-gray bg-brand-offwhite/40 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-slate">
          Reminder schedule
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

      <div className="text-[11px] text-brand-slate leading-relaxed">
        Pick the days before expiry on which we should remind you.
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {CHECKPOINT_OPTIONS.map((d) => {
          const checked = picked.has(d);
          const fired = nudgesFired.includes(d);
          return (
            <label
              key={d}
              className={clsx(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[12px] cursor-pointer transition-colors",
                checked
                  ? "bg-brand-navy/10 border-brand-navy/30 text-brand-charcoal"
                  : "bg-white border-brand-light-gray text-brand-slate hover:bg-brand-offwhite"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleCheckpoint(d)}
                className="w-3.5 h-3.5 accent-brand-navy"
              />
              <span className="font-semibold tabular-nums w-12 shrink-0">
                {d}d
              </span>
              <span className="text-brand-slate/80 tabular-nums">
                {formatFireDate(expiryMs, d)}
              </span>
              {fired && (
                <span className="ml-auto inline-flex items-center gap-0.5 text-emerald-700 text-[10px] font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Already sent
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* Channels */}
      <div className="pt-2 border-t border-brand-light-gray space-y-1.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-slate">
          Where we send
        </div>
        <div className="grid grid-cols-1 gap-1.5">
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
        <p className="text-[10px] text-brand-slate/80 leading-relaxed">
          WhatsApp delivery isn&rsquo;t live yet — we&rsquo;ll switch
          it on as soon as our Business API approval comes through.
          You can tick it now and we&rsquo;ll honour it from day one.
        </p>
      </div>

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="text-[11px] font-semibold text-brand-slate hover:text-brand-charcoal px-3 py-1.5 rounded-lg border border-brand-light-gray hover:bg-white transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-brand-navy hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-1.5 rounded-lg transition-colors"
        >
          {pending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </>
          ) : (
            "Save schedule"
          )}
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

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
    <label
      className={clsx(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[12px] cursor-pointer transition-colors",
        checked
          ? "bg-brand-navy/10 border-brand-navy/30 text-brand-charcoal"
          : "bg-white border-brand-light-gray text-brand-slate hover:bg-brand-offwhite"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-3.5 h-3.5 accent-brand-navy"
      />
      <Icon className="w-3.5 h-3.5 text-brand-slate" />
      <span className="font-semibold">{label}</span>
      {badge && (
        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {badge}
        </span>
      )}
    </label>
  );
}

function ChannelsLine({ channels }: { channels: Channel[] }) {
  if (!channels.length) return null;
  return (
    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-brand-slate">
      <span className="font-semibold uppercase tracking-[0.1em]">Via</span>
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
          <span className="text-[9px] text-brand-slate/70">(soon)</span>
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
